# Log

Append-only. Newest last. Every entry starts `## [YYYY-MM-DD] <op> | <subject>` so the file stays
greppable:

```sh
grep "^## \[" wiki/log.md | tail -5
```

`op` is one of `ingest`, `query`, `lint`, `migrate`, `correct`.

The **sha** on the newest entry is the drift-lint watermark: `git log --oneline <sha>..HEAD` lists
everything that has happened to the codebase since the wiki last moved.

---

## [2026-09-05] ingest | Brasileirão Feminino A1/A2/A3 2026

Extracted the three women's divisions from CBF's REC PDFs and `times` endpoints. Seeded 66 clubs
into `teams-womens.json` and three entries into `championships.json` (MS-102).

Produced: [[brasileirao-feminino-a1]], [[brasileirao-feminino-a2]], [[brasileirao-feminino-a3]],
[[invented-data]], [[known-contradictions]], [[ms-102-simplifications]].

## [2026-09-06] correct | cups re-extraction

CBF's CMS document endpoint was reachable after all — the 2026-09-05 pass read a missing `url` field
as an empty response. Re-extracted both cups from their own RECs.

Corrections to the previous pass, kept because MS-103/MS-104 may have seen the earlier numbers:

| Previously recorded | Corrected |
|---|---|
| Copa: **68** entry slots — 66 named + 2 "A Definir" (ids 53397, 58916) | **66 clubs.** The placeholders were Preliminar-winner slots, double-counted against clubs already among the 66. Both now filled (Sampaio Corrêa 20056, Liga Sanjoanense 53094); ids 53397/58916 appear nowhere in current data. |
| Copa: **6** phases, nothing beyond the 5ª | **8 phases** (REC Art. 11). The site publishes six because the 6ª and 7ª have no drawn clubs yet. |
| "Six phases do not divide 68 entrants cleanly" — arithmetic unresolved | Resolved: staggered entry, no byes. 4 + 30 + 16 + 16 = 66 distinct entrants over 72 matches. |
| CMS `championship-documents` endpoint is down | **It was serving.** The response omits `url` unless you pass `populate=*`. |
| Supercopa qualification per "A1 REC Art. 5º" | Right rule, wrong edition — that article governs the **2027** Supercopa. Correct 2026 citation: Supercopa REC Arts. 2º and 11. |
| Names "Copa do Brasil Feminino" / "Supercopa do Brasil Feminino" | The RECs write **"Copa do Brasil Feminina"** and **"Supercopa Feminina"**. Only the URL slugs use the masculine form. |
| Copa participants listed by short name only | Unchanged in substance — still exactly A1 + A2 + A3 — but now carry official names, ranking positions and entry phases. |

Confirmed unchanged: competitionId `1260632`, championshipId `24`, categoryId `55`, `fase_id`s
2033/2034/2055/2060/2069/2077, all phases single-leg except the 5ª, and the Supercopa's slug,
competitionId, two clubs and single-match format.

Produced: [[copa-do-brasil-feminina]], [[supercopa-feminina]], [[cbf-data-sources]],
[[ms-102-cups-deferred]].

## [2026-09-07] migrate | docs/ replaced by wiki/ — sha a850ebe

Adopted the LLM-wiki pattern. `docs/` deleted; its seven files resolved as:

| Was | Now |
|---|---|
| `BrasileiraoFeminino.md` | split into 5 competition pages + 6 concept pages |
| `PlayerXpSystem.md` | `specs/player-xp.md`, moved verbatim |
| `FolderRestructuring.md` | distilled into [[layer-boundaries]] |
| `RefactorPlan.md` | **deleted** — drifted entity list, superseded by `src/domain/models/`; reasoning folded into [[layer-boundaries]] |
| `LeagueTypeSelectorScreen.md` | distilled into [[league-type-flow]] |
| `NewFeatures.md` | **deleted** — stale intent, shipped as MS-101 |
| `GameEngine.md` | **deleted** — duplicated `CLAUDE.md` and had drifted (cited `src/context`, `src/providers`, pre-restructure paths) |

