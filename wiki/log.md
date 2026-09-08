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
