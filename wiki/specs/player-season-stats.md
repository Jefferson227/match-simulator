---
title: Player season stats
type: spec
verified: 2026-09-30
owner: user
asserts:
  - file: src/domain/features/player-stats/SeasonStats.ts
    exists: true
  - file: src/domain/features/lineup/RandomLineup.ts
    exists: true
  - file: src/presentation/pages/TeamManager/SquadSelection.tsx
    exists: true
---

> **Spec, not description.** This is the contract `SeasonStats.ts` and its call sites are judged
> against. If the code and this page disagree, the code is wrong until the user says otherwise. The
> user owns this page; Claude keeps it in sync and drafts changes, but does not change the rules
> unilaterally.

# Player season stats

Introduced by MS-114. Every player has two counters, **games** and **goals**, shown as MATCHES and
GOALS in the TeamManager → Choose Strategy → PLAYER view.

## The rules

**Season scope.** Both count the current season only. Both go back to 0 at the NEW SEASON
roll-over, after ageing ([[player-retirement]]). A retiree's record does not carry them.

**A game** is +1 for a match the player took part in:

| Player in that match         | Game? |
| ---------------------------- | ----- |
| Starter                      | yes   |
| Starter substituted off      | yes   |
| Substitute who came on       | yes   |
| Substitute who never came on | no    |
| Not in the matchday squad    | no    |

**A goal** is every goal credited to the player in the match's scorers. Penalty-shootout kicks are
**not** goals: a shootout decides a tie, never the score ([[ms-103-simulated-shootout]]).

**Which matches.** Every match of the division the club plays in, across all its phases: league
phase, groups, knockouts and promotion playoffs. Cups are not simulated yet
([[ms-109-full-pyramid-container]]); when they are, whether they count is an open decision.

**Which clubs.** Every club in every division, human and AI alike, so a future top-scorers screen or
a club change has the numbers already.

**Each round counts exactly once**, including the several rounds an AI division can play in one
call to keep pace with the human's ([[ms-103-ai-championship-catch-up]]).

**Old saves.** A save written before MS-114 loads with 0 games and 0 goals for every player, and
counting starts from the next match. Past rounds are not replayed to rebuild the totals, so the
numbers are low until the next NEW SEASON. The save version did not change.

> **Not asserted.** Every rule above is behaviour, not a literal value. The tests that enforce them
> are `tests/domain/features/player-stats/SeasonStats.test.ts`, the MS-114 blocks of
> `tests/domain/services/ChampionshipService.test.ts` and `tests/use-cases/ChampionshipUseCases.test.ts`,
> and the pre-MS-114 case in `tests/infrastructure/mappers/GameStateMapper.test.ts`.

## Why counting happens when a round ends

The obvious place was `UPDATE_TEAM_STATS`, which already updates XP and morale after every round.
It was rejected for two reasons:

- it reads only the **last** finished round, and an AI division can end several rounds in one
  `END_ROUND_FOR_ALL_CHAMPIONSHIPS`, so rounds would be missed;
- it also runs after the NEW SEASON roll-over, where counting would be wrong.

Ending a round is the one point every round of every division passes exactly once, and it already
refuses to end a round twice. The counts are also copied onto the fixtures not yet played before
the next phase is drawn, because a later step builds lineups from those fixture copies and writes
them back onto the clubs; a stale copy there would wipe the counts.

## Why a starter who goes off needs a marker

A substitution used to flip the outgoing starter to "neither starter nor substitute", which after
the final whistle looks exactly like a player who never played. The substitution now also records
the minute they went off, for this match only, the same way the incoming player's minute is already
recorded for [[player-stamina]].

## Why AI catch-up rounds get a real lineup

Before MS-114 only the round played alongside the human's had AI lineups picked. An AI division
catching up played its other rounds with whatever lineup the fixture last carried, or none, and a
fixture with no lineup counts every player on the squad as on the pitch. Counting appearances from
that would credit whole squads with games.

So every AI round played in one pass now picks each AI club's 11 and bench first, with the same
picker the human's round uses, drawn from the division's own random stream so results stay
deterministic under an injected rng. That also changes AI strength in those matches: they now use a
real 11 instead of a stale or whole squad. The user accepted this in planning.

## Open

- **A finished season's totals are not shown anywhere.** The last round is counted, but the season
  summary does not show the counters, and NEW SEASON resets them. Out of scope for MS-114.
- Cards, injuries and mood in the same view still show `-`.
