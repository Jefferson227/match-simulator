---
title: Promotion and relegation
type: concept
verified: 2026-09-05
sources: [rec-a1-2026, rec-a2-2026, rec-a3-2026]
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

Both declared in `championships.json`, both defined in `src/domain/models/Championship.ts`.

> **Neither is honoured yet.** With a single flat phase there are no semifinalists, so the engine
> promotes the top 4 of the table; and the 1ª Fase table *is* the final table, so the relegation
> rules coincide by accident. They diverge the moment MS-103 adds knockout phases. See
> [[ms-102-simplifications]].

## The arithmetic that does not close

A1 relegates 2; A2 promotes 4. No REC states A1 2027's club count. The implication is that A1 grows
from 18 to 20, but CBF never says so. Modelled literally, contradiction recorded — see
[[known-contradictions]].

## Depends on the table being right

Promotion and relegation both read off the standings order, which currently has a defect — see
[[tiebreakers]].
