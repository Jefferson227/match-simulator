---
title: Brasileirão Série D
type: competition
internalName: brasileirao-serie-d
season: 2025
verified: 2026-09-10
sources: [rec-serie-d-2025, rec-serie-c-2026, rec-serie-d-2026, times-serie-d-2025, tabelas-serie-d-2025, jogos-api, news-serie-d-2025-final]
asserts:
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: numberOfTeams
    equals: 64
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: phases.length
    equals: 6
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: phases.1.crossings.pairs.length
    equals: 16
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: phases.3.reseed
    equals: accumulated-points
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: numberOfPromotableTeams
    equals: 4
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: promotionRule
    equals: semifinalists
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: promotionChampionshipInternalName
    equals: brasileirao-serie-c
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: rolloverSlotting
    equals: replace-in-place
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: type
    equals: group-stage-knockout
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    absent: numberOfRelegatableTeams
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    absent: relegationChampionshipInternalName
---

# Brasileirão Série D — 2025

Bottom men's national tier. 64 clubs in 8 regional groups, then a five-round bracket whose
pairings the REC prints in full. `competitionId` `12617`. The seed plays the **2025 regulation**;
see [[ms-106-mens-lower-divisions]].

Played in **6 phases** (REC D Art. 13). The REC calls ties "grupos de 2":

| Phase (REC) | Tabela's `fase_nome` | Format |
|---|---|---|
| 1ª Fase | 1ª Fase | 64 clubs in **8 groups of 8** (A-1…A-8), **double** round-robin, 14 rounds; the **top 4** of each group advance (Arts. 13, 15) |
| 2ª Fase | 2ª Fase | 32 clubs, 16 two-legged ties B-1…B-16 (Art. 13) |
| 3ª Fase | 3ª Fase | 16 clubs, 8 ties C-1…C-8 (Art. 13) |
| 4ª Fase | Quartas de Final | 8 clubs, 4 ties D-1…D-4 (Arts. 13, 18) |
| 5ª Fase (Semifinal) | Semi Finais | 4 clubs, 2 ties E-1, E-2 (Art. 13) |
| 6ª Fase (Final) | Final | 2 clubs, 1 tie F-1 (Art. 13) |

The seed names the last three phases as the tabela does. The mismatch is recorded on
[[known-contradictions]].

- **Every phase restarts at zero points** (Art. 13, parágrafo único).
- **The 1ª Fase groups are Anexo B's**, and the REC states **no criterion** for composing them
  (Art. 14). They are visibly regional:
  - A-1: AC, AM, PA, RR, AP
  - A-2: CE, MA, PI, TO
  - A-3: CE, PB, PE, RN
  - A-4: AL, SE, BA, TO
  - A-5: DF, GO, MT, RO
  - A-6: ES, RJ, MG, SP
  - A-7: GO, MG, SP, MS, PR
  - A-8: PR, SC, RS

  The seed lists `teamNames` in Anexo B order, so the 2025 groups are reproduced exactly.
- **2ª Fase crossings** (Art. 17 → Anexo B). Groups pair A-1/A-2, A-3/A-4, A-5/A-6 and A-7/A-8. With
  x the first group and y the second, each pair gives four ties, in this order:
  - 1º x × 4º y
  - 2º y × 3º x
  - 1º y × 4º x
  - 2º x × 3º y

  The club that finished **1º or 2º** hosts the second leg (Art. 21 §1).
- **3ª Fase crossings** (Art. 17 → Anexo B). Winners meet **across** the block of eight ties, not
  from adjacent ties: C-1 = W(B-1)×W(B-6), C-2 = W(B-2)×W(B-5), C-3 = W(B-3)×W(B-8),
  C-4 = W(B-4)×W(B-7), and the same for B-9…B-16.
- **Quartas: the "Bloco"** (Art. 18). The 8 survivors are **re-ranked** on points summed across
  every phase, then wins, goal difference, goals scored, red cards, yellow cards, draw (§2). They
  pair **1º×8º, 4º×5º, 2º×7º, 3º×6º** (D-1…D-4), and the better-ranked club hosts the second leg
  (§1).
