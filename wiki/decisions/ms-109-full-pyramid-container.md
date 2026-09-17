---
title: The container holds the whole pyramid, and the AI divisions are dripped across the season
type: decision
ticket: MS-109
decided: 2026-09-17
status: implemented
asserts:
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-a
    path: tier
    equals: 1
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-b
    path: tier
    equals: 2
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-c
    path: tier
    equals: 3
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: tier
    equals: 4
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a1
    path: tier
    equals: 1
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a2
    path: tier
    equals: 2
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a3
    path: tier
    equals: 3
  - file: src/infrastructure/data/championships.json
    select: internalName=supercopa-feminina
    absent: tier
  - file: src/infrastructure/data/championships.json
    select: internalName=copa-do-brasil-feminina
    absent: tier
  - file: src/domain/features/pyramid/Pyramid.ts
    exists: true
  - file: src/domain/features/phases/SeasonRoundCount.ts
    exists: true
---

# The container holds the whole pyramid, and the AI divisions are dripped across the season

**Decision.** `ChampionshipContainer` holds every league division of the human's league type —
Série A to D, or A1 to A3 — ordered by a new `tier` seed field, with `playableInternalName` pointing
at the division the human plays in. At roll-over every adjacent pair of tiers exchanges clubs at
once, and a human who changes division moves only the pointer. The AI divisions are no longer
caught up in one pass at the playable division's phase boundaries: each is dripped the rounds it
owes after every playable round, from its own random stream, and played to its end when the
playable season ends.

This supersedes the three-slot, re-centred container of [[ms-107-container-recentring]] and amends
the sync points of [[ms-103-ai-championship-catch-up]].

## Why MS-107's choice had to be reopened

The three-slot window could not hold the men's pyramid. With the human in Série D it held D and C
only, so:

- Série A and B were never instantiated, and Série C's top clubs never went up — the exchange only
  moved the clubs that touched the playable division.
- The end-of-season summary could show at most the three divisions in the window.
- A division leaving the window lost its state and was reseeded on re-entry, the consequence MS-107
  accepted.

MS-107 rejected the whole pyramid for two reasons, and both had gone:

- **Save size.** MS-107 measured the men's container over `localStorage`'s quota.
  [[ms-108-saved-game-size]] then cut a played Série D save by 92%; the whole men's pyramid now saves
  at under a fifth of the quota (below).
- **"State no screen shows."** The season summary now wants every division.

## Measurements

Simulation cost, taken on `dev` before the change (raw `runMatchTick` over each division's initially
generated rounds):

| Division | One season | In-memory JSON |
| --- | ---: | ---: |
| Série A | 61 ms | 1.83 MB |
| Série B | 51 ms | 2.24 MB |
| Série C | 24 ms | 1.17 MB |
| Série D | 71 ms | 2.86 MB |

One clock minute across the whole men's pyramid is about 0.11 ms. Spreading the AI rounds across the
season does not reduce the total CPU; it removes the stall of playing them all at once — with the
human in Série D, that is Série A, B and C's 136 ms in a single step at the season end.

Saved sizes after MS-109, in UTF-16 code units against the 5,000,000-unit quota (measured with the
scripted season harness, human on the top seed):

| Case | Saved | In memory |
| --- | ---: | ---: |
| Men's pyramid, fresh (Série D entry) | 850,506 | 7,932,867 |
| Men's pyramid, played season, human in D | 694,239 | 9,246,939 |
| Men's pyramid, rolled over D → C | 850,960 | 7,928,212 |
| Women's pyramid, fresh (A3 entry) | 422,078 | 2,384,752 |
| Women's pyramid, played season, human in A3 | 321,219 | 3,302,861 |
| Women's pyramid, rolled over A3 → A2 | 422,105 | 2,599,306 |

The peak is a fresh or just-rolled-over pyramid, where every division's round 1 is kept whole as
`currentRoundTeams`; a finished season has no current round left to keep.

## The shape

- `championships` — the pyramid, top tier first. A division never leaves it.
- `playableInternalName` — the human's division. `hasTeamControlledByHuman` is kept true on that
  division alone.
- `cups?` — declared so it survives save and load. Cups are not loaded, simulated or shown yet.

`tier` is 1 for the top of each league type. The repository rejects a seed whose tiers are
duplicated, have a gap, or disagree with the `promotionChampionshipInternalName` /
`relegationChampionshipInternalName` chain. A cup carries no tier.

*Rejected: keep compatibility accessors named after the old slots.* Every consumer moved to the
pyramid helpers instead (playable, by name, above, below). Screens read the playable division through
`ChampionshipUseCases`, keeping presentation off the domain helpers.

## The exchange: every boundary, computed first, applied at once