Also rescued `.plans/MS-102/docs/03-MS-102-extraction-notes.md` into [[invented-data]] — `.plans/` is
gitignored, so that provenance record was one `rm -rf` from being lost.

**Finding, unprompted:** `ChampionshipService.ts:220` sorts standings by points → goal difference →
goals for, omitting **most wins**, which every REC places directly after points. `Standing.wins` is
tracked but unused. Recorded on [[tiebreakers]]; no ticket raised.

## [2026-09-07] lint | baseline — sha a850ebe

Built `scripts/lint-wiki.cjs` (`npm run lint-wiki`). Five passes: asserts, links, orphans, staleness,
drift. Zero dependencies, CommonJS so ESLint's browser/JSX config leaves it alone.

First full run is clean across 20 pages. Verified non-vacuous by deliberately breaking an assert
(`numberOfTeams` 18 → 17), a wikilink and a `verified` date, and confirming all three were reported
with exit 1.

Two design notes worth keeping:

- The frontmatter parser is deliberately **not** a YAML implementation. It handles the documented
  subset and throws on anything else, so a malformed page is reported rather than silently skipped.
- Drift ignores commits that themselves touched `wiki/`. Without that, the commit filing the wiki
  would always flag itself. The cost is that a commit touching both code and wiki reads as filed even
  if only part of it was.

Also wired step 9 of the `execute-tasks` skill (user-level, shared across projects) to run the
close-out filter, gated on a `wiki/` folder existing and deferring to `wiki/CLAUDE.md` when present.

## [2026-09-08] ingest | MS-103 — the engine plays what `phases` declares — sha f7966cd

MS-102 declared the women's formats and left them inert. MS-103 executes them: group stages,
single-leg round-robins, two-legged knockouts, per-phase standings resets, the regulations' hosting
and tiebreaker rules, semifinalist promotion, and both cups seeded. 15 tasks, 15 commits.

**Verification at close-out:** `npm test` 38 suites / 340 tests green; `test-back` 28/284;
`test-front` 10/56; `npm run build` succeeds; `npx tsc --noEmit` **136 errors against the documented
103-error baseline**. The whole +33 is in the two component test files MS-103 added and uses only
error classes the baseline already contains (jest-dom matchers, `jest.Mock`); the non-test error set
is byte-identical to the baseline.

### What changed in the seed

| | Was | Now |
|---|---|---|
| A1 `type` | `double-round-robin`, 34 rounds | `single-round-robin`, **23 rounds** |
| A2 `type` | `double-round-robin`, 30 rounds | `single-round-robin`, **21 rounds** |
| A3 `type` | `double-round-robin`, **62 rounds / 992 matches** | `group-stage-knockout`, **14 rounds**, 96 group matches |
| Cups | none seeded | [[supercopa-feminina]] and [[copa-do-brasil-feminina]], 7 competitions in all |
| New fields | — | `targetNumberOfTeams`, `numberOfRelegatableTeamsAtTarget`, `hasLeagueTable`, `KnockoutPhase.entrants` |

The men's divisions are untouched — no `phases`, `double-round-robin`, `'table-position'`, 38 rounds,
identical fixtures — and a regression suite now pins that against a verbatim copy of the pre-MS-103
generator.

### External evidence gathered

The 2026-09-07 pass on the A1 club-count question. Two CBF **news** articles registered in
[[sources]] under a new non-regulatory tier, plus REC A1 2025/2026 and REC A2 2025 Art. 2º as
corroboration. Outcome: [[known-contradictions]] item 1 is resolved **in direction but not by
regulation**, and its A2 arithmetic — which said the numbers do not close — is **corrected**: A2
balances at exactly 16, only A1 is unbalanced.

