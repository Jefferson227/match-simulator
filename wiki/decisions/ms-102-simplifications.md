---
title: MS-102 deliberate simplifications
type: decision
ticket: MS-102
decided: 2026-09-05
status: accepted, revisited by MS-103
asserts:
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a3
    path: type
    equals: double-round-robin
---

# MS-102 deliberate simplifications

**Decision.** Seed the women's divisions with a format the engine can actually play, and record the
real format beside it, rather than block the seed on MS-103's knockout work.

MS-102 seeds data and *declares* formats. The match engine still only knows how to run a flat
round-robin.

MS-102 seeds data and declares formats; the match engine still only knows how to run a flat
round-robin. Consequences:

- **All three divisions carry `"type": "double-round-robin"`** so `ChampionshipService.createMatches`
  produces a valid fixture list and the divisions are immediately playable. The real format lives
  beside it in each entry's `phases` array, unused until MS-103.
- **This makes the simulated seasons wrong on purpose.** A1 plays 34 rounds instead of 17 + knockouts;
  A2 plays 30 instead of 15 + knockouts; **A3 plays 62 rounds / 992 matches** instead of 6 group
  rounds + 4 knockout rounds. The A3 season length is the sharpest consequence and was accepted
  knowingly — the alternative considered was hiding A3 from the selector until MS-103.
- **Promotion and relegation run off table position** regardless of `promotionRule`. A2 and A3
  declare `promotionRule: "semifinalists"`, but with no knockout phases there are no semifinalists,
  so the engine promotes the top 4 of the table instead.
- **`relegationRule: "first-phase-table-position"`** is likewise declared but not honoured — with a
  single flat phase, the 1ª Fase table *is* the final table, so the two coincide today. They diverge
  once MS-103 adds knockouts.


## What was rejected

**Hiding A3 from the selector until MS-103.** Considered specifically because of the 62-round season,
and rejected: a visible-but-wrong A3 is recoverable and testable; an invisible A3 means the seed data
goes unexercised until the knockout work lands.

## Consequences to undo in MS-103

Every `"type": "double-round-robin"` on a women's division is a placeholder. When knockouts land, the
`phases` array becomes the source of truth and `type` should stop being read for these competitions.

See [[phases-and-knockouts]], [[promotion-and-relegation]], [[brasileirao-feminino-a3]].
