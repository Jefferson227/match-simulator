---
title: The championship container follows the human's club between divisions
type: decision
ticket: MS-107
decided: 2026-09-12
status: implemented
asserts:
  - file: src/domain/services/ChampionshipService.ts
    exists: true
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-a
    absent: promotionChampionshipInternalName
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a1
    absent: promotionChampionshipInternalName
---

# The championship container follows the human's club between divisions

**Decision.** At season roll-over, once clubs have been exchanged between divisions, the
championship container is rebuilt around whichever division now holds the human's club. That
division becomes `playableChampionship`; its two neighbours are read from the names its own seed
declares. The container keeps its existing three-slot shape.

This closes the gap [[ms-105-drawn-team-start]] §3 and [[ms-106-mens-lower-divisions]] left open.

## Why it needed deciding

Nothing in the code could state which of three container shapes the game should have, and the choice
is not reversible cheaply — it decides what `GameState` holds, what gets persisted, and what every
consumer of `playableChampionship` can assume.

## The shape chosen, and the two rejected

**Chosen: three slots, re-centred, with the newly-entered neighbour seeded fresh.**
`ChampionshipContainer` keeps `playableChampionship` plus optional `promotionChampionship` and
`relegationChampionship`. On a move, the divisions already in the container are carried over with the
state the roll-over just produced, and the one division that was outside it is loaded from
`championships.json` and initialised exactly as a new game initialises it. No change to `GameState`,
to persistence, or to any consumer.

*Rejected: hold the whole pyramid in `GameState` with a pointer at the human's division.* It is the
only shape that never loses a division's state, but it reshapes `GameState`, every save, and every
consumer that reads `playableChampionship` — and it makes the game simulate four divisions a season
where it currently simulates three, for state no screen shows.

*Rejected: three slots plus a parked-division state map.* A cheaper version of the same idea, and
worse: it keeps two representations of a division's state in sync by hand, and the parked entries are
still dead weight in every save.

## The consequence that was accepted

**A division that drops out of the container loses its state.** Re-entering it seeds it fresh from
`championships.json`, which restarts it from its seeded club list — which can differ from the clubs
that were actually in it when it left. A player who goes D → C → B and then falls back to C will find
a C composed of the clubs the seed names, not the ones that were there two seasons ago.

This was accepted deliberately: the alternative is one of the two rejected shapes, and the divergence
is invisible to the player, who only ever sees three divisions at a time.

Two smaller consequences follow from the same choice:

- A freshly seeded neighbour's `matchContainer.currentSeason` is set to the re-centred playable
  division's, not to the fixture generator's real-world-year default. Without that, a division
  entering the container in season 2030 would display 2026 the day the human moved into it.
- `hasTeamControlledByHuman` is set `true` on the new playable division and `false` on the
  neighbours, so the flag does not describe a division the human has left.

## What re-centring does not change

A season in which the human's club stays in its division returns the very same container object the
exchange produced. No slot moves, nothing is reseeded, and the result is byte-identical to the
pre-MS-107 behaviour.

> **Not asserted.** The lint has no form for a claim about a `.ts` file's behaviour, so these stay
> prose, pinned by `tests/domain/services/ContainerRecentring.test.ts` instead:
> - Promotion D → C leaves C playable, B above and D below; A3 → A2 leaves A2 playable, A1 above and
>   A3 below.
> - Relegation B → C re-centres on C; A2 → A3 re-centres on A3.
> - A human promoted into Série A or A1 gets no `promotionChampionship`, and one who drops into Série
>   D or A3 gets no `relegationChampionship`, with `isPromotable` / `isRelegatable` consistent.
> - The newly-entered neighbour arrives with generated fixtures and `initialisePhaseState`'s result.
> - `TeamManager` renders the human's club after a promoting roll-over
>   (`src/presentation/pages/TeamManager/TeamManagerAfterPromotion.test.tsx`).

## Left open

- ~~**A men's saved game does not fit in `localStorage`**~~ — **closed by MS-108.** The save now
  stores club references rather than club copies, which takes a played Série D season from 5,132,127
  code units to 400,274 and the re-centred D → C container from 6,144,347 to 712,681.
  `localStorage` stayed; `GameRepository` stayed synchronous, so none of the asynchronous ripple
  below was needed. See [[ms-108-saved-game-size]]. The original finding, for the record:
- **A men's saved game does not fit in `localStorage` — raised as MS-108.** Discovered while proving MS-107's
  save/load round-trip, and **pre-existing**: a played Série D season serialises to 5,133,791 code
  units against a 5,000,000-unit quota and throws `QuotaExceededError`, with no MS-107 code on the
  path. Re-centring makes the container larger still (D → C reaches ~6.1M units). The bytes are in
  `matchContainer.rounds`, where every `Match` embeds full copies of both squads: Série D's fixtures
  are 2.34 MB against 0.16 MB of club data. MS-107's round-trip is therefore proven on the women's
  pyramid, which fits. Fixing it means changing what is persisted — team references inside `Match`,
  or regenerating fixtures on load — and possibly changing the backend to IndexedDB or
  SQLite-in-wasm, which would make `GameRepository` asynchronous and force `GameEngine.dispatch` to
  follow. That is MS-108. The measurements are in `.plans/MS-107/docs/`.
- **`UPDATE_TEAM_STATS` is a no-op on the roll-over turn.** `TeamStandings.handleContinue` dispatches
  it immediately after the roll-over, when every division's last finished round belongs to the new,
  unplayed season. Pre-existing and unchanged by MS-107.
