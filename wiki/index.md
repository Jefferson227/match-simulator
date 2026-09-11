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
| [[brasileirao-serie-c]] | yes | 20 | Men. League → 2 serpentine groups of 4 → final. Promotes the top 2 of each 2ª Fase group; relegates 4 off the 1ª Fase. 2025 rules. |
| [[brasileirao-serie-d]] | yes | 64 | Men. 8 regional groups → Anexo B crossings → re-seeded quarter-finals. Promotes 4 semifinalists; no relegation. 2025 rules. |

All seven are seeded and played by the engine. The men's Série A and B have no pages — nothing about
them is known beyond what `championships.json` already states (they were not re-researched; only
their exchange with Série C is confirmed by CBF's 2026 RECs).

## Concepts

Cross-competition synthesis. These are where the rules are compared and where the code is checked
against them.

| Page | Summary |
|---|---|
| [[tiebreakers]] | League and knockout tiebreaker cascades, women's and men's. The missing `wins` criterion was fixed by MS-106, with the 2025 cases it decides; head-to-head and cards are still absent. |
| [[promotion-and-relegation]] | Why promotion is semifinalist- or group-position-based below the top tiers, and why relegation reads the 1ª Fase table. |
| [[phases-and-knockouts]] | The `phases` descriptor — serpentine groups, Anexo B crossings, re-seeding — what the engine does with it, and why second-leg hosting cannot be a constant. |
| [[known-contradictions]] | Where CBF's own documents disagree, which side the seed data follows, and the gaps CBF leaves open. |
| [[invented-data]] | Everything in the seed that CBF does not publish: MS-102's women's clubs, MS-106's men's Série C/D clubs, and every invented schedule. |
| [[cbf-data-sources]] | How to fetch from CBF without repeating a wasted pass. Read before any new extraction. |

## Specs

Contracts the code is judged against. The user owns these.

| Page | Implemented by |
|---|---|
| [[player-xp]] | `src/domain/services/PlayerProgressionService.ts` |

## Decisions

Why things are the way they are — the part the code cannot state.

| Page | Ticket | Status |
|---|---|---|
| [[layer-boundaries]] | — | implemented |
| [[league-type-flow]] | MS-101 | implemented; flow after CoachCreator superseded by MS-105 |
| [[ms-102-simplifications]] | MS-102 | superseded by MS-103 |
| [[ms-102-cups-deferred]] | MS-102 | resolved — both cups seeded |
| [[ms-103-a1-club-count-growth]] | MS-103 | implemented; superseded on A3's shape by MS-104 |
| [[ms-103-ai-championship-catch-up]] | MS-103 | implemented |
| [[ms-103-simulated-shootout]] | MS-103 | implemented |
| [[ms-104-a3-group-shape-schedule]] | MS-104 | implemented; **wholly inference** |
| [[ms-106-mens-lower-divisions]] | MS-106 | implemented; post-2025 seasons are inference |
| [[ms-105-drawn-team-start]] | MS-105 | implemented; leaves container re-centring to MS-107 |

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
- **Container re-centring after promotion or relegation**, men's and women's — **raised as
  MS-107.** The container stays centred on the division the human started in, and `TeamManager`
  reads the human's club from `playableChampionship`. So a human promoted or relegated out of that
  division is not followed. Since MS-105 every game starts in the bottom division, so **every
  promoted player hits this**. See [[ms-105-drawn-team-start]] and [[ms-106-mens-lower-divisions]].
- **The men's Série A and B strengths overlap** (A's floor 55 is below B's ceiling 75). C and D sit
  strictly below B. No ticket. See [[invented-data]].
- **A1 2027's club count is inference, not regulation**, and so is A2's route to 20. See
  [[ms-103-a1-club-count-growth]] and the open gap on [[known-contradictions]].
- **URLs for the two CBF news articles were never recorded.** See [[sources]].
- ~~Série A3's field shrinks 2 clubs a season~~ — **closed by MS-104.** It still shrinks, and the
  game still refuses to invent state champions, but its format now follows its club count instead of
  staying frozen at 8 groups of 4. The pyramid settles at A1 20 / A2 20 / A3 26 from 2029. The whole
  post-2026 schedule is invented; see [[ms-104-a3-group-shape-schedule]].
