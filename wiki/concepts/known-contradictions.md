---
title: Known contradictions
type: concept
verified: 2026-09-23
sources: [rec-a1-2026, rec-a2-2026, rec-a3-2026, times-a1-2026, news-expansao-2025, news-calendario-2025, rec-serie-b-2026, rec-serie-c-2025, rec-serie-d-2025, rec-serie-c-2026, times-serie-c-2025, times-serie-d-2025, tabelas-serie-d-2025, rec-serie-d-2026, tabela-serie-d-2026, tabelas-serie-d-2026, times-serie-d-2026, jogos-api, news-serie-d-2026-f03-preview, news-serie-d-2026-f03-report, news-serie-d-2026-goiatuba, news-conselho-serie-c-2026, ogol-rosters-2026]
---

# Known contradictions

Places where the sources disagree with each other, or with the seed data. **Recorded, not resolved
by inference** — where a choice had to be made, the choice is stated.

This page is the first thing to read when a fact looks wrong. Adding to it is a required step of
every ingest.

1. **A1 relegates 2 but A2 promotes 4.** REC A1 Art. 26 sends 2 clubs down; REC A2 Art. 5º sends 4
   clubs up. **Resolved in direction 2026-09-07, but not by a regulation.**

   - **CBF states the target — in a news article, not a rule.** "CBF anuncia novidades para o futebol
     feminino de 2025", 17/01/2025: A1 gets *"uma ampliação progressiva para 20 clubes até 2027"*, by
     relegating the bottom 2 and promoting A2's top 4 in both 2025 and 2026. The same article gives
     A2 *"um crescimento gradual para 20 clubes até 2028"*. The string "20 clubes" appears in **no**
     REC, PGA or Anexo.
   - **Regulatory corroboration that the mechanic was executed.** REC A1 **2025** Art. 2º composes 16
     clubs from 12 stayers plus 4 promoted; REC A1 **2026** Art. 2º composes **18** from **14**
     stayers plus 4 promoted. REC A2 2025 Art. 2º records the pre-expansion regime, in which A1 2024
     relegated 4.
   - **A1 2027 is still unpublished** (re-verified 2026-09-07), so 20 remains inference.
   - **The target predates the current administration.** The 24/11/2025 calendar article under
     president Samir Xaud confirms A1 *"ampliado de 16 para 18"* and A2 *"mantido"* at 16, but does
     **not** restate the 20-club goal.

   **Correction to this page's earlier arithmetic.** It said A2's numbers do not close. They do —
   only A1 is unbalanced:

   | Flow | Clubs | Citation |
   |---|---|---|
   | A2 2026 field | 16 | REC A2 2026 Art. 2º |
   | − promoted to A1 (4 semifinalists) | −4 | REC A2 2026 Art. 5º |
   | − relegated to A3 (2 last of 1ª Fase) | −2 | REC A2 2026 Art. 25 |
   | + relegated from A1 (2 last of 1ª Fase) | +2 | REC A1 2026 Art. 26 |
   | + promoted from A3 (4 semifinalists) | +4 | REC A3 2026 Art. 5º |
   | **A2 2027** | **16** | net zero |

   What the game does with this is [[ms-103-a1-club-count-growth]].
2. **Competition naming.** REC A1 spells the competition "BRASILEIRÃO FEMININO A1" (with the
   augmentative *-ão*), while REC A2 and REC A3 spell theirs "BRASILEIRO FEMININO A2" / "BRASILEIRO
   FEMININO A3". CBF's own website uses "Brasileirão Feminino" for all three. The seed data uses the
   consistent "Brasileirão Feminino" form.
3. **Club name spellings differ between endpoints.** For roughly 7 A1 clubs, the `times` endpoint's
   `nome_completo` disagrees with REC Anexo A's spelling. **The `times` endpoint is canonical** for
   `name` in `teams-womens.json`. The men's Série C and D seed deliberately does the opposite; see
   item 8. *Superseded by MS-112 (item 13): both seed files now take their names from the 2026 ogol
   rosters.*