- **Semifinal and final** follow the bracket: E-1 = W(D-1)×W(D-2), E-2 = W(D-3)×W(D-4),
  F-1 = W(E-1)×W(E-2) (Art. 19). The second leg of the 3ª, 5ª and 6ª Fases goes to the club with
  the most accumulated points (Art. 21 §2). CBF chooses the final's stadium (Art. 21 §3).
- **Tiebreakers.**
  - 1ª Fase (Art. 16): wins, goal difference, goals scored, **head-to-head** (180-minute aggregate;
    not used when more than 2 clubs are level), red cards, yellow cards, draw. §3: a group of fewer
    than 8 clubs uses the same criteria **as averages**.
  - Every tie (Art. 20): goal difference, then penalties. **No away goals.** See [[tiebreakers]].
- **Promotion: the 4 semifinalists** go up to Série C (Art. 7º). The final does not decide
  promotion.
- **Relegation: none.** REC D 2025 has no relegation clause; it is the bottom national tier.
- **Final classification** (Art. 22). Elimination round first, then campaign within each block:
  1º/2º the finalists; 3º/4º the semifinal losers; 5º–8º the 4ª Fase losers; 9º–16º the 3ª Fase
  losers; 17º–32º the 2ª Fase losers; 33º–64º the 1ª Fase non-qualifiers.

> **Not asserted.** The exact 16 group-position pairs, the 3ª Fase tie crossings, the
> better-placing host, the Bloco re-seed and the bracket order are too structured for a literal
> assert. They are honoured by `KnockoutBracket.ts` (`pairsFromCrossings`,
> `reseedOnAccumulatedPoints`, `resolveSecondLegHost`) and `PhaseProgression.seedingForNextPhase`.
> They are pinned by `tests/domain/services/LowerDivisionReplay.test.ts` and
> `tests/infrastructure/data/championships.test.ts` (the Anexo B groups).

## 2025 outcome

| Fact | Value | Source |
|---|---|---|
| Champion | **Barra** (SC): 2×1 away at Santa Cruz (27/09/2025), 0×0 at home (04/10/2025) | `jogos-api` phase `1976`; `news-serie-d-2025-final` |
| 1º–4º | Barra, Santa Cruz, Inter de Limeira, Maranhão | REC C 2026 Anexo B |
| Promoted to C 2026 | **Barra, Santa Cruz, Inter de Limeira, Maranhão**, the 4 semifinalists | REC C 2026 Anexo A, Critério 3 |
| Relegated | none | REC D 2025 (no clause) |
| Bloco (derived) | ASA 41, Inter de Limeira 38, Barra 36, América-RN 35, Santa Cruz 32, Cianorte 30, Goiatuba 29, Maranhão 26. That gives D-1 ASA×Maranhão, D-2 América-RN×Santa Cruz, D-3 Inter×Goiatuba, D-4 Barra×Cianorte, exactly as played, with those hosts | `jogos-api` |
| Shootouts | 2ª Fase: Imperatriz 5–3 Manaus, Santa Cruz 5–4 Sergipe, Mixto 4–3 Portuguesa. 3ª Fase: Santa Cruz 3–1 Altos. The later phases were decided on aggregate | `jogos-api` (`panaltis` field) |

**The wins tiebreaker decided a group.** In Grupo A-8, Barra and São José both had 26 points and
+10. Barra had 8 wins to São José's 7, so Barra finished 1º. That changed the 2ª Fase pairings and
hosts. See [[tiebreakers]].

## Later seasons

- **The field recycles.** In reality ~56 clubs are replaced every year from the 27 state
  championships (Arts. 2º–3º: 4 relegated from C plus 60 federation slots by RNF rank). The game has
  no source for state champions, so Série D keeps its clubs. With 4 in from C and 4 out to C it
  stays at 64. This follows the Série A3 precedent; see [[invented-data]].
- **Newcomers take vacated slots.** The clubs relegated from C take the group slots the 4 promoted
  clubs left. The other 60 keep their real regional groups. Where the newcomers land is invented;
  see [[ms-106-mens-lower-divisions]].
- **CBF's 2026 format is not played.** REC D 2026 grows the division to **96 clubs** in 16 groups of
  6 (Arts. 2º, 13), adds a playoff round, and promotes **6** (Art. 6º). The game keeps the 2025
  rules.

## Feeds

- Promotes its 4 semifinalists to [[brasileirao-serie-c]], and receives Série C's 1ª Fase bottom 4.
