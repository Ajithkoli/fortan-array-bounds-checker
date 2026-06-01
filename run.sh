#!/bin/bash

# Ensure build binary exists
if [ ! -f "./bounds-checker.exe" ]; then
    echo "Compiled binary ./bounds-checker.exe not found. Running build.sh first..."
    ./build.sh
fi

# Usage helper
if [ $# -eq 0 ]; then
    echo "Usage: ./run.sh [test_file.f90] [--stats]"
    echo "Running default test cases to demonstrate capability..."
    echo ""
    
    echo "=== Running Test 1: Constant OOB ==="
    ./bounds-checker.exe testcases/boundary_violation_literals.f90 --stats
    echo ""
    
    echo "=== Running Test 2: Variable Indices (Warnings) ==="
    ./bounds-checker.exe testcases/dynamic_subscript_analysis.f90 --stats
    echo ""
    
    echo "=== Running Test 3: Correct Usage (Clean) ==="
    ./bounds-checker.exe testcases/verified_safe_accesses.f90 --stats
    echo ""
    
    echo "=== Running Test 5: Constant Expressions ==="
    ./bounds-checker.exe testcases/compile_time_expression_check.f90 --stats
else
    ./bounds-checker.exe "$@"
fi
