# Player Actions

- For GK players, these are the only possible actions:
  - `Pass` if they have the ball possession
  - `Defend Shot` when some opponent player shoots towards the goal
- For players with other positions:
  - If the player doesn't have the ball possession, they can:
    - `Move`
    - `Intercept` only if the player from the opponent team has the ball possession, and is at 1 square of distance
  - If the player has the ball possession, they can:
    - `Move`
    - `Pass`
    - `Shoot`

# Actions Per Position

- The actions differ depending on whether the player has the ball possession or not
- Each action has a percentage of chance to be taken

## GK

- Has the ball possession:
  - `Pass`: 100%

## DF

- Has the ball possession:

  - `Move`: 47.5%
  - `Pass`: 47.5%
  - `Shoot`: 5%

- Doesn't have the ball possession:
  - `Move`: 100%
  - `Intercept`: 100%, only if the opponent player is 1 square away

## MF

- Has the ball possession:

  - `Move`: 45%
  - `Pass`: 45%
  - `Shoot`: 10%

- Doesn't have the ball possession:
  - `Move`: 100%
  - `Intercept`: 100%, only if the opponent player is 1 square away

## FW

- Has the ball possession:

  - `Move`: 40%
  - `Pass`: 40%
  - `Shoot`:
    - If is at 1 square of distance from the opponent goal: 100%
    - If is at 2 square of distance from the opponent goal: 70%
    - Otherwise: 20%

- Doesn't have the ball possession:
  - `Move`: 100%
  - `Intercept`: 70%, only if the opponent player is 1 square away

# Decision Making

- Based on the player position, each action has a percentage of chance to be taken
- On every clock tick, a random number between 0 and 100 will be generated to determine the action of each player

# Action Success Rate

- Each action has a fixed success rate depending on the position in the field:

  - `Move`:
    - All positions: 100%
  - `Pass`:
    - Defensive field: 90%
    - Middle field: 70%
    - Offensive field: 40%
  - `Shoot`:
    - Defensive field: 1%
    - Middle field: 5%
    - Offensive field: 10%

- The player force can increase the percentage of success rate of each action
- Considering each player has a force between 1 and 99, on every action attempt, a random number will be generated between 1 and the player force
- The resulted number will be added as a percentage in the success rate
- The sum of total success rate plus the player random force, will have a max percentage of 100%
  - `Total success rate = position success rate + player random force`
  - Example:
    - Action: `Pass` in the middle field (70% of success)
    - Player force: 43
    - Player random force: 11
    - `Total success rate = 70 + 11 = 81%`
