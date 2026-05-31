/* ═══════════════════════════════════════════════════════════════════════════
   Fortran Array Bounds Checker — Frontend App
   Includes: Fortran parser, SVG parse-tree renderer, analysis pipeline,
             animated simulation, and live backend API integration.
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

// ───────────────────────────────────────────────────────────────────────────
// 1.  HARDCODED TEST CASES
// ───────────────────────────────────────────────────────────────────────────
const TEST_CASES = {
boundary_violation_literals:`! bounds_validation_case01.f90
! Array Bounds Validation Test
!
! Expected diagnostics:
!   error: TEMP(0)    - lower bound violation  (1:12)
!   error: TEMP(13)   - upper bound violation  (1:12)
!   error: DATA(-8)   - lower bound violation  (-7:7)
!   error: DATA(8)    - upper bound violation  (-7:7)
!   error: GRID(4,5)  - dimension-2 upper bound violation (1:4)

PROGRAM bounds_validation_case01

    IMPLICIT NONE

    ! Temperature samples
    REAL :: TEMP(12)          ! bounds: 1:12

    ! Symmetric integer storage
    INTEGER :: DATA(-7:7)     ! bounds: -7:7

    ! Matrix for computations
    REAL :: GRID(6,4)         ! bounds: 1:6, 1:4

    ! -----------------------------------------------------------
    ! Valid accesses
    ! -----------------------------------------------------------

    TEMP(1)  = 10.5
    TEMP(6)  = 20.5
    TEMP(12) = 30.5

    DATA(-7) = 11
    DATA(0)  = 22
    DATA(7)  = 33

    GRID(1,1) = 1.0
    GRID(6,4) = 2.0

    ! -----------------------------------------------------------
    ! Invalid accesses (diagnostics expected)
    ! -----------------------------------------------------------

    ! Below lower bound of TEMP
    TEMP(0) = -1.0

    ! Above upper bound of TEMP
    TEMP(13) = -2.0

    ! Below lower bound of DATA
    DATA(-8) = -100

    ! Above upper bound of DATA
    DATA(8) = 100

    ! Second dimension exceeds declared limit
    GRID(4,5) = 9.9

END PROGRAM bounds_validation_case01`,

dynamic_subscript_analysis:`! variable_subscript_analysis.f90
! Array Bounds Analysis – Variable Subscript Test
!
! Expected diagnostics:
!   warning: BUFFER(pos)      - variable index cannot be verified
!   warning: BUFFER(pos+2)    - expression contains variable
!   warning: TABLE(offset)    - variable index cannot be verified
!   warning: MATRIX(r,c)      - both dimensions use variables
!   warning: BUFFER(idx)      - value of idx not tracked

PROGRAM variable_subscript_analysis

    IMPLICIT NONE

    INTEGER, PARAMETER :: SIZE = 10

    REAL    :: BUFFER(SIZE)      ! bounds: 1:10
    INTEGER :: TABLE(-7:7)       ! bounds: -7:7
    REAL    :: MATRIX(15,15)     ! bounds: 1:15, 1:15

    INTEGER :: pos
    INTEGER :: r, c
    INTEGER :: idx
    INTEGER :: offset

    ! ----------------------------------------------------------
    ! Variable loop index
    ! ----------------------------------------------------------
    ! Runtime-safe loop, but static checker does not infer
    ! the range of the induction variable.

    DO pos = 1, SIZE
        BUFFER(pos) = REAL(pos)
    END DO

    ! ----------------------------------------------------------
    ! Variable expression
    ! ----------------------------------------------------------

    pos = 4
    BUFFER(pos + 2) = 50.0

    ! ----------------------------------------------------------
    ! Negative lower-bound array
    ! ----------------------------------------------------------

    DO offset = -7, 7
        TABLE(offset) = offset * 10
    END DO

    ! ----------------------------------------------------------
    ! Two-dimensional variable subscripts
    ! ----------------------------------------------------------

    DO r = 1, 15
        DO c = 1, 15
            MATRIX(r,c) = REAL(r + c)
        END DO
    END DO

    ! ----------------------------------------------------------
    ! Variable known at runtime but not tracked statically
    ! ----------------------------------------------------------

    idx = 8
    BUFFER(idx) = 123.45

END PROGRAM variable_subscript_analysis`,

verified_safe_accesses:`! safe_array_accesses.f90
! Array Bounds Checker – Valid Access Test
!
! Expected diagnostics:
!   NONE
!
! Every constant subscript lies within the declared bounds.
! A correct checker should accept the program without warnings.

PROGRAM safe_array_accesses

    IMPLICIT NONE

    ! ----------------------------------------------------------
    ! Array declarations with different bound styles
    ! ----------------------------------------------------------

    REAL    :: VALUES(12)         ! bounds: 1:12
    REAL    :: SCALE(-10:10)      ! bounds: -10:10
    REAL    :: CACHE(0:50)        ! bounds: 0:50
    INTEGER :: GRID(6,5)          ! bounds: 1:6, 1:5

    ! ----------------------------------------------------------
    ! Valid accesses: standard 1-based array
    ! ----------------------------------------------------------

    VALUES(1)  = 10.0
    VALUES(6)  = 20.0
    VALUES(12) = 30.0

    ! ----------------------------------------------------------
    ! Valid accesses: negative lower bound array
    ! ----------------------------------------------------------

    SCALE(-10) = -5.0
    SCALE(-3)  = -1.0
    SCALE(0)   = 0.0
    SCALE(10)  = 5.0

    ! ----------------------------------------------------------
    ! Valid accesses: zero-based array
    ! ----------------------------------------------------------

    CACHE(0)  = 1.0
    CACHE(25) = 2.0
    CACHE(50) = 3.0

    ! ----------------------------------------------------------
    ! Valid accesses: 2-D array
    ! ----------------------------------------------------------

    GRID(1,1) = 11
    GRID(1,5) = 22
    GRID(6,1) = 33
    GRID(6,5) = 44
    GRID(3,3) = 55

    PRINT *, "Compile-time bounds verification passed."

END PROGRAM safe_array_accesses`,

hybrid_index_validation:`! hybrid_bounds_test.f90
! Array Bounds Checker – Mixed Access Patterns
!
! Expected diagnostics:
+!   error:   MEMORY(0)      - lower bound violation (1:512)
+!   error:   MEMORY(513)    - upper bound violation (1:512)
+!   error:   FIELD(10,0)    - dimension-2 lower bound violation
+!   error:   QUEUE(-2)      - lower bound violation (0:127)
+!   warning: MEMORY(ptr)    - variable index cannot be verified
+!   warning: FIELD(x,y)     - variable subscripts cannot be verified

PROGRAM hybrid_bounds_test

    IMPLICIT NONE

    ! ----------------------------------------------------------
    ! Array declarations
    ! ----------------------------------------------------------

    INTEGER :: MEMORY(512)      ! bounds: 1:512

    REAL    :: FIELD(50,75)     ! bounds: 1:50, 1:75

    REAL    :: QUEUE(0:127)     ! bounds: 0:127

    INTEGER :: ptr
    INTEGER :: x, y
    INTEGER :: temp

    ! ----------------------------------------------------------
    ! Valid constant accesses
    ! ----------------------------------------------------------

    MEMORY(1)   = 10
    MEMORY(256) = 20
    MEMORY(512) = 30

    FIELD(1,1)    = 1.0
    FIELD(25,40)  = 2.0
    FIELD(50,75)  = 3.0

    QUEUE(0)   = 0.0
    QUEUE(64)  = 5.0
    QUEUE(127) = 9.0

    ! ----------------------------------------------------------
    ! Definite out-of-bounds accesses
    ! ----------------------------------------------------------

    MEMORY(0) = -1

    MEMORY(513) = -1

    FIELD(10,0) = -5.0

    QUEUE(-2) = -3.0

    ! ----------------------------------------------------------
    ! Variable-index accesses
    ! ----------------------------------------------------------

    READ *, ptr
    MEMORY(ptr) = 999

    DO x = 1, 50
        DO y = 1, 75
            FIELD(x,y) = REAL(x + y)
        END DO
    END DO

    temp = 100

END PROGRAM hybrid_bounds_test`,

compile_time_expression_check:`! constant_folding_bounds_check.f90
! Array Bounds Checker – Constant Arithmetic Expressions
!
! Expected diagnostics:
!   error:   VECTOR(8+5)     -> VECTOR(13), exceeds upper bound 12
!   error:   VECTOR(3*5)     -> VECTOR(15), exceeds upper bound 12
!   error:   CACHE(2-3)      -> CACHE(-1), below lower bound 0
!   error:   TABLE(15+11)    -> TABLE(26), exceeds upper bound 25
!
! No diagnostics expected for expressions that fold
! to values within the declared bounds.

PROGRAM constant_folding_bounds_check

    IMPLICIT NONE

    REAL    :: VECTOR(12)      ! bounds: 1:12
    REAL    :: CACHE(0:10)     ! bounds: 0:10
    INTEGER :: TABLE(1:25)     ! bounds: 1:25

    ! ----------------------------------------------------------
    ! Folded expressions that remain within bounds
    ! ----------------------------------------------------------

    VECTOR(2 + 5) = 1.0        ! -> 7, valid
    VECTOR(3 * 3) = 2.0        ! -> 9, valid

    CACHE(6 - 2) = 3.0         ! -> 4, valid

    TABLE(12 + 8) = 100        ! -> 20, valid

    ! ----------------------------------------------------------
    ! Folded expressions that become out-of-bounds
    ! ----------------------------------------------------------

    VECTOR(8 + 5) = 99.0       ! -> 13, error

    VECTOR(3 * 5) = 99.0       ! -> 15, error

    CACHE(2 - 3) = 99.0        ! -> -1, error

    TABLE(15 + 11) = 999       ! -> 26, error

    PRINT *, "Constant-expression bounds test finished."
END PROGRAM constant_folding_bounds_check`
};

// ───────────────────────────────────────────────────────────────────────────
// 2.  DOM REFERENCES
// ───────────────────────────────────────────────────────────────────────────
const codeInput       = document.getElementById('code-input');
const highlightContent= document.getElementById('highlight-content');
const editorGutter    = document.getElementById('editor-gutter');
const backendStatus   = document.getElementById('backend-status');
const btnSimulate     = document.getElementById('btn-simulate');
const btnRunLive      = document.getElementById('btn-run-live');
const btnClear        = document.getElementById('btn-clear');

const tableBody       = document.getElementById('symbol-table-body');
const accessesGridP2  = document.getElementById('accesses-grid-p2');
const accessesGridP3  = document.getElementById('accesses-grid-p3');
const termOutput      = document.getElementById('terminal-output');
const simBanner       = document.getElementById('sim-status-banner');
const simBannerText   = document.getElementById('sim-banner-text');

const statErrors      = document.getElementById('stat-errors');
const statWarnings    = document.getElementById('stat-warnings');
const statSafe        = document.getElementById('stat-safe');
const statRate        = document.getElementById('stat-rate');

const parseTreeSvg    = document.getElementById('parse-tree-svg');
const treeEmpty       = document.getElementById('tree-empty');
const btnExpandAll    = document.getElementById('btn-expand-all');
const btnCollapseAll  = document.getElementById('btn-collapse-all');

// State
let isAnimating = false;
let treeRootData = null;   // cached tree for expand/collapse
let currentAnalysis = null; // cached analysis for Clang comparison
let zoomScale = 1;
let panX = 0;
let panY = 0;

// ───────────────────────────────────────────────────────────────────────────
// 3.  SYNTAX HIGHLIGHTER
// ───────────────────────────────────────────────────────────────────────────
const KW  = /\b(PROGRAM|END|DO|IF|THEN|ELSE|PRINT|READ|IMPLICIT|NONE|PARAMETER)\b/gi;
const TY  = /\b(REAL|INTEGER|LOGICAL|CHARACTER|COMPLEX|DOUBLE\s+PRECISION|DIMENSION)\b/gi;
const NUM = /\b(\d+(\.\d*)?)\b/g;

function highlightLine(line) {
    const ci = line.indexOf('!');
    const code    = ci === -1 ? line : line.slice(0, ci);
    const comment = ci === -1 ? ''   : line.slice(ci);

    const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    let h = esc(code)
        .replace(KW,  m => `<span class="f-keyword">${m}</span>`)
        .replace(TY,  m => `<span class="f-type">${m}</span>`)
        .replace(NUM, m => `<span class="f-literal">${m}</span>`);
    if (comment) h += `<span class="f-comment">${esc(comment)}</span>`;
    return h;
}

function syncHighlights() {
    const lines = codeInput.value.split('\n');
    highlightContent.innerHTML = lines.map(highlightLine).join('\n');
    editorGutter.innerHTML = lines.map((_,i) =>
        `<div class="gutter-num" id="gutter-L${i+1}">${i+1}</div>`
    ).join('');
}

codeInput.addEventListener('input', syncHighlights);
codeInput.addEventListener('scroll', () => {
    const pre = document.getElementById('editor-highlight');
    pre.scrollTop = codeInput.scrollTop;
    pre.scrollLeft = codeInput.scrollLeft;
    editorGutter.scrollTop = codeInput.scrollTop;
});

function loadCode(code) {
    codeInput.value = code;
    syncHighlights();
    resetUI();
}

// ───────────────────────────────────────────────────────────────────────────
// 4.  PHASE TAB SWITCHING
// ───────────────────────────────────────────────────────────────────────────
const PHASE_MAP = {
    parse:     'sec-parse',
    symbols:   'sec-symbols',
    intercept: 'sec-intercept',
    propagate: 'sec-propagate',
    diag:      'sec-diag',
    comparison: 'sec-comparison',
};
const FLOW_MAP = {
    parse:     ['flow-parse'],
    symbols:   ['flow-parse','flow-symbol'],
    intercept: ['flow-parse','flow-symbol','flow-intercept'],
    propagate: ['flow-parse','flow-symbol','flow-intercept','flow-folding'],
    diag:      ['flow-parse','flow-symbol','flow-intercept','flow-folding','flow-diagnostic'],
    comparison: ['flow-parse','flow-symbol','flow-intercept','flow-folding','flow-diagnostic'],
};

function switchPhase(phase) {
    document.querySelectorAll('.phase-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.phase === phase);
    });
    Object.entries(PHASE_MAP).forEach(([k, secId]) => {
        document.getElementById(secId)?.classList.toggle('active', k === phase);
    });
    updateFlowchart(phase);
}

function updateFlowchart(activePhase) {
    const steps = ['flow-parse','flow-symbol','flow-intercept','flow-folding','flow-diagnostic'];
    const active = FLOW_MAP[activePhase] || [];
    const lastActive = active[active.length - 1];

    steps.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.className = 'flowchart-step';
        if (id === lastActive) el.classList.add('active');
        else if (active.includes(id)) el.classList.add('completed');
    });

    // connectors
    for (let i = 1; i <= 4; i++) {
        const el = document.getElementById(`conn-${i}`);
        if (!el) continue;
        el.className = 'flow-connector';
        const prev = steps[i - 1];
        if (active.includes(prev) && active.length > i) el.classList.add('active');
    }
}

// ───────────────────────────────────────────────────────────────────────────
// 5.  RESET UI
// ───────────────────────────────────────────────────────────────────────────
function resetUI() {
    switchPhase('parse');
    tableBody.innerHTML = `<tr><td colspan="5" class="empty-state">Run analysis to populate.</td></tr>`;
    if (accessesGridP2) accessesGridP2.innerHTML = `<div class="empty-state">No subscripts intercepted yet.</div>`;
    if (accessesGridP3) accessesGridP3.innerHTML = `<div class="empty-state">No propagation steps yet.</div>`;
    statErrors.textContent = statWarnings.textContent = statSafe.textContent = '0';
    statRate.textContent = '0%';
    termOutput.textContent = 'Ready. Press "Simulate Pass" or "Run Live Plugin"…';
    document.querySelectorAll('.gutter-num').forEach(el => el.className = 'gutter-num');
    document.querySelector('.scan-line-overlay')?.remove();
    clearTree();
    
    // Clear comparison
    const compSelect = document.getElementById('comp-access-select');
    if (compSelect) compSelect.innerHTML = '<option value="">Run simulation first...</option>';
    const flangCode = document.getElementById('comp-flang-code');
    if (flangCode) flangCode.textContent = 'REAL A(10); A(0) = 99.0';
    const clangCode = document.getElementById('comp-clang-code');
    if (clangCode) clangCode.textContent = 'float A[10]; A[-1] = 99.0f;';
    const flangMini = document.getElementById('flang-mini-ast');
    if (flangMini) flangMini.innerHTML = '';
    const clangMini = document.getElementById('clang-mini-ast');
    if (clangMini) clangMini.innerHTML = '';
    currentAnalysis = null;

    // Clear problems panel
    const probBody = document.getElementById('problems-table-body');
    const probWrapper = document.getElementById('problems-table-wrapper');
    const probEmpty = document.getElementById('problems-empty');
    const probCount = document.getElementById('problem-count');
    if (probBody) probBody.innerHTML = '';
    if (probWrapper) probWrapper.style.display = 'none';
    if (probEmpty) probEmpty.style.display = 'flex';
    if (probCount) probCount.textContent = '0';
}

// ───────────────────────────────────────────────────────────────────────────
// 6.  FORTRAN ANALYSIS ENGINE  (mirrors the C++ checker phases)
// ───────────────────────────────────────────────────────────────────────────
function parseDim(raw) {
    const t = raw.trim();
    const colon = t.indexOf(':');
    if (colon === -1) {
        const u = parseInt(t); return { lower: 1, upper: isNaN(u) ? null : u };
    }
    const lo = parseInt(t.slice(0, colon).trim());
    const hi = parseInt(t.slice(colon + 1).trim());
    return { lower: isNaN(lo) ? null : lo, upper: isNaN(hi) ? null : hi };
}

function splitComma(s) {
    const out = []; let depth = 0, cur = '';
    for (const ch of s) {
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; }
        else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
}

function evalSubscript(raw) {
    const t = raw.trim();
    if (/^-?\d+$/.test(t)) return { kind:'Constant', value: parseInt(t) };
    const bin = t.match(/^((-?\d+))\s*([+\-\*])\s*(\d+)$/);
    if (bin) {
        const a = parseInt(bin[1]), b = parseInt(bin[4]), op = bin[3];
        const r = op==='+' ? a+b : op==='-' ? a-b : a*b;
        return { kind:'Constant', value: r };
    }
    if (t.includes(':')) return { kind:'Expression', value: 0 };
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(t)) return { kind:'Variable', value: 0 };
    return { kind:'Expression', value: 0 };
}

function runAnalysis(code) {
    const lines = code.split('\n');

    // Phase 1 — declarations
    const declarations = [];
    const knownNames   = new Set();
    const arrayMap     = new Map();

    const typeKw       = /^\s*(real|integer|logical|character|complex|double\s+precision)\b/i;
    const dimAttrRe    = /,\s*dimension\s*\(([^)]+)\)\s*::(.+)$/i;
    const colonColonRe = /::\s*([a-z_][a-z0-9_]*)\s*\(([^)]+)\)/i;
    const directRe     = /^\s*(?:real|integer|logical|character|complex|double\s+precision)\s+([a-z_][a-z0-9_]*)\s*\(([^)]+)\)/i;

    lines.forEach((rawLine, idx) => {
        const lineNo = idx + 1;
        let line = rawLine.trim();
        const ci = line.indexOf('!');
        if (ci !== -1) line = line.slice(0, ci).trim();
        if (!line) return;

        if (!typeKw.test(line)) return;

        let m;
        // DIMENSION attribute
        if ((m = line.match(dimAttrRe))) {
            const dimSpecs = splitComma(m[1]);
            splitComma(m[2]).forEach(rawName => {
                let name = rawName.trim();
                const p = name.indexOf('('); if (p !== -1) name = name.slice(0, p).trim();
                if (!name) return;
                const dims = dimSpecs.map(parseDim);
                const entry = { name, dims, lineNo };
                declarations.push(entry); knownNames.add(name.toLowerCase()); arrayMap.set(name.toLowerCase(), entry);
            });
            return;
        }
        // :: name(dims)
        if ((m = line.match(colonColonRe))) {
            const dims = splitComma(m[2]).map(parseDim);
            const entry = { name: m[1], dims, lineNo };
            declarations.push(entry); knownNames.add(m[1].toLowerCase()); arrayMap.set(m[1].toLowerCase(), entry);
            return;
        }
        // direct TYPE name(dims)
        if ((m = line.match(directRe))) {
            const dims = splitComma(m[2]).map(parseDim);
            const entry = { name: m[1], dims, lineNo };
            declarations.push(entry); knownNames.add(m[1].toLowerCase()); arrayMap.set(m[1].toLowerCase(), entry);
        }
    });

    // Phase 2 — harvest accesses
    const accesses = [];
    const declLineRe = /^\s*(real|integer|logical|character|complex|double)\b/i;
    const accessRe   = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;

    lines.forEach((rawLine, idx) => {
        const lineNo = idx + 1;
        let line = rawLine.trim();
        const ci = line.indexOf('!');
        if (ci !== -1) line = line.slice(0, ci).trim();
        if (!line || declLineRe.test(line)) return;

        accessRe.lastIndex = 0;
        let m;
        while ((m = accessRe.exec(line)) !== null) {
            const nm = m[1].toLowerCase();
            if (!knownNames.has(nm)) continue;
            let openAt = m.index + m[0].length - 1, depth = 1, cur = openAt + 1;
            while (cur < line.length && depth > 0) {
                if (line[cur] === '(') depth++;
                else if (line[cur] === ')') depth--;
                cur++;
            }
            const inner = line.substring(openAt + 1, cur - 1);
            accesses.push({ arrayName: m[1], subscripts: splitComma(inner), lineNo, text: `${m[1]}(${inner})` });
        }
    });

    // Phase 3+4 — evaluate
    const results = [];
    let totalSubs = 0, constErrors = 0, varWarnings = 0, verified = 0, unknownBds = 0;

    accesses.forEach(acc => {
        const arr = arrayMap.get(acc.arrayName.toLowerCase());
        if (!arr) return;
        const details = [];

        for (let d = 0; d < acc.subscripts.length && d < arr.dims.length; d++) {
            totalSubs++;
            const bnd    = arr.dims[d];
            const subTxt = acc.subscripts[d];
            const idx    = evalSubscript(subTxt);
            let status = 'safe', detail = '';

            if (bnd.lower === null || bnd.upper === null) {
                unknownBds++;
                status = 'note';
                detail = `unknown bounds on dim ${d+1}`;
            } else if (idx.kind === 'Constant') {
                if (idx.value < bnd.lower || idx.value > bnd.upper) {
                    constErrors++; status = 'error';
                    detail = `array '${acc.arrayName}' dimension ${d+1}: index ${idx.value} is out of bounds [${bnd.lower}:${bnd.upper}]`;
                } else {
                    verified++; status = 'safe';
                    detail = `index ${idx.value} ∈ [${bnd.lower}:${bnd.upper}] ✓`;
                }
            } else {
                const checkWarnings = document.getElementById('check-warnings')?.checked !== false;
                if (checkWarnings) {
                    varWarnings++; status = 'warning';
                    detail = `array '${acc.arrayName}' dimension ${d+1}: non-constant index '${subTxt}' — bounds [${bnd.lower}:${bnd.upper}] cannot be verified`;
                } else {
                    verified++; status = 'safe';
                    detail = `array '${acc.arrayName}' dimension ${d+1}: index '${subTxt}' assumed safe (variable verification disabled)`;
                }
            }
            details.push({ sub: subTxt, dimension: d+1, kind: idx.kind, foldedValue: idx.value,
                           boundsStr: `${bnd.lower ?? '?'}:${bnd.upper ?? '?'}`, status, detail });
        }
        const hasErr = details.some(d => d.status === 'error');
        const hasWrn = details.some(d => d.status === 'warning');
        acc._status = hasErr ? 'error' : hasWrn ? 'warning' : 'safe';
        results.push({ access: acc, details });
    });

    return {
        declarations, results,
        stats: { totalSubs, constErrors, varWarnings, verified, unknownBds,
                 arraysCount: declarations.length,
                 fullyBounded: declarations.filter(d => d.dims.every(dm => dm.lower !== null && dm.upper !== null)).length }
    };
}

// ───────────────────────────────────────────────────────────────────────────
// 7.  PARSE TREE BUILDER — builds an AST-like JSON tree from Fortran code
// ───────────────────────────────────────────────────────────────────────────
function buildParseTree(code, analysis) {
    const lines = code.split('\n');

    // Index analysis results by line
    const oobLines   = new Set();
    const warnLines  = new Set();
    const safeLines  = new Set();
    analysis.results.forEach(r => {
        const haErr = r.details.some(d => d.status === 'error');
        const haWrn = r.details.some(d => d.status === 'warning');
        if (haErr)       oobLines.add(r.access.lineNo);
        else if (haWrn)  warnLines.add(r.access.lineNo);
        else             safeLines.add(r.access.lineNo);
    });

    // Build tree
    const declLineNos = new Set(analysis.declarations.map(d => d.lineNo));
    const accessLineNos = new Set(analysis.results.map(r => r.access.lineNo));

    // root
    const progName = (code.match(/^\s*PROGRAM\s+(\w+)/im) || ['','<program>'])[1];
    const root = node('Program', 'program', null, true, `PROGRAM ${progName}`);

    // implicit none
    if (/IMPLICIT\s+NONE/i.test(code)) {
        root.children.push(node('ImplicitNone', 'keyword', null, false, 'IMPLICIT NONE'));
    }

    // Declaration section
    if (analysis.declarations.length > 0) {
        const declSec = node('SpecificationPart', 'decl', null, true, `Declarations (${analysis.declarations.length})`);
        analysis.declarations.forEach(decl => {
            const typeName = lines[decl.lineNo - 1]?.trim().split(/\s+/)[0] ?? 'TYPE';
            const arrNode = node('ArrayDecl', 'array', null, true, `${decl.name}`);
            arrNode.children.push(node('TypeSpec',  'type', null, false, typeName.toUpperCase()));
            arrNode.children.push(node('ObjectName','name', null, false, decl.name));
            decl.dims.forEach((dm, i) => {
                const dStr = `${dm.lower ?? '?'}:${dm.upper ?? '?'}`;
                arrNode.children.push(node(`DimSpec[${i+1}]`, 'dim', null, false, dStr));
            });
            declSec.children.push(arrNode);
        });
        root.children.push(declSec);
    }

    // Execution section
    const execLines = analysis.results;
    if (execLines.length > 0) {
        const execSec = node('ExecutionPart', 'exec', null, true, `Statements (${execLines.length})`);

        execLines.forEach(item => {
            const acc  = item.access;
            const lineText = lines[acc.lineNo - 1]?.trim() ?? '';

            const hasErr = item.details.some(d => d.status === 'error');
            const hasWrn = item.details.some(d => d.status === 'warning');
            const stmtType = hasErr ? 'oob' : hasWrn ? 'warn' : 'safe';

            const stmtNode = node('AssignStmt', stmtType, acc.lineNo, true, `Line ${acc.lineNo}`);

            // LHS: ArrayElement
            const aelType = hasErr ? 'oob' : hasWrn ? 'warn' : 'access';
            const ael = node('ArrayElement', aelType, null, true, acc.text);
            ael.children.push(node('Name', 'name', null, false, acc.arrayName));

            item.details.forEach(d => {
                let subType = 'subscript';
                if (d.status === 'error')   subType = 'oob';
                else if (d.status === 'warning') subType = 'warn';
                else if (d.status === 'safe')    subType = 'safe';

                let subLabel = d.sub;
                if (d.kind === 'Constant' && d.sub !== String(d.foldedValue)) {
                    subLabel = `${d.sub}→${d.foldedValue}`;
                }
                const sNode = node(`Subscript[${d.dimension}]`, subType, null, false, subLabel);
                sNode.annotation = d.status === 'error'   ? '✗ OOB'
                                 : d.status === 'warning' ? '⚠ Var'
                                 : '✓';
                ael.children.push(sNode);
            });
            stmtNode.children.push(ael);

            // RHS placeholder
            const rhs = lineText.includes('=') ? lineText.split('=').slice(1).join('=').trim() : '?';
            stmtNode.children.push(node('RhsExpr', 'literal', null, false, rhs.slice(0, 18)));

            execSec.children.push(stmtNode);
        });
        root.children.push(execSec);
    }

    return root;
}

function node(type, cls, lineNo, collapsed, label) {
    return { type, cls, lineNo, label: label || type, collapsed, children: [], annotation: '' };
}

// ───────────────────────────────────────────────────────────────────────────
// 8.  SVG TREE RENDERER
// ───────────────────────────────────────────────────────────────────────────
const NODE_R    = 14;
const H_GAP     = 56;   // vertical gap between levels
const MIN_W_GAP = 36;   // minimum horizontal gap between siblings

// colour map
const CLS_FILL = {
    program:  '#6366f1',
    decl:     '#1e40af',
    array:    '#0ea5e9',
    type:     '#0891b2',
    dim:      '#164e63',
    name:     '#334155',
    keyword:  '#374151',
    exec:     '#7c3aed',
    assign:   '#5b21b6',
    access:   '#a78bfa',
    subscript:'#8b5cf6',
    oob:      '#dc2626',
    warn:     '#d97706',
    safe:     '#059669',
    literal:  '#1f2937',
    var:      '#374151',
};

function flattenVisible(root) {
    const nodes = [];
    function walk(n, depth, parentIdx) {
        const idx = nodes.length;
        nodes.push({ ...n, depth, parentIdx, idx, x: 0, y: 0 });
        if (!n.collapsed) {
            n.children.forEach(ch => walk(ch, depth + 1, idx));
        }
    }
    walk(root, 0, -1);
    return nodes;
}

function computeLayout(nodes) {
    // Count x-slots per depth using a simple algorithm
    const xCounters = {};
    nodes.forEach(n => {
        if (xCounters[n.depth] === undefined) xCounters[n.depth] = 0;
    });

    // Assign x positions using the subtree approach
    // First pass: assign leaf x sequentially, then average for parents
    let leafX = 0;
    function assignX(n) {
        const children = n.children.filter(() => !n.collapsed);
        if (n.collapsed || children.length === 0) {
            n._x = leafX; leafX += 1;
        } else {
            children.forEach(c => assignX(c));
            n._x = (children[0]._x + children[children.length - 1]._x) / 2;
        }
    }

    // Rebuild a real nested structure from flat array for layout
    function rebuildTree(flatNodes) {
        if (flatNodes.length === 0) return null;
        const root = { ...flatNodes[0], children: [] };
        const stack = [root];
        for (let i = 1; i < flatNodes.length; i++) {
            const fn = flatNodes[i];
            while (stack.length > 1 && stack[stack.length-1].depth >= fn.depth) stack.pop();
            const parent = stack[stack.length-1];
            const child = { ...fn, children: [] };
            parent.children.push(child);
            stack.push(child);
        }
        return root;
    }

    const treeRoot = rebuildTree(nodes);
    if (!treeRoot) return nodes;

    leafX = 0;
    assignX(treeRoot);

    // Assign actual positions
    function writePositions(n) {
        const flat = nodes.find(fn => fn.idx === n.idx);
        if (flat) {
            flat.x = n._x * (NODE_R * 2 + MIN_W_GAP);
            flat.y = n.depth * H_GAP;
        }
        n.children.forEach(c => writePositions(c));
    }
    writePositions(treeRoot);
    return nodes;
}

function renderTree(root) {
    treeRootData = root;
    const nodes = computeLayout(flattenVisible(root));

    const maxX = Math.max(...nodes.map(n => n.x), 0) + NODE_R * 3 + 40;
    const maxY = Math.max(...nodes.map(n => n.y), 0) + NODE_R * 3 + 60;
    const svgW = Math.max(maxX, 600);
    const svgH = Math.max(maxY, 340);

    const padX = svgW / 2 - (maxX / 2);

    parseTreeSvg.setAttribute('width',  svgW);
    parseTreeSvg.setAttribute('height', svgH);
    parseTreeSvg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    parseTreeSvg.innerHTML = '';

    const defs = svgEl('defs');
    // glow filters
    ['acc','oob','warn','safe'].forEach(k => {
        const filter = svgEl('filter', { id:`glow-${k}` });
        const fe = svgEl('feDropShadow', { dx:'0', dy:'0', stdDeviation:'3',
            'flood-color': k==='oob'?'#ef4444':k==='warn'?'#f59e0b':k==='safe'?'#10b981':'#6366f1',
            'flood-opacity':'0.7' });
        filter.appendChild(fe);
        defs.appendChild(filter);
    });
    parseTreeSvg.appendChild(defs);

    const zoomG = svgEl('g', { id: 'svg-zoom-group' });
    const edgesG = svgEl('g', { class:'edges' });
    const nodesG = svgEl('g', { class:'nodes' });
    zoomG.appendChild(edgesG);
    zoomG.appendChild(nodesG);
    parseTreeSvg.appendChild(zoomG);

    // Draw edges first
    nodes.forEach(n => {
        if (n.parentIdx < 0) return;
        const parent = nodes[n.parentIdx];
        const x1 = parent.x + padX + NODE_R;
        const y1 = parent.y + NODE_R * 2;
        const x2 = n.x + padX + NODE_R;
        const y2 = n.y;

        const midY = (y1 + y2) / 2;
        const path = svgEl('path', {
            d: `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`,
            class: 'tree-edge',
            'data-parent': n.parentIdx,
            'data-child': n.idx
        });
        edgesG.appendChild(path);
    });

    // Draw nodes
    nodes.forEach(n => {
        const cx = n.x + padX + NODE_R;
        const cy = n.y + NODE_R;
        const fill = CLS_FILL[n.cls] || '#4b5563';

        const g = svgEl('g', {
            class: 'tree-node-group',
            'data-idx': n.idx,
            transform: `translate(${cx - NODE_R}, ${cy - NODE_R})`,
            style: 'cursor:pointer'
        });

        // node circle
        const r = n.cls === 'program' || n.cls === 'exec' || n.cls === 'decl' ? NODE_R + 3 : NODE_R;
        const circle = svgEl('circle', {
            cx: NODE_R, cy: NODE_R, r,
            fill, class: 'tree-node-circle',
            stroke: 'rgba(255,255,255,0.15)', 'stroke-width': '1',
            filter: n.cls === 'oob'  ? 'url(#glow-oob)'  :
                    n.cls === 'warn' ? 'url(#glow-warn)' :
                    n.cls === 'safe' ? 'url(#glow-safe)' : ''
        });
        g.appendChild(circle);

        // label (below node)
        const labelTxt = svgEl('text', {
            x: NODE_R, y: r + 14,
            class: 'tree-node-text',
            'text-anchor': 'middle',
            'font-size': n.cls === 'program' ? '12' : '10'
        });
        labelTxt.textContent = truncate(n.label, 14);
        g.appendChild(labelTxt);

        // annotation (above node, for OOB/Warn/Safe)
        if (n.annotation) {
            const annTxt = svgEl('text', {
                x: NODE_R, y: -4,
                class: 'tree-node-label',
                'text-anchor': 'middle',
                fill: n.annotation.startsWith('✗') ? '#ef4444'
                    : n.annotation.startsWith('⚠') ? '#f59e0b' : '#10b981',
                'font-size': '9'
            });
            annTxt.textContent = n.annotation;
            g.appendChild(annTxt);
        }

        // expand/collapse indicator
        if (n.children.length > 0 || (n.collapsed && n.children.length === 0)) {
            // show +/- only for real collapsed/expandable nodes
        }
        if (!n.collapsed && n.children.length > 0 || n.collapsed) {
            const indicator = svgEl('text', {
                x: NODE_R, y: -r - 2,
                class: 'toggle-indicator',
                'text-anchor': 'middle',
                'font-size': '10'
            });
            indicator.textContent = n.collapsed ? '[+]' : '[-]';
            g.appendChild(indicator);
        }

        // tooltip on hover
        const title = svgEl('title');
        title.textContent = `${n.type}: ${n.label}${n.lineNo ? ' (line ' + n.lineNo + ')' : ''}`;
        g.appendChild(title);

        // Click to expand/collapse
        g.addEventListener('click', () => toggleNode(n.idx));

        nodesG.appendChild(g);
    });

    // Show svg, hide empty state
    treeEmpty.style.display = 'none';
    parseTreeSvg.style.display = 'block';
    updateZoomTransform();
}

function toggleNode(idx) {
    // Find the node in treeRootData and toggle
    function findAndToggle(n) {
        if (n.idx === idx) { n.collapsed = !n.collapsed; return true; }
        return n.children.some(c => findAndToggle(c));
    }
    // Rebuild flat tree, reassign idx
    let counter = 0;
    function reindex(n) { n.idx = counter++; n.children.forEach(c => reindex(c)); }
    reindex(treeRootData);
    findAndToggle(treeRootData);
    renderTree(treeRootData);
}

function expandAll()  { setAllCollapsed(treeRootData, false); renderTree(treeRootData); }
function collapseAll(){ setAllCollapsed(treeRootData, true);  renderTree(treeRootData); }
function setAllCollapsed(n, val) { n.collapsed = val; n.children.forEach(c => setAllCollapsed(c, val)); }

function clearTree() {
    parseTreeSvg.innerHTML = '';
    parseTreeSvg.style.display = 'none';
    treeEmpty.style.display = 'flex';
    treeRootData = null;
}

// SVG helper
function svgEl(tag, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
}
function truncate(s, n) { return s.length > n ? s.slice(0, n-1) + '…' : s; }

// ───────────────────────────────────────────────────────────────────────────
// 9.  ANIMATED PARSE TREE BUILD (node by node)
// ───────────────────────────────────────────────────────────────────────────
async function animateTreeBuild(root, delayMs) {
    // Start with everything collapsed, then expand level-by-level
    setAllCollapsed(root, true);
    renderTree(root);
    await sleep(delayMs * 0.5);

    // BFS expand
    const queue = [root];
    while (queue.length) {
        const current = queue.shift();
        current.collapsed = false;
        renderTree(root);
        await sleep(delayMs);
        current.children.forEach(c => queue.push(c));
    }
}

// ───────────────────────────────────────────────────────────────────────────
// 10. FLOWCHART HELPER (for simulator)
// ───────────────────────────────────────────────────────────────────────────
function setFlow(phase) { updateFlowchart(phase); }

// ───────────────────────────────────────────────────────────────────────────
// 11. MAIN SIMULATION
// ───────────────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function simulateCompilerPass() {
    if (isAnimating) return;
    isAnimating = true;

    btnSimulate.disabled = true;
    btnRunLive.disabled  = true;
    document.querySelectorAll('.file-item').forEach(el => el.classList.add('disabled'));
    codeInput.readOnly   = true;
    resetUI();

    // Switch bottom console to terminal output during simulation run
    const tabOutput = document.getElementById('tab-output');
    if (tabOutput) tabOutput.click();

    const code  = codeInput.value;
    const lines = code.split('\n');
    const analysis = runAnalysis(code);
    currentAnalysis = analysis;

    simBanner.classList.remove('hidden');

    // Scanner setup
    const wrapper    = document.querySelector('.editor-textarea-wrapper');
    const scanLine   = document.createElement('div');
    scanLine.className = 'scan-line-overlay';
    scanLine.style.top = '14px';
    wrapper.appendChild(scanLine);
    const lh = 21, pad = 14;

    // ── PHASE: PARSE TREE ─────────────────────────────────────────
    switchPhase('parse');
    setFlow('parse');
    simBannerText.textContent = 'Building Fortran Parse Tree (AST)…';

    // quick scan before tree
    for (let i = 0; i < lines.length; i++) {
        scanLine.style.top = `${pad + i * lh}px`;
        const g = document.getElementById(`gutter-L${i+1}`);
        if (g) { g.classList.add('active'); }
        await sleep(18);
        if (g) g.classList.remove('active');
    }

    const treeRoot = buildParseTree(code, analysis);
    simBannerText.textContent = 'Expanding AST nodes…';
    await animateTreeBuild(treeRoot, 120);
    await sleep(500);

    // ── PHASE 1: SYMBOLS ───────────────────────────────────────────
    switchPhase('symbols');
    setFlow('symbols');
    simBannerText.textContent = 'Phase 1: Collecting array declarations…';

    tableBody.innerHTML = '';
    let tableHtml = '';

    for (let i = 0; i < lines.length; i++) {
        scanLine.style.top = `${pad + i * lh}px`;
        const g = document.getElementById(`gutter-L${i+1}`);
        if (g) g.classList.add('active');

        const decl = analysis.declarations.find(d => d.lineNo === i + 1);
        if (decl) {
            tableHtml += `
                <tr>
                    <td class="sn">${decl.name}</td>
                    <td>${decl.dims.length}D</td>
                    <td>${decl.dims.map(d => d.lower ?? '?').join(', ')}</td>
                    <td>${decl.dims.map(d => d.upper ?? '?').join(', ')}</td>
                    <td>L${decl.lineNo}</td>
                </tr>`;
            tableBody.innerHTML = tableHtml;
            await sleep(380);
        } else {
            await sleep(28);
        }
        if (g) g.classList.remove('active');
    }
    await sleep(300);

    // ── PHASE 2: INTERCEPT ─────────────────────────────────────────
    switchPhase('intercept');
    setFlow('intercept');
    simBannerText.textContent = 'Phase 2: Intercepting array subscripts…';

    accessesGridP2.innerHTML = '';

    for (let i = 0; i < lines.length; i++) {
        scanLine.style.top = `${pad + i * lh}px`;
        const g = document.getElementById(`gutter-L${i+1}`);
        if (g) g.classList.add('active');

        const accs = analysis.results.filter(r => r.access.lineNo === i + 1);
        for (const item of accs) {
            const card = document.createElement('div');
            card.className = 'access-card checking';
            card.innerHTML = `
                <div class="access-expr">${item.access.text}</div>
                <div class="access-pipeline">
                    <span class="step-label">Intercepted · Line ${item.access.lineNo}</span>
                    <span class="fold-detail">Enter(ArrayElement &amp;) fired</span>
                </div>
                <div class="badge badge-checking">Queued</div>`;
            accessesGridP2.appendChild(card);
            card.scrollIntoView({ behavior:'smooth', block:'nearest' });
            await sleep(380);
        }
        if (accs.length === 0) await sleep(25);
        if (g) g.classList.remove('active');
    }
    await sleep(300);

    // ── PHASE 3: PROPAGATE ─────────────────────────────────────────
    switchPhase('propagate');
    setFlow('propagate');
    simBannerText.textContent = 'Phase 3: Constant propagation on subscripts…';

    accessesGridP3.innerHTML = '';
    let finalLog = `flang-new -fc1 -fsyntax-only -plugin bounds-checker input.f90\n`;
    finalLog += '-'.repeat(60) + '\n';
    analysis.declarations.forEach(d => {
        const bs = d.dims.map(dm => `${dm.lower ?? '?'}:${dm.upper ?? '?'}`).join(',');
        finalLog += `remark: ${d.name}(${bs})  [line ${d.lineNo}]\n`;
    });
    finalLog += '\n';

    for (const item of analysis.results) {
        const hasErr = item.details.some(d => d.status === 'error');
        const hasWrn = item.details.some(d => d.status === 'warning');
        const cardCls = hasErr ? 'error' : hasWrn ? 'warning' : 'safe';

        let detailHtml = '';
        item.details.forEach(d => {
            let foldTxt = d.kind === 'Constant'
                ? `'${d.sub}' folded → ${d.foldedValue} (bounds [${d.boundsStr}])`
                : d.kind === 'Variable'
                ? `'${d.sub}' is variable → cannot fold`
                : `'${d.sub}' is expression → cannot fold`;
            detailHtml += `<span class="fold-detail">Dim ${d.dimension}: ${foldTxt}</span>`;
        });

        const card = document.createElement('div');
        card.className = `access-card checking`;
        card.innerHTML = `
            <div class="access-expr">${item.access.text}</div>
            <div class="access-pipeline">
                <span class="step-label">evalSubscript()</span>
                ${detailHtml}
            </div>
            <div class="badge badge-checking">Evaluating…</div>`;
        accessesGridP3.appendChild(card);
        card.scrollIntoView({ behavior:'smooth', block:'nearest' });
        await sleep(180);

        // Animate result reveal
        const bdg = hasErr  ? `<div class="badge badge-error">OOB Error</div>`
                  : hasWrn  ? `<div class="badge badge-warning">Warning</div>`
                            : `<div class="badge badge-safe">Safe ✓</div>`;
        card.className = `access-card ${cardCls}`;
        card.querySelector('.badge').outerHTML; // just trigger reflow
        card.innerHTML = `
            <div class="access-expr">${item.access.text}</div>
            <div class="access-pipeline">
                <span class="step-label">Result · Line ${item.access.lineNo}</span>
                ${detailHtml}
            </div>
            ${bdg}`;

        // Gutter highlight
        const g = document.getElementById(`gutter-L${item.access.lineNo}`);
        if (g) g.classList.add(hasErr ? 'error' : hasWrn ? 'warning' : 'safe');

        // Terminal log
        item.details.forEach(d => {
            if (d.status !== 'safe' && d.status !== 'note') {
                finalLog += `input.f90:${item.access.lineNo}:1: ${d.status}: ${d.detail}\n`;
            }
        });

        await sleep(320);
    }

    // ── PHASE 4: DIAGNOSTICS ───────────────────────────────────────
    switchPhase('diag');
    setFlow('diag');
    simBannerText.textContent = 'Phase 4: Emitting diagnostics…';
    await sleep(250);

    const total = analysis.stats.totalSubs;
    animateCounter(statErrors,   0, analysis.stats.constErrors, 400);
    animateCounter(statWarnings, 0, analysis.stats.varWarnings, 400);
    animateCounter(statSafe,     0, analysis.stats.verified,    400);
    const rate = total > 0 ? Math.round(analysis.stats.constErrors / total * 1000) / 10 : 0;
    statRate.textContent = `${rate}%`;

    finalLog += '\n=== Bounds Checker Statistics ===\n';
    finalLog += `  Arrays declared      : ${analysis.stats.arraysCount}\n`;
    finalLog += `  Subscripts analysed  : ${analysis.stats.totalSubs}\n`;
    finalLog += `  Constant violations  : ${analysis.stats.constErrors}  (errors)\n`;
    finalLog += `  Variable warnings    : ${analysis.stats.varWarnings}  (warnings)\n`;
    finalLog += `  Verified safe        : ${analysis.stats.verified}\n`;
    if (total > 0) {
        finalLog += `  Static catch rate    : ${rate}%\n`;
        finalLog += `  Variable-index rate  : ${Math.round(analysis.stats.varWarnings/total*1000)/10}%\n`;
        finalLog += `  Verified-safe rate   : ${Math.round(analysis.stats.verified/total*1000)/10}%\n`;
    }
    finalLog += '=================================\n';
    termOutput.textContent = finalLog;
    termOutput.scrollTop = termOutput.scrollHeight;

    scanLine.remove();
    simBanner.classList.add('hidden');

    populateComparisonSelector();
    populateProblemsPanel(analysis);

    // Switch bottom console to problems tab when finished
    const tabProblems = document.getElementById('tab-problems');
    if (tabProblems) tabProblems.click();

    btnSimulate.disabled = false;
    btnRunLive.disabled  = false;
    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('disabled'));
    codeInput.readOnly   = false;
    isAnimating = false;
}

// ───────────────────────────────────────────────────────────────────────────
// 12. LIVE BACKEND RUNNER
// ───────────────────────────────────────────────────────────────────────────
async function runLiveCompiler() {
    if (isAnimating) return;
    
    // Switch bottom console to terminal output during compile
    const tabOutput = document.getElementById('tab-output');
    if (tabOutput) tabOutput.click();
    
    document.querySelectorAll('.file-item').forEach(el => el.classList.add('disabled'));
    resetUI();
    switchPhase('diag');
    btnSimulate.disabled = true;
    btnRunLive.disabled  = true;
    termOutput.textContent = "Connecting to backend — invoking ./bounds-checker binary…";

    try {
        const resp = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: codeInput.value })
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        // The C++ binary writes to stderr
        const out = data.stderr || data.stdout || '';
        termOutput.textContent = out;

        populateUIFromOutput(out);
        
        // Switch bottom console to problems tab when finished
        const tabProblems = document.getElementById('tab-problems');
        if (tabProblems) tabProblems.click();
    } catch (err) {
        console.error(err);
        termOutput.textContent = `Backend unreachable — falling back to JS simulator.\n\n`;
        await simulateCompilerPass();
        return;
    } finally {
        btnSimulate.disabled = false;
        btnRunLive.disabled  = false;
        document.querySelectorAll('.file-item').forEach(el => el.classList.remove('disabled'));
    }
}

function populateUIFromOutput(out) {
    setFlow('diag');

    // Build tree from current code + analysis
    const analysis = runAnalysis(codeInput.value);
    currentAnalysis = analysis;
    const treeRoot = buildParseTree(codeInput.value, analysis);
    renderTree(treeRoot);

    // Symbol table
    const declRe = /remark:\s*([a-zA-Z0-9_]+)\(([^)]+)\)\s*\[line\s*(\d+)\]/g;
    let m; tableBody.innerHTML = '';
    while ((m = declRe.exec(out)) !== null) {
        const name = m[1], bounds = m[2], lineNo = m[3];
        const dims = bounds.split(',').map(b => {
            const p = b.split(':');
            return { lower: parseInt(p[0])||1, upper: parseInt(p[1])||null };
        });
        tableBody.insertAdjacentHTML('beforeend', `<tr>
            <td class="sn">${name}</td>
            <td>${dims.length}D</td>
            <td>${dims.map(d=>d.lower).join(', ')}</td>
            <td>${dims.map(d=>d.upper??'?').join(', ')}</td>
            <td>L${lineNo}</td>
        </tr>`);
    }

    // Diagnostics cards
    const errRe = /:(\d+):\d+:\s*(error|warning|note):\s*(.+)/g;
    const lines = codeInput.value.split('\n');
    const diags = [];
    while ((m = errRe.exec(out)) !== null) {
        const lineNo = parseInt(m[1]), sev = m[2], msg = m[3];
        const txt = lines[lineNo-1]?.trim() ?? '';
        const g = document.getElementById(`gutter-L${lineNo}`);
        if (g) g.classList.add(sev === 'error' ? 'error' : 'warning');
        diags.push({ lineNo, sev, msg, txt });
    }

    if (accessesGridP2) {
        accessesGridP2.innerHTML = '';
        accessesGridP3.innerHTML = '';
        diags.forEach(d => {
            const cls = d.sev === 'error' ? 'error' : d.sev === 'warning' ? 'warning' : 'safe';
            const badge = `<div class="badge badge-${cls}">${d.sev.toUpperCase()}</div>`;
            const card = `<div class="access-card ${cls}">
                <div class="access-expr">${d.txt||'Array Access'}</div>
                <div class="access-pipeline">
                    <span class="step-label">Line ${d.lineNo}</span>
                    <span class="fold-detail">${d.msg}</span>
                </div>${badge}</div>`;
            accessesGridP2.insertAdjacentHTML('beforeend', card);
            accessesGridP3.insertAdjacentHTML('beforeend', card);
        });
    }

    // Stats
    const constErrors = parseInt((out.match(/Constant violations\s*:\s*(\d+)/)||[0,0])[1]);
    const varWarnings = parseInt((out.match(/Variable warnings\s*:\s*(\d+)/)||[0,0])[1]);
    const verified    = parseInt((out.match(/Verified safe\s*:\s*(\d+)/)||[0,0])[1]);
    const catchRate   = (out.match(/Static catch rate\s*:\s*([\d.]+%)/)||[0,'0%'])[1];
    statErrors.textContent   = constErrors;
    statWarnings.textContent = varWarnings;
    statSafe.textContent     = verified;
    statRate.textContent     = catchRate;

    populateComparisonSelector();
    populateProblemsPanel(analysis);
}

// ───────────────────────────────────────────────────────────────────────────
// 12.5 CLANG COMPARISON ENGINE
// ───────────────────────────────────────────────────────────────────────────
function populateComparisonSelector() {
    const compSelect = document.getElementById('comp-access-select');
    if (!compSelect || !currentAnalysis) return;

    compSelect.innerHTML = '<option value="">Select an array access statement...</option>';
    currentAnalysis.results.forEach((r, idx) => {
        compSelect.insertAdjacentHTML('beforeend', `<option value="${idx}">[Line ${r.access.lineNo}] ${r.access.text}</option>`);
    });
}

function handleComparisonChange() {
    const compSelect = document.getElementById('comp-access-select');
    if (!compSelect) return;
    const idx = parseInt(compSelect.value);
    
    const flangCodeEl = document.getElementById('comp-flang-code');
    const clangCodeEl = document.getElementById('comp-clang-code');
    const flangMiniEl = document.getElementById('flang-mini-ast');
    const clangMiniEl = document.getElementById('clang-mini-ast');

    if (isNaN(idx) || !currentAnalysis || idx < 0 || idx >= currentAnalysis.results.length) {
        flangCodeEl.textContent = 'REAL A(10)\nA(0) = 99.0\n! flang: error: index 0 < lbound 1';
        clangCodeEl.textContent = 'REAL A(10)\nA(0) = 99.0\n! At runtime:\n! Fortran runtime error:\n!  Array bound mismatch for dimension 1';
        flangMiniEl.innerHTML = '';
        clangMiniEl.innerHTML = '';
        return;
    }

    const item = currentAnalysis.results[idx];
    const acc = item.access;
    
    // Find the declaration
    const decl = currentAnalysis.declarations.find(d => d.name.toLowerCase() === acc.arrayName.toLowerCase());
    
    // ── Flang Plugin side: Fortran source + compile-time diagnostic
    const fDeclStr = decl
        ? `REAL ${decl.name}(${decl.dims.map(d => `${d.lower ?? '?'}:${d.upper ?? '?'}`).join(',')})`
        : `REAL ${acc.arrayName}(?)`;

    const flangDiag = (() => {
        if (!item.details || item.details.length === 0) return '! ✓ No issues found';
        const d = item.details[0];
        if (d.status === 'error') {
            return `! flang: error: ${d.message || 'index out of bounds'}`;
        } else if (d.status === 'warning') {
            return `! flang: warning: ${d.message || 'cannot verify at compile time'}`;
        }
        return '! flang: ✓ in-bounds (compile-time verified)';
    })();
    flangCodeEl.textContent = `${fDeclStr}\n${acc.text}\n${flangDiag}`;

    // ── gfortran side: same Fortran + what gfortran -fbounds-check would say at runtime
    const gfLines = [];
    gfLines.push(fDeclStr);
    gfLines.push(acc.text);
    gfLines.push('! [ gfortran -fbounds-check ]');

    if (decl) {
        const hasBadConst = item.details?.some(d => d.status === 'error');
        const hasVar      = item.details?.some(d => d.status === 'warning');

        if (hasBadConst) {
            decl.dims.forEach((dim, d) => {
                const lo = dim.lower ?? 1;
                const hi = dim.upper ?? '?';
                const sub = acc.subscripts[d];
                if (!sub) return;
                const f = evalSubscript(sub);
                if (f.kind === 'Constant') {
                    if (lo !== null && f.value < lo) {
                        gfLines.push(`! Fortran runtime error: Array bound`);
                        gfLines.push(`!  mismatch for dimension ${d+1}`);
                        gfLines.push(`!  Index ${f.value} < lower bound ${lo}`);
                    } else if (hi !== null && f.value > hi) {
                        gfLines.push(`! Fortran runtime error: Array bound`);
                        gfLines.push(`!  mismatch for dimension ${d+1}`);
                        gfLines.push(`!  Index ${f.value} > upper bound ${hi}`);
                    }
                }
            });
        } else if (hasVar) {
            gfLines.push(`! (no error at compile time)`);
            gfLines.push(`! At runtime, if index OOB:`);
            gfLines.push(`! Fortran runtime error: Array`);
            gfLines.push(`!  bound mismatch for dimension 1`);
        } else {
            gfLines.push(`! (no runtime error — access in-bounds)`);
        }
    } else {
        gfLines.push(`! Fortran runtime error: Array bound`);
        gfLines.push(`!  mismatch (unknown bounds)`);
    }
    clangCodeEl.textContent = gfLines.join('\n');

    // Render comparison mini-ASTs!
    drawFlangMiniAST(flangMiniEl, acc, decl);
    drawClangMiniAST(clangMiniEl, acc, decl);
}

function drawMiniASTNode(parent, x, y, label, type, status = 'info') {
    const r = 10;
    const color = CLS_FILL[status] || '#6366f1';
    
    const c = svgEl('circle', {
        cx: x, cy: y, r: r,
        fill: color, stroke: 'rgba(255,255,255,0.2)', 'stroke-width': '1'
    });
    parent.appendChild(c);
    
    const t = svgEl('text', {
        x: x, y: y + 20,
        'font-family': 'Fira Code, monospace',
        'font-size': '10px',
        fill: '#e2e8f0',
        'text-anchor': 'middle'
    });
    t.textContent = truncate(label, 12);
    parent.appendChild(t);

    const tType = svgEl('text', {
        x: x, y: y - 14,
        'font-family': 'Outfit, sans-serif',
        'font-size': '9px',
        fill: '#64748b',
        'text-anchor': 'middle'
    });
    tType.textContent = type;
    parent.appendChild(tType);
}

function drawMiniASTEdge(parent, x1, y1, x2, y2) {
    const edge = svgEl('line', {
        x1, y1, x2, y2,
        stroke: 'rgba(99,102,241,0.25)',
        'stroke-width': '1.5'
    });
    parent.appendChild(edge);
}

function drawFlangMiniAST(svg, acc, decl) {
    svg.innerHTML = '';
    const w = svg.clientWidth || 280;
    const h = 180;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    
    const rootX = w / 2;
    const rootY = 40;
    
    const children = [];
    children.push({ label: acc.arrayName, type: 'Name', status: 'name' });
    acc.subscripts.forEach((s, idx) => {
        children.push({ label: s, type: `Subscript[${idx+1}]`, status: 'subscript' });
    });
    
    const cy = 120;
    const numKids = children.length;
    const startX = rootX - ((numKids - 1) * 70) / 2;
    
    // Draw edges
    children.forEach((c, idx) => {
        const cx = startX + idx * 70;
        drawMiniASTEdge(svg, rootX, rootY, cx, cy);
    });
    
    // Draw root
    drawMiniASTNode(svg, rootX, rootY, 'ArrayElement', 'Expr', 'access');
    
    // Draw kids
    children.forEach((c, idx) => {
        const cx = startX + idx * 70;
        drawMiniASTNode(svg, cx, cy, c.label, c.type, c.status);
    });
}

// Draws the gfortran -fbounds-check runtime guard tree (Fortran perspective)
function drawClangMiniAST(svg, acc, decl) {
    svg.innerHTML = '';
    const w = svg.clientWidth || 280;
    const h = 180;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    // Root: BoundsCheck node → [ArrayAccess, LBound, UBound]
    const rootX = w / 2, rootY = 28;
    const accessX = w / 2, accessY = 88;
    const lbX = accessX - 70, lbY = 148;
    const ubX = accessX + 70, ubY = 148;

    drawMiniASTEdge(svg, rootX, rootY, accessX, accessY);
    drawMiniASTEdge(svg, accessX, accessY, lbX, lbY);
    drawMiniASTEdge(svg, accessX, accessY, ubX, ubY);

    const dim = decl ? decl.dims[0] : null;
    const lo  = dim ? (dim.lower ?? 1)   : 1;
    const hi  = dim ? (dim.upper ?? '?') : '?';
    const sub = acc.subscripts[0] ?? '?';
    const f   = evalSubscript(String(sub));
    const idxLabel = f.kind === 'Constant' ? String(f.value) : String(sub);

    // Status-aware root colour
    const hasBad  = acc._status === 'error';
    const hasWarn = acc._status === 'warning';
    const rootStatus = hasBad ? 'error' : hasWarn ? 'subscript' : 'exec';

    drawMiniASTNode(svg, rootX,   rootY,   'BoundsCheck', 'gfortran guard', rootStatus);
    drawMiniASTNode(svg, accessX, accessY, `${acc.arrayName}(${idxLabel})`, 'ArrayAccess', 'access');
    drawMiniASTNode(svg, lbX,     lbY,     `lbound=${lo}`,  'LBound', 'name');
    drawMiniASTNode(svg, ubX,     ubY,     `ubound=${hi}`,  'UBound', 'literal');
}

// ───────────────────────────────────────────────────────────────────────────
// 13. UTILITIES
// ───────────────────────────────────────────────────────────────────────────
function animateCounter(el, from, to, dur) {
    if (from === to) { el.textContent = to; return; }
    const steps = Math.abs(to - from);
    const step  = to > from ? 1 : -1;
    const dt    = Math.max(Math.floor(dur / steps), 15);
    let cur = from;
    const t = setInterval(() => {
        cur += step; el.textContent = cur;
        if (cur === to) clearInterval(t);
    }, dt);
}

async function checkBackend() {
    try {
        const r = await fetch('/api/tests/1');
        if (r.ok) {
            backendStatus.className = 'status-badge online';
            backendStatus.querySelector('.status-text').textContent = 'Backend Online';
        }
    } catch { /* stays offline */ }
}

