# SPEC

## Rules
- R1 Write-once. markPresent and sweep are the only write paths.
- R2 PRESENT only if local date == today, weekday matches, start <= now <= end.
- R3 sweep writes ABSENT for ended, unrecorded, attendable period-days from semesterStart.
- R4 percent = (baseline.attended + sum PRESENT units) / (baseline.conducted + sum all units).
- R5 units 0 = non-attendance. Lab = one Period row with units 2.
- R6 forecast: Y = units remaining through semesterEnd; X = ceil((65*(C+Y) - 100*A)/100), clamped.
- R7 No holiday logic.

