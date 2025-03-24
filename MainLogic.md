# How Players Move

- All players move 1 square, or remain in the same square, per clock tick.
- All players can move to the four directions, except GK
- On every clock tick, the players can stay in the same position, or move in any other direction
- The players of the team that has the ball possession, tend to move to the offensive field, or stay in the same position
- The players of the team that doesn't have the ball possession, tend to move to the defensive field, or stay in the same position
- One square can support up to 3 players

## GK

- Most of the time, stay in the same square:
  - (3,1) if from home team
  - (3, 10) if from visitor team
- Depending on if the ball is close, can move up to 1 square forward, 1 square upwards or 1 square downwards

## DF

- Most of the time: stay in the defensive field:
  - Between the columns 1 to 4, if from home team
  - Between the columns 7 to 10, if from visitor team
- Once in a while: go to the middle field:
  - Can go up to the column 5, if from home team
  - Can go up to the column 6, if from visitor team
- Rarely: go to the offensive field:
  - Can go up to the column 9, if from home team
  - Can go up to the column 2, if from visitor team
- Can also move upwards and downwards

## MF

- Most of the time: stay in the middle field:
  - Between the columns 4 and 7 for both home and visitor teams
- Once in a while:
  - Go to the offensive field:
    - Can go up to the column 9, if from home team
    - Can go up to the column 2, if from visitor team
  - Go to the defensive field:
    - Can go up to the column 2, if from home team
    - Can go up to the column 9, if from visitor team

## FW

- Most of the time: stay in the offensive field:
  - Between the columns 8 and 10, if from home team
  - Between the columns 1 and 3, if from visitor team
- Once in a while: go to the middle field
  - Can go up to the column 6, if from home team
  - Can go up to the column 5, if from visitor team
- Rarely: go to the defensive field
  - Can go up to the column 3, if from home team
  - Can go up to the column 8, if from visitor team
