---
title: Tiebreakers
type: concept
verified: 2026-09-10
sources: [rec-a1-2026, rec-a2-2026, rec-a3-2026, rec-copa-2026, rec-supercopa-2026, rec-serie-c-2025, rec-serie-d-2025, jogos-api]
---

# Tiebreakers

Two unrelated systems: one for **league tables**, one for **knockout ties**.

## League phase (the three women's divisions)

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

## League phase (men's Série C and Série D, 2025)

Same spine, with **head-to-head** inserted in the phases where clubs meet twice:

| # | Série C 1ª Fase (Art. 16) | Série C 2ª Fase groups (Art. 20) | Série D 1ª Fase groups (Art. 16) |
|---|---|---|---|
| 1 | Points | Points | Points |
| 2 | **Most wins** | **Most wins** | **Most wins** |
| 3 | Goal difference | Goal difference | Goal difference |
| 4 | Goals for | Goals for | Goals for |
| 5 | Fewest red cards | **Head-to-head** (180-minute aggregate; not used when more than 2 clubs are level) | **Head-to-head** (same, §§1–2) |
| 6 | Fewest yellow cards | Red, then yellow cards | Red, then yellow cards |
| 7 | Draw | Draw | Draw |

REC D Art. 16 §3: a group of fewer than 8 clubs uses the same criteria **as averages** per match.

Accumulated rankings — Série D's quarter-final **Bloco** (Art. 18 §2) and its 3ª/5ª/6ª Fase hosting
(Art. 21 §2) — use points, wins, goal difference, goals for, red cards, yellow cards, draw, summed
over every phase. Série C's final host (Art. 22) is shorter: points, wins, goal difference, draw.

## Knockout ties

Also identical across the three divisions (A1 Art. 17, A2 Art. 16, A3 Art. 17) and, for two-legged
ties only, the Copa (Art. 13 §1):

| # | Criterion |
|---|---|
| 1 | Points across the tie — every phase restarts at zero |
| 2 | Goal difference over the two legs |
| 3 | Penalty shootout, starting within 10 minutes of full time |

Série C's final (REC C Art. 21, parágrafo único) and every Série D tie (REC D Art. 20) use the same
three steps.

**No away goals. No extra time.** Neither appears anywhere in any of the seven RECs. The
[[supercopa-feminina]] is a single match and goes straight from a draw to penalties (Art. 10).

Single-legged Copa phases (Preliminar through 4ª Fase) have no goal-difference step — a drawn match
goes directly to penalties.

## What the code does

`compareStandings` in `src/domain/features/standings/StandingsComparator.ts` sorts standings by:

```
points → wins → goal difference → goals for → team abbreviation (alphabetical)
```

**The missing `wins` criterion was fixed by MS-106**, for every competition, men's and women's.
Every REC puts most wins immediately after points; the comparator used to skip straight to goal
difference.
MS-103 had deliberately kept the defect, because fixing it changes the men's tables too. It did move
the cascade into one shared module, so the fix changed the league table, the final classification
and `accumulated-points` hosting together.

**2025 evidence that it was not cosmetic** (derived from `jogos-api`):

- **Série C 1ª Fase, 16º/17º, the relegation line.** Itabaiana had 22 points, 6 wins and a goal
  difference of −4. CSA had 22 points, 5 wins and −2. The REC puts Itabaiana 16º and relegates CSA,
  which is what CBF did. The old cascade would have relegated **Itabaiana**.
- **Série D Grupo A-8, 1º/2º.** Barra had 26 points, 8 wins, +10 and 20 goals for. São José had 26,
  7, +10 and 21. The REC puts Barra 1º; the old cascade put São José 1º, which changes the 2ª Fase
  pairings and hosts.
- No qualification effect, but also swapped: Série C Ponte Preta/Náutico (2º/3º) and
  Botafogo-PB/Figueirense (13º/14º); Série D A-8 Joinville/Marcílio Dias (3º/4º).

**Still absent:**

- **Head-to-head** (Série C 2ª Fase, Série D 1ª Fase). Out of scope for MS-106.
- **Card counts.** The simulation has no cards, so they are unreachable.
- **REC D Art. 16 §3 averages.** These only apply to a group of fewer than 8 clubs. Série D stays
  at 64 in 8 groups of 8, so the case never arises.
- **The final `localeCompare`** on abbreviation stands in for the RECs' *sorteio*. That is a
  defensible substitution, since a deterministic game cannot draw lots, but it is not the rule.
  Série C's final host (Art. 22) has no goals-for step; the shared cascade inserts one before that
  stand-in, which changes nothing a draw would not.

Since MS-103 a phase declares which steps its ties use: single-legged phases carry
`tiebreakers: ['penalties']` and skip goal difference entirely, two-legged ones carry
`['goal-difference', 'penalties']`. How the shootout itself is taken is the game's own model —
see [[ms-103-simulated-shootout]].

## Not asserted

None of this is machine-checkable — a comparator's ordering cannot be expressed as a literal
equality. `tests/domain/features/standings/StandingsComparator.test.ts` pins the wins step with the
Itabaiana/CSA case. The lint pass must re-read
`src/domain/features/standings/StandingsComparator.ts` by hand against the tables above, and
`src/domain/features/phases/TieResolution.ts` against the knockout cascade.
