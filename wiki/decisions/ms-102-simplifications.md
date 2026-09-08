---
title: MS-102 deliberate simplifications
type: decision
ticket: MS-102
decided: 2026-09-05
status: superseded by MS-103
asserts:
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a3
    path: type
    equals: group-stage-knockout
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a1
    path: type
    equals: single-round-robin
---

# MS-102 deliberate simplifications

> **Superseded 2026-09-07 by MS-103.** Every simplification below has been undone. The page is kept
> because the *decision* — ship a playable-but-wrong season rather than block the seed on the
> knockout work — is still worth having recorded, and because the ticket that undid it was scoped
> against this list.

**Decision.** Seed the women's divisions with a format the engine could actually play, and record
the real format beside it, rather than block the seed on MS-103's knockout work.

MS-102 seeded data and *declared* formats; the match engine only knew how to run a flat round-robin.
Consequences at the time:

- **All three divisions carried `"type": "double-round-robin"`** so `createMatches` produced a valid
  fixture list and the divisions were immediately playable. The real format lived beside it in each
  entry's `phases` array, unused.
- **The simulated seasons were wrong on purpose.** A1 played 34 rounds instead of 17 + knockouts; A2
  30 instead of 15 + knockouts; **A3 62 rounds / 992 matches** instead of 6 group rounds + 4 knockout
  phases. The A3 season length was the sharpest consequence and was accepted knowingly.
- **Promotion and relegation ran off table position** regardless of `promotionRule`. A2 and A3
  declared `promotionRule: "semifinalists"`, but with no knockout phases there were no semifinalists.
- **`relegationRule: "first-phase-table-position"`** was declared but not honoured — with a single
  flat phase the 1ª Fase table *was* the final table, so the two coincided.

## What was rejected

**Hiding A3 from the selector until MS-103.** Considered specifically because of the 62-round season,
and rejected: a visible-but-wrong A3 is recoverable and testable; an invisible A3 means the seed data
goes unexercised until the knockout work lands. That reasoning held — A3's data was exercised
throughout, and MS-103 switched it over without re-seeding anything.

## How MS-103 undid it

| Simplification | Now |
|---|---|
| A1/A2/A3 all `double-round-robin` | A1 and A2 `single-round-robin`; A3 `group-stage-knockout` |
| A1 34 rounds, A2 30, A3 62 | **A1 23, A2 21, A3 14** — league or group phase plus two rounds per knockout phase |
| A3 992 matches | 96 group matches plus its bracket |
| `promotionRule` declared, not honoured | honoured — see [[promotion-and-relegation]] |
| `relegationRule` declared, not honoured | honoured, and it now genuinely diverges from the final classification |

The `phases` array is the source of truth for these competitions; `type` is a label the engine does
not read. See [[phases-and-knockouts]], [[brasileirao-feminino-a3]].