// ───────────────────────────────────────────────────────────────────────────
// 14. EVENT WIRING + BOOT
// ───────────────────────────────────────────────────────────────────────────
function updateZoomTransform() {
    const zoomG = document.getElementById('svg-zoom-group');
    if (zoomG) {
        zoomG.setAttribute('transform', `translate(${panX}, ${panY}) scale(${zoomScale})`);
    }
}

function initCanvasBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });
    
    const particles = [];
    const maxParticles = 65;
    
    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.radius = Math.random() * 2 + 1;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
                this.reset();
            }
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            const accentColor = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#6366f1';
            ctx.fillStyle = accentColor + '22';
            ctx.fill();
        }
    }
    
    for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
    }
    
    let mouse = { x: null, y: null, radius: 120 };
    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });
    
    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        const gridGap = 80;
        const gridColor = getComputedStyle(document.body).getPropertyValue('--border').trim() || 'rgba(0,0,0,0.02)';
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;
        
        for (let x = 0; x < width; x += gridGap) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y < height; y += gridGap) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        particles.forEach((p, idx) => {
            p.update();
            p.draw();
            
            for (let j = idx + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 110) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    const accentColor = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#6366f1';
                    ctx.strokeStyle = accentColor + '11';
                    ctx.stroke();
                }
            }
            
            if (mouse.x !== null) {
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouse.radius) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    const accentColor = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#6366f1';
                    ctx.strokeStyle = accentColor + '18';
                    ctx.stroke();
                }
            }
        });
        
        requestAnimationFrame(animate);
    }
    animate();
}

