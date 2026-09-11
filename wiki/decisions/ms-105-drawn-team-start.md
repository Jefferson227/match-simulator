---
title: Every new game starts in a drawn bottom-division club
type: decision
ticket: MS-105
decided: 2026-09-11
status: implemented
asserts:
  - file: src/domain/constants/EntryChampionships.ts
    exists: true
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-serie-d
    absent: numberOfRelegatableTeams
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a3
    absent: numberOfRelegatableTeams
---

# Every new game starts in a drawn bottom-division club

**Decision.** A new game no longer lets the player choose a championship or a club. The league type
fixes the **entry division** — the bottom of that pyramid, [[brasileirao-serie-d]] for men and
[[brasileirao-feminino-a3]] for women — and `TeamAssigner` draws the player's club from it,
uniformly over every club in the division. The flow is now:

```
InitialScreen → LeagueTypeSelector → CoachCreator → TeamAssigner → TeamManager
```

This supersedes the part of [[league-type-flow]] that sent the player from the league type into
`ChampionshipSelector` and then `TeamSelector`. MS-101's reasons for the league-type step itself
still stand.

## 1. The start is the bottom of the pyramid

MS-105's brief fixes the start at each pyramid's lowest seeded division. It was only possible for
the men's game once [[ms-106-mens-lower-divisions]] seeded Série D. The original MS-105 plan would
have shipped the men's flow blocked on an unseeded Série D; MS-106 was raised to close that first.

The two asserts above pin the premise: neither entry division relegates, so nothing sits below it.
If a division is ever seeded below Série D or A3, they fail, and this choice needs revisiting.

## 2. The draw replaced both selector screens

- **`ChampionshipSelector` is redundant.** With the entry division fixed per league type, it had
  exactly one right answer. It was removed, not hidden.
- **`TeamSelector` is removed, not kept as an override.** The draw *is* the assignment; the player
  cannot re-pick. *Rejected:* keeping `TeamSelector` after the draw so the player could swap clubs.
  That would have made the draw cosmetic.
- **The read APIs those screens used are kept on purpose.** `ChampionshipService.getChampionships`,
  `TeamService.getTeamsToSelect` and their use-case wrappers lost their only production callers.
  They keep their test coverage and cost nothing, so they stay. Their lack of callers is expected,
  not dead code left behind by mistake.
- **The draw lives in the domain, not in the component.** It takes an injected `RandomProvider`,
  like the match engine, so tests pin it. *Rejected:* drawing inline in `TeamAssigner`.

## 3. Starting at the bottom makes container re-centring the common path

The championship container stays centred on the division the human **started** in. When the
human's club is promoted, it moves into `promotionChampionship`, `playableChampionship` holds no
human club, and `TeamManager` cannot find the player's team. MS-106 recorded this as a
pre-existing gap: before MS-105 a player could start in Série A or A1 and never be promoted out.

MS-105 removes that escape. Every game starts at the bottom, so **every player who wins promotion
hits the gap**. MS-105 deliberately leaves it unfixed. It is raised as **MS-107**: re-centre the
container on the human's new division at roll-over, men's and women's, promotion and relegation.

> **Not asserted.** The lint has no "file absent" or "value in a `.ts` file" form, so these stay
> prose:
> - `ENTRY_CHAMPIONSHIP_BY_LEAGUE_TYPE` maps `mens` → `brasileirao-serie-d` and `womens` →
>   `brasileirao-feminino-serie-a3` (`src/domain/constants/EntryChampionships.ts`).
> - `src/presentation/pages/ChampionshipSelector/` and `src/presentation/pages/TeamSelector/` no
>   longer exist, and `App.tsx` routes neither.
> - The draw is uniform: `ChampionshipService.drawTeamForHumanPlayer` asks the rng for an index in
>   `0 … teams.length - 1`, pinned by `tests/domain/services/ChampionshipService.test.ts`.

## Left open

- **Container re-centring after promotion or relegation — MS-107.** See section 3 and [[index]].
