---
title: Squads age and retire at every season roll-over
type: decision
ticket: MS-113
decided: 2026-09-27
status: implemented
asserts:
  - file: src/domain/services/SeasonAgeingService.ts
    exists: true
  - file: src/domain/models/RetiredPlayer.ts
    exists: true
  - file: src/domain/models/RetiredCoach.ts
    exists: true
  - file: src/domain/models/RetirementReport.ts
    exists: true
  - file: src/domain/constants/GeneratedNames.ts
    exists: true
  - file: tests/infrastructure/repositories/RetirementPersistence.test.ts
    exists: true
---

# Squads age and retire at every season roll-over

**Decision.** At the roll-over, before any club changes division, every player and coach in the
pyramid and the coach pool ages a year and rolls for retirement. Retired players are replaced in
their club by generated teenagers; retired club coaches by generated coaches. Retirees are kept in
lists on `GameState`, a minimal coach pool exists, and the human's club gets a report page. The
rules are the spec [[player-retirement]]; this page records the choices behind it that the code
cannot state. It closes the open thread that players never aged between seasons.

The rule choices below were agreed with the user during planning on 2026-09-27. The implementation
choices were made while executing it and are marked as such.

## Rules the source left open

- **The bands are read as contiguous.** The source gave players "≤ 42: 60%" then "≥ 45: 80%", and
  coaches "≤ 70: 60%" then "≥ 72: 80%", so a 43- or 44-year-old player and a 71-year-old coach had
  no chance at all. The gaps are closed upwards: the last band starts at 43 and 71.
- **Ageing comes before the roll.** The source says both happen at the end of the season and does
  not order them. Rolling on the new age means a player's first season in a band is a season spent
  at that band's risk.
- **The human's coach is exempt.** The human is their club's coach. Ageing or retiring the seeded
  `team.coach` on the human's club would replace a coach the human is standing in for, so that club's
  coach is left alone; its players are not.
- **Retirees live in `GameState` lists, not in the squad.** The source asks for retirees to stay
  visible, flagged retired, for a records feature that does not exist. Keeping them in the squad with
  a flag would have made every lineup, strength sum and screen filter them out. Two lists,
  `retiredPlayers` and `retiredCoaches`, keep them out of play and in the save.
- **The coach pool is minimal.** It exists because a retiring player can become a coach, but nothing
  hires from it and `free-coaches.json` is not loaded into it. Hiring is a later ticket.
- **A women's-league coach is a woman or a man with even odds.** Women's players are always women.
  No reason beyond the user's choice was recorded.
- **The youth penalty, the nationality and the names are invented.** See [[invented-data]].
- **Version-4 saves are abandoned, not migrated**, as MS-108, MS-109 and MS-112 abandoned theirs.
  `SAVE_VERSION` is 5.

## Choices made while implementing

- **Ageing runs in the use case, before the pyramid roll-over.**
  `ChampionshipUseCases.runEndOfChampionshipActions` asks `ChampionshipService.isSeasonOver`, runs
  `SeasonAgeingService`, and hands the aged container to the roll-over, which builds the next
  season's fixtures and tables from `championship.teams`. Ageing after the roll-over would have to
  rewrite every fixture and table it had just built.
- **Clubs crossing a boundary are resolved by id** (`currentTeams` in `ChampionshipService.ts`).
  The exchange reads promoted and relegated clubs off the tables, whose rows hold *copies* of each
  club taken when the row was last written. Ageing rewrites `championship.teams` after that, so
  without the lookup every club changing division carried last season's squad, retirees included,
  into its new division. The save boundary already resolves table rows by id the same way
  ([[ms-108-saved-game-size]]). Found while reading the roll-over before wiring ageing in; not in
  the plan.
- **No lineup change was needed.** A replacement joins as neither starter nor substitute. AI clubs
  draw a fresh lineup from the whole squad before every match, and TeamManager re-picks the human's
  best lineup when it opens, so every club still kicks off with 11.
- **The save is written on TeamManager, then the Retirements page is shown.** A load resumes on the
  saved `currentScreen`, and the page is a one-off report, not somewhere to resume.

## Save growth

Measured by `tests/infrastructure/repositories/RetirementPersistence.test.ts` over five men's
seasons. The seasons were finished by the test harness rather than played, and the ageing rolls
used a seeded random generator:

| After season | Whole save (code units) | Retirement data |
| ---: | ---: | ---: |
| 1 | 1,661,661 | 76,728 |
| 2 | 1,726,093 | 139,018 |
| 3 | 1,784,662 | 195,565 |
| 4 | 1,848,404 | 257,305 |
| 5 | 1,912,765 | 319,484 |

About 62,000 code units a season, linear, because `retiredPlayers` is never trimmed. At that rate
`localStorage`'s 5,000,000 quota is roughly 48 seasons past the fifth, not counting what played
matches add. The test fails if a season adds 100,000 or more.

## Left open

- **Nothing hires from the coach pool**, and a club whose seed has no coach never gets one.
- **Nothing shows retirees** beyond the human's own club's page after each season; the records
  feature they are kept for does not exist.
- **`retiredPlayers` grows without bound** in the save.
- **Real ages drift.** After one roll-over a squad mixes 2026-09-22 ages plus a year with generated
  teenagers ([[player-ages]]).
