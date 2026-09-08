---
title: The playable championship is the clock
type: decision
ticket: MS-103
decided: 2026-09-07
status: implemented
---

# The playable championship is the clock

**Decision.** Stop advancing the AI championships one round per human round. Only the playable
championship moves on `END_ROUND_FOR_ALL_CHAMPIONSHIPS`; the promotion and relegation championships
are brought up to date in a single execution at **sync points** — the end of each of the playable
championship's phases, and the end of its season.

## Why the old rule had to go

`ChampionshipService.endRoundForAllChampionships` called `endRound` exactly once on each of the three
championships per human round. That is a hard round-for-round pairing, and it only ever worked
because Série A and Série B both play 38 rounds.

**It was already broken on the MS-102 seeds, before any MS-103 change.** Reproduced 2026-09-07 with
A1 as the playable championship:

```
A1 rounds 17   A2 rounds 15     (first phase only; each grows by 6 as its knockouts generate)
startRound failed at playable round 22: Championship couldn't be found.
```

Both divisions append their knockout rounds as they go, so A1 ends on 23 and A2 on 21. The pairing
breaks the moment the shorter competition runs out — the round is looked up by number and the lookup
throws. MS-103 widens the mismatch: A1 23, A2 21, A3 14.

## The rule

- The playable championship advances one round per `END_ROUND_FOR_ALL_CHAMPIONSHIPS`.
- The AI championships are **not** stepped in pairs with it. At each sync point each one runs every
  round it owes and resolves any phase it completes, in one pass, with no UI clock involvement.
- Sync points are **the end of each phase of the playable championship** and **the end of its
  season**. The season-end sync is mandatory: promotion and relegation read the AI divisions'
  semifinalists and 1ª Fase tables, and those do not exist until those divisions have been played to
  their finals.
- A championship that has run out of rounds is a **no-op**, never an error, so nothing can overflow
  its round lookup again.

## Why this is not observable for the men's divisions

Nothing in `src/presentation`, `src/use-cases` or `src/game-engine` reads `promotionChampionship` or
`relegationChampionship` — the UI only ever renders the playable one. The AI divisions are fully
played before promotion and relegation are read, so the men's season produces the same fixtures, the
same exchange and the same club counts as before. That is pinned by test.

`startRoundForAllChampionships` no longer starts a round on the AI championships either, which means
`MatchService.runMatchActions` no longer simulates them tick by tick; the catch-up simulates their
matches itself.

## What was rejected

**Padding the shorter competitions with filler rounds**, which the MS-103 plan floated. It invents
fixtures no regulation produces, and the club counts and match totals this wiki asserts would stop
matching.

See [[phases-and-knockouts]], [[ms-103-a1-club-count-growth]].
