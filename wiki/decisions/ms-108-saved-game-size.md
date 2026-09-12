---
title: A saved game stores club references, not club copies
type: decision
ticket: MS-108
decided: 2026-09-12
status: implemented
asserts:
  - file: src/infrastructure/data-transfer-objects/GameStateSaveDTO.ts
    exists: true
  - file: src/infrastructure/mappers/GameStateMapper.ts
    exists: true
  - file: src/infrastructure/repositories/GameRepository.ts
    exists: true
---

# A saved game stores club references, not club copies

**Decision.** A game is dehydrated at the serialisation boundary: every `Team`, `Player` and
`Standing` reference outside `championship.teams` is written as an id and resolved back from
`teams` on load. The in-memory `GameState` does not change, `localStorage` stays the backend,
`GameRepository` stays synchronous, and pre-MS-108 saves are abandoned rather than migrated.

This closes the persistence gap [[ms-107-container-recentring]] left open.

## Why it needed deciding

A men's saved game did not fit. `GameRepository.saveGame` was `JSON.stringify(state)`, and every
`Match` embeds full copies of `homeTeam` and `awayTeam` — squads included — so each squad is
duplicated once per fixture it appears in. A played Série D season measured 5,132,127 code units
against `localStorage`'s 5,000,000-unit quota, so the save threw `QuotaExceededError`, surfaced as
`state.hasError`, and the game was silently not saved. MS-107 could only prove its round-trip on the
women's pyramid for this reason.

Two things had to be decided and neither is readable from the code: **what** gets stored, and
**where**.

## Measurements

Taken on `dev` with `tests/support/scriptedSeason.ts`. A fresh Série D game is D playable plus C as
the promotion neighbour, 64 + 20 clubs.

Where the bytes were, before the change:

| Slice | Code units | Share |
| --- | ---: | ---: |
| Whole `ChampionshipContainer` | 4,029,978 | 100% |
| `matchContainer.rounds` | 3,558,595 | 88% |
| — of which embedded `homeTeam` + `awayTeam` copies | **3,481,124** | **86%** |
| — of which `scorers` | 1,276 | <1% |
| `standings[].team` copies | 229,176 | 6% |
| `teams`, the canonical list, kept as-is | 229,262 | 6% |

What the four real cases now measure, in memory against on disk:

| Case | In memory | Saved | Cut |
| --- | ---: | ---: | ---: |
| Série D, fresh | 3,960,324 | 557,390 | 85.9% |
| Série D, played season | 5,132,127 | 400,274 | 92.2% |
| Re-centred D → C, three divisions | 6,144,347 | 712,681 | 88.4% |
| Re-centred A3 → A2 | 2,577,652 | 421,550 | 83.6% |

The two cases that threw before MS-108 now sit at 8% and 14% of the quota. A played season saves
*smaller* than a fresh one because a fresh Série D carries its whole unplayed fixture list, while a
finished season has been narrowed to the knockout bracket.

## Axis A — what gets stored: dehydrate at the save boundary only

`Match` keeps holding full `Team` objects in memory; the mapper swaps them for ids on write and
resolves them on read. Nothing outside `src/infrastructure/` knows.

*Rejected: change the `Match` model to `homeTeamId` / `awayTeamId` everywhere.* The honest fix, and
the expensive one: ~320 occurrences across 23 `src` files and 18 test files, every screen rewritten
to look a club up before it can render a fixture, for a saving the save boundary gets for free.

*Rejected: persist scores only and regenerate fixtures on load.* Fixtures are generated from a
round-robin rotation and from phase progression that reads results, so regeneration has to replay
the season to be faithful. That makes loading a game depend on the fixture generator never changing
— a far worse contract than storing ids.

*Rejected: rely on a bigger backend alone.* It would work, and it would leave 86% of every save as
duplicated squads. Whatever the backend, storing the same squad 90 times is the actual defect.

## Axis B — where it gets stored: `localStorage` stays

