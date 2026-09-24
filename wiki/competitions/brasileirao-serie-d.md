---
title: Brasileirão Série D
type: competition
internalName: brasileirao-serie-d
season: 2026
verified: 2026-09-23
sources: [rec-serie-d-2026, tabela-serie-d-2026, times-serie-d-2026, tabelas-serie-d-2026, jogos-api, news-serie-d-2026-goiatuba, news-serie-d-2026-f03-report, news-serie-d-2026-f03-preview, news-calendario-2026, rec-serie-c-2026, rec-serie-d-2025, news-serie-d-2025-final]
asserts:
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: numberOfTeams
    equals: 96
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: phases.length
    equals: 7
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: phases.0.numberOfGroups
    equals: 16
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: phases.0.teamsPerGroup
    equals: 6
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: phases.1.crossings.pairs.length
    equals: 32
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: phases.2.crossings.pairs.length
    equals: 16
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: phases.3.crossings.pairs.length
    equals: 8
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: phases.4.reseed
    equals: accumulated-points
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: phases.5.playoff.pairs.length
    equals: 2
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: phases.5.playoff.secondLegHost
    equals: higher-seed
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: numberOfPromotableTeams
    equals: 6
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    path: promotionRule
    equals: semifinalists-and-playoff-winners
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

# Brasileirão Série D — 2026

Bottom men's national tier. **96 clubs** in 16 regional groups of 6, then a knockout whose
pairings the REC prints in full, with a **promotion playoff** among the quarter-final losers played
alongside the semifinal. `competitionId` `1260635`. The seed plays the **2026 regulation** (REC D
2026, dated 24/02/2026) since MS-112; see [[ms-112-2026-rosters-and-serie-d]]. The 2025 regulation it
replaced is kept under History below.

REC D 2026 Art. 13 heads its list "6 (seis) fases" but lists **eight stages**. The seed follows the
list:

| # | REC (Art. 13, Anexo B) | Tabela `fase_nome` | Format |
|---|---|---|---|
| 1 | 1ª Fase | 1ª Fase | 96 clubs in **16 groups of 6** (A01–A16), **double** round-robin, 10 rounds; the **top 4** of each group advance (Art. 15) |
| 2 | 2ª Fase | 2ª Fase | 64 clubs, 32 two-legged ties B01–B32 |
| 3 | 3ª Fase | 3ª Fase | 32 clubs, 16 ties C01–C16 |
| 4 | 4ª Fase (Oitavas) | 4ª fase | 16 clubs, 8 ties D01–D08 |
| 5 | 5ª Fase (Quartas) | Quartas de Final | 8 clubs re-ranked as **Bloco I**, 4 ties E01–E04 (Art. 18) |
| 6 | 6ª Fase (Semifinal) | Semifinais | the 4 quarter-final winners, 2 ties F01–F02 |
| — | Playoffs | Playoff de Acesso | the 4 quarter-final **losers** re-ranked as **Bloco II**, 2 ties F03–F04 (Art. 21) |
| 7 | 7ª Fase (Final) | Final | the 2 semifinal winners, 1 tie G01 |

The seed names its phases '1ª Fase', '2ª Fase', '3ª Fase', '4ª Fase', 'Quartas de Final',
'Semifinal' and 'Final'. The playoff is not a phase of its own: it is the Semifinal's `playoff`.

- **Every phase restarts at zero points** (Art. 13, parágrafo único; Art. 21 §1 for the playoff).
- **The playoff runs in parallel with the semifinal.** Both are fed by the 5ª Fase, its winners
  to the semifinal and its losers to the playoff. The Tabela Básica schedules the semifinal on
  23/08–30/08 and the playoff on 26/08–02/09, and the playoff leads nowhere. The seed plays both in
  the semifinal's two rounds; see [[phases-and-knockouts]].
- **The 1ª Fase groups come from CBF's live data, not the REC.** Anexo B p. 19 prints 16 empty
  boxes, and Art. 14 defers the composition to a later Diretriz. The membership is CBF's own
  (`tabelas-serie-d-2026` phase `2040`, and the group tag on every `jogos-api` match). The groups
  are regional: A01 AM/RR, A02 RO/TO/AC, A03 DF/MT/GO, A04 DF/GO/MT, A05 AP/PA/MA/TO,
  A06 CE/PI/MA, A07 CE/PI, A08 RN/PE/PB, A09 PB/SE/PE, A10 AL/BA, A11 MG/GO/MS, A12 MG/ES/BA,
  A13 SP/RJ/MG, A14 SP/RJ, A15 SC/PR/RS, A16 SC/PR/RS.
