# How Players Move

## General Rules

- All players must have an initial position when the match starts
- All players move 1 square, or remain in the same square, per clock tick.
- All players can move to 8 different directions (forward, backward, upward, backward, and diagonally), or stay in the same square, except GK
- On every clock tick, the player with the ball moves first, followed by the order DF, MF, FW
- The players of the team that has the ball possession, tend to move to the offensive field, or stay in the same position
- The players of the team that doesn't have the ball possession, tend to move to the defensive field, or stay in the same position
- One square can support up to 3 players, regardless whether they're teammates or not

## Specific Rules

- If the ball is in the possession of the opponent team, and it's at 1 square of distance, they can:
  - Go to the same square as the opponent player
  - Try to intercept the ball from the opponent player
  - If the interception is successful, they can move 1 square more towards the offensive field
- If the ball is in the possession of the current team, players shouldn't be more than 2 squares apart from their teammates, except when the player has the ball possession
- If the player doesn't have the ball possession and they're moving forwards of backwards, they should move to a square that doesn't have any other teammate, if possible

## Move Decision

- GK players will perform the action under these categories:

  - Most of the time: 95% of the clock ticks
  - Rarely: 5% of the clock ticks (if the ball is at 1 square of distance)

- MF players will perform the action under these categories:

  - Most of the time: 80% of the clock ticks
  - Once in a while: 20% of the clock ticks

- DF and FW players will perform the action under these categories:
  - Most of the time: 80% of the clock ticks
  - Once in a while: 15% of the clock ticks
  - Rarely: 5% of the clock ticks

## Moves by Position

### GK

- Most of the time: stay in the same square:
  - (3,1) if from home team
  - (3, 10) if from visitor team
- Rarely:
  - If the ball is at 1 square of distance, GK can move up to 1 square forward, 1 square upwards or 1 square downwards

### DF

- Most of the time (80%): stay in the defensive field:
  - Between the columns 1 to 4, if from home team
  - Between the columns 7 to 10, if from visitor team
- Once in a while (15%): can go to the middle field:
  - Up to the column 5, if from home team
  - Up to the column 6, if from visitor team
- Rarely: can go to the offensive field:
  - Up to the column 9, if from home team
  - Up to the column 2, if from visitor team

### MF

- Most of the time (80%): stay in the middle field:
  - Between the columns 4 and 7 for both home and visitor teams
- Once in a while (20%):
  - Can go to the offensive field:
    - Up to the column 9, if from home team
    - Up to the column 2, if from visitor team
  - Can go to the defensive field:
    - Up to the column 2, if from home team
    - Up to the column 9, if from visitor team

### FW

- Most of the time (80%): stay in the offensive field:
  - Between the columns 7 and 10, if from home team
  - Between the columns 1 and 4, if from visitor team
- Once in a while (15%): can go to the middle field
  - Up to the column 6, if from home team
  - Up to the column 5, if from visitor team
- Rarely (5%): go to the defensive field
  - Up to the column 3, if from home team
  - Up to the column 8, if from visitor team

## Player States

- `FieldPosition`: an array with size of 2, storing the row and the column
- `HasBallPossession`: boolean
- `Behavior`: if the team has the ball possession, the behavior is `Offensive`, otherwise it's `Defensive`

## Player Actions

- `Move`: performs a move according to your field position, ball possession and specific rules
