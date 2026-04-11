# Player Strength Evolution System (XP-Based)

## Overview

This system defines how player **strength** evolves over time using an
**experience points (XP)** model.

Design goals:

-   Players evolve based on team performance and morale
-   Stronger players improve more slowly
-   Weaker players do not collapse too quickly
-   Team success gradually improves players
-   Team failure gradually stagnates or reduces players
-   Stable, predictable, and easy to tune
-   No individual player performance metrics required

------------------------------------------------------------------------

# Step 1 --- Determine Team Result Value (Based on Last 5 Games)

This system evaluates the **team's recent form** using the last **5
games** instead of a single match.

Each match contributes:

WIN = +1.0\
DRAW = +0.2\
LOSS = -0.8

The result is averaged across the last 5 games to produce a stable trend
indicator.

``` ts
function getResultValue(lastFiveResults: MatchResult[]): number {
  let total = 0

  for (const result of lastFiveResults) {
    switch (result) {
      case "WIN":
        total += 1.0
        break
      case "DRAW":
        total += 0.2
        break
      case "LOSS":
        total -= 0.8
        break
    }
  }

  return total / 5
}
```

------------------------------------------------------------------------

# Step 2 --- Compute Morale Multiplier

Morale slightly boosts or slows development.

Formula:

moraleMultiplier = 0.8 + (teamMorale / 100) \* 0.4

Meaning:

-   0.8 = minimum multiplier at very low morale
-   100 = maximum morale
-   0.4 = adjustment range

``` ts
function getMoraleMultiplier(teamMorale: number): number {
  return 0.8 + (teamMorale / 100) * 0.4
}
```

------------------------------------------------------------------------

# Step 3 --- Compute Player Growth Bias

Weaker players grow faster. Stronger players grow slower.

growthBias = 0.3 + 0.7 \* ((101 - strength) / 100)

Meaning:

-   101 ensures strength 100 still produces growth
-   0.7 controls strength influence
-   0.3 guarantees minimum growth potential

``` ts
function getGrowthBias(strength: number): number {
  return 0.3 + 0.7 * ((101 - strength) / 100)
}
```

------------------------------------------------------------------------

# Step 4 --- Random Variation

Adds small natural variation between players.

Range:

randomBetween(-1, 1)

``` ts
function getRandomness(): number {
  return randomBetween(-1, 1)
}
```

------------------------------------------------------------------------

# Step 5 --- Compute XP Change

Combines all factors into a single XP change.

BASE_XP_SCALE = 6

This controls overall progression speed.

``` ts
function computeXpDelta(
  lastFiveResults: MatchResult[],
  teamMorale: number,
  strength: number
): number {
  const resultValue = getResultValue(lastFiveResults)
  const moraleMultiplier = getMoraleMultiplier(teamMorale)
  const growthBias = getGrowthBias(strength)
  const randomness = getRandomness()

  const BASE_XP_SCALE = 6

  return (
    BASE_XP_SCALE *
    resultValue *
    moraleMultiplier *
    growthBias +
    randomness
  )
}
```

------------------------------------------------------------------------

# Step 6 --- XP Required to Gain Strength

Stronger players require more XP to improve.

BASE_UP_XP = 40\
XP_PER_STRENGTH = 4

``` ts
function xpToLevelUp(strength: number): number {
  const BASE_UP_XP = 40
  const XP_PER_STRENGTH = 4

  return BASE_UP_XP + XP_PER_STRENGTH * strength
}
```

------------------------------------------------------------------------

# Step 7 --- XP Required to Lose Strength

Players near extremes are more stable.

BASE_DOWN_XP = 50\
STABILITY_FACTOR = 2\
MID_STRENGTH = 50

``` ts
function xpToLevelDown(strength: number): number {
  const BASE_DOWN_XP = 50
  const STABILITY_FACTOR = 2
  const MID_STRENGTH = 50

  return (
    BASE_DOWN_XP +
    STABILITY_FACTOR *
    Math.abs(strength - MID_STRENGTH)
  )
}
```

------------------------------------------------------------------------

# Step 8 --- Apply XP and Update Strength

``` ts
function updateStrength(player: Player) {
  while (player.xp >= xpToLevelUp(player.strength)) {
    player.xp -= xpToLevelUp(player.strength)
    player.strength += 1
  }

  while (player.xp <= -xpToLevelDown(player.strength)) {
    player.xp += xpToLevelDown(player.strength)
    player.strength -= 1
  }

  player.strength = clamp(player.strength, 1, 100)
}
```

------------------------------------------------------------------------

# Required Inputs

player.strength\
player.xp\
team.morale\
team.lastFiveResults

------------------------------------------------------------------------

# End of Specification
