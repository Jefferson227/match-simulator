---
title: Club levels inside a division's strength range
type: decision
ticket: MS-116
decided: 2026-10-17
status: implemented; acceptance targets 1 and 3 missed and accepted by the user; verified by a scripted engine run, not in the running app
asserts:
  - file: src/domain/features/strength-progression/ClubLevel.ts
    exists: true
  - file: src/domain/features/strength-progression/ProgressionPolicy.ts
    exists: true
  - file: src/infrastructure/data-transfer-objects/GameStateSaveDTO.ts
    exists: true
---

# Club levels inside a division's strength range

**Decision.** Every league club gets a hidden, persisted **level** inside its division's strength
range, and its players are pulled toward `level ± 3` instead of the whole range. Inside that band a
four-band age curve decides the direction, mid morale holds a grown player, and every +1 is rolled,
less likely the nearer the band's top. The level moves once a season by final rank, and resets near
the bottom or top of the new range on promotion or relegation. The rules are the spec
[[player-strength-progression]]. This page records why, the choices made in clarification, and
the numbers. It closes the open thread MS-115 left on [[ms-115-strength-ranges]].

## Why

MS-115's rubber band had no resting point inside a range. At any morale above 30 strength only went
up, and morale drifts up over a season, so every squad ended at its range max. In a scripted run,
84% of Série A players were at 99 by season 3, and a division's strongest clubs were
indistinguishable (Série D's top clubs all at 24). Longer intervals alone would only slow the climb
to the same ceiling. What was missing was a different ceiling per club.

## Choices made in clarification (2026-10-17)

- **A level per club, inside the range**, starting at the club's MS-115 seed target, so the seed
  order survives into the first season.
- **Final rank, not the 1ª Fase table, moves the level** for multi-phase divisions: champion,
  runner-up, then furthest phase reached, then points across every phase. A club that went deep in
  the knockouts earned it more than the league-phase leader that went out early.
- **Promotion and relegation land 3 inside the new range** (min + 3, max − 3) instead of carrying
  the old level over, which would be outside it.
- **Mid morale holds from 24**, high morale holds from 30, everything declines from 34. Under 24
  still grows at mid morale, so youth still develops.
- **The +1 is a roll** against the distance to the band top. A gain is certain at the band bottom
  and impossible at the top, so squads settle inside the band instead of on its edge. A hold and a
  lost roll both reset the counter.
- **The roll uses the division's own random stream**, so it cannot shift another division's results.
  The seeded determinism tests did not need new expected values.
- **Saves move to version 7 and version 6 is abandoned**, as every save change since MS-108 has done.

Rejected:

- **Longer intervals only.** They slow the climb but keep the same ceiling.
- **Migrating version-6 saves** by deriving a level from squad strength.
- **Showing the level in the UI.** It stays hidden; no i18n strings.
- **Rebalancing how results move morale.** That is `TeamStatsService`'s business and out of scope.

## The numbers

Scripted three-season run of both pyramids through the real game loop (`GameEngine` actions as the
UI dispatches them, seeded randomness), measured after each division's last round, seeds 1 / 2 / 3.
The run was rewritten for MS-116; MS-115's script was not on the machine.

Share of players at the division max (target ≤ 10%):

| Division | MS-115 | MS-116 |
|---|---|---|
| Série A | 85 / 89 / 85% | 18 / 15 / 18% |
| Série B | 86 / 81 / 81% | 16 / 26 / 25% |
| Série C | 50 / 40 / 43% | 15 / 14 / 10% |
| Série D | 50 / 50 / 48% | 12 / 13 / 11% |
| A1 | 53 / 54 / 51% | 12 / 14 / 13% |
| A2 | 39 / 36 / 32% | 14 / 13 / 14% |
| A3 | 23 / 16 / 21% | 3 / 4 / 5% |

Best − worst club average reached ≥ 50% of the range width in every division, before and after.

Players above their range (target ≤ MS-115's numbers: Série B 4, C 73, D 28, A2 18, A3 0):

| Division | MS-115 | MS-116 |
|---|---|---|
| Série B | 2 / 2 / 0 | 0 / 0 / 0 |
| Série C | 58 / 73 / 61 | 25 / 0 / 0 |
| Série D | 23 / 5 / 7 | 32 / 0 / 0 |
| A2 | 68 / 15 / 61 | 0 / 30 / 0 |
| A3 | 9 / 63 / 15 | 28 / 31 / 0 |

**Targets missed, accepted.** The ≤ 10% target fails in every division but A3. Every player at the
max belongs to one of the 3–5 clubs per division whose level is within 3 of the max, whose band
therefore reaches it; most of their young and prime players get there within a season. The
above-range target misses on some seeds, but it also misses on MS-115's own rules for this run (A3
on every seed), so MS-115's single-run numbers are noisy thresholds. On 2026-10-18 the user
accepted the rules as specified. Two alternatives were measured and rejected:

- **Squaring the +1 probability.** It took the share at max to 2–15%, still failing in five
  divisions on some seeds, and left more players outside their range.
- **Capping a band one below the range max.** It took the share at max to about 0%, but no player
  would ever again reach a division's max.

Also new: a promoted squad now arrives further below its new range, because the division it left no
longer saturates. A1's promoted clubs ended their first season with up to 87 players below 67.

## Still open

The six-season run shows the pile-up risk the requirements named. The season change rewards
winners, so over seasons more clubs reach the max level (Série D: 2 clubs at season 3, 8–12 at
season 6) and the share at max climbs again: Série A 24–25%, Série B 25–35%, Série D 22% at season
6. Spread holds (about 21–37 points best to worst), so clubs still differ, but the top band fills.
No ticket.