function initThemeSwitcher() {
    const dots = document.querySelectorAll('.theme-dot');
    const savedTheme = localStorage.getItem('bounds-checker-theme') || 'light-alabaster';
    document.body.setAttribute('data-theme', savedTheme);
    
    dots.forEach(dot => {
        const theme = dot.getAttribute('data-theme');
        dot.classList.toggle('active', theme === savedTheme);
        
        dot.addEventListener('click', () => {
            dots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('bounds-checker-theme', theme);
        });
    });
}

function initZoomPanControls() {
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomReset = document.getElementById('btn-zoom-reset');
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const wrapper = document.getElementById('parse-tree-wrapper');

    if (btnZoomIn) {
        btnZoomIn.addEventListener('click', () => {
            zoomScale = Math.min(zoomScale * 1.2, 5);
            updateZoomTransform();
        });
    }
    if (btnZoomOut) {
        btnZoomOut.addEventListener('click', () => {
            zoomScale = Math.max(zoomScale * 0.8, 0.2);
            updateZoomTransform();
        });
    }
    if (btnZoomReset) {
        btnZoomReset.addEventListener('click', () => {
            zoomScale = 1;
            panX = 0;
            panY = 0;
            updateZoomTransform();
        });
    }
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', () => {
            wrapper.classList.toggle('fullscreen-tree');
            zoomScale = 1;
            panX = 0;
            panY = 0;
            updateZoomTransform();
        });
    }

    let isPanning = false;
    let startX = 0, startY = 0;

    parseTreeSvg.style.cursor = 'grab';

    parseTreeSvg.addEventListener('mousedown', e => {
        if (e.button !== 0 || e.target.closest('.zoom-btn')) return;
        isPanning = true;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
        parseTreeSvg.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', e => {
        if (!isPanning) return;
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        updateZoomTransform();
    });

    window.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            parseTreeSvg.style.cursor = 'grab';
        }
    });
}

