# Wiki index

Knowledge this project depends on that the repository does not contain. Read [[CLAUDE]] for how it is
maintained; the short version is that the code, the seed JSON and git history are the truth for
anything derivable from them, and this folder is the truth for everything else.

Start here when answering a question, then drill into the pages named below.

## Competitions

Real formats and rules, cited to CBF's *Regulamento Específico da Competição*.

| Page | Seeded | Clubs | Summary |
|---|---|---|---|
| [[brasileirao-feminino-a1]] | yes | 18 | Top women's tier. 4 phases; relegates 2 off the 1ª Fase table. |
| [[brasileirao-feminino-a2]] | yes | 16 | 4 phases. Promotes its 4 **semifinalists**; relegates 2. |
| [[brasileirao-feminino-a3]] | yes | 32 | 8 groups of 4 then knockouts, reshaping to 4 groups as it shrinks. Promotes 4 semifinalists; no relegation. |
| [[copa-do-brasil-feminina]] | yes | 66 | 8-phase knockout with staggered entry. 72 matches. |
| [[supercopa-feminina]] | yes | 2 | A single match, decided on penalties if drawn. |
| [[brasileirao-serie-c]] | yes | 20 | Men. League → 2 serpentine groups of 4 → final. Promotes the top 2 of each 2ª Fase group; relegates 6 off the 1ª Fase (REC C 2026: 2, so the 6 is invented). 2026 clubs. |
| [[brasileirao-serie-d]] | yes | 96 | Men. REC D 2026: 16 regional groups of 6 → Anexo B crossings → Bloco I quarter-finals → semifinal with a Bloco II promotion playoff alongside → final. Promotes 6 (4 semifinalists + 2 playoff winners); no relegation. |

All seven are seeded and played by the engine. The men's Série A and B have no pages — nothing about
them is known beyond what `championships.json` already states. Their 2026 membership comes from
the MS-112 rosters; their format was not re-researched, and only their exchange with Série C is
confirmed by CBF's 2026 RECs.

## Concepts

Cross-competition synthesis. These are where the rules are compared and where the code is checked
against them.

| Page | Summary |
|---|---|
| [[tiebreakers]] | League and knockout tiebreaker cascades, women's and men's. The missing `wins` criterion was fixed by MS-106, with the 2025 cases it decides; head-to-head and cards are still absent. |
| [[promotion-and-relegation]] | Why promotion is semifinalist- or group-position-based below the top tiers, and why relegation reads the 1ª Fase table. |
| [[phases-and-knockouts]] | The `phases` descriptor — serpentine groups, Anexo B crossings, re-seeding — what the engine does with it, and why second-leg hosting cannot be a constant. |
| [[known-contradictions]] | Where CBF's own documents disagree, which side the seed data follows, and the gaps CBF leaves open. |
| [[invented-data]] | Everything in the seed that no source publishes: strengths, most colours, abbreviations, the 6 ↔ 6 C/D exchange, Série D's group order, and every invented schedule. Squads are real since MS-112. |
| [[cbf-data-sources]] | How to fetch from CBF without repeating a wasted pass. Read before any new extraction. |
| [[player-ages]] | Where the real ages come from since MS-112 (ogol 2026 rosters, as of 2026-09-22), and why CBF, Wikidata and scripted scraping could not supply them before. |

## Specs

Contracts the code is judged against. The user owns these.

| Page | Implemented by |
|---|---|
| [[player-xp]] | `src/domain/services/PlayerProgressionService.ts` |
| [[match-simulation]] | `src/domain/features/match-simulation/`, `src/domain/services/MatchService.ts` |
| [[player-stamina]] | `src/domain/features/match-simulation/StaminaPolicy.ts`, `StrengthResolver.ts` |

## Decisions

Why things are the way they are — the part the code cannot state.

| Page | Ticket | Status |
|---|---|---|
| [[layer-boundaries]] | — | implemented |
| [[league-type-flow]] | MS-101 | implemented; flow after CoachCreator superseded by MS-105 |
| [[ms-102-simplifications]] | MS-102 | superseded by MS-103 |
| [[ms-102-cups-deferred]] | MS-102 | resolved — both cups seeded |
| [[ms-103-a1-club-count-growth]] | MS-103 | implemented; superseded on A3's shape by MS-104 |
| [[ms-103-ai-championship-catch-up]] | MS-103 | implemented; phase-boundary sync replaced by MS-109's per-round drip |
| [[ms-103-simulated-shootout]] | MS-103 | implemented |
| [[ms-104-a3-group-shape-schedule]] | MS-104 | implemented; **wholly inference** |
| [[ms-106-mens-lower-divisions]] | MS-106 | implemented; superseded by MS-112 on season, names, Série D's shape and the C/D exchange |
| [[ms-105-drawn-team-start]] | MS-105 | implemented; container re-centring closed by MS-107 |
| [[ms-107-container-recentring]] | MS-107 | superseded by MS-109 |
| [[ms-108-saved-game-size]] | MS-108 | implemented; a reload loses each played match's historical squad snapshot; save version 3 since MS-109 |
| [[ms-109-full-pyramid-container]] | MS-109 | implemented; cups declared but not loaded |
| [[ms-110-language-selection]] | MS-110 | implemented; verified in the running app |
| [[ms-112-2026-rosters-and-serie-d]] | MS-112 | implemented; playoff screens covered by component tests only (running-app check waived) |

