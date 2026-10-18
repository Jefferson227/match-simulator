---
title: Player strength progression
type: spec
verified: 2026-10-18
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
  - file: src/domain/features/strength-progression/ClubLevel.ts
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
> [[ms-115-strength-ranges]]. Amended again by MS-116 on 2026-10-17 (club levels, the age curve,
> the rolled gain); why is on [[ms-116-club-levels]].

# Player strength progression

Introduced by MS-115, reworked by MS-116. A player's strength moves on a **rubber band**: every
league division owns a slice of the strength scale, every club owns a narrower **band** inside its
division's slice, squads start there, and every few team games each player steps up, holds or
steps down, pulled back toward the club's band whenever they are outside it.

## The scale and the division ranges

- A strength is always within **1–99**, whatever produced it.
- Each league pyramid splits 1–99 into one range per division. Counting tiers from the bottom
  (k = 1 for the lowest of N tiers), tier k's upper bound is `floor(99 × k / N)` and its lower bound
  is the previous tier's upper bound + 1:
  - Men (N = 4): Série D 1–24, Série C 25–49, Série B 50–74, Série A 75–99.
  - Women (N = 3): A3 1–33, A2 34–66, A1 67–99.

  The ranges are computed from the pyramid, not written down per division.
- A club's range is the range of the division it plays in **now**. Promotion or relegation switches
  it at the roll-over, and the rubber band pulls the squad toward its band in the new range.
- Cups have no tier and no range; they play no part.

## Starting strength (new game)

- Each club's **target** is its seed `initialOverallStrength` mapped linearly from its starting
  division's seed min..max onto that division's range: the strongest seed club lands on the range's
  top, the weakest on its bottom. A division whose seed clubs all share one strength maps to the
  range's midpoint.
- Each player is rolled at the club target **±2**, kept inside the division range.
- The club's **level** starts at its target (see below).

The linear map and the ±2 are invented; see [[invented-data]].

## Club level and band (MS-116)

- Every league club has a persisted **level**: an integer always inside its current division's
  range. It is hidden — no screen shows it.
- A club's **band** is `level − 3 .. level + 3`, cut to the division range. The band, not the
  division range, is what the rubber band pulls toward.
- **New game:** level = the club's target.
- **End of season, club stays in its division:** the level moves by the club's **final rank**,
  linearly from **+2** for the champion to **−2** for the last, rounded
  (`round(2 − 4 × (rank − 1) / (clubs − 1))`, 0 in a one-club division), so mid-table is about 0.
  The result is kept inside the division range.
- **Final rank.** A single-table division ranks by its table. A multi-phase division (Série C,
  Série D, A1, A2, A3) ranks its champion 1st and runner-up 2nd, then every other club by the
  furthest phase it reached, latest first, and within a phase by points across every phase, with
  the league tiebreakers. So A2's 8th-placed league club that reaches the semifinals ranks above the
  league leader knocked out in the quarter-finals.
- **Promotion:** level = the new range's min + 3. **Relegation:** level = the new range's max − 3.
  These replace the season change for that club.
- Cups have no range and no level; a club that only plays cups has none.

The ±3 band, the ±2 season change and the +3 / −3 offsets are invented; see [[invented-data]].

> **Not asserted.** The level rules live in `ClubLevel.ts`; the final rank in
> `PhaseProgression.buildSeasonRanking`; the roll-over that applies them in
> `ChampionshipService.runEndOfChampionshipActionsForAllChampionships`. Their tests check them.

## Progression

**Who.** Every player of every club in every league division, the human's club included, whether or
not the player took part in the match.

**When.** Each player keeps a persisted counter of team games, +1 for every match their club plays.
It is **not** reset at NEW SEASON. When it reaches the interval for the player's current bands, the
change is applied and the counter goes back to 0. A club that plays no match in a round — knocked
out of a group-stage-knockout division, or idle — does not count one.

**Morale band** (team morale 0–100, moving in 0.5 steps), read as it stands when the round ends,
before that round's result changes it: **low** ≤ 30, **mid** 30 < morale ≤ 70, **high** > 70.

**Age band**, age read as it stands: **≤ 23** (under-16s included), **24–29**, **30–33**, **≥ 34**.

**Direction inside the band**, by age and morale:

| Age | Low | Mid | High |
|---|---|---|---|
| ≤ 23 | −1 | +1 | +1 |
| 24–29 | −1 | hold | +1 |
| 30–33 | −1 | hold | hold |
| ≥ 34 | −1 | −1 | −1 |

**Interval** (games per change):

| Age | Low | Mid | High |
|---|---:|---:|---:|
| ≤ 23 | 3 | 3 | 2 |
| 24–29 | 4 | 4 | 2 |
| 30–33 | 4 | 4 | 3 |
| ≥ 34 | 3 | 3 | 3 |

A change that comes out as none — a hold, or a lost +1 roll — still resets the counter: the change
was due.

### The step

When a change is due:

| Strength vs. band | Change |
|---|---|
| Above the band | −2, whatever the morale and age |
| Inside, +1 | +1 with probability `(bandMax − strength) / (bandMax − bandMin)`, never past the band max |
| Inside, hold | none |
| Inside, −1 | −1, certain, never below the band min |
| Below the band | +2, whatever the morale and age |

The +1 is rolled through the division's injected random stream, never `Math.random`: certain at
the band min, impossible at the band max, and never applied in a one-point band (a band cut to
`bandMax = bandMin` at a division edge). The result is always kept within 1–99.

> **Amended 2026-10-17 (MS-116).** MS-115's rule increased every player at any morale above 30, so
> every squad climbed to its division's max and a division's strongest clubs ended level with each
> other. MS-116 aims the pull at the club's band, adds the four-band age curve with a mid-morale
> hold, and makes the +1 harder near the top. The two-way pull of 2026-10-08 stays, now aimed at the
> band. Numbers on [[ms-116-club-levels]].

> **Amended 2026-10-08.** The brief stopped an increasing player above the range and a decreasing
> player below it. A scripted three-season run showed relegated squads then never came down, since
> clubs rarely reach morale ≤ 30, and the user chose the two-way pull. Numbers on
> [[ms-115-strength-ranges]].

> **Not asserted.** The bands, the direction and interval tables and the step live in
> `ProgressionPolicy.ts`; the band in `ClubLevel.getClubBand`; the counting and the random stream in
> `ChampionshipService.endRound`. Their unit tests, not this page's asserts, check them.

## Other strength sources

- A youth player generated to replace a retiree ([[player-retirement]]) keeps the MS-113 formula —
  the rest of the squad's average ±5, less 10 — kept within **1–99**, not within the club's band:
  the progression pulls them there. Their counter starts at 0.

## No XP

`Player.xp`, the XP constants and the XP row of the PLAYER view are gone. A version-5 save, which
still carries XP, is abandoned rather than migrated (save version 6).

## Saves

A club's level is saved with it (save version 7). A version-6 save, whose clubs carry no level, is
abandoned rather than migrated.
