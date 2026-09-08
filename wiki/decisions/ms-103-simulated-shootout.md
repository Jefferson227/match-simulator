---
title: Penalty shootouts are simulated, not drawn
type: decision
ticket: MS-103
decided: 2026-09-07
status: implemented
asserts:
  - file: src/domain/features/phases/PenaltyShootoutSimulator.ts
    exists: true
---

# Penalty shootouts are simulated, not drawn

**Decision.** A knockout tie that is level after the regulation cascade is decided by a shootout
**simulated kick by kick**, contested on player strength, rather than by a coin flip through the
injected random provider.

The MS-103 plan left this open: "simulate the shootout properly, or resolve level ties with a coin
flip and revisit later". The user chose simulation.

## What the regulations require

Identical across the three divisions (A1 Art. 17, A2 Art. 16, A3 Art. 17) and, for two-legged ties,
the Copa (Art. 13 §1): points across the tie, then goal difference over the two legs, then a penalty
shootout starting within 10 minutes of full time. **No away goals and no extra time** — neither
appears in any of the five RECs. A single-legged tie has no goal-difference step and goes straight
from a draw to penalties (Copa Art. 13 §1, Supercopa Art. 10). See [[tiebreakers]].

The RECs say nothing about how a shootout is *taken*, beyond that it happens. Everything below is the
game's own model.

## The model

Five alternating kicks a side, then sudden death in pairs, with the standard best-of-five early exit
once the remaining kicks cannot change the result. Takers cycle through the starters in order, so
nobody kicks twice until every starter has. Each kick is a **contested roll** — the taker's strength
against the opposing goalkeeper's — resolved the same way `ActionStrategies` resolves a shot, so a
shootout obeys the same strength and morale model as the match that produced it.

Every draw goes through the injected `RandomProvider`; there is no `Math.random` anywhere in the
path, which is what makes a shootout reproducible under test.

The full per-kick sequence is stored on the match that decided the tie, and **the recorded match
score is never touched** — a shootout decides who advances, nothing else.

## The one arbitrary constant

Sudden death is capped at 50 pairs, after which the winner is drawn. It is unreachable in normal play
and exists only because a degenerate fixture — clubs with no players, which fall back to strength 1 —
makes every kick unstoppable and would otherwise loop forever. A test fixture that reaches a shootout
needs **real players**, or it ends 55–55 on this guard.

See [[phases-and-knockouts]].