Also new on that page: a **contradiction** between REC A2 2026 Art. 2º and the 24/11/2025 calendar
article over how A2 2026 is composed (both total 16; the REC is decisive), and an **open gap** — CBF
states "A2 com 20 equipes até 2028" and publishes no mechanism that reaches it. Not inferred.

### Decisions filed

| Page | Call |
|---|---|
| [[ms-103-a1-club-count-growth]] | A1 grows 18 → 20, then 4 down / 4 up. Data-driven, **partly inference** |
| [[ms-103-ai-championship-catch-up]] | The playable championship is the clock; AI divisions catch up at sync points |
| [[ms-103-simulated-shootout]] | Shootouts simulated kick by kick on player strength, not drawn |

[[ms-102-simplifications]] is **superseded** — every simplification it recorded is undone, and its
stale `type` assert is corrected rather than deleted, so it still guards the new value.
[[ms-102-cups-deferred]] is **resolved**.

### Live defect fixed, and one deliberately not

`endRoundForAllChampionships` stepped all three championships round for round, which only ever worked
because Série A and B both play 38 rounds. **It was already broken on the MS-102 seeds**: with A1
playable it threw `Championship couldn't be found.` at round 22, when A2 ran out. Reproduced before
fixing; see [[ms-103-ai-championship-catch-up]].

The missing `wins` tiebreaker was **inherited, not fixed** — correcting it changes the men's tables
and it still has no ticket. MS-103 did extract the cascade into one shared module, so
[[tiebreakers]]' callout now points at `StandingsComparator.ts` and there is a single place to fix.

### Retrieval traps added to [[cbf-data-sources]]

- `tabelas/<comp>/<year>` returns **200 with an empty payload** for an unpublished year, while
  `times/` and `competicoes/` correctly 404. A 200 is not evidence a season exists.
- `times` emits **one record per legal entity**, so a mid-season SAF conversion inflates the count
  (Bahia 2023, Fortaleza 2025, Botafogo 2022–23). Deduplicate on `nome_popular`.
- `curl` needs **`-g`** for the bracketed `filters[slug][$eq]` query. `raw/fetch.sh` escaped only
  `\$` and worked by luck; it now passes `-g`.
- 2022 and 2023 REC records exist in the CMS with `file: null`.

### Rescued from `.plans/MS-103/`

Two bracket rules the RECs do not fully specify, now on [[invented-data]]: A3's groups are split in
**seed order** (Art. 12 draws them by geographic proximity, which the seed has no data for), and
A3's round of 16 **crosses neighbouring groups** (Art. 14 does not give the cross). Both are
deterministic substitutions for a draw, and both could be wrong against the regulation.

### Left open

- **URLs for the two CBF news articles were not recorded** and are deliberately not reconstructed.
- A1 2027's club count, and A2's route to 20, remain inference.
- A3's field shrinks 2 clubs a season; bounded by a floor, not solved.

## [2026-09-09] ingest | MS-104 — A3's shape follows its club count

sha 074e140

No new source. This entry files a **decision**, and the inference behind it, not evidence.

MS-103 let a division's club count move across a roll-over but left its format descriptor frozen, so
Série A3 — which loses 2 clubs a season — was being played in eight groups that no longer held four
clubs each. A competition can now declare several shapes, each guarded by the smallest field it
needs, and the roll-over selects between them by club count. A3 declares two; nothing else declares
any.

Filed: [[ms-104-a3-group-shape-schedule]] — the 2026–2030 club counts for all three divisions, the
arithmetic behind each one, why selection is by club count and never by year, why the reduced group
stage drops to a single leg, and the explicit statement that CBF has published no post-2027
regulation so the whole schedule is invented.

Amended:

- [[ms-103-a1-club-count-growth]] — marked superseded **on A3's shape only**. Its claim that A3's
  outflow is absorbed inside a fixed 8-group shape is wrong; the floor is 8, not 16, from 2027. Its
  asserts and everything it says about A1 and A2 stand untouched.
