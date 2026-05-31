! safe_array_accesses.f90
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

END PROGRAM safe_array_accesses
