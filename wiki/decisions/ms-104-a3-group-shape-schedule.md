---
title: A3's group shape follows its club count
type: decision
ticket: MS-104
decided: 2026-09-09
status: implemented
asserts:
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a3
    path: phaseVariants.length
    equals: 2
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a3
    path: phaseVariants.0.minNumberOfTeams
    equals: 32
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a3
    path: phaseVariants.1.minNumberOfTeams
    equals: 0
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a3
    path: phaseVariants.1.phases.0.numberOfGroups
    equals: 4
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a3
    path: phaseVariants.1.phases.0.legs
    equals: 1
---

# A3's group shape follows its club count

**Decision.** A competition may declare more than one shape. Each is guarded by the smallest field it
can be played with, and the season roll-over picks the first one the incoming field satisfies. Série
A3 declares two: the 32-club regulation shape, and a reduced 4-group shape it drops into as soon as
its field falls below 32.

[[ms-103-a1-club-count-growth]] let a division's club count move across a roll-over but left its
*format descriptor* frozen. A3 loses 2 clubs a season, so from its second season it was being played
in eight groups that no longer held four clubs each — eight lopsided groups, indefinitely. MS-104
makes the shape follow the field.

## CBF publishes nothing that governs this

**The entire schedule below is invented for playability. It is not a claim about the real
competition.** CBF has published no post-2027 regulation for any of the three women's divisions
(re-verified 2026-09-09; the state of the evidence is on [[ms-103-a1-club-count-growth]] and
[[known-contradictions]]). REC A3 2026 Art. 2º re-composes A3 every year from 27 state champions,
which the game has no source for and does not invent — see [[invented-data]].

So A3 shrinks, and the question MS-104 answers is only *what it is played as while it shrinks*.

## The schedule

Nothing forces a club count directly. Every number is a consequence of the exchange rules.

| Season | A1 clubs | A1 relegates | A2 clubs | A2 promotes / relegates | A3 clubs | A3 promotes |
|---|---|---|---|---|---|---|
| 2026 | 18 | 2 | 16 | 4 / 2 | 32 | 4 |
| 2027 | 20 | 4 | 16 | 4 / 2 | 30 | 4 |
| 2028 | 20 | 4 | 18 | 4 / 2 | 28 | 4 |
| 2029 | 20 | 4 | 20 | 4 / 4 | 26 | 4 |
| 2030+ | 20 | 4 | 20 | 4 / 4 | 26 | 4 |

Per roll-over:

- **A1** `18 −2 +4 = 20`, then `20 −4 +4 = 20` forever. Its switch to 4 down is MS-103's
  `numberOfRelegatableTeamsAtTarget`, unchanged by this ticket.
- **A2** `16 −4 +2 −2 +4 = 16`, `16 −4 +4 −2 +4 = 18`, `18 −4 +4 −2 +4 = 20`, then
  `20 −4 +4 −4 +4 = 20`. It stalls at 16 for one season because A1 is still relegating only 2 while
  it grows to its own target.
- **A3** `32 −4 +2 = 30`, `−4 +2 = 28`, `−4 +2 = 26`, then `26 −4 +4 = 26` once A2 is at target and
  relegates 4.

The pyramid settles at **A1 20 / A2 20 / A3 26** from 2029. A1 and A2 need no data change for any of
this; MS-103's `targetNumberOfTeams` / `numberOfRelegatableTeamsAtTarget` pair already produces both
curves, and MS-104 only asserts them.

## The two shapes A3 is played in

| A3 clubs | Groups | Group sizes | Legs | Advance/group | Qualifiers | Bracket |
|---|---|---|---|---|---|---|
| 32 | 8 | 4 × 8 | 2 | 2 | 16 | Oitavas → Quartas → Semi → Final |
| 30 | 4 | 8, 8, 7, 7 | 1 | 2 | 8 | Quartas → Semi → Final |
| 28 | 4 | 7 × 4 | 1 | 2 | 8 | Quartas → Semi → Final |
| 26 | 4 | 7, 7, 6, 6 | 1 | 2 | 8 | Quartas → Semi → Final |

