# Static Array Bounds Verification for Fortran Programs

A Flang-based semantic analysis framework that identifies invalid array accesses during compilation and reports potential boundary violations before program execution.

---

## Introduction

Array indexing mistakes are a common source of bugs in scientific and engineering software. This project introduces a compile-time verification mechanism integrated into Flang's semantic analysis stage to detect such errors early.

The system analyzes array declarations, extracts dimension information, evaluates subscript expressions, and validates accesses against declared bounds without introducing any runtime checks.

### Supported Capabilities

* Analysis of one-dimensional and multi-dimensional arrays.
* Support for custom lower and upper bounds.
* Compile-time evaluation of arithmetic subscript expressions.
* Detection of definite out-of-range accesses.
* Warnings for accesses that cannot be verified statically.
* Zero execution-time overhead.

---

## Getting Started

### Web-Based Visualization Interface

Start the frontend application:

```bash
cd frontend
npm install
npm start
```

Open:

```text
http://localhost:3000
```

### Available Visualizations

* Compiler processing workflow.
* Array access verification stages.
* Parse-tree navigation.
* Diagnostic reporting interface.
* Static versus runtime checking comparison.

---

### Command-Line Analyzer

Compile the analyzer:

```bash
./build.sh
```

Analyze an individual source file:

```bash
./run.sh testcases/boundary_violation_literals.f90
```

Execute the complete validation suite:

```bash
./run.sh
```

---

## Project Organization

```text
project-root/
│
├── src/
│   ├── bounds_checker.cpp
│   ├── bounds_checker.h
│   └── main_standalone.cpp
│
├── testcases/
│   ├── boundary_violation_literals.f90
│   ├── dynamic_subscript_analysis.f90
│   ├── verified_safe_accesses.f90
│   ├── hybrid_index_validation.f90
│   └── compile_time_expression_check.f90
│
├── frontend/
├── build.sh
├── run.sh
├── design.md
├── implementation.md
└── evaluation.md
```

---

## Validation Programs

### boundary_violation_literals.f90

Evaluates direct violations caused by constant subscripts.

Coverage:

* Lower-bound violations
* Upper-bound violations
* Negative-index ranges
* Multi-dimensional accesses

### dynamic_subscript_analysis.f90

Examines array references involving variable indices.

Coverage:

* Loop variables
* User-controlled values
* Computed subscripts

### verified_safe_accesses.f90

Contains only valid array accesses.

Goal:

* Confirm correct behavior.
* Ensure no unnecessary diagnostics are produced.

### hybrid_index_validation.f90

Combines safe accesses, invalid accesses, and variable-based accesses in a single program.

Goal:

* Simulate realistic usage scenarios.
* Verify simultaneous handling of errors and warnings.

### compile_time_expression_check.f90

Tests constant-expression folding before bounds verification.

Example:

```fortran
DATA(5+6)
DATA(3*5)
CACHE(2-3)
```

Expressions are evaluated during compilation and then checked against declared array limits.

---

## Verification Procedure

The analysis pipeline performs the following steps:

1. Extract array declarations.
2. Record dimension bounds.
3. Locate array element references.
4. Evaluate constant subscript expressions.
5. Validate indices against declared ranges.
6. Generate diagnostics.

### Sample Analysis

```fortran
REAL DATA(10)

DATA(5+6) = 1.0
```

After constant folding:

```fortran
DATA(11)
```

Since `11` exceeds the upper bound of `10`, the checker reports a compile-time error.

---

## Summary

The project demonstrates how Flang's semantic analysis infrastructure can be extended to perform static array-bound verification. By identifying invalid accesses before execution, the checker improves program reliability while maintaining zero runtime overhead.
