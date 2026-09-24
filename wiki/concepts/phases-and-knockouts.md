---
title: Phases and knockouts
type: concept
verified: 2026-09-23
sources: [rec-a1-2026, rec-a2-2026, rec-a3-2026, rec-copa-2026, rec-serie-c-2025, rec-serie-d-2025, rec-serie-d-2026, tabela-serie-d-2026]
asserts:
  - file: src/domain/models/ChampionshipPhase.ts
    exists: true
  - file: src/domain/features/fixture-generation/KnockoutBracket.ts
    exists: true
  - file: src/domain/features/phases/PhaseProgression.ts
    exists: true
  - file: src/infrastructure/data/championships.json
    select: internalName=copa-do-brasil-feminina
    path: phases.length
    equals: 8
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: phases.2.crossings.from
    equals: previous-ties
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-c
    path: phases.2.crossings.from
    equals: group-position
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: phases.5.playoff.from
    equals: previous-phase-losers
---

# Phases and knockouts

Every women's competition CBF runs is **phased**: a league or group stage, then two-legged
knockouts. So are the men's Série C and D. `phases` declares the real shape, and since MS-103 the
engine executes it. The men's Série A and B stay unphased double round-robins.

## The descriptor

`src/domain/models/ChampionshipPhase.ts`, populated in `championships.json`:

```
round-robin  → numberOfGroups, teamsPerGroup, legs, advancingPerGroup, groupAllocation?
knockout     → numberOfTies, legs, secondLegHost, tiebreakers, entrants?, crossings?, reseed?, playoff?
playoff      → name, from: 'previous-phase-losers', pairs, secondLegHost, tiebreakers
```

`entrants` names the clubs joining at that phase, and exists for the cups' staggered entry. The
other three optional fields were added by MS-106, because Série C and D print their pairings
instead of leaving them to a seeding rule:

- `groupAllocation: 'serpentine'` deals a ranked field snaking across the groups: 1→A, 2→B, 3→B,
  4→A… Série C's 2ª Fase is 1ª Fase 1-4-5-8 / 2-3-6-7 (REC C Anexo B). Absent means the declared
  order, which is how Série D's real regional groups are reproduced.
- `crossings` copies an Anexo B literally. `from: 'group-position'` pairs placings of the previous
  group stage; Série D's 2ª Fase is 1º A-1 × 4º A-2, 2º A-2 × 3º A-1…, and Série C's final is the
  two group winners. `from: 'previous-ties'` pairs winners of the previous knockout by tie index;
  Série D's 3ª Fase is W(B-1)×W(B-6), W(B-2)×W(B-5)… **Pair order is emission order**, so a later
  `bracket` phase keeps following it.
- `reseed: 'accumulated-points'` re-ranks the survivors on points summed across every phase, then
  pairs them 1×8, 4×5, 2×7, 3×6. That is Série D's quarter-final "Bloco I" (REC D Art. 18).
- `playoff` (MS-112) declares a second set of ties played **alongside** the phase, among the clubs
  the previous knockout knocked out. Série D 2026's quarter-final losers are re-ranked on
  accumulated points ("Bloco II") and paired by the explicit seeds `[[1, 4], [2, 3]]`, the 1º and
  2º hosting (REC D 2026 Art. 21 §§2–3). Its winners advance nowhere; they are kept on
  `Championship.playoffWinnerIds` for the promotion rule (see [[promotion-and-relegation]]).

The repository rejects at load time a crossing the previous phase cannot produce, a playoff whose
previous phase is not a knockout or whose seeds are not exactly 1..that phase's ties, and a `seed`
tiebreaker under any hosting but `higher-seed`.

**Why the playoff lives inside the semifinal phase.** REC D 2026 lists the Playoffs as a stage of
their own, *before* the 6ª Fase. But they are fed by the 5ª Fase like the semifinal, lead nowhere,
and are played at the same time (Tabela Básica: semifinal 23/08–30/08, playoffs 26/08–02/09). Kept
in the semifinal's rounds, `currentPhaseIndex` stays linear, the season gains no extra round, and
"the championship is over" still means the final is decided, which can only happen after both. The
playoff matches are tagged `bracket: 'playoff'`. They share the semifinal's table, so their legs
count towards accumulated points, but not its bracket or its `phaseParticipants`. The alternative,
a phase fed from two phases back, would have broken the linear phase index everything else relies
on.

