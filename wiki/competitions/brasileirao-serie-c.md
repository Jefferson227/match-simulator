---
title: Brasileirão Série C
type: competition
internalName: brasileirao-serie-c
season: 2026
verified: 2026-09-23
sources: [rec-serie-c-2025, rec-serie-b-2026, rec-serie-c-2026, rec-serie-d-2026, times-serie-c-2025, tabelas-serie-c-2025, jogos-api, news-serie-c-2025-final, news-serie-c-2025-acesso, news-conselho-serie-c-2026]
asserts:
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-c
    path: numberOfTeams
    equals: 20
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-c
    path: phases.length
    equals: 3
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-c
    path: phases.1.groupAllocation
    equals: serpentine
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-c
    path: numberOfPromotableTeams
    equals: 4
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-c
    path: promotionRule
    equals: phase-group-position
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-c
    path: promotionPhaseIndex
    equals: 1
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-c
    path: promotionChampionshipInternalName
    equals: brasileirao-serie-b
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-c
    path: numberOfRelegatableTeams
    equals: 6
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-c
    path: relegationRule
    equals: first-phase-table-position
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-c
    path: relegationChampionshipInternalName
    equals: brasileirao-serie-d
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-b
    path: numberOfRelegatableTeams
    equals: 4
---

# Brasileirão Série C

Third men's tier. 20 clubs: a league, then two groups of four, then a final. Since MS-112 the seed
holds the **2026 membership** (the 20 clubs of Série C 2026), and every men's division moved to 2026
together; see [[ms-112-2026-rosters-and-serie-d]]. The **format is the same in 2025 and 2026**: REC C
2026 keeps the 2025 shape, and only its relegation count changed (see below). The articles cited
here are REC C 2025's (`competitionId` `12616`), as MS-106 read them.

Played in **3 phases** (REC C Art. 12):

| Phase | Format |
|---|---|
| 1ª Fase | 20 clubs in 1 group, **single** round-robin, 19 rounds (Arts. 12, 14) |
| 2ª Fase | 8 clubs in **2 groups of 4** (Grupos B and C), **double** round-robin, 6 rounds (Arts. 12, 17) |
| 3ª Fase (Final) | 2 clubs, **two legs** (Arts. 12, 21) |

- **Every phase restarts at zero points** (Art. 12, parágrafo único).
- **The top 8 of the 1ª Fase advance** (Art. 15). Clubs 9º–20º finish in their 1ª Fase positions.
- **The 2ª Fase groups are fixed, not drawn.** Anexo B seeds them from the 1ª Fase table:
  Grupo B = 1º, 4º, 5º, 8º and Grupo C = 2º, 3º, 6º, 7º (Art. 13 → Anexo B). The seed calls this
  `groupAllocation: serpentine`.
- **Only the group winners reach the final** (Art. 19).
- **Home sides.**
  - 1ª Fase: the club listed on the left of the DCO table hosts (Art. 13, parágrafo único). Anexo B
    also fixes a **10/9 home split**: the 4 clubs relegated from B 2024 and 5º–10º of C 2024 host
    10 matches; the rest host 9 (Art. 14 §§1–2).
  - 2ª Fase: home games are "definidos na tabela" (Art. 18). The REC states **no rule**.
  - The game models neither; its round-robin rotation decides home sides. See [[invented-data]].
- **The final's second leg** goes to the club with the most points summed across every phase, then
  most wins, then goal difference, then a draw (Art. 22). CBF chooses the stadium for both legs
  (Art. 23).
- **Tiebreakers.**
  - 1ª Fase (Art. 16): wins, goal difference, goals scored, fewer red cards, fewer yellow cards,
    draw. There is no head-to-head in a single-leg league.
  - 2ª Fase, within each group (Art. 20): wins, goal difference, goals scored, **head-to-head**
    (the 180-minute aggregate, not used when more than 2 clubs are level), red cards, yellow cards,
    draw.
  - Final (Art. 21, parágrafo único): goal difference, then penalties. **No away goals.** See
    [[tiebreakers]].
- **Promotion: 4 clubs, the top 2 of each 2ª Fase group** (Art. 5º). The final does **not** decide
  promotion: both finalists are already up, and it only awards the title (Art. 24).
