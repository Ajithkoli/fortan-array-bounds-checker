# SYSTEM DESIGN: Compile-Time Fortran Array Boundary Verification

This document describes the architecture, processing workflow, implementation rationale, and engineering trade-offs behind the Fortran Array Boundary Verification system integrated into Flang.

---

# 1. Architectural Overview

The checker is implemented as a semantic-analysis extension within the Flang frontend. Rather than inserting runtime checks into generated code, the system performs static analysis during compilation to identify invalid array accesses before executable generation.

### Processing Workflow

```
      Fortran Source File
               │
               ▼
      ┌────────────────┐
      │ Lexical Scan   │
      └───────┬────────┘
              │
              ▼
      ┌────────────────┐
      │ Syntax Parser  │
      └───────┬────────┘
              │
              ▼
      Parse Tree Representation
              │
              ▼
 ┌──────────────────────────────────┐
 │ Semantic Processing Stage        │
 │                                  │
 │  Step A: Array Metadata Capture  │
 │  Step B: Index Usage Analysis    │
 │  Step C: Expression Evaluation   │
 │  Step D: Diagnostic Generation   │
 │                                  │
 │  Bounds Verification Executes    │
 │  Within This Stage               │
 └──────────────────────────────────┘
              │
              ▼
      Verified Semantic Model
```

The implementation leverages Flang's existing semantic infrastructure, enabling array verification without modifying later compilation stages.

---

# 2. Analysis Pipeline

The checker operates as a sequence of four logical stages.

## Stage A: Array Metadata Collection

During semantic processing, array declarations are examined and recorded.

Information extracted includes:

* Number of dimensions
* Lower bound for each dimension
* Upper bound for each dimension
* Shape and extent information

This information is maintained in an internal lookup structure associated with the declared symbol.

---

## Stage B: Array Reference Detection

The semantic walker traverses the parse tree and identifies all array element references.

For every encountered array access:

```fortran
A(5)
B(i)
C(x,y)
```

the corresponding subscript expressions are collected for further verification.

---

## Stage C: Compile-Time Expression Evaluation

Subscript expressions are recursively analyzed to determine whether they can be resolved to constant values.

Examples:

```fortran
A(3 + 4)
```

becomes:

```fortran
A(7)
```

Likewise:

```fortran
A(2 * 5)
```

becomes:

```fortran
A(10)
```

The evaluator currently handles simple arithmetic operations involving integer constants and folded expressions.

---

## Stage D: Reporting and Diagnostics

After evaluating a subscript, the resulting value is compared against the declared dimension bounds.

Possible outcomes include:

### Definite Violation

```fortran
REAL A(10)

A(11)
```

Compiler output:

```text
error: index 11 exceeds declared upper bound 10
```

### Unverifiable Access

```fortran
A(i)
```

Compiler output:

```text
warning: unable to determine whether index i is within bounds
```

This approach provides immediate feedback without requiring program execution.

---

# 3. Alternative Designs Evaluated

Several implementation strategies were considered before selecting the final architecture.

| Approach                       | Benefits                                                                      | Limitations                                                    | Outcome                           |
| ------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------- |
| Frontend Semantic Verification | No runtime overhead, immediate compile-time feedback, tight Flang integration | Cannot prove correctness for arbitrary runtime values          | Adopted                           |
| LLVM-Level Instrumentation     | Detects violations after lowering and optimization                            | Additional execution overhead and reduced source-level context | Rejected                          |
| Runtime Bounds Libraries       | Broad coverage of runtime scenarios                                           | Errors discovered only during execution                        | Used only for comparison purposes |

The semantic-analysis approach was chosen because it provides the earliest possible detection point while preserving execution performance.

---

# 4. Key Engineering Choices

## Support for Non-Standard Index Ranges

Fortran arrays may begin at arbitrary indices.

Example:

```fortran
INTEGER BUFFER(-5:5)
```

Unlike languages that assume zero-based indexing, the checker preserves the original bounds exactly as declared.

For each dimension:

```text
Lower Bound = L
Upper Bound = U
Index = I
```

verification is performed using:

```text
L ≤ I ≤ U
```

This strategy keeps diagnostics consistent with the programmer's source code and avoids unnecessary index translation.

---

## Multi-Dimensional Array Verification

Multi-dimensional arrays are processed one dimension at a time.

Example:

```fortran
REAL GRID(5,3)

GRID(4,4)
```

The checker evaluates:

```text
Dimension 1: 4 ∈ [1,5]  ✓
Dimension 2: 4 ∈ [1,3]  ✗
```

Result:

```text
error: dimension 2 index 4 exceeds upper bound 3
```

By validating dimensions independently, diagnostics can precisely identify which coordinate is responsible for the violation rather than reporting a generic array-access failure.

---

