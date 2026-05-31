! constant_folding_bounds_check.f90
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

END PROGRAM constant_folding_bounds_check
