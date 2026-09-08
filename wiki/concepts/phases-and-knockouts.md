---
title: Phases and knockouts
type: concept
verified: 2026-09-07
sources: [rec-a1-2026, rec-a2-2026, rec-a3-2026, rec-copa-2026]
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
---

# Phases and knockouts

Every women's competition CBF runs is **phased**: a league or group stage, then two-legged
knockouts. `phases` declares the real shape, and since MS-103 the engine executes it.

## The descriptor

`src/domain/models/ChampionshipPhase.ts`, populated in `championships.json`:

```
round-robin  → numberOfGroups, teamsPerGroup, legs, advancingPerGroup
knockout     → numberOfTies, legs, secondLegHost, tiebreakers, entrants?
```

`entrants` names the clubs joining at that phase, and exists for the cups' staggered entry.

| Competition | Phases | Shape |
|---|---|---|
| [[brasileirao-feminino-a1]] | 4 | 1 group of 18, single RR → QF → SF → F |
| [[brasileirao-feminino-a2]] | 4 | 1 group of 16, single RR → QF → SF → F |
| [[brasileirao-feminino-a3]] | 5 | 8 groups of 4, double RR → R16 → QF → SF → F |
| [[copa-do-brasil-feminina]] | 8 | pure knockout, staggered entry |
| [[supercopa-feminina]] | 1 | single match |

**Every phase restarts at zero points**, in all five competitions.

Only the **first** phase is generated when a competition is created. Every later phase depends on
results that do not exist yet, and is generated as its predecessor is resolved — so the round list
and `totalRounds` **grow** during a season. "The championship is over" therefore means *the last
phase's final is decided*, not *the rounds ran out*.

## Second-leg hosting is not one rule

This is the trap. Three different mechanics, and the Copa's is incompatible with the divisions':

| Value | Meaning | Used by |
|---|---|---|
| `higher-seed` | Clubs placed 1st–4th in the 1ª Fase host | A1/A2 quarter-finals |
| `group-winner` | The club that won its 1ª Fase group hosts | A3 round of 16 |
| `accumulated-points` | Points across the whole competition, then the league tiebreaker cascade | A1/A2/A3 semifinals and finals |
| `drawn` | Public DCO draw at **every** phase; home team is whoever sits on the left of the table | **Copa and Supercopa, all phases** |

Hosting is therefore a **per-competition choice, not a constant**, read off the phase descriptor.
The Copa also designates a CBF-chosen neutral stadium for both legs of the final, as do the division
finals; the game does not model stadiums.

## What the engine does with it

- **Group stages** rotate inside each group and merge every group's round *n* into a single round
  *n*, because the UI plays one round at a time. A3's 8 groups of 4 give 6 rounds and 96 matches.
- **Brackets** are seeded four different ways, chosen by the phase being entered, not assumed:
  off a single league table (1º×8º, 2º×7º, 3º×6º, 4º×5º), by crossing neighbouring groups, by
  carrying the previous knockout's survivors through in bracket order, or by the cups' draw, which
  pairs the *n*-th club with the *(N+1−n)*-th (Copa Anexo B).
- **Standings reset to zero at every phase boundary** and hold only the survivors. The 1ª Fase table
  is kept aside, because relegation reads it; points and goals also accumulate across all phases,
  because hosting and the final classification read that.
- **Ties resolve** on points, then goal difference *if the phase declares it*, then a shootout —
  see [[tiebreakers]] and [[ms-103-simulated-shootout]].
- **Staggered entry** works by the phase naming its `entrants`: each phase's field is the survivors
  plus whoever joins now. There are no byes.

> **Not asserted.** Which seeding a phase gets, and which club ends up hosting, are decisions no
> literal comparison can express. `src/domain/features/fixture-generation/KnockoutBracket.ts` is the
> file that has to honour the table above, and `PhaseProgression.ts` the one that chooses between
> them.

The three divisions and both cups all run on this. What the cups needed beyond the divisions —
optional league scaffolding, per-phase entrants, drawn hosting — is in [[ms-102-cups-deferred]].
The AI divisions no longer advance in lockstep with the human's: see
[[ms-103-ai-championship-catch-up]].
