---
title: Player and coach ageing and retirement
type: spec
verified: 2026-09-27
owner: user
asserts:
  - file: src/domain/services/SeasonAgeingService.ts
    exists: true
  - file: src/domain/features/retirement/RetirementPolicy.ts
    exists: true
  - file: src/domain/features/retirement/ReplacementFactory.ts
    exists: true
  - file: src/domain/features/retirement/NameGenerator.ts
    exists: true
  - file: src/domain/constants/RetirementConstants.ts
    exists: true
  - file: src/presentation/pages/Retirements/Retirements.tsx
    exists: true
---

> **Spec, not description.** This is the contract `SeasonAgeingService.ts` and
> `src/domain/features/retirement/` are judged against. If the code and this page disagree, the
> code is wrong until the user says otherwise. The user owns this page; Claude keeps it in sync and
> drafts changes, but does not change the rules unilaterally.

# Player and coach ageing and retirement

Introduced by MS-113. Until then a squad's ages were fixed for the life of a save. The source is
the user's `.plans/MS-113/input/PlayerCoachRetirementLogic.md` (not tracked in git), as clarified on
2026-09-27; where this page differs from the source, the difference was agreed then and is
explained on [[ms-113-ageing-and-retirement]].

## When

Once per season, at the roll-over NEW SEASON triggers, and **before** clubs change division. The
next season's fixtures and tables are built from the aged, replaced squads, so a club that is
promoted or relegated takes its new squad with it.

## Ageing

Every player of every club in every division of the pyramid, every club coach, and every coach in
the coach pool is one year older.

**Ageing comes first.** Each retirement roll reads the age just reached: a 30-year-old turning 31
rolls in the 31–34 band.

**The human's coach never ages or retires.** The human *is* their club's coach, so that club's
`coach` is left alone. The human's club's players age and retire like everyone else's.

## The roll

A number from 0.0 to 100.0 in steps of 0.1. Retire when `roll <= chance`. A roll equal to the chance
retires. The same roll, against a different chance, decides every other percentage on this page.

| Players | Chance | | Coaches | Chance |
| --- | ---: | --- | --- | ---: |
| ≤ 30 | 0.5% | | ≤ 45 | 0.5% |
| 31–34 | 10% | | 46–60 | 10% |
| 35–38 | 40% | | 61–65 | 40% |
| 39–42 | 60% | | 66–70 | 60% |
| ≥ 43 | 80% | | ≥ 71 | 80% |

The bands are contiguous. The source left gaps (players 43–44, coach 71) and put the last band at
"≥ 45" and "≥ 72"; closing the gaps upwards was agreed. See [[ms-113-ageing-and-retirement]].

## A player retires

- They leave the squad and are kept, marked retired, with the season they retired in and their
  last club. Their records must stay visible to the records feature, which does not exist yet.
- A generated player takes their place in the same club: same position, aged 17–20, Brazilian,
  no XP, neither a starter nor a substitute. Their strength is a seed-loader roll around the rest of
  the squad's average (±5), less 10, and never below 1.
- The new player's name comes from the name lists, and differs from the retiree's and from every
  active player's and coach's in the pyramid (see *Names*).
- **3%** of retirees also become coaches: a coach with the retiree's name, age and nationalities
  joins the coach pool. They are still kept as a retired player.

## A coach retires

- **A club coach** leaves the club, is kept marked retired with the season and their last club,
  never enters the coach pool, and is replaced by a generated Brazilian coach aged 45–50.
- **A pool coach** leaves the pool, is kept marked retired, and is not replaced.
- A club with no coach stays without one.
- A coach who joined the pool this season is not rolled until next season.

## The coach pool

Filled only by the 3% of retiring players who become coaches. Nothing hires from it yet, and
`free-coaches.json` is not in it.

## Names

- A men's league generates men. A women's league generates women as players, and a woman or a man
  with even odds as a coach.
- A player is known by a nickname alone 20% of the time, otherwise by first name and surname. A
  coach always has first name and surname.
- A name already in use is redrawn up to 20 times. If every draw is taken, the name is only
  guaranteed to differ from the retiree's.

## On screen

After NEW SEASON, the Retirements page lists the human's club's retirements: position, the
retiree's name and age, their replacement's name and age, and whether they became a coach.
CONTINUE goes to TeamManager. When the club lost nobody, the page is skipped. The game is saved
before the page is shown, on TeamManager, so a reload never resumes on it.

> **Not asserted.** The lint pass can only check that the files exist. The bands, the order, the
> exemptions, the ranges and the navigation are pinned by
> `tests/domain/features/retirement/*.test.ts`, `tests/domain/services/SeasonAgeingService.test.ts`,
> `tests/use-cases/SeasonAgeingRollover.test.ts`,
> `tests/infrastructure/repositories/RetirementPersistence.test.ts`,
> `src/presentation/pages/Retirements/Retirements.test.tsx` and
> `src/presentation/pages/SeasonSummary/SeasonSummary.test.tsx` instead.

## Consequences worth knowing

- **Stamina now changes across a save.** A squad's fatigue profile shifts every season as players
  age and are replaced by teenagers. See [[player-stamina]].
- **Real ages stop being real after one season.** The seed's ages are as of 2026-09-22
  ([[player-ages]]); from the first roll-over on, a squad is part real, part generated.
- **Retired players only accumulate.** Their list is never trimmed, and it is saved. It grows a men's
  save by about 62,000 code units a season; see [[ms-113-ageing-and-retirement]].