// ───────────────────────────────────────────────────────────────────────────
// 13.5 NEW HELPER FUNCTIONS FOR 3-COLUMN IDE
// ───────────────────────────────────────────────────────────────────────────
function getActiveTestCaseKey() {
    const activeEl = document.querySelector('.file-item.active');
    return activeEl ? activeEl.getAttribute('data-test') : 'custom';
}

function initFileExplorer() {
    const fileItems = document.querySelectorAll('.file-item');
    const activeFileLabel = document.getElementById('active-file-label');

    fileItems.forEach(item => {
        item.addEventListener('click', () => {
            if (isAnimating || item.classList.contains('disabled')) return;

            fileItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const testKey = item.getAttribute('data-test');
            const fileName = item.querySelector('.file-name').textContent;
            if (activeFileLabel) {
                activeFileLabel.textContent = fileName;
            }

            if (testKey && testKey !== 'custom') {
                loadCode(TEST_CASES[testKey]);
            } else {
                // custom code
                loadCode('');
            }
        });
    });
}

function initCompilerOptions() {
    const optToggles = document.querySelectorAll('.opt-toggle');
    optToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            if (isAnimating) return;
            const parent = toggle.parentElement;
            parent.querySelectorAll('.opt-toggle').forEach(t => t.classList.remove('active'));
            toggle.classList.add('active');
        });
    });
}

