---
title: Brasileirão Feminino Série A2
type: competition
internalName: brasileirao-feminino-serie-a2
season: 2026
verified: 2026-09-05
sources: [rec-a2-2026, times-a2-2026]
asserts:
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a2
    path: numberOfTeams
    equals: 16
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a2
    path: numberOfPromotableTeams
    equals: 4
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a2
    path: promotionRule
    equals: semifinalists
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a2
    path: relegationRule
    equals: first-phase-table-position
---

# Brasileirão Feminino Série A2 — 2026

Second tier. 16 clubs. Structurally identical to [[brasileirao-feminino-a1]], and the only division
that both promotes and relegates. `competitionId` `1260622`.

Played in **4 phases** (REC A2 Art. 11) — structurally identical to A1:

| Phase | Name | Format |
|---|---|---|
| 1ª Fase | League phase | 16 clubs in **1 group**, **single** round-robin — 15 rounds, 120 matches (Art. 13) |
| 2ª Fase | Quartas-de-Final | 8 clubs in 4 ties, **two legs** (Art. 13) |
| 3ª Fase | Semifinal | 4 clubs in 2 ties, **two legs** (Art. 13) |
| 4ª Fase | Final | 2 clubs in 1 tie, **two legs** (Art. 13) |

- **Every phase restarts at zero points** (Art. 11, parágrafo único).
- **Top 8 of the 1ª Fase advance** (Art. 14).
- **Bracket** (Art. 18): 1º×8º, 2º×7º, 3º×6º, 4º×5º; clubs placed **1st–4th host the second leg**
  of the quarter-finals (parágrafo único). Semifinal pairings Art. 19, final Art. 20.
- **Second-leg hosting in the semifinal and final** is by accumulated points across the whole
  competition (Art. 21); the final's stadium is designated by CBF (Art. 22).
- **1ª Fase tiebreakers** (Art. 15) and **knockout tie tiebreakers** (Art. 16) are identical to A1's.
- **Promotion**: the **4 semifinalists** ascend to A1 2027 (Art. 5º). This is *not* a table position
  rule — it is decided by reaching the 3ª Fase.
- **Relegation**: the **2 last-placed clubs of the 1ª Fase table** drop to A3 2027 (Art. 25).


> **Not asserted.** `promotionRule: "semifinalists"` is declared but not honoured — with no knockout
> phases the engine promotes the top 4 of the table. `PromotionRelegationService` must start reading
> the rule in MS-103. See [[promotion-and-relegation]].

## Feeds

- Promotes 4 semifinalists to [[brasileirao-feminino-a1]].
- Relegates 2 clubs to [[brasileirao-feminino-a3]].
- All 16 clubs enter [[copa-do-brasil-feminina]] at the 1ª or 2ª Fase by ranking.
