---
title: Known contradictions
type: concept
verified: 2026-09-06
sources: [rec-a1-2026, rec-a2-2026, rec-a3-2026, times-a1-2026]
---

# Known contradictions

Places where the sources disagree with each other, or with the seed data. **Recorded, not resolved
by inference** — where a choice had to be made, the choice is stated.

This page is the first thing to read when a fact looks wrong. Adding to it is a required step of
every ingest.

1. **A1 relegates 2 but A2 promotes 4.** REC A1 Art. 26 sends 2 clubs down; REC A2 Art. 5º sends 4
   clubs up. No REC states A1 2027's club count, so the arithmetic implies A1 2027 grows from 18 to
   20 — but CBF never says so. **Recorded as-is; not resolved by inference.** The game's data models
   the two clauses literally.
2. **Competition naming.** REC A1 spells the competition "BRASILEIRÃO FEMININO A1" (with the
   augmentative *-ão*), while REC A2 and REC A3 spell theirs "BRASILEIRO FEMININO A2" / "BRASILEIRO
   FEMININO A3". CBF's own website uses "Brasileirão Feminino" for all three. The seed data uses the
   consistent "Brasileirão Feminino" form.
3. **Club name spellings differ between endpoints.** For roughly 7 A1 clubs, the `times` endpoint's
   `nome_completo` disagrees with REC Anexo A's spelling. **The `times` endpoint is canonical** for
   `name` in `teams-womens.json`.
4. **Squad pagination is lossy.** The athlete API reported 32 registered athletes for one club but
   returned only 29 across its pages. The reachable set is accepted; the remainder is not fabricated
   beyond position padding (see below).
5. **A1's semifinal and final phases are not in CBF's live API** (only phase ids 1994 and 2097
   exist). Their two-legged format comes from REC A1 Arts. 20–21, not from live data.


6. **Supercopa 2026 hosting.** REC Anexo B lists Corinthians on the left — which under Art. 12 §1
   would make it the home club — but the DCO's published table and the live fixture both have
   **Palmeiras as mandante**. Anexo B is the pre-draw template; the draw is decisive. See
   [[supercopa-feminina]].

Referenced by: [[brasileirao-feminino-a1]], [[brasileirao-feminino-a2]],
[[brasileirao-feminino-a3]], [[cbf-data-sources]], [[promotion-and-relegation]].
