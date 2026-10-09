---
title: Division strength ranges replace XP
type: decision
ticket: MS-115
decided: 2026-10-07
status: implemented; verified by a scripted engine run, not in the running app
asserts:
  - file: src/domain/features/strength-progression/ProgressionPolicy.ts
    exists: true
  - file: src/domain/features/strength-progression/SeedStrength.ts
    exists: true
  - file: src/infrastructure/data-transfer-objects/GameStateSaveDTO.ts
    exists: true
---

# Division strength ranges replace XP

**Decision.** Player strength no longer moves by XP earned from the last five results. Each league
division owns a slice of 1–99, squads start inside it, and every few team games each player steps
by morale and age, pulled back toward the slice when outside it. The rules are the spec
[[player-strength-progression]]; this page records the choices behind them that the code cannot
state. It closes the open thread that neighbouring men's divisions' strengths overlapped.

## Why XP went

XP grew every squad by recent form alone, against no reference point, so nothing kept a division's
strengths inside any band and, since MS-112, a club kept its strength when it changed division: B/C
and C/D overlapped as A/B always had. The user's brief asked for a rubber band that keeps each
division's squads in its own band instead.

## Counting happens when a round ends

Each team game is counted in `ChampionshipService.endRound`, next to MS-114's season counters, for
the reasons on [[player-season-stats]]: it is the one point every round of every division passes
exactly once, AI catch-up rounds included, and `UPDATE_TEAM_STATS` reads only the last finished
round and also runs after NEW SEASON. The consequence is that morale is read **before** that round's
result moves it. NEW SEASON never calls `endRound`, so a roll-over cannot count a game twice.

`UPDATE_TEAM_STATS` was reduced to morale only.

## A new phase is dealt the squads as they stand

The scripted run found that a phase generated at round end started one round stale. A knockout
hands the next phase its winners as they stood in the tie they played (the played match copies),
and the new table is built from them, so the new phase's fixtures carried each squad before that
round moved it. The match engine reads strengths off fixture copies, so knockout games would have
been played at stale strengths, and MS-114's season counters were stale on those copies too.
`endRound` now copies every persisted per-player field from `teams` to the not-started fixtures and
the table whenever phase resolution changed the championship.

## The two-way pull (amended 2026-10-08)

The brief stopped an increasing player above the range and a decreasing player below it, so an
above-range player only came down when the club's morale was 30 or less. A scripted three-season
run of both pyramids (MS-115 task 11) showed clubs rarely get there: relegated clubs sat at morale
31–56. Relegated squads froze above their new range and bounced back up — Corinthians went A → B at
95.4, was still 95.4 a season later, and went down to C at 94.5. That contradicted the brief's own
aim ("a relegated team … will decrease their strength easily").

The user chose to pull both ways: outside the range a player always moves 2 toward it, and morale
only decides the direction inside. Players above their range at the end of season 3:

| Division | Brief as written | Two-way pull |
|---|---:|---:|
| Série B | 134 | 4 |
| Série C | 177 | 73 |
| Série D | 239 | 28 |
| A2 | 138 | 18 |
| A3 | 82 | 0 |

Rejected: keeping the brief and filing the finding for later; redesigning the morale thresholds.

**Still open.** Inside the range mid and high morale both increase, and morale drifts up over a
season, so squads pile up at the top of their range: by season 3, 84% of Série A players were at 99
and 82% of Série B's at 74. Strength stops telling a division's clubs apart. No ticket.

## Smaller choices

- **Band edges.** Morale moves in 0.5 steps, so the brief's "30% or less", "31–70" and "71 or more"
  leave gaps at 30.5 and 70.5. Both edges are closed downward: ≤ 30 low, ≤ 70 mid, above 70 high.
  Under-16s use the youngest age band.
- **Tier count.** A pyramid's tier count is its lowest division's tier, not the number of
  divisions held. The seed's tiers are contiguous from 1, so the two agree for a whole pyramid, and
  the lowest tier stays right for a container holding only part of one (as some tests build).
- **Youth replacements** are clamped to 1–99, not to the division's range: the generated player is
  meant to start weaker than the squad, and the progression pulls them in.
- **Saves are abandoned, not migrated** (save version 6), as MS-108 and MS-109 did; see
  [[ms-108-saved-game-size]].
- **The counter is saved as `spg`.** Every saved player carries it, and under its full name
  `strengthProgressGames` it cost a five-season men's save ~233,000 code units, pushing it past the
  2,500,000 guard MS-113 set. As `spg` it costs ~72,000; with `xp` gone the save ended slightly
  smaller than before the ticket (2,306,075 against 2,310,367). Rejected: a shorter name in the
  domain, accepting the cost, and loosening the guard.