- **The order within each group is not official.** The Tabela Básica (emitted 24/02/2026) prints
  all 480 1ª Fase matches as "A definir", so no CBF document gives a group order. The seed lists
  each group in its **final 2026 1ª Fase order**. That only shuffles fixture order; the 2ª Fase
  crossings read the simulated table. See [[invented-data]].
- **2ª Fase crossings** (Anexo B p. 20). Groups pair (A01, A02) … (A15, A16). With x the first
  group and y the second, each pair gives four ties, in this order: 1º x × 4º y, 2º y × 3º x,
  1º y × 4º x, 2º x × 3º y. It is the 2025 pattern over 8 group pairs instead of 4. The
  **1º/2º club hosts the second leg** (Art. 19).
- **3ª and 4ª Fase crossings** (Anexo B p. 21). Winners meet across each block of 8 ties, never
  from adjacent ties: C01 = W(B01)×W(B06), C02 = W(B02)×W(B05), C03 = W(B03)×W(B08),
  C04 = W(B04)×W(B07), repeated per block. D01–D08 apply the same pattern to the C ties. The club
  with **more accumulated points hosts** (Art. 19).
- **Bloco I** (Art. 18). The 8 survivors are ranked on accumulated points, then wins, goal
  difference, goals scored, red cards, yellow cards, draw. They pair **1º×8º, 4º×5º, 2º×7º,
  3º×6º**, and the better-ranked club hosts.
- **Semifinal and final** follow the bracket: F01 = W(E01)×W(E02), F02 = W(E03)×W(E04),
  G01 = W(F01)×W(F02). Accumulated points decide the host (Art. 19). CBF picks the final's stadium
  (Art. 19, parágrafo único).
- **Bloco II and the playoff** (Art. 21). The 4 quarter-final losers are ranked on the same
  accumulated criteria (§2) and paired **1º×4º and 2º×3º** (F03, F04). The **1º and 2º host the
  second leg** (§3). The tie is decided on **points over the two legs** (§4), then goal difference,
  then "melhor posicionamento na Classificação Final…". The sentence is **cut off at the page
  break** (§5). **There are no penalties.**
- **"Accumulated" means every match at 3/1/0, knockout legs included**, not 3 points per tie won.
  Summed that way, the 2026 data reproduces every host from the 3ª Fase to the final, and both
  Blocos.
- **Tiebreakers.**
  - 1ª Fase (Art. 16): wins, goal difference, goals scored, head-to-head (180-minute aggregate; not
    used when more than 2 clubs are level), red cards, yellow cards, draw. The 2025 averages clause
    for uneven groups is **gone**.
  - Every knockout tie (Art. 17): goal difference, then penalties within 10 minutes of the second
    leg. **No away goals.**
  - Playoff: see above. See [[tiebreakers]].
- **Promotion: 6** (Art. 6º), the 4 semifinalists (the quarter-final winners) and the 2 playoff
  winners (Art. 17, Art. 21 §4). The final does not decide promotion.
- **Relegation: none.** It is the bottom national tier.
- **Final classification** (Art. 20). Bands first, then the accumulated criteria within each band:
  1º champion, 2º runner-up, 3º–4º semifinal losers, **5º–6º playoff winners, 7º–8º playoff
  losers**, 9º–16º 4ª Fase losers, 17º–32º 3ª Fase losers, 33º–64º 2ª Fase losers, 65º–96º the 1ª
  Fase non-qualifiers.

> **Assumption: the playoff's last tiebreaker is the Bloco II rank.** Art. 21 §5 is truncated. The
> seed reads it as the better Bloco II rank (`'seed'`). The only other reading, the Art. 20
> accumulated criteria, agrees on the one real case (Goiatuba 2026). CBF's own preview said
> penalties; see [[known-contradictions]].

> **Not asserted.** The 32 group-position pairs, the cross-block tie crossings, the 1º/2º host, the
> accumulated-points host, both Bloco re-seeds, the 1º×4º / 2º×3º playoff pairing, the playoff's
> points → goal difference → seed decision with no shootout, and the promotion of semifinalists
> plus playoff winners are all too structured for a literal assert. They are honoured by
> `KnockoutBracket.ts` (`pairsFromCrossings`, `reseedOnAccumulatedPoints`, `pairsFromSeeds`,
> `buildPlayoffTies`, `resolveSecondLegHost`), `TieResolution.resolveTie`,
> `PhaseProgression.resolveCompletedPhase` and `ChampionshipService.getPromotedTeams`. They are
> pinned by `tests/domain/services/SerieD2026Replay.test.ts`, which replays **all 610 real 2026
> matches** and looks each result up by its real host, and by
> `tests/infrastructure/data/championships.test.ts`.

