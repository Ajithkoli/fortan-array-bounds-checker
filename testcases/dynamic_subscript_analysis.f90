! variable_subscript_analysis.f90
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

END PROGRAM variable_subscript_analysis
