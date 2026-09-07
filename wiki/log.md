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
