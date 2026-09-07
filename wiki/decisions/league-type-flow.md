---
title: League type selection flow
type: decision
ticket: MS-101
decided: 2026
status: implemented
supersedes: docs/LeagueTypeSelectorScreen.md, docs/NewFeatures.md
asserts:
  - file: src/domain/enums/LeagueType.ts
    exists: true
---

# League type selection flow

**Decision.** The player picks Women's League or Men's League before choosing a championship. The
choice filters what `ChampionshipSelector` offers.

Shipped as MS-101. The implementation is in the code; this page keeps the decisions and the
trade-offs behind them.

```
InitialScreen
  └─ New Game ─► LeagueTypeSelector
                    ├─ MEN'S LEAGUE  ─┐
                    └─ WOMEN'S LEAGUE ┴─► ChampionshipSelector (filtered by leagueType)
                                              ├─ pick championship ─► TeamSelector
                                              └─ GO BACK ─► LeagueTypeSelector
```

| Question | Decision |
|---|---|
| Position in the flow | After **New Game**, before `ChampionshipSelector`. **Load Game** untouched. |
| Data scope | Structure and filtering only. No new seed data in MS-101 — the women's list shipped **empty**, filled later by MS-102. |
| Data model | `leagueType` on every `championships.json` entry and on `Championship`; the selected value lives in `GameState.leagueType`. |
| Optionality | **Required, not optional** — every championship must declare its league. |
| Back navigation | `ChampionshipSelector` gains a GO BACK button. |

## Why required rather than optional

An optional `leagueType` would let a championship silently appear in neither list. Making it required
turns a missing value into a compile-time problem instead of an empty screen.

The caveat recorded at the time still holds: `ChampionshipRepository.getChampionships` builds partial
objects with `as Championship`, so the cast keeps compiling regardless of what the type says. The
field being required does not, on its own, guarantee it is carried through.

## Follow-on

MS-102 seeded the three women's divisions — [[brasileirao-feminino-a1]],
[[brasileirao-feminino-a2]], [[brasileirao-feminino-a3]].
