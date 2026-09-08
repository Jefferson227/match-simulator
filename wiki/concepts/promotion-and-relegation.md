---
title: Promotion and relegation
type: concept
verified: 2026-09-07
sources: [rec-a1-2026, rec-a2-2026, rec-a3-2026]
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
---

# Promotion and relegation

The women's pyramid does **not** work like the men's, and that is the whole reason
`promotionRule` / `relegationRule` exist on the `Championship` model.

## The real rules

| Division | Promotion | Relegation |
|---|---|---|
| [[brasileirao-feminino-a1]] | none — top tier | 2 last of the **1ª Fase table** (Art. 26) |
| [[brasileirao-feminino-a2]] | **4 semifinalists** (Art. 5º) | 2 last of the **1ª Fase table** (Art. 25) |
| [[brasileirao-feminino-a3]] | **4 semifinalists** (Art. 5º) | **none** — no clause exists |

Two things break the usual assumption:

1. **Promotion is not a table position.** A2 and A3 promote whoever *reaches the 3ª Fase*. A club can
   finish 8th in the league phase, win a quarter-final, and go up ahead of the club that finished
   1st and lost.
2. **Relegation reads the 1ª Fase table, not the final classification.** The two differ because
   final classification (A1 Art. 27) is accumulated points across *all* phases, with champion and
   runner-up forced to 1st and 2nd.

## How the model expresses it

```ts
promotionRule?: 'table-position' | 'semifinalists'          // default 'table-position'
relegationRule?: 'table-position' | 'first-phase-table-position'
```

Both declared in `championships.json`, both defined in `src/domain/models/Championship.ts`. Absent
means `'table-position'`, which is what both men's divisions use.

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

## Depends on the table being right

Promotion and relegation both read off the standings order, which currently has a defect — see
[[tiebreakers]].