function initConsoleTabs() {
    const tabs = document.querySelectorAll('.console-tab');
    const panels = document.querySelectorAll('.console-body-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const consoleType = tab.getAttribute('data-console');
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            panels.forEach(panel => {
                if (panel.id === `panel-${consoleType}`) {
                    panel.classList.add('active');
                    panel.style.display = 'block';
                } else {
                    panel.classList.remove('active');
                    panel.style.display = 'none';
                }
            });
        });
    });
}

function populateProblemsPanel(analysis) {
    const probBody = document.getElementById('problems-table-body');
    const probWrapper = document.getElementById('problems-table-wrapper');
    const probEmpty = document.getElementById('problems-empty');
    const probCount = document.getElementById('problem-count');

    if (!probBody) return;

    probBody.innerHTML = '';
    let count = 0;

    analysis.results.forEach(item => {
        item.details.forEach(d => {
            if (d.status === 'error' || d.status === 'warning') {
                count++;
                const isError = d.status === 'error';
                const severityClass = isError ? 'badge-err-list' : 'badge-warn-list';
                const severityBadge = isError ? '🔴 Error' : '🟡 Warning';
                
                const row = document.createElement('tr');
                row.className = 'problem-row';
                row.innerHTML = `
                    <td>Line ${item.access.lineNo}</td>
                    <td><span class="problem-severity-badge ${severityClass}">${severityBadge}</span></td>
                    <td>${d.detail}</td>
                `;

                // Add event listener to highlight/scroll to the line in editor
                row.addEventListener('click', () => {
                    highlightAndScrollToLine(item.access.lineNo, isError);
                });

                probBody.appendChild(row);
            }
        });
    });

    if (probCount) {
        probCount.textContent = count;
    }

    if (count > 0) {
        if (probWrapper) probWrapper.style.display = 'block';
        if (probEmpty) probEmpty.style.display = 'none';
    } else {
        if (probWrapper) probWrapper.style.display = 'none';
        if (probEmpty) probEmpty.style.display = 'flex';
    }
}