4. **Squad pagination is lossy.** The athlete API reported 32 registered athletes for one club but
   returned only 29 across its pages. The reachable set is accepted; the remainder is not fabricated
   beyond position padding (see below).
5. **A1's semifinal and final phases are not in CBF's live API** (only phase ids 1994 and 2097
   exist). Their two-legged format comes from REC A1 Arts. 20–21, not from live data.


6. **Supercopa 2026 hosting.** REC Anexo B lists Corinthians on the left — which under Art. 12 §1
   would make it the home club — but the DCO's published table and the live fixture both have
   **Palmeiras as mandante**. Anexo B is the pre-draw template; the draw is decisive. See
   [[supercopa-feminina]].
7. **How A2 2026 is composed.** REC A2 2026 Art. 2º builds the field as 2 relegated from A1 + 8
   stayers (7º–14º) + 4 from A3 (1º–4º) + 2 more from A3 (5º–6º). The 24/11/2025 calendar article
   says 2 relegated + **10** stayers (5º–14º) + 4 from A3. Both total 16. **The REC is later and
   decisive**; the difference is A1 withdrawals pulling A2's 5º–6º up (REC A1 2026 Art. 2º, parágrafo
   único). Recorded, not resolved by inference.

8. **`times` vs REC Anexo A club names, men's Série C and D 2025.** The two disagree in three ways:
   - `times` drops diacritics and uses odd casing: "Associacao Atletica Ponte Preta", "Clube Nautico
     Capibaribe", "Abc", "Csa", "S.a.f.".
   - `times` names the post-SAF **legal entity** where the REC names the **association**:
     Botafogo-PB, Londrina, Brusque, Figueirense, Maringá; Portuguesa ("Portuguesa Sociedade Anonima
     do Futebol" vs "Associação Portuguesa De Desportos"); Azuriz ("Azuriz Futebol de Alta
     Performance SAF" vs "Azuriz Futebol Clube").
   - Outright differences: Altos is "Associação **Esportiva** de Altos" in `times` and "Associação
     **Atlética** de Altos" in the REC. Pouso Alegre is "…Sociedade **Amonima**…" (sic) in `times`.

   **The men's seed follows REC Anexo A** — accented association names, matching the existing
   Série A/B style. This deliberately diverges from item 3's rule for the women's seed; the reason
   is on [[ms-106-mens-lower-divisions]]. The one pre-existing clash was `caxias`: the seed said
   "Caxias Futebol Clube", which is in neither source. CBF's Série C club is "Sociedade Esportiva e
   Recreativa Caxias do Sul", and the seed now says so. *Superseded by MS-112 (item 13).*
9. **Série D phase names: REC vs tabela.** REC D 2025 Art. 13 names the knockouts "4ª Fase",
   "5ª Fase (Semifinal)" and "6ª Fase (Final)". The tabela's `fase_nome` says "Quartas de Final",
   "Semi Finais" and "Final" (`tabelas-serie-d-2025`). Série C's REC likewise says "3ª Fase
   (Final)".
   **The seed uses "Quartas de Final", "Semifinal" and "Final"**, matching the women's divisions.
   Only display names differ; the formats agree.
10. **REC D 2025 Art. 22 §4 is internally inconsistent.** It ranks 9º on the "somatória da 1ª, 2ª e
    3ª fases", then ranks 10º on "1ª, 2ª, 3ª **e 4ª** fases" among clubs that never reached the 4ª
    Fase. This is a copy-paste slip; the intent is 1ª–3ª. **No effect on the game**, which does not
    model the REC's final-classification tiers.

11. **Série D 2026's playoff tiebreak: the REC is truncated and CBF contradicted itself.** REC D 2026
    Art. 21 §4 decides the playoff on points over the two legs, and §5 breaks a level tie on goal
    difference, then "Melhor posicionamento na Classificação Final do CAMPEONATO…". **The sentence
    is cut off at the page break** (p. 11 ends mid-sentence; p. 12 opens Capítulo 5), so what
    "Classificação Final" means is not stated. Then:
    - CBF's **preview** of F03 said a level aggregate would go to **penalties**
      (`news-serie-d-2026-f03-preview`).
    - CBF's **report** of the first leg said "Caso haja novo empate, o Goiatuba será beneficiado por
      ter melhor campanha" (`news-serie-d-2026-f03-report`).
    - What happened: F03 ended 0×0 and 1×1, level on points and goal difference. `panaltis` is 0–0 in
      both legs (`jogos-api` phase `2090`), and **Goiatuba was promoted "por ter tido melhor
      campanha"** (`news-serie-d-2026-goiatuba`).

    **The REC's rule is what was applied, and the seed follows it: no penalties.** The truncated
    criterion is read as the **Bloco II rank** (Art. 21 §2), the `seed` tiebreaker. The only other
    reading, the Art. 20 accumulated criteria, also puts Goiatuba ahead, so the one real case cannot
    tell them apart. Recorded as an assumption on [[brasileirao-serie-d]].
12. **Série D 2026's phase count and names.** REC D 2026 Art. 13 announces "6 (seis) fases" and
    then lists **eight stages** (1ª–7ª Fase plus Playoffs). REC and tabela also name them
    differently: "4ª Fase" vs `fase_nome` "4ª fase", "6ª Fase (Semifinal)" vs "Semifinais",
    "Playoffs" vs "Playoff de Acesso", "7ª Fase (Final)" vs "Final". **The seed has 7 phases**,
    '1ª Fase', '2ª Fase', '3ª Fase', '4ª Fase', 'Quartas de Final', 'Semifinal', 'Final', with the
    playoff inside the Semifinal. Only names differ; the format agrees with both.
13. **Club names: the 2026 rosters vs CBF.** Since MS-112, `name` and `shortName` in **both** seed
    files are the 2026 ogol rosters' `teamFullName` / `teamShortName` (`ogol-rosters-2026`). That
    overrides item 3 (women's: CBF `times`) and item 8 (men's: REC Anexo A). The two sources often
    differ: ogol abbreviates the SAF suffix ("Clube Laguna SAF" vs CBF's "Clube Laguna Sociedade
    Anônima do Futebol"), sometimes names another entity ("Capital Clube de Futebol" vs CBF's
    "Capital Sociedade Anônima do Futebol"), and uses its own short forms ("Nacional-AM", "GAS"). **The seed follows the rosters**, because the squads come from them, and it keeps every
    `internalName` so saves and fixtures do not move. Two real clubs share each of "América Futebol
    Clube" (MG, RN) and "Botafogo Futebol Clube" (SP, PB), so full names are not unique; short names
    are. The reason is on [[ms-112-2026-rosters-and-serie-d]].
14. **REC C 2026 Art. 5º says "Série B 2026".** It means 2027 (Art. 25 says so). A typo; no effect.

## Open gaps

Not contradictions — places where CBF states an outcome and publishes no mechanism for it.

- **"A2 com 20 equipes até 2028" is unreachable under the 2026 RECs.** Read literally, A2's flows
  cancel at exactly 16 (table in item 1 above). No published regulation contains a mechanism that
  would grow it. The game reaches 20 only as a **consequence of MS-103's inferred A1 rule** — once A1
  is at its target and relegating 4, A2 grows — which is inference stacked on inference. See
  [[ms-103-a1-club-count-growth]]. **Do not invent a mechanism for this.**
- ~~**Série C 2027's size is unstated.**~~ **Stated since:** CBF's Conselho Técnico article says
  2026 is "a última edição com 20 times", with 24 in 2027 and 28 in 2028
  (`news-conselho-serie-c-2026`). That is news, not regulation; no REC C 2027 exists yet. The game
  does not follow it: it relegates 6 from C to keep C at 20 and D at 96. See
  [[ms-112-2026-rosters-and-serie-d]].
- **Série D 2027's size is unstated.** REC D 2026 fixes 96 for 2026 only (Art. 2º), and CBF
  publishes no D 2027 field. The game keeps 96.

Referenced by: [[brasileirao-feminino-a1]], [[brasileirao-feminino-a2]],
[[brasileirao-feminino-a3]], [[brasileirao-serie-c]], [[brasileirao-serie-d]], [[cbf-data-sources]],
[[promotion-and-relegation]].
