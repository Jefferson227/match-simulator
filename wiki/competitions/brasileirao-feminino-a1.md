---
title: Brasileirão Feminino Série A1
type: competition
internalName: brasileirao-feminino-serie-a1
season: 2026
verified: 2026-09-05
sources: [rec-a1-2026, times-a1-2026]
asserts:
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a1
    path: numberOfTeams
    equals: 18
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a1
    path: numberOfRelegatableTeams
    equals: 2
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a1
    path: relegationRule
    equals: first-phase-table-position
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a1
    path: phases.length
    equals: 4
---

# Brasileirão Feminino Série A1 — 2026

Top tier of the Brazilian women's national pyramid. 18 clubs. Seeded by MS-102; the real format is
declared in `phases` but not executed — see [[ms-102-simplifications]].

Every rule below cites its article in the 2026 REC. `competitionId` `1260614`. Related: [[tiebreakers]],
[[promotion-and-relegation]], [[phases-and-knockouts]].

Played in **4 phases** (REC A1 Art. 12):

| Phase | Name | Format |
|---|---|---|
| 1ª Fase | League phase | 18 clubs in **1 group**, **single** round-robin — 17 rounds, 153 matches (Art. 14) |
| 2ª Fase | Quartas-de-Final | 8 clubs in 4 ties, **two legs** (Art. 14) |
| 3ª Fase | Semifinal | 4 clubs in 2 ties, **two legs** (Art. 14) |
| 4ª Fase | Final | 2 clubs in 1 tie, **two legs** (Art. 14) |

- **Every phase restarts at zero points** (Art. 12, parágrafo único).
- **Top 8 of the 1ª Fase advance** (Art. 15).
- **Bracket** (Art. 19): 1º×8º, 2º×7º, 3º×6º, 4º×5º. Semifinal pairings are fixed by bracket group
  (Art. 20); the final is the two semifinal winners (Art. 21).
- **Second-leg hosting**:
  - Quarter-finals — the clubs placed **1st–4th in the 1ª Fase** host the second leg (Art. 19, parágrafo único).
  - Semifinal and final — hosting is decided by **accumulated points across the whole competition**
    (sum of all phases), then wins, goal difference, goals for, fewest red cards, fewest yellow
    cards, draw (Art. 22). The final's stadium is designated by CBF under those same criteria (Art. 23).
- **1ª Fase tiebreakers** (Art. 16): most wins → goal difference → goals for → fewest red cards →
  fewest yellow cards → draw.
- **Knockout tie tiebreakers** (Art. 17): **goal difference over the two legs, then a penalty
  shootout**. There are no away goals and no extra time; the shootout starts within 10 minutes of
  the second leg ending (parágrafo único).
- **Promotion**: none — A1 is the top tier. Art. 5º gives the champion a Supercopa Feminina 2027
  berth; Art. 6º gives the champion and runner-up CONMEBOL Libertadores Feminina 2027 berths.
  Neither is modelled in the game.
- **Relegation**: the **2 last-placed clubs of the 1ª Fase table** drop to A2 2027 (Art. 26).
  Note this is the *1ª Fase* table, not the final classification.
- **Final classification** (Art. 27) is by accumulated points across all phases, with the champion
  and runner-up forced to 1st and 2nd.


## Feeds

- Relegates 2 clubs to [[brasileirao-feminino-a2]].
- Receives 4 promoted semifinalists from [[brasileirao-feminino-a2]] — an arithmetic mismatch CBF
  never resolves. See [[known-contradictions]].
- All 18 clubs enter [[copa-do-brasil-feminina]] at the 2ª or 3ª Fase by ranking.
- The champion plays [[supercopa-feminina]] the following season.