- **Relegation: the bottom of the 1ª Fase table** goes to Série D. It reads the 1ª Fase table, not
  the final classification. REC C 2025 Art. 6º sent **4** down; REC C 2026 Art. 42 sends **2**.
  **The game sends 6**, invented to balance Série D's 6 promoted; see below and
  [[promotion-and-relegation]].
- **Final classification** (Arts. 24–26): 1º the champion, 2º the runner-up. 3º/4º are the two 2ª
  Fase runners-up, by their summed 1ª + 2ª Fase campaign. 5º–8º are the other four 2ª Fase clubs,
  by summed campaign. 9º–20º follow the 1ª Fase table.

> **Not asserted.** The serpentine groups, the final pairing the two group winners
> (`crossings: group-position`), the accumulated-points host and the goal-difference-then-penalties
> knockout are too structured for a literal assert. They are honoured by `FixtureGenerator.ts`
> (`dealSerpentine`), `KnockoutBracket.ts` and `ChampionshipService.getPromotedTeams`, and pinned
> by `tests/domain/services/LowerDivisionReplay.test.ts`.

> **Not modelled.** The engine's final classification keeps the podium and orders everyone else by
> accumulated points; it does not use the REC's tiers. This is cosmetic, because promotion never
> reads it. Head-to-head and card counts are not modelled at all.

## 2025 outcome

| Fact | Value | Source |
|---|---|---|
| Champion | **Ponte Preta**: 0×0 away at Londrina (18/10/2025), 2×0 at home (25/10/2025). Ponte Preta hosted the second leg on 53 accumulated points | `jogos-api` phase `1983`; `news-serie-c-2025-final` |
| Runner-up | Londrina | same |
| Promoted to B 2026 | **Londrina, Náutico, Ponte Preta, São Bernardo** | REC B 2026 Anexo A; `news-serie-c-2025-acesso` |
| 3º / 4º | Náutico, São Bernardo. **Derived** under Art. 25 (summed 44 vs 37 points); no CBF document found states it | `jogos-api` |
| 5º–16º | Caxias, Brusque, Guarani, Floresta, Confiança, Ypiranga, Maringá, Ituano, Botafogo-PB, Figueirense, Anápolis, Itabaiana | REC C 2026 Anexo B ("posição final em 2025") |
| Relegated to D 2026 | **CSA, ABC, Retrô, Tombense** | REC D 2026 Anexo A, Critério 1 |
| 2ª Fase tables (derived) | B: Londrina 10, São Bernardo 7, Floresta 7, Caxias 4. C: Ponte Preta 13, Náutico 8, Guarani 7, Brusque 6 | `jogos-api` phase `1969` |

**Why promotion needed its own rule.** Caxias **won the 1ª Fase** and finished **last in Grupo B**,
so it stayed down. São Bernardo, 5º in the 1ª Fase, went up. A "top of the table" or
"semifinalists" rule would have promoted Caxias. That is the counter-example behind
`phase-group-position`.

**The wins tiebreaker decided relegation.** Itabaiana and CSA both finished on 22 points.
Itabaiana had 6 wins and a goal difference of −4; CSA had 5 wins and −2. The REC ranks wins first,
so CSA went down. See [[tiebreakers]].

## The game's deviation: 6 down, not 2

REC C 2026 relegates **2** (Art. 42) while Série D promotes **6** (REC D 2026 Art. 6º), so the real
Série C grows: 20 − 4 up − 2 down + 4 from B + 6 from D = **24** in 2027, and 28 in 2028
(`news-conselho-serie-c-2026`). Série D is rebuilt from the state championships every year, so it
does not shrink. The game has no source for state champions and cannot refill D. With 2 down and 6
up, a closed D would lose 4 clubs a season and its 16 groups of 6 would break.

The game relegates **6** instead. C stays at 20 and D at 96 = 16×6 every season. This is invented,
not regulation; it is a design decision recorded in [[ms-112-2026-rosters-and-serie-d]] and
[[invented-data]]. It supersedes MS-106's choice to keep 2025's 4 ↔ 4.

## Feeds

- Promotes 4 clubs (the top 2 of each 2ª Fase group) to Série B, and receives Série B's bottom 4.
- Relegates its 1ª Fase bottom 6 to [[brasileirao-serie-d]], and receives Série D's 4 semifinalists
  and 2 playoff winners.
