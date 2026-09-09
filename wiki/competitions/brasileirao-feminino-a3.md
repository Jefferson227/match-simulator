---
title: Brasileirão Feminino Série A3
type: competition
internalName: brasileirao-feminino-serie-a3
season: 2026
verified: 2026-09-09
sources: [rec-a3-2026, times-a3-2026]
asserts:
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a3
    path: numberOfTeams
    equals: 32
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a3
    path: numberOfPromotableTeams
    equals: 4
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a3
    path: phases.length
    equals: 5
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a3
    path: type
    equals: group-stage-knockout
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a3
    absent: numberOfRelegatableTeams
---

# Brasileirão Feminino Série A3 — 2026

Bottom senior tier. 32 clubs, the only division played in groups, and the only one with no
relegation clause at all.

CBF confirms there is **no fourth senior women's division** — everything below A3 (Sub-20, Sub-17) is
a youth category. That is why REC A3 has nowhere to relegate to.

`competitionId` `1260630`.

Played in **5 phases** (REC A3 Art. 11). Everything in this section is the **2026 regulation
shape** — the one the seed's `phases` holds and the one the game plays in its first season. From the
second season A3 is played in the game's own reduced shape, which no REC describes; see
[[ms-104-a3-group-shape-schedule]] and the note below the table.


| Phase | Name | Format |
|---|---|---|
| 1ª Fase | Group phase | 32 clubs in **8 groups of 4**, **double** round-robin inside each group — 6 rounds, 12 matches per group, **96 matches total** (Art. 13) |
| 2ª Fase | Oitavas-de-final | 16 clubs in 8 ties, **two legs** (Art. 13) |
| 3ª Fase | Quartas-de-final | 8 clubs in 4 ties, **two legs** (Art. 13) |
| 4ª Fase | Semifinal | 4 clubs in 2 ties, **two legs** (Art. 13) |
| 5ª Fase | Final | 2 clubs in 1 tie, **two legs** (Art. 13) |

- **Every phase restarts at zero points** (Art. 11, parágrafo único).
- **Top 2 of each group advance** — 16 clubs (Art. 14).
- **Groups are drawn by geographic proximity** (Art. 12): groups A1–A4 take clubs from Sul, Sudeste,
  Centro-Oeste and Norte; groups A5–A8 take clubs from Nordeste, Espírito Santo and Norte.
- **Second-leg hosting**:
  - 2ª Fase — the club that **won its 1ª Fase group** hosts the second leg (Art. 18, first sentence).
  - 3ª, 4ª and 5ª Fases — accumulated points across the whole competition, then the same cascade as
    A1/A2 (Art. 18). The final's stadium is designated by CBF (Art. 19).
- **1ª Fase tiebreakers** (Art. 16) and **knockout tie tiebreakers** (Art. 17) match A1/A2:
  goal difference, then penalties.
- **Promotion**: the **4 semifinalists** ascend to A2 2027 (Art. 5º).
- **Relegation**: **none.** REC A3 contains no relegation clause — A3 is the bottom senior tier.


## Later seasons are not this shape

A3's field shrinks 2 clubs a season, because CBF re-composes it every year from state champions the
game cannot seed. The 2026 shape above needs 32 clubs to fill eight groups of four, so the seed also
declares a **reduced shape** — 4 groups over a single leg, 2 advancing per group, feeding a Quartas
instead of an Oitavas — which the roll-over selects as soon as the field falls below 32. It plays 7
group rounds against the regulation shape's 6, and sends 8 clubs into the bracket rather than 16.

**The reduced shape is invented.** CBF has published no post-2027 regulation, and nothing on this
page's `sources` supports it. It exists so the division stays playable, and the season-by-season
club counts behind it are on [[ms-104-a3-group-shape-schedule]] and [[invented-data]].

> **Not asserted.** That the seeded `phases` is the 2026 regulation shape *and* equals the variant
> A3's seeded club count selects is a relationship between two fields, not a literal. The repository
> refuses to load seed data where they disagree
> (`src/infrastructure/repositories/ChampionshipRepository.ts`), and
> `tests/infrastructure/data/championships.test.ts` pins it.

> **Fixed by MS-103.** A3 was flattened to a double round-robin and played **62 rounds / 992
> matches**; it now plays its real format — 6 group rounds and 96 matches, then a four-phase bracket,
> 14 rounds in all. That was the sharpest of the MS-102 simplifications and the main reason MS-103
> existed. See [[ms-102-simplifications]], [[phases-and-knockouts]].

## Feeds

- Promotes 4 semifinalists to [[brasileirao-feminino-a2]].
- All 32 clubs enter [[copa-do-brasil-feminina]] at the Preliminar or 1ª Fase by ranking; A3 #29–32
  are the four clubs that play the Preliminar.
