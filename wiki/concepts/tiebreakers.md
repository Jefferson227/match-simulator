---
title: Tiebreakers
type: concept
verified: 2026-09-06
sources: [rec-a1-2026, rec-a2-2026, rec-a3-2026, rec-copa-2026, rec-supercopa-2026]
---

# Tiebreakers

Two unrelated systems: one for **league tables**, one for **knockout ties**. The game currently
implements a third thing that matches neither exactly.

## League phase (all three divisions)

Identical across A1 (Art. 16), A2 (Art. 15) and A3 (Art. 16):

| # | Criterion |
|---|---|
| 1 | Points |
| 2 | **Most wins** |
| 3 | Goal difference |
| 4 | Goals for |
| 5 | Fewest red cards |
| 6 | Fewest yellow cards |
| 7 | Draw (sorteio) |

## Knockout ties

Also identical across the three divisions (A1 Art. 17, A2 Art. 16, A3 Art. 17) and, for two-legged
ties only, the Copa (Art. 13 §1):

| # | Criterion |
|---|---|
| 1 | Points across the tie — every phase restarts at zero |
| 2 | Goal difference over the two legs |
| 3 | Penalty shootout, starting within 10 minutes of full time |

**No away goals. No extra time.** Neither appears anywhere in any of the five RECs. The
[[supercopa-feminina]] is a single match and goes straight from a draw to penalties (Art. 10).

Single-legged Copa phases (Preliminar through 4ª Fase) have no goal-difference step — a drawn match
goes directly to penalties.

## What the code does

`compareStandings` in `src/domain/features/standings/StandingsComparator.ts` sorts standings by:

```
points → goal difference → goals for → team abbreviation (alphabetical)
```

> **Contradiction — the `wins` tiebreaker is missing.** Every REC puts *most wins* immediately after
> points, ahead of goal difference. The comparator skips it and goes straight to goal difference,
> even though `Standing.wins` is tracked and available (`src/domain/models/Standing.ts`). Two clubs
> level on points where one has more wins and the other a better goal difference will be ordered
> **wrong**, and because relegation reads off this table the error is not cosmetic.
>
> **MS-103 inherited this deliberately rather than fixing it** — correcting it changes the men's
> tables too, and it has no ticket. What MS-103 did change is that the cascade was extracted out of
> `ChampionshipService.updateStandings` into one shared module, so the league table, the final
> classification and `accumulated-points` second-leg hosting all order clubs the same way. There is
> now exactly one place to fix.
>
> The final `localeCompare` on abbreviation also stands in for what the RECs make a *sorteio*, which
> is a defensible substitution — a deterministic game cannot draw lots — but it is a substitution,
> not the rule. Card-count criteria are unreachable because the simulation has no cards.

Not raised as a ticket yet. See [[promotion-and-relegation]] for why it matters, and
[[known-contradictions]] for the rest.

Since MS-103 a phase declares which steps its ties use: single-legged phases carry
`tiebreakers: ['penalties']` and skip goal difference entirely, two-legged ones carry
`['goal-difference', 'penalties']`. How the shootout itself is taken is the game's own model —
see [[ms-103-simulated-shootout]].

## Not asserted

None of this is machine-checkable — a comparator's ordering cannot be expressed as a literal
equality. The lint pass must re-read `src/domain/features/standings/StandingsComparator.ts` by hand
against the table above, and `src/domain/features/phases/TieResolution.ts` against the knockout
cascade.