Dehydration brings every measured case to under 15% of the quota, so the backend is no longer the
binding constraint. `GameRepository` stays synchronous, and `GameEngine.reduce` → `GameUseCases` →
`GameService` are untouched.

The deferred options, should a future ticket need them — **IndexedDB**, **OPFS**, or
**SQLite-in-wasm** — share one consequence that makes them expensive: all three are asynchronous.
`GameRepository` would have to return promises, `GameService` and `GameUseCases` would follow, and
`GameEngine.reduce` is a synchronous reducer returning a new `GameState`, so `dispatch` itself would
have to change shape. That ripple is the reason none of them was taken for a size problem that
dehydration solves outright.

## Old saves are abandoned, not migrated

The storage key is versioned — `match-simulator-game-state-v2` — and the payload carries
`saveVersion: 2`. A pre-MS-108 save, or one with any other version, is treated exactly as a missing
save: `InitialScreen` hides *continue* and the player starts a new game. The old
`match-simulator-game-state` key is removed on the next read rather than left occupying a quota this
project needs.

No legacy hydration branch is carried. This is a hobby project with no shipped saves worth
migrating, and a branch that reads a format nothing writes rots unnoticed.

## The equivalence rule, and what a reload loses

A played match currently carries a **historical snapshot** of its two clubs — their `morale`, and
each player's `xp` / `strength` / `isStarter` / `isSub` as they stood when that match was played —
because `TeamStatsService.updateChampionshipTeamStats` only refreshes fixtures in rounds whose
`status` is `not-started`. Those snapshots are **not preserved** across a save: after a reload, every
past match references the club as it is now.

This is a deliberate loss, and it is bounded:

- Nothing reads them. `TeamStatsService` reads `match.homeTeam.id` and the scores; the screens render
  the current round.
- The one case that would matter — the lineup of the round about to be or being played — *is*
  preserved. The current round's clubs are stored in full under `currentRoundTeams`, about 55,000
  code units, under 2% of a dehydrated save, and they win over `teams` when that round is rehydrated.

So "the reloaded game equals the saved one" means: equal once both sides have their match and
standing references resolved from `championship.teams` by id, with the current round byte-identical.
That rule is implemented once, in `tests/support/savedGameEquivalence.ts`, and every round-trip test
judges by it.

> **Not asserted.** The lint has no form for a claim about a `.ts` file's behaviour, so these stay
> prose, pinned by tests instead:
> - Dehydrate/hydrate round-trips matches, standings, scorers and `phaseEntrants`, and an
>   unresolvable id throws naming the id — `tests/infrastructure/mappers/GameStateMapper.test.ts`.
> - The three real containers save, round-trip and stay under 5,000,000 code units —
>   `tests/infrastructure/repositories/SavedGameSize.test.ts`.
> - A reloaded game plays the next round to the same fixtures, scores and standings as one that was
>   never saved, under a pinned rng — `tests/infrastructure/repositories/SavedGameReplay.test.ts`.
>   This is what justifies dropping the historical snapshots.
> - A pre-MS-108 payload is ignored and its key removed; `hasSavedGame` agrees with `loadGame` both
>   ways — `tests/infrastructure/repositories/GameRepository.test.ts`.
> - The men's promoting roll-over saves with `hasError === false` and `TeamManager` renders the
>   human's new division — `src/presentation/pages/TeamManager/TeamManagerAfterMensPromotion.test.tsx`.

## A second defect fixed on the way

`InitialScreen` decided whether to offer *continue* by calling `GameService.loadGame()` and reading
`succeeded`, which parsed and rebuilt the entire container during render to produce a boolean. It now
calls `GameService.hasSavedGame()`, which scans the stored string for the save version without
parsing it.

## Left open

- **The backend is no longer the binding constraint, but it is still 5 MB.** A pyramid deeper than
  three divisions, or per-season history, would reopen the question — and then the asynchronous
  ripple described above is the real cost, not the storage itself.
- **`UPDATE_TEAM_STATS` is a no-op on the roll-over turn**, pre-existing and untouched. Recorded on
  [[ms-107-container-recentring]].
