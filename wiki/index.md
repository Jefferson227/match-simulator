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
| [[brasileirao-feminino-a3]] | yes | 32 | 8 groups of 4 then knockouts. Promotes 4 semifinalists; no relegation. |
| [[copa-do-brasil-feminina]] | **no** | 66 | 8-phase knockout with staggered entry. Spec only. |
| [[supercopa-feminina]] | **no** | 2 | A single match. Cheapest cup to implement. |

The men's divisions have no pages — nothing about Série A/B is currently known beyond what
`championships.json` already states.

## Concepts

Cross-competition synthesis. These are where the rules are compared and where the code is checked
against them.

| Page | Summary |
|---|---|
| [[tiebreakers]] | League and knockout tiebreaker cascades. **Records a live defect** — the `wins` criterion is missing from the standings comparator. |
| [[promotion-and-relegation]] | Why women's promotion is semifinalist-based, and why relegation reads the 1ª Fase table. |
| [[phases-and-knockouts]] | The `phases` descriptor, and why second-leg hosting cannot be a constant. |
| [[known-contradictions]] | Where CBF's own documents disagree, and which side the seed data follows. |
| [[invented-data]] | Everything in the women's seed that CBF does not publish, including full MS-102 provenance. |
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
| [[league-type-flow]] | MS-101 | implemented |
| [[ms-102-simplifications]] | MS-102 | accepted, revisited by MS-103 |
| [[ms-102-cups-deferred]] | MS-102 | deferred to MS-103/MS-104 |

## Raw

[[sources]] (`raw/sources.md`) — the manifest of every CBF document and endpoint behind the pages
above. `raw/fetch.sh` re-downloads the PDFs, which are gitignored.

## Open threads

Things named across these pages that nothing currently owns:

- The missing `wins` tiebreaker has no ticket. See [[tiebreakers]].
- MS-103 is planned but unstarted: knockout phases, group fixtures, per-phase standings resets,
  semifinalist promotion.
- Libertadores qualification via the Copa is **not verified** — outside MS-102's brief.
- No page covers the men's competitions.
