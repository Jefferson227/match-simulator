---
title: Player stamina
type: spec
verified: 2026-09-20
owner: user
asserts:
  - file: src/domain/features/match-simulation/StaminaPolicy.ts
    exists: true
  - file: src/domain/features/match-simulation/StrengthResolver.ts
    exists: true
  - file: src/domain/features/phases/PenaltyShootoutSimulator.ts
    exists: true
---

> **Spec, not description.** This is the contract `StaminaPolicy.ts` and the stamina path through
> `StrengthResolver.ts` are judged against. If the code and this page disagree, the code is wrong
> until the user says otherwise. The user owns this page; Claude keeps it in sync and drafts
> changes, but does not change the rules unilaterally.

# Player stamina

Introduced by MS-111. Stamina makes a squad's age matter: an old side is as strong as a young one at
kickoff and materially weaker by the final whistle. It extends the strength model in
[[match-simulation]], which until MS-111 listed fatigue among the things the model deliberately did
not have.

## The rule

Stamina is a number in `[1, 100]`. Every player starts every match at 100 and loses 1 point every
`N` ticks, where `N` is set by the player's age. Wherever a player's strength is read **during a
match**, the value used is:

```
effectiveStrength = strength * (stamina / 100)
```

Unrounded. Strength 43 at stamina 99 is 42.57, not 43.

## The age table

`N` — ticks per stamina point — by age:

| Age band | 1 point per … ticks | Lost over 90 ticks |
| -------- | ------------------- | ------------------ |
| ≤ 20     | 15                  | 6                  |
| 21–25    | 13                  | 6                  |
| 26–28    | 10                  | 9                  |
| 29–32    | 6                   | 15                 |
| 33–35    | 4                   | 22                 |
| 36–38    | 3                   | 30                 |
| > 38     | 2                   | 45                 |

The youngest band is open at the bottom, so an implausibly young age cannot fall through it; the
oldest is open at the top. A 39-year-old finishes a match at 55% of their strength while a
23-year-old finishes at 94%.

### The ratio column wins, and that is a resolution, not a transcription

The source spec (`.plans/MS-111/input/PlayerStaminaLogic.md`) carried **both** columns above, and
from age 29 up they disagree with each other — its own "per match" figures do not follow from its
ratios. **The ratio column is authoritative** and the per-match column above is derived from it,
which is why those two columns are consistent here and were not in the source. Anyone reconciling
this page against the original should expect the difference and not treat it as a transcription
error.

## Where the multiplier applies

The multiplier is applied **per player, before aggregation**. A summed team strength is the sum of
each player's stamina-adjusted strength, not the team's raw sum scaled once.

Order of operations, and it is fixed: stamina first, then the ±30% morale band from
[[match-simulation]], then the rounding and the `max(1, …)` floor. Morale keeps the last word, so a
fully drained lineup still fields at least 1.

## Scope

Stamina is **match-scoped**. It is not carried between matches, has no effect outside one, and is
never persisted — a value caught mid-match in a save is stale the moment it is read back, so it is
dropped on the way to disk rather than on the way back.

Three deliberate exclusions:

- **Penalty shootouts are contested at full strength.** 90 minutes of fatigue does not carry into
  the shootout. This is a choice, not an oversight, and it is why the dispute functions take an
  `applyStamina` flag at all.
- **Only players on the pitch tire.** Bench players stay at 100. This is free rather than designed:
  the engine has no substitutions, so nobody on the bench ever plays.
- **Players do not age between seasons.** A squad's ages are fixed for the life of a save.

## Derived, not accumulated

Stamina at a given tick is computed **from the minute**, not decremented from the previous value:

```
stamina(age, minute) = max(1, 100 - floor((minute + 1) / N))
```

This is the load-bearing design decision. It makes a tick idempotent — replaying minute 45 twice
yields the same stamina — so a match resumed from a save cannot drift or double-count, and no
bookkeeping has to survive the save boundary. It is also why nothing resets stamina at kickoff: the
smallest `N` is 2, so `floor(1 / N)` is 0 at minute 0 and every band already evaluates to 100.

> **Not asserted.** The lint pass can only check that the files exist. The table, the multiplier
> order, the floor and the shootout exemption are pinned by
> `tests/domain/features/match-simulation/StaminaPolicy.test.ts`,
> `tests/domain/features/match-simulation/StrengthResolver.test.ts`,
> `tests/domain/services/MatchService.test.ts` and
> `tests/domain/features/phases/TieResolution.test.ts` instead.

## Consequences worth knowing

- **Age is now a balance lever with no UI.** Nothing renders stamina or age yet, so a player fading
  is invisible to the user; only the result moves.
- **The AI divisions get it for free.** They run the same `runMatchTick`, so their matches tire too.
- **It interacts with the summed-strength tension** already recorded in [[match-simulation]]: an
  extra body in an area is worth more than quality, and now also more than freshness.
- **Seed ages are invented**, so the *distribution* of fatigue across the league is not a claim
  about real squads. See [[player-ages]].