## Raw

[[sources]] (`raw/sources.md`) — the manifest of every CBF document and endpoint behind the pages
above. `raw/fetch.sh` re-downloads the PDFs, which are gitignored.

## Open threads

Things named across these pages that nothing currently owns:

- ~~The missing `wins` tiebreaker has no ticket~~ — **closed by MS-106.** Wins now rank right after
  points in every competition. Head-to-head and card counts are still not modelled; see
  [[tiebreakers]].
- Libertadores qualification via the Copa is **not verified** — outside MS-102's brief.
- ~~No page covers the men's competitions~~ — **closed by MS-106** for Série C and D; Série A and B
  still have none.
- ~~Container re-centring after promotion or relegation~~ — **closed by MS-107**, then
  **superseded by MS-109.** The container now holds the whole pyramid of the human's league type
  with a playable pointer; every tier exchanges clubs at roll-over and no division is ever reseeded,
  so MS-107's accepted state loss is gone. The AI divisions are dripped per playable round instead of
  caught up at phase boundaries. See [[ms-109-full-pyramid-container]].
- **Cups are declared on the container but not loaded, simulated or shown.** No ticket. See
  [[ms-109-full-pyramid-container]].
- ~~A men's saved game exceeds the `localStorage` quota~~ — **closed by MS-108.** The save boundary
  now writes club, player and standing references as ids and resolves them from `championship.teams`
  on load, cutting a played Série D season from 5,132,127 code units to 400,274. `localStorage`
  stayed and `GameRepository` stayed synchronous, so IndexedDB and SQLite-in-wasm are recorded as
  deferred rather than taken. Pre-MS-108 saves are abandoned via a versioned key, and a reload no
  longer preserves each played match's historical squad snapshot — the current round is kept whole.
  See [[ms-108-saved-game-size]].
- ~~**Nothing renders stamina.**~~ — **closed 2026-09-26, no ticket.** The team match details panel
  shows a bar beside each starter's name. See [[player-stamina]].
- **Stamina's low-stamina blink threshold is a placeholder.** At 70, only players over 38 ever
  blink. The user kept it deliberately and will add more logic in a later session; no ticket. See
  [[player-stamina]].
- **Players never age between seasons.** A squad's ages are fixed for the life of a save, so the
  league cannot get older or younger. Out of MS-111's scope; no ticket.
- ~~**Real player ages have never been obtained.**~~ — **closed by MS-112.** Every age now comes
  from the 2026 ogol rosters, as of 2026-09-22. See [[player-ages]].
- **Neighbouring men's divisions' strengths overlap.** Since MS-112 clubs keep their strength when
  they change division, so B/C and C/D overlap as A/B always did; only the averages are ordered. No
  ticket. See [[invented-data]].
- **Coaches and nationalities are not shown.** MS-112 added both to the seed and neither to any
  screen. No ticket. See [[ms-112-2026-rosters-and-serie-d]].
- **Série C and D stop tracking reality from 2027.** The game's 6 ↔ 6 keeps both sizes fixed, while
  CBF grows C to 24 and 28. No ticket. See [[brasileirao-serie-c]].
- **Unattached coaches were collected but not used.** `free-coaches.json` (Transfermarkt) needs a
  coach market that does not exist. No ticket.
- **A1 2027's club count is inference, not regulation**, and so is A2's route to 20. See
  [[ms-103-a1-club-count-growth]] and the open gap on [[known-contradictions]].
- **URLs for the two CBF news articles were never recorded.** See [[sources]].
- ~~Série A3's field shrinks 2 clubs a season~~ — **closed by MS-104.** It still shrinks, and the
  game still refuses to invent state champions, but its format now follows its club count instead of
  staying frozen at 8 groups of 4. The pyramid settles at A1 20 / A2 20 / A3 26 from 2029. The whole
  post-2026 schedule is invented; see [[ms-104-a3-group-shape-schedule]].