| Competition | Phases | Shape |
|---|---|---|
| [[brasileirao-feminino-a1]] | 4 | 1 group of 18, single RR → QF → SF → F |
| [[brasileirao-feminino-a2]] | 4 | 1 group of 16, single RR → QF → SF → F |
| [[brasileirao-feminino-a3]] | 5 | 8 groups of 4, double RR → R16 → QF → SF → F |
| [[copa-do-brasil-feminina]] | 8 | pure knockout, staggered entry |
| [[supercopa-feminina]] | 1 | single match |
| [[brasileirao-serie-c]] | 3 | 1 group of 20, single RR → 2 serpentine groups of 4, double RR → F |
| [[brasileirao-serie-d]] | 7 | 16 groups of 6, double RR → 2ª (crossings) → 3ª, 4ª (crossings) → QF (re-seeded Bloco I) → SF + playoff (Bloco II) → F |

**Every phase restarts at zero points**, in all seven competitions.

Only the **first** phase is generated when a competition is created. Every later phase depends on
results that do not exist yet, and is generated as its predecessor is resolved — so the round list
and `totalRounds` **grow** during a season. "The championship is over" therefore means *the last
phase's final is decided*, not *the rounds ran out*.

## Second-leg hosting is not one rule

This is the trap. Three different mechanics, and the Copa's is incompatible with the divisions':

| Value | Meaning | Used by |
|---|---|---|
| `higher-seed` | Clubs placed 1st–4th in the 1ª Fase host | A1/A2 quarter-finals; Série D quarter-finals on the re-seeded Bloco I, and the playoff on Bloco II, where 1º/2º host (REC D 2026 Arts. 19, 21 §3) |
| `group-winner` | The club with the **better placing in its first-phase group** hosts; the seed decides between equal placings | A3 round of 16 (1º × 2º); Série D 2ª Fase, where 1º/2º hosts 3º/4º (REC D 2026 Art. 19) |
| `accumulated-points` | Points across the whole competition, then the league tiebreaker cascade | A1/A2/A3 semifinals and finals; Série C final (Art. 22); Série D 3ª and 4ª Fase, semifinal and final (REC D 2026 Art. 19) |
| `drawn` | Public DCO draw at **every** phase; home team is whoever sits on the left of the table | **Copa and Supercopa, all phases** |

Hosting is therefore a **per-competition choice, not a constant**, read off the phase descriptor.
The Copa also designates a CBF-chosen neutral stadium for both legs of the final, as do the division
finals; the game does not model stadiums.

## What the engine does with it

- **Group stages** rotate inside each group and merge every group's round *n* into a single round
  *n*, because the UI plays one round at a time. A3's 8 groups of 4 give 6 rounds and 96 matches.
- **Brackets** are seeded six different ways, chosen by the phase being entered, not assumed:
  off a single league table (1º×8º, 2º×7º, 3º×6º, 4º×5º), by crossing neighbouring groups, by
  carrying the previous knockout's survivors through in bracket order, by the cups' draw, which
  pairs the *n*-th club with the *(N+1−n)*-th (Copa Anexo B), by the phase's declared `crossings`,
  or by re-seeding on accumulated points.
- **A round-robin can follow another phase** (MS-106, for Série C's 2ª Fase). It is dealt from the
  qualifiers in rank order, honouring `groupAllocation`.
- **Standings reset to zero at every phase boundary** and hold only the survivors. Every completed
  phase's table is kept aside: relegation reads the 1ª Fase's, and Série C's promotion reads the
  2ª Fase's. Points and goals also accumulate across all phases, because hosting, the Bloco and the
  final classification read that.
- **Ties resolve** on points, always first, then the phase's declared `tiebreakers` in order:
  `goal-difference`, `penalties` (a simulated shootout), or `seed`. `seed` gives the tie to the
  last leg's host, which `higher-seed` hosting makes the better seed. It is Série D's playoff
  reading of REC D 2026 Art. 21 §5. **A phase that does not list `penalties` never shoots out.**
  See [[tiebreakers]] and [[ms-103-simulated-shootout]].
- **Staggered entry** works by the phase naming its `entrants`: each phase's field is the survivors
  plus whoever joins now. There are no byes.

> **Not asserted.** Which seeding a phase gets, and which club ends up hosting, are decisions no
> literal comparison can express. `src/domain/features/fixture-generation/KnockoutBracket.ts` is the
> file that has to honour the table above, and `PhaseProgression.ts` the one that chooses between
> them.

The five phased divisions and both cups all run on this. What the cups needed beyond the divisions —
optional league scaffolding, per-phase entrants, drawn hosting — is in [[ms-102-cups-deferred]].
The AI divisions no longer advance in lockstep with the human's: see
[[ms-103-ai-championship-catch-up]], and [[ms-109-full-pyramid-container]] for how they are paced
now.
