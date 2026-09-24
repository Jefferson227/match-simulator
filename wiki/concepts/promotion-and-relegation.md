---
title: Promotion and relegation
type: concept
verified: 2026-09-23
sources: [rec-a1-2026, rec-a2-2026, rec-a3-2026, rec-serie-c-2025, rec-serie-d-2025, rec-serie-c-2026, rec-serie-d-2026, news-conselho-serie-c-2026]
asserts:
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a2
    path: promotionRule
    equals: semifinalists
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a3
    path: promotionRule
    equals: semifinalists
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-a
    absent: relegationRule
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-b
    absent: relegationRule
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-c
    path: promotionRule
    equals: phase-group-position
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: promotionRule
    equals: semifinalists-and-playoff-winners
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-c
    path: numberOfRelegatableTeams
    equals: 6
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: numberOfPromotableTeams
    equals: 6
---

# Promotion and relegation

Only the men's top two divisions promote and relegate straight off a league table. The women's
pyramid and the men's Série C and D do not, and that is the whole reason `promotionRule` /
`relegationRule` exist on the `Championship` model.

## The real rules

| Division | Promotion | Relegation |
|---|---|---|
| [[brasileirao-feminino-a1]] | none — top tier | 2 last of the **1ª Fase table** (Art. 26) |
| [[brasileirao-feminino-a2]] | **4 semifinalists** (Art. 5º) | 2 last of the **1ª Fase table** (Art. 25) |
| [[brasileirao-feminino-a3]] | **4 semifinalists** (Art. 5º) | **none** — no clause exists |
| Série A (men) | none — top tier | bottom 4 of the table |
| Série B (men) | top 4 of the table | bottom 4 of the table — 17º–20º of B 2025 were relegated (REC C 2026 Anexo A, Critério 1) |
| [[brasileirao-serie-c]] | **top 2 of each 2ª Fase group** (REC C Art. 5º) | last of the **1ª Fase table**: 4 in 2025 (REC C 2025 Art. 6º), **2** in 2026 (REC C 2026 Art. 42). **The game relegates 6** (see below) |
| [[brasileirao-serie-d]] | 2026: **6**, the 4 semifinalists plus the 2 **playoff winners** (REC D 2026 Art. 6º, Art. 21 §4). 2025: the 4 semifinalists (REC D 2025 Art. 7º) | **none** — no clause exists |

The men's Série A and B REC were not read; their rows are what the seed has always done, and CBF's
2026 RECs confirm the B ↔ C exchange of 4 each way happened in 2025.

Three things break the usual assumption:

1. **Promotion is not a table position.** A2 and A3 promote whoever *reaches the 3ª Fase*. A club can
   finish 8th in the league phase, win a quarter-final, and go up ahead of the club that finished
   1st and lost.
2. **Relegation reads the 1ª Fase table, not the final classification.** The two differ because
   final classification (A1 Art. 27) is accumulated points across *all* phases, with champion and
   runner-up forced to 1st and 2nd.
3. **Série C promotes off a middle phase.** The top 2 of each 2ª Fase group go up, whatever happens
   in the final. In 2025 Caxias **won the 1ª Fase**, finished **last in Grupo B** and stayed down,
   while São Bernardo (5º in the 1ª Fase, 2º in Grupo B) went up. Neither a table rule nor
   `semifinalists` picks that set: both would have promoted Caxias.
4. **Série D 2026 promotes clubs that lost.** The 4 quarter-final losers play a playoff alongside
   the semifinal, and its 2 winners go up with the 4 semifinalists. In 2026 Goiatuba lost its
   quarter-final to ASA on penalties and was promoted anyway. A `semifinalists` rule would have
   left both playoff winners down.

## How the model expresses it

```ts
promotionRule?:                                                // default 'table-position'
  | 'table-position'
  | 'semifinalists'
  | 'semifinalists-and-playoff-winners'
  | 'phase-group-position'
promotionPhaseIndex?: number                                                 // phase-group-position only
relegationRule?: 'table-position' | 'first-phase-table-position'
```

Both declared in `championships.json`, both defined in `src/domain/models/Championship.ts`. Absent
means `'table-position'`, which is what the men's Série A and B use.

`'phase-group-position'` was added by MS-106 for Série C. It reads the kept table of phase
`promotionPhaseIndex` and takes the top `numberOfPromotableTeams / numberOfGroups` of each group.
The repository refuses a seed where that phase is not a grouped round-robin, or where the count does
not divide evenly.

`'semifinalists-and-playoff-winners'` was added by MS-112 for Série D 2026. It takes the
semifinalists as `'semifinalists'` does, then `Championship.playoffWinnerIds` in playoff tie order,
capped at `numberOfPromotableTeams`. The repository refuses the rule unless the second-to-last phase
declares a `playoff`. See [[phases-and-knockouts]].

**Both are honoured since MS-103.** `'semifinalists'` reads the record of who reached the semifinal —
the second-to-last phase, kept on the championship as each phase resolves — not the table.
`'first-phase-table-position'` reads the 1ª Fase table held aside before the standings were zeroed
for the second phase. Each falls back to the table when its data is missing rather than throwing.

For a phased championship, `'table-position'` itself means the **final classification** (A1 Art. 27):
accumulated points across every phase, with champion and runner-up forced to 1st and 2nd. So "top 4"
is not "top 4 on accumulated points".

> **Not asserted.** Which clubs a rule picks cannot be expressed as a literal comparison. The
> dispatch lives in `getPromotedTeams` / `getRelegatedTeams` in
> `src/domain/services/ChampionshipService.ts`.

## The arithmetic that does not close

A1 relegates 2; A2 promotes 4. No REC states A1 2027's club count. MS-102 recorded this literally and
resolved nothing. **MS-103 had to act on it**, because the season roll-over now runs: A1 grows
18 → 20 and then switches to a balanced 4 down / 4 up. That direction is CBF's own stated intent but
is **not** in any regulation — see [[ms-103-a1-club-count-growth]] and [[known-contradictions]].

## The C ↔ D exchange: balanced by choice

Série D 2026 promotes 6 while Série C 2026 relegates 2, and the real Série C grows to 24 in 2027
(`news-conselho-serie-c-2026`). CBF refills Série D from the state championships every year; the
game cannot. **The game relegates 6 from C instead**, so both divisions keep their size (20 and
96 = 16×6) and `rolloverSlotting: replace-in-place` still swaps like for like. The relegated clubs
take the promoted clubs' group slots. This is invented, recorded on [[invented-data]], and argued on
[[ms-112-2026-rosters-and-serie-d]].

## Depends on the table being right

Promotion and relegation both read off the standings order. Until MS-106 that order skipped the
**most wins** criterion; on 2025 data it would have relegated Itabaiana instead of CSA from Série C.
It is fixed now — see [[tiebreakers]].