For each boundary between tier *n* and *n+1*, the clubs relegated out of *n* and the clubs promoted
out of *n+1* are computed from the **pre-roll-over tables**, before any club moves. Then every division
loses its promoted and relegated clubs and gains the ones coming down from above and up from below,
in the same roll-over. A middle division such as Série C therefore changes both ways at once, and no
boundary reads a table another boundary has already altered.

Each boundary keeps MS-103's per-division rules: each division's own counts and `promotionRule` /
`relegationRule`, the A1 growth to `targetNumberOfTeams`, the `getSustainablePromotionCount` cap
(applied per boundary, against the clubs relegated down that boundary), and `rolloverSlotting`.
Incoming clubs are ordered from-above first, then from-below, which is the order a
`replace-in-place` division slots them.

One visible consequence: with A1 playable, A2 used to shrink to 14 and stay there, because A3 was
not in the container to refill it. The A2 ↔ A3 boundary now exchanges too, so over three seasons A2
goes 16 → 16 → 18 → 20, the same as with the human in A3.

## Pacing: dripped per playable round

After each `END_ROUND_FOR_ALL_CHAMPIONSHIPS`, an AI division of `N` season rounds has completed
`ceil(p × N / P)` rounds, where `p` is the playable division's completed rounds and `P` its season
length — never behind the playable division's progress through its season, and less than one round
ahead of it. When the playable season is over, every AI division is played to its end — the MS-103
guarantee that promotion, relegation and the summary never read an unfinished table.

A phased division generates its knockout rounds only as the season goes, so its `totalRounds` grows
mid-season and cannot be the `N` above. `N` is derived up front from `phases` instead:
round-robin rounds per largest group times legs, plus each knockout's legs, walking the field from
phase to phase. It matches the rounds actually generated — Série A 38, B 38, C 27, D 24; A1 23, A2 21,
A3 14 — at every point of the season.

*Rejected: keep MS-103's catch-up at the playable division's phase boundaries.* With the whole
pyramid that pass is the stall MS-109 exists to remove; the drip makes it unnecessary.

*Not chosen: drip per clock minute.* The drip point was settled as the playable round in the MS-109
discussion; no further rationale was recorded. The UI clock and `RUN_MATCH_ACTIONS` tick only the
playable division, and an AI round is played whole, in one pass, when it is owed.

## Per-division randomness

Each AI division draws every match minute and every shootout from its own `RandomProvider`
(`rngForDivision`). Its results therefore depend only on its own draws, so dripping its rounds or
playing them all in one pass at the season end produces the same table under an injected rng.
Production keeps the shared unseeded provider for every division.

> **Not asserted.** The lint has no form for behaviour in a `.ts` file, so these stay prose, pinned
> by tests instead:
> - A new game loads the whole pyramid, top tier first, entry division playable —
>   `tests/domain/services/PyramidInitialisation.test.ts`.
> - D → C, B → C, A3 → A2 and A2 → A3 move only the pointer; D → C → B → C keeps Série C's own clubs
>   and state — `tests/domain/services/PyramidMovement.test.ts`.
> - With the human in D, B's promoted clubs reach A and A's relegated clubs reach B; Série C changes
>   both ways in one roll-over; club counts follow each division's rules over three seasons —
>   `tests/domain/services/PyramidExchange.test.ts`.
> - No AI division is off pace after any playable round, none is caught up at a phase boundary, and
>   each ends identical to a one-pass season end — `tests/domain/services/AmortisedCatchUp.test.ts`.
> - One division's results do not depend on another's draws —
>   `tests/domain/services/DivisionRandomStreams.test.ts`.
> - `getSeasonRoundCount` equals the generated rounds for every seeded division —
>   `tests/domain/features/phases/SeasonRoundCount.test.ts`.
> - The summary has one page per tier, opens on the human's division, and always knows each
>   division's promoted and relegated clubs — `tests/domain/services/SeasonSummaryBuild.test.ts`,
>   `src/presentation/pages/SeasonSummary/SeasonSummary.test.tsx`.

## Persistence

The saved container mirrors the new shape and the save format moved to version 3. A version-2 save
is abandoned, not migrated, as [[ms-108-saved-game-size]] abandoned version 1: the payload's version
no longer matches, so it reads as no saved game. Per-championship dehydration is unchanged.

## Left open

- **Cups** are declared on the container but not loaded, simulated or shown.
- **Browsing another tier's table** is out of scope: `TeamStandings`, `TeamManager`,
  `MatchSimulator` and `TeamAdditionalInfo` show only the playable division.
- **An unphased playable division is "over" one round early.** `isChampionshipOver` treats
  `currentRound >= totalRounds` as over, so with Série A or B playable the season-end catch-up runs
  after round 37 of 38. Pre-existing, unchanged by MS-109.
- **`UPDATE_TEAM_STATS` is a no-op on the roll-over turn**, pre-existing and unchanged — see
  [[ms-107-container-recentring]].
