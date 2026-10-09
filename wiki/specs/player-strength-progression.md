---
title: Player strength progression
type: spec
verified: 2026-10-08
owner: user
asserts:
  - file: src/domain/services/PlayerProgressionService.ts
    exists: true
  - file: src/domain/features/strength-progression/StrengthRange.ts
    exists: true
  - file: src/domain/features/strength-progression/ProgressionPolicy.ts
    exists: true
  - file: src/domain/features/strength-progression/SeedStrength.ts
    exists: true
  - file: src/domain/constants/StrengthConstants.ts
    exists: true
---

> **Spec, not description.** This is the contract `PlayerProgressionService.ts` and
> `src/domain/features/strength-progression/` are judged against. If the code and this page
> disagree, the code is wrong until the user says otherwise. The user owns this page; Claude keeps
> it in sync and drafts changes, but does not change the rules unilaterally.

> **Provenance.** Drafted from the user's MS-115 brief (*PlayerStrengthBalance*) and the
> clarifications agreed on 2026-10-07, then amended by the user on 2026-10-08 (the two-way pull, see
> *The step*). It replaces the XP spec MS-115 retired; why, and the rejected alternatives, are on
> [[ms-115-strength-ranges]].

# Player strength progression

Introduced by MS-115. A player's strength moves on a **rubber band**: every league division owns a
slice of the strength scale, squads start inside their division's slice, and every few team games
each player steps up or down, pulled back toward the slice whenever they are outside it.

## The scale and the division ranges

- A strength is always within **1–99**, whatever produced it.
- Each league pyramid splits 1–99 into one range per division. Counting tiers from the bottom
  (k = 1 for the lowest of N tiers), tier k's upper bound is `floor(99 × k / N)` and its lower bound
  is the previous tier's upper bound + 1:
  - Men (N = 4): Série D 1–24, Série C 25–49, Série B 50–74, Série A 75–99.
  - Women (N = 3): A3 1–33, A2 34–66, A1 67–99.

  The ranges are computed from the pyramid, not written down per division.
- A club's range is the range of the division it plays in **now**. Promotion or relegation switches
  it at the roll-over, and the rubber band pulls the squad toward the new range.
- Cups have no tier and no range; they play no part.

## Starting strength (new game)

- Each club's **target** is its seed `initialOverallStrength` mapped linearly from its starting
  division's seed min..max onto that division's range: the strongest seed club lands on the range's
  top, the weakest on its bottom. A division whose seed clubs all share one strength maps to the
  range's midpoint.
- Each player is rolled at the club target **±2**, kept inside the division range.

The linear map and the ±2 are invented; see [[invented-data]].

## Progression

**Who.** Every player of every club in every league division, the human's club included, whether or
not the player took part in the match.

**When.** Each player keeps a persisted counter of team games, +1 for every match their club plays.
It is **not** reset at NEW SEASON. When it reaches the interval for the player's current bands, the
change is applied and the counter goes back to 0. A club that plays no match in a round — knocked
out of a group-stage-knockout division, or idle — does not count one.

**Morale band** (team morale 0–100, moving in 0.5 steps), read as it stands when the round ends,
before that round's result changes it:

| Band | Morale | Direction inside the range |
|---|---|---|
| Low | ≤ 30 | decrease |
| Mid | 30 < morale ≤ 70 | increase |
| High | > 70 | increase |

**Age band and interval** (games per change), age read as it stands:

| Age | Low | Mid | High |
|---|---:|---:|---:|
| ≤ 25 (under-16s included) | 3 | 3 | 1 |
| 26–35 | 4 | 4 | 2 |
| ≥ 36 | 5 | 5 | 3 |

### The step

When a change is due:

| Strength vs. range | Change |
|---|---|
| Above the range | −2, whatever the morale |
| Inside, increasing | +1, never past the range max |
| Inside, decreasing | −1, never below the range min |
| Below the range | +2, whatever the morale |

The result is always kept within 1–99.

> **Amended 2026-10-08.** The brief stopped an increasing player above the range and a decreasing
> player below it. A scripted three-season run showed relegated squads then never came down, since
> clubs rarely reach morale ≤ 30, and the user chose the two-way pull. Numbers on
> [[ms-115-strength-ranges]].

> **Not asserted.** The bands, the interval table and the step live in `ProgressionPolicy.ts`; the
> counting lives in `ChampionshipService.endRound`. Their unit tests, not this page's asserts, check
> them.

## Other strength sources

- A youth player generated to replace a retiree ([[player-retirement]]) keeps the MS-113 formula —
  the rest of the squad's average ±5, less 10 — kept within **1–99**, not within the division's
  range: the progression pulls them there. Their counter starts at 0.

## No XP

`Player.xp`, the XP constants and the XP row of the PLAYER view are gone. A version-5 save, which
still carries XP, is abandoned rather than migrated (save version 6).