> **Not modelled.** The final classification. The engine forces only the champion and runner-up and
> orders everyone else by accumulated points, so a playoff loser can sit above a playoff winner. No
> screen and no rule reads past the podium, so the Art. 20 bands would change nothing the player
> sees. Head-to-head and card counts are not modelled at all.

## 2026 outcome

| Fact | Value | Source |
|---|---|---|
| Champion | **Uberlândia**: 2×0 away at ASA (06/09/2026), 1×1 at home (13/09/2026). Uberlândia hosted on 39 accumulated points to ASA's 38 | `jogos-api` phase `2099` |
| Promoted to C 2027 | **ASA, Gama, Uberlândia, ABC** (semifinalists), **Goiatuba, Nacional** (playoff winners) | `news-serie-d-2026-goiatuba`; `jogos-api` phase `2090` |
| Bloco I (derived) | 1 Gama 38, 2 ABC 34, 3 CSA 32 (9 wins, +23), 4 ASA 32 (9, +15), 5 Goiatuba 32 (9, +11), 6 Uberlândia 29 (8, +8), 7 Nacional 29 (8, +7), 8 São José 22. That gives E01 São José×Gama, E02 Goiatuba×ASA, E03 Nacional×ABC, E04 Uberlândia×CSA, with the first-named club of each tie hosting the first leg, as played. **Wins and goal difference were needed** to separate CSA, ASA and Goiatuba | `jogos-api` |
| Bloco II (derived) | 1 Goiatuba 34, 2 CSA 32, 3 Nacional 29, 4 São José 23: F03 São José×Goiatuba, F04 Nacional×CSA, Goiatuba and CSA hosting | `jogos-api` |
| Playoffs | F03 0×0 and 1×1, level on points and goal difference with no shootout (`panaltis` 0–0 both legs): **Goiatuba up on the better campaign**. F04 Nacional 3×1, 0×0 | `jogos-api`; `news-serie-d-2026-f03-report` |
| Shootouts | 15 ties, all in the 2ª Fase to Quartas; none in the semifinal, playoff or final | `jogos-api` (`panaltis`) |

The **promotion of Nacional** follows from Art. 21 §4 and the F04 result; no CBF article
confirming it was read.

## The game's deviations

- **Balanced 6 ↔ 6 with Série C.** Série C 2026 relegates **2** (REC C 2026 Art. 42) and grows to
  24 clubs in 2027 (`news-conselho-serie-c-2026`). The game relegates **6** from C, so C holds 20
  and D holds 96 in 16 groups of 6 every season. Invented; see
  [[ms-112-2026-rosters-and-serie-d]] and [[promotion-and-relegation]].
- **The field recycles.** In reality CBF rebuilds the 96 every year (Art. 2º) from relegated clubs,
  federation slots and deep runners. The game has no source for state champions, so Série D keeps
  its clubs. See [[invented-data]].
- **Newcomers take vacated slots.** The 6 clubs relegated from C take the group slots the 6
  promoted clubs left, whatever their state. The other 90 keep their real groups
  (`rolloverSlotting: replace-in-place`).

## History: the 2025 regulation

MS-106 seeded the 2025 regulation (REC D 2025, `competitionId` `12617`): **64 clubs** in 8 groups
of 8 (Anexo B's groups, seeded in Anexo B order), double round-robin, top 4 through. Then 16 2ª
Fase ties with the same 1º x × 4º y crossing pattern over 4 group pairs, 3ª Fase cross-block
crossings, a re-seeded Bloco quarter-final, semifinal and final. The **4 semifinalists** were
promoted (Art. 7º), and a group of fewer than 8 clubs used averages (Art. 16 §3). The final
classification was elimination round first (Art. 22).

| 2025 fact | Value | Source |
|---|---|---|
| Champion | **Barra** (SC): 2×1 away at Santa Cruz (27/09/2025), 0×0 at home (04/10/2025) | `jogos-api` phase `1976`; `news-serie-d-2025-final` |
| Promoted to C 2026 | **Barra, Santa Cruz, Inter de Limeira, Maranhão**, the 4 semifinalists | REC C 2026 Anexo A, Critério 3 |
| Bloco (derived) | ASA 41, Inter de Limeira 38, Barra 36, América-RN 35, Santa Cruz 32, Cianorte 30, Goiatuba 29, Maranhão 26 | `jogos-api` |

**The wins tiebreaker decided a 2025 group.** In Grupo A-8, Barra and São José both had 26 points
and +10. Barra's 8 wins to São José's 7 put Barra 1º, which changed the 2ª Fase pairings and hosts.
See [[tiebreakers]].

## Feeds

- Promotes its 4 semifinalists and 2 playoff winners to [[brasileirao-serie-c]], and receives
  Série C's 1ª Fase bottom 6.
