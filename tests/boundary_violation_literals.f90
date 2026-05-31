! bounds_validation_case01.f90
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

END PROGRAM bounds_validation_case01
