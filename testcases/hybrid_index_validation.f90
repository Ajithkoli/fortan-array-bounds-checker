! hybrid_bounds_test.f90
! Array Bounds Checker – Mixed Access Patterns
!
! Expected diagnostics:
!   error:   MEMORY(0)      - lower bound violation (1:512)
!   error:   MEMORY(513)    - upper bound violation (1:512)
!   error:   FIELD(10,0)    - dimension-2 lower bound violation
!   error:   QUEUE(-2)      - lower bound violation (0:127)
!   warning: MEMORY(ptr)    - variable index cannot be verified
!   warning: FIELD(x,y)     - variable subscripts cannot be verified

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

END PROGRAM hybrid_bounds_test
