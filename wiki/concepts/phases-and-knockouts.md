---
title: Phases and knockouts
type: concept
verified: 2026-09-05
sources: [rec-a1-2026, rec-a2-2026, rec-a3-2026, rec-copa-2026]
asserts:
  - file: src/domain/models/ChampionshipPhase.ts
    exists: true
---

# Phases and knockouts

Every women's competition CBF runs is **phased**: a league or group stage, then two-legged
knockouts. The game's match engine only knows how to run a flat round-robin. `phases` is the bridge
— a declaration of the real shape, recorded now, executed in MS-103.

## The descriptor

`src/domain/models/ChampionshipPhase.ts`, populated in `championships.json`:

```
round-robin  → numberOfGroups, teamsPerGroup, legs, advancingPerGroup
knockout     → numberOfTies, legs, secondLegHost, tiebreakers
```

| Competition | Phases | Shape |
|---|---|---|
| [[brasileirao-feminino-a1]] | 4 | 1 group of 18, single RR → QF → SF → F |
| [[brasileirao-feminino-a2]] | 4 | 1 group of 16, single RR → QF → SF → F |
| [[brasileirao-feminino-a3]] | 5 | 8 groups of 4, double RR → R16 → QF → SF → F |
| [[copa-do-brasil-feminina]] | 8 | pure knockout, staggered entry |
| [[supercopa-feminina]] | 1 | single match |

**Every phase restarts at zero points**, in all five competitions.

## Second-leg hosting is not one rule

This is the trap. Three different mechanics, and the Copa's is incompatible with the divisions':

| Value | Meaning | Used by |
|---|---|---|
| `higher-seed` | Clubs placed 1st–4th in the 1ª Fase host | A1/A2 quarter-finals |
| `group-winner` | The club that won its 1ª Fase group hosts | A3 round of 16 |
| `accumulated-points` | Points across the whole competition, then the league tiebreaker cascade | A1/A2/A3 semifinals and finals |
| *(drawn)* | Public DCO draw at **every** phase; home team is whoever sits on the left of the table | **Copa, all phases** |

A knockout implementation must therefore make hosting a **per-competition choice, not a constant**.
The Copa also designates a CBF-chosen neutral stadium for both legs of the final, as do the division
finals.

## What MS-103 needs beyond this

- Group-stage fixture generation (A3's 8 groups of 4, drawn by geographic proximity — Art. 12).
- Two-legged bracket construction with fixed pairings (1º×8º, 2º×7º, 3º×6º, 4º×5º).
- A standings reset between phases.
- Semifinalist-based promotion — see [[promotion-and-relegation]].
- Tie resolution: goal difference over two legs, then penalties — see [[tiebreakers]].

Cups need more than that again; see [[ms-102-cups-deferred]].