Only the two endpoints are seeded. The reduced variant declares `teamsPerGroup: 8` — the top of its
range — and `splitIntoGroups` spreads a smaller field evenly across the four groups without any
further data, so 30, 28 and 26 all fall out of one variant.

The Quartas takes `secondLegHost: 'group-winner'`, because it is now the phase the group stage
feeds, exactly as the Oitavas is in the 32-club shape. Semifinal and Final keep `accumulated-points`,
and the tiebreaker cascade is untouched.

## Why the group stage drops from two legs to one

The 32-club shape plays 8 groups of 4 over two legs: **6 rounds**. Four groups of 7–8 over two legs
would be **12–14 rounds**, roughly doubling the season for the division that plays the most clubs
and the least interesting football. Over a single leg it is **7 rounds** — comparable to the 6 it
replaces, and the change is invisible in season length.

The qualifier count is what actually mattered for the bracket, and 4 groups × 2 advancing = 8 fills
a Quartas exactly, with no byes.

## Why selection is by club count and never by year

The obvious alternative was to switch A3's shape in 2027. It was rejected because the year is not
the thing that makes the shape wrong — the field size is. Selecting by club count:

- survives a division drifting off the predicted curve, which it does the moment a container holds
  only two of the three divisions (see MS-103's consequence about unmodelled borders);
- survives a player starting the game in a later year — `createMatches` stamps the first season with
  `new Date().getFullYear()`, so nothing in the game is anchored to 2026;
- survives any future reseed of A3 at a different size.

**Nothing in the code or the seed data names a year, and nothing in the code names the number 32.**
The rule is `first variant whose minNumberOfTeams <= teams.length`; 32 is data.

## A3 2027 is 30, not 28

The ticket's first draft had A3 at 28 in 2027. That needs an extra 2-club removal at the 2026→2027
roll-over only — not a repeating rule, and no mechanism in the game produces it. Confirmed as a slip.
The exchange stays the only thing that moves clubs, so A3 settles at **26 rather than 24**, and no
club-trimming or club-inventing mechanic was introduced.

## What was rejected

- **Switching on the season year.** See above.
- **Backfilling A3 to keep it at 32.** Already rejected by MS-103 and unchanged: the game has no
  source for state champions and will not fabricate clubs ([[invented-data]]).
- **Combining variants with staggered entry.** `Championship.phaseEntrants` is resolved once, at
  load, from `phases`; a variant switch would leave it describing a shape that is no longer being
  played. The repository rejects a variant list carrying `entrants` rather than leaving the
  combination half-working. Only the [[copa-do-brasil-feminina]] uses staggered entry, and it has a
  fixed field.
- **Teaching the consumers about variants.** `phases` stays the single source of truth for
  `PhaseView`, `PhaseProgression`, `FixtureGenerator` and the promotion floor; the roll-over writes
  the selected shape into `phases` and nothing downstream knows a choice was made.

## One thing MS-104 had to fix on the way

`getSustainablePromotionCount` capped A3's outflow using a floor read off the shape it had **just
played** — 16 while it was in 8 groups feeding an Oitavas. A division that has shrunk out of a shape
should not be held to that shape's floor, so the floor is now computed from the phases the division
is *about* to use, selected from the post-exchange field.

Across this whole schedule the cap is inert: the floor is 8 from 2027 and A3 never falls below 26.

> **Not asserted.** That the cap never binds is a property of the schedule, not a literal in the
> seed. It is pinned executably in `tests/domain/services/SeasonSchedule.test.ts`, which drives four
> roll-overs and asserts the table above row by row.

See [[brasileirao-feminino-a3]], [[promotion-and-relegation]], [[phases-and-knockouts]],
[[invented-data]].
