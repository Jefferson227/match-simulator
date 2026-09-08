---
title: A1 grows to 20 clubs, then balances
type: decision
ticket: MS-103
decided: 2026-09-07
status: implemented
asserts:
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a1
    path: targetNumberOfTeams
    equals: 20
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a1
    path: numberOfRelegatableTeamsAtTarget
    equals: 4
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a2
    path: targetNumberOfTeams
    equals: 20
---

# A1 grows to 20 clubs, then balances

**Decision.** Let a division's club count change across a season roll-over. A1 grows 18 → 20 by
relegating 2 and taking 4 up, then stops at 20 and switches to a balanced 4 down / 4 up. A2 is given
the same target, because otherwise it grows without bound.

MS-102 recorded "A1 relegates 2 but A2 promotes 4" as an unresolved contradiction and modelled both
clauses literally ([[known-contradictions]] item 1). That was tenable while nothing executed them.
MS-103 has to *do* something at the roll-over, so the direction had to be settled.

## What CBF actually publishes

- **The 20-club target is a news article, not a regulation.** "CBF anuncia novidades para o futebol
  feminino de 2025" (17/01/2025) says A1 gets *"uma ampliação progressiva para 20 clubes até 2027"*
  by relegating the bottom 2 and promoting A2's top 4 in both 2025 and 2026, and that A2 gets *"um
  crescimento gradual para 20 clubes até 2028"*. The string "20 clubes" appears in **no** REC, PGA or
  Anexo.
- **The mechanic was executed.** REC A1 2025 Art. 2º composes 16 clubs from 12 stayers plus 4
  promoted; REC A1 2026 Art. 2º composes **18** from **14** stayers plus 4 promoted. REC A2 2025
  Art. 2º records the pre-expansion regime, in which A1 2024 relegated 4.
- **A1 2027 is still unpublished** (re-verified 2026-09-07), so 20 remains inference.
- **The target predates the current administration.** The 24/11/2025 calendar article under president
  Samir Xaud confirms A1 *"ampliado de 16 para 18"* and A2 *"mantido"* at 16, but does not restate
  the 20-club goal.

## The rule the game implements

Two optional fields on `Championship`, both seeded in `championships.json`:

- `targetNumberOfTeams` — the size the division is growing towards.
- `numberOfRelegatableTeamsAtTarget` — the relegation count once it is reached.

A division relegates `numberOfRelegatableTeams` until `teams.length >= targetNumberOfTeams`, then
`numberOfRelegatableTeamsAtTarget`. **Nothing in the code knows the number 20**; it is data.

4 down / 4 up at target is the regime CBF actually ran before the expansion — REC A2 2025 Art. 2º
records A1 2024 relegating 13º–16º — and it balances against A2's four semifinalists without
overriding any clause a REC states. Only A1's relegation count changes, and only after the target is
reached. **CBF has published no post-2027 rule, so this is inference.**

## Why A2 was given a target too

The task asked only for A1. But once A1 is at 20 and relegating 4, A2 receives 4 from above and 4
from below while sending 4 up and only 2 down — it grows by 2 a season, to 22, 24, and on. Capping it
at 20 stops that and matches CBF's own stated "A2 com 20 equipes até 2028". **No REC gives A2 a
mechanism to reach 20**; this is the same class of inference as A1's, recorded as a gap in
[[known-contradictions]].

With all three divisions loaded the pyramid settles at **A1 20, A2 20, A3 26**.

## What was rejected

- **Capping promotion so every division stays fixed.** That is what the pre-MS-103 code did by
  accident — both sides of every exchange used the *playable* division's count — and it kept the club
  totals stable only by making A1 relegate 4 where its REC says 2, and A3 promote 2 where its REC
  says 4. Stability bought by ignoring the regulations.
- **Backfilling A3.** A3 loses 2 clubs a season because CBF re-composes it each year from 27 state
  champions, which the game has no source for (REC A3 2026 Art. 2º). Inventing clubs to keep it at 32
  was rejected; see [[invented-data]]. Instead its outflow is capped so it never falls below a field
  its own group stage and bracket can fill.

## Consequences

- `numberOfTeams` is now a **starting value, not an invariant** — it follows the actual team list
  after a roll-over. An assert on it is about the seed only.
- A division whose *other* border is not in the container drifts, because
  `ChampionshipContainer` only ever holds the playable division and its two neighbours. Playing A1,
  A2 loses 2 clubs once (16 → 14) and then holds. Accepted.

See [[promotion-and-relegation]], [[ms-103-ai-championship-catch-up]].