function highlightAndScrollToLine(lineNo, isError) {
    // 1. Remove highlight-error and highlight-warning from all gutter lines
    document.querySelectorAll('.gutter-num').forEach(g => {
        g.classList.remove('highlight-error', 'highlight-warning');
    });

    // 2. Add appropriate class to the clicked line gutter element
    const targetedGutter = document.getElementById(`gutter-L${lineNo}`);
    if (targetedGutter) {
        targetedGutter.classList.add(isError ? 'highlight-error' : 'highlight-warning');
    }

    // 3. Scroll to the line
    const editorHeight = codeInput.clientHeight;
    const scrollTarget = (lineNo - 1) * 21 - (editorHeight / 2) + 10;
    codeInput.scrollTop = Math.max(0, scrollTarget);
    
    // Manually trigger the scroll listener sync
    const pre = document.getElementById('editor-highlight');
    if (pre) pre.scrollTop = codeInput.scrollTop;
    editorGutter.scrollTop = codeInput.scrollTop;
}

document.addEventListener('DOMContentLoaded', () => {
    // Load default test case
    loadCode(TEST_CASES.boundary_violation_literals);

    // Initializations
    initCanvasBackground();
    initThemeSwitcher();
    initZoomPanControls();
    initFileExplorer();
    initCompilerOptions();
    initConsoleTabs();

    // Backend probe
    checkBackend();

    // Buttons
    btnSimulate.addEventListener('click', simulateCompilerPass);
    btnRunLive.addEventListener('click', runLiveCompiler);
    btnClear.addEventListener('click', () => {
        const k = getActiveTestCaseKey();
        if (k !== 'custom') loadCode(TEST_CASES[k]);
        else resetUI();
    });

    // Parse tree toolbar
    btnExpandAll.addEventListener('click',  expandAll);
    btnCollapseAll.addEventListener('click', collapseAll);

    // Comparison select listener
    const compSelect = document.getElementById('comp-access-select');
    if (compSelect) {
        compSelect.addEventListener('change', handleComparisonChange);
    }

    // Phase tabs (manual)
    document.querySelectorAll('.phase-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            if (!isAnimating) switchPhase(tab.dataset.phase);
        });
    });
});