- [[brasileirao-feminino-a3]] — separates the 2026 regulation shape from the game's own reduced
  shape, with a `> **Not asserted.**` callout on the seed invariant that ties `phases` to the
  variant its club count selects.
- [[invented-data]] — new "Invented by MS-104" section carrying the schedule table.
- [[index]] — new decision row, A3's summary line, and the A3 open thread closed.

[[promotion-and-relegation]] was checked and **left alone**: it states A3's promotion count
(4 semifinalists, Art. 5º), which MS-104 does not change, and no qualifier count.

### Corrected during the ticket

**A3 2027 is 30, not 28.** The ticket's first draft said 28, which needs a one-off removal of 2
extra clubs that no mechanism produces. The exchange stays the only thing that moves clubs, so A3
settles at 26 rather than 24.

### Left open

- Every number after 2026 remains inference. Nothing here should be read as a CBF rule.
- A2's route to 20 and A1 2027's club count are still inference, as MS-103 left them.

## [2026-09-10] ingest | MS-106 — the men's pyramid runs A ↔ B ↔ C ↔ D

sha 6b09f23

Seeds the 2025 Série C (20 clubs) and Série D (64 clubs) with every real club, real match-sheet
squads and their real mechanics, links Série B down to C, and fixes the missing wins tiebreaker.

### External evidence gathered

- Five RECs registered in [[sources]] and added to `raw/fetch.sh`: `rec-serie-c-2025` and
  `rec-serie-d-2025` (the rules), plus `rec-serie-b-2026`, `rec-serie-c-2026` and `rec-serie-d-2026`,
  read **only as outcome evidence**, since their Anexos state where each club finished in 2025.
- `times` and `tabelas` endpoints for both competitions (competitionIds `12616` / `12617`, phase
  ids from `competitionData`), and the **`jogos-api`**: 51 rounds, 216 C and 510 D matches,
  including lineups with a `goleiro` flag. Three CBF news articles filed **with URLs**.

### Filed

- New competition pages: [[brasileirao-serie-c]] and [[brasileirao-serie-d]], with article
  citations, the 2025 outcome and asserts (D's absent relegation included).
- New decision: [[ms-106-mens-lower-divisions]] covers why 2025, why REC Anexo A names, why D's
  newcomers take the vacated group slots, and why the rules are frozen at 2025.
- [[cbf-data-sources]] now covers the `jogos` lineups API, `competitionData`, the athlete API's
  ~60% loss on men's 2025, and the dedupe that `nome_popular` gets wrong both ways (Pouso Alegre,
  the two Santa Cruz clubs). Knockout second legs returned HTTP 500 until `--retry-all-errors`.
- [[known-contradictions]] items 8–10: `times` vs Anexo A names, REC vs tabela phase names, and REC D
  Art. 22 §4. One new open gap: Série C 2027's size.
- [[tiebreakers]]: the men's cascades, and the wins fix with its 2025 evidence (CSA relegated over
  Itabaiana; Barra over São José atop D group A-8).
- [[invented-data]]: the "Invented by MS-106" section, plus the build provenance moved out of the
  ticket's `.plans/` task notes.
- [[phases-and-knockouts]] and [[promotion-and-relegation]]: the new descriptor fields and the
  `phase-group-position` rule, with the Caxias/São Bernardo counter-example.
- [[index]]: new rows. The wins and "no men's pages" threads are closed. The container re-centring
  and A/B strength-overlap threads are opened.

### Live defect fixed

The **wins** tiebreaker, preserved on purpose since MS-103, is fixed for every competition. No
pinned expectation in the pre-existing suite changed.

### Left open

- Container re-centring after promotion or relegation (men's and women's).
- Head-to-head and card tiebreakers; the RECs' final-classification tiers.
- Every men's season after 2025 plays 2025 rules; CBF's 2026 formats are not modelled.
- Série A/B strength overlap in the pre-existing seed.
