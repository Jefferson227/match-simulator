import { Match, Scorer } from '../types';
import utils from '../utils/utils';
const {
  getRandomNumber,
  getPlayerPosition,
  getOpposingPosition,
  getNextFieldArea,
  getPreviousFieldArea,
  getMaxTeamStrength,
  getMaxShooterStrength,
  getMaxDefenseStrength,
} = utils;
const debugTeam = 'Ceará Sporting Club';

function kickOff(matches: Match[]): void {
  matches.forEach((match) => {
    var randomNumber = getRandomNumber(0, 100);
    match.ballPossession.isHomeTeam = randomNumber < 50;
    match.ballPossession.position = 'midfield';

    // Log the kick off
    if (match.homeTeam.name === debugTeam) {
      if (match.ballPossession.isHomeTeam) {
        console.log(
          `kickOff(); team: ${match.homeTeam.name}; position: ${match.ballPossession.position}`
        );

        return;
      }

      console.log(
        `kickOff(); team: ${match.visitorTeam.name}; position: ${match.ballPossession.position}`
      );
    }
  });
}

function kickOffAfterGoal(match: Match): void {
  // Ball possession is switched to the opposing team after taking a goal
  match.ballPossession.isHomeTeam = !match.ballPossession.isHomeTeam;
  match.ballPossession.position = 'midfield';

  // Log the kick off after goal
  if (match.homeTeam.name === debugTeam) {
    if (match.ballPossession.isHomeTeam) {
      console.log(
        `kickOffAfterGoal(); team: ${match.homeTeam.name}; position: ${match.ballPossession.position}`
      );

      return;
    }

    console.log(
      `kickOffAfterGoal(); team: ${match.visitorTeam.name}; position: ${match.ballPossession.position}`
    );
  }
}

function endMatch(): void {
  // Placeholder for match end logic if needed
}

function handleBallShoot(
  match: Match,
  time: number,
  setScorer: (matchId: string, scorer: Scorer) => void,
  increaseScore: (matchId: string, scorerTeam: { isHomeTeam: boolean }) => void
): void {
  /**
   * Get all players from the current position from the team with the ball possession
   * Roll the dice to choose one player from the current position to dispute against the opposing team
   * Get the sum of the strength of all DF players plus the GK from the opposing team
   */

  // Get the team with the ball possession
  const teamWithBallPossession = match.ballPossession.isHomeTeam
    ? match.homeTeam
    : match.visitorTeam;

  // Track shot attempts
  match.shotAttempts = (match.shotAttempts || 0) + 1;
  if (match.homeTeam.name === debugTeam)
    console.log(
      `handleBallShoot(); team: ${teamWithBallPossession.name}; position: ${match.ballPossession.position}; shot attempt: ${match.shotAttempts}`
    );

  // Get the opposing team
  const opposingTeam = match.ballPossession.isHomeTeam
    ? match.visitorTeam
    : match.homeTeam;

  // Get all players from the current position from the team with the ball possession
  const offensivePlayers = teamWithBallPossession.starters.filter(
    (p) => p.position === getPlayerPosition(match.ballPossession.position)
  );

  // Roll the dice to choose one player from the current position to dispute against the opposing team
  const shooter =
    offensivePlayers[getRandomNumber(0, offensivePlayers.length - 1)];
  const shooterMaxStrength = getMaxShooterStrength(
    shooter,
    teamWithBallPossession
  );

  // Get the sum of the strength of all DF players plus the GK from the opposing team
  const defensePlayersMaxStrength = getMaxDefenseStrength(opposingTeam);

  // Roll the dice to see if the shooter can score a goal
  const shooterStrength = getRandomNumber(1, shooterMaxStrength);
  const defenseStrength = getRandomNumber(1, defensePlayersMaxStrength);

  // If the shooter strength is greater than the defense strength, the shooter scores a goal
  if (shooterStrength > defenseStrength) {
    match.latestGoal = { scorerName: shooter.name };

    setScorer(match.id, { playerName: shooter.name, time });
    increaseScore(match.id, { isHomeTeam: match.ballPossession.isHomeTeam });

    // Log the goal
    if (match.homeTeam.name === debugTeam)
      console.log(
        `handleBallShoot(); team: ${teamWithBallPossession.name}; position: ${match.ballPossession.position}; goal scored by ${shooter.name} at ${time} minutes`
      );

    kickOffAfterGoal(match);
    return;
  }

  // Otherwise, the ball possession is switched to the opposing team
  match.ballPossession.isHomeTeam = !match.ballPossession.isHomeTeam;
  match.ballPossession.position = getOpposingPosition(
    match.ballPossession.position
  );

  // Log the shot attempt failed
  if (match.homeTeam.name === debugTeam)
    console.log(
      `handleBallShoot(); team: ${opposingTeam.name}; position: ${match.ballPossession.position}; shot attempt failed - interception`
    );
}

function handleBallPassToNextArea(match: Match): void {
  // Get the team with the ball possession
  var teamWithBallPossession = match.ballPossession.isHomeTeam
    ? match.homeTeam
    : match.visitorTeam;

  // Get the opposing team
  var opposingTeam = match.ballPossession.isHomeTeam
    ? match.visitorTeam
    : match.homeTeam;

  // Get the sum of the strength of all players in the position from the team with the ball possession
  const maxTeamWithBallPossessionStrength = getMaxTeamStrength(
    teamWithBallPossession,
    getPlayerPosition(match.ballPossession.position)
  );

  // Get the opposing position
  const opposingPosition = getOpposingPosition(match.ballPossession.position);

  // Get the sum of the strength of all players in the opposing position from the opposing team
  const maxOpposingTeamStrength = getMaxTeamStrength(
    opposingTeam,
    getPlayerPosition(opposingPosition)
  );

  // Roll the dice for each sum to get the values to be disputed
  const teamWithBallPossessionStrengthForDispute = getRandomNumber(
    1,
    maxTeamWithBallPossessionStrength
  );
  const opposingTeamStrengthForDispute = getRandomNumber(
    1,
    maxOpposingTeamStrength
  );

  // Considering the team with the ball possession wins the dispute, so the ball is passed to the next area
  if (
    teamWithBallPossessionStrengthForDispute >= opposingTeamStrengthForDispute
  ) {
    match.ballPossession.position = getNextFieldArea(
      match.ballPossession.position
    );

    // Log the ball passed to the next area
    if (match.homeTeam.name === debugTeam)
      console.log(
        `handleBallPassToNextArea(); team: ${teamWithBallPossession.name}; position: ${match.ballPossession.position}; ball passed to next area`
      );
    return;
  }

  // Otherwise, the ball possession is switched to the opposing team
  match.ballPossession.isHomeTeam = !match.ballPossession.isHomeTeam;
  match.ballPossession.position = opposingPosition;

  // Log the ball pass failed
  if (match.homeTeam.name === debugTeam)
    console.log(
      `handleBallPassToNextArea(); team: ${opposingTeam.name}; position: ${match.ballPossession.position}; ball pass failed - interception`
    );
}

function handleBallPassToPreviousArea(match: Match): void {
  // Get the team with the ball possession
  var teamWithBallPossession = match.ballPossession.isHomeTeam
    ? match.homeTeam
    : match.visitorTeam;

  // Get the opposing team
  var opposingTeam = match.ballPossession.isHomeTeam
    ? match.visitorTeam
    : match.homeTeam;

  // Get the sum of the strength of all players in the position from the team with the ball possession
  const maxTeamWithBallPossessionStrength = getMaxTeamStrength(
    teamWithBallPossession,
    getPlayerPosition(match.ballPossession.position)
  );

  // Get the opposing position
  const opposingPosition = getOpposingPosition(match.ballPossession.position);

  // Get the sum of the strength of all players in the opposing position from the opposing team
  const maxOpposingTeamStrength = getMaxTeamStrength(
    opposingTeam,
    getPlayerPosition(opposingPosition)
  );

  // Roll the dice for each sum to get the values to be disputed
  const teamWithBallPossessionStrengthForDispute = getRandomNumber(
    1,
    maxTeamWithBallPossessionStrength
  );
  const opposingTeamStrengthForDispute = getRandomNumber(
    1,
    maxOpposingTeamStrength
  );

  // If the team with the ball possession wins the dispute, so the ball is passed to the previous area
  if (
    teamWithBallPossessionStrengthForDispute >= opposingTeamStrengthForDispute
  ) {
    match.ballPossession.position = getPreviousFieldArea(
      match.ballPossession.position
    );

    // Log the ball passed to the previous area
    if (match.homeTeam.name === debugTeam)
      console.log(
        `handleBallPassToPreviousArea(); team: ${teamWithBallPossession.name}; position: ${match.ballPossession.position}; ball passed to previous area`
      );
    return;
  }

  // Otherwise, the ball possession is switched to the opposing team
  match.ballPossession.isHomeTeam = !match.ballPossession.isHomeTeam;
  match.ballPossession.position = opposingPosition;

  // Log the ball pass failed
  if (match.homeTeam.name === debugTeam)
    console.log(
      `handleBallPassToPreviousArea(); team: ${opposingTeam.name}; position: ${match.ballPossession.position}; ball pass failed - interception`
    );
}

function handleBallMovement(match: Match): void {
  // Get the team with the ball possession
  var teamWithBallPossession = match.ballPossession.isHomeTeam
    ? match.homeTeam
    : match.visitorTeam;

  // Get the opposing team
  var opposingTeam = match.ballPossession.isHomeTeam
    ? match.visitorTeam
    : match.homeTeam;

  // Get the sum of the strength of all players in the position from the team with the ball possession
  const maxTeamWithBallPossessionStrength = getMaxTeamStrength(
    teamWithBallPossession,
    getPlayerPosition(match.ballPossession.position)
  );

  // Get the opposing position
  const opposingPosition = getOpposingPosition(match.ballPossession.position);

  // Get the sum of the strength of all players in the opposing position from the opposing team
  const maxOpposingTeamStrength = getMaxTeamStrength(
    opposingTeam,
    getPlayerPosition(opposingPosition)
  );

  // Roll the dice for each sum to get the values to be disputed
  const teamWithBallPossessionStrengthForDispute = getRandomNumber(
    1,
    maxTeamWithBallPossessionStrength
  );
  const opposingTeamStrengthForDispute = getRandomNumber(
    1,
    maxOpposingTeamStrength
  );

  // If the team with the ball possession wins the dispute, so the possession is maintained
  if (
    teamWithBallPossessionStrengthForDispute >= opposingTeamStrengthForDispute
  ) {
    // Log the ball movement within the same area
    if (match.homeTeam.name === debugTeam)
      console.log(
        `handleBallMovement(); team: ${teamWithBallPossession.name}; position: ${match.ballPossession.position}; ball movement within the same area`
      );
    return;
  }

  // Otherwise, the possession is switched to the opposing team
  match.ballPossession.isHomeTeam = !match.ballPossession.isHomeTeam;
  match.ballPossession.position = opposingPosition;

  // Log the ball movement - interception
  if (match.homeTeam.name === debugTeam)
    console.log(
      `handleBallMovement(); team: ${opposingTeam.name}; position: ${match.ballPossession.position}; ball movement - interception`
    );
}

function runMatchLogic(
  match: Match,
  time: number,
  setScorer: (matchId: string, scorer: Scorer) => void,
  increaseScore: (matchId: string, scorerTeam: { isHomeTeam: boolean }) => void
): void {
  // TODO: Implement one small part at a time
  /**
   * If the ball is in the defense field, the team with the ball possession must roll the dice to decide what to do:
   * - Move the ball within the same area (60% of the times)
   * - Pass the ball to the midfield area (39% of the times)
   * - Shoot the ball to the goal (1% of the times)
   */
  if (match.ballPossession.position === 'defense') {
    const randomNumber = getRandomNumber(0, 100);
    if (randomNumber < 60) {
      // Move the ball within the same area
      handleBallMovement(match);
      return;
    }

    if (randomNumber < 99) {
      // Pass the ball to the attacking area
      handleBallPassToNextArea(match);
      return;
    }

    // Shoot the ball to the goal
    handleBallShoot(match, time, setScorer, increaseScore);
    return;
  }

  /**
   * If the ball is in the midfield, the team with the ball possession must roll the dice to decide what to do:
   * - Move the ball within the same area (80% of the times)
   * - Pass the ball to the attacking area (18% of the times)
   * - Shoot the ball to the goal (2% of the times)
   */
  if (match.ballPossession.position === 'midfield') {
    const randomNumber = getRandomNumber(0, 100);
    if (randomNumber < 80) {
      // Move the ball within the same area
      handleBallMovement(match);
      return;
    }

    if (randomNumber < 98) {
      // Pass the ball to the attacking area
      handleBallPassToNextArea(match);
      return;
    }

    // Shoot the ball to the goal
    handleBallShoot(match, time, setScorer, increaseScore);
    return;
  }

  /**
   * If the ball is in the attack field, the team with the ball possession must roll the dice to decide what to do:
   * - Move the ball within the same area (60% of the times)
   * - Pass the ball back to the midfield area (10% of the times)
   * - Shoot the ball to the goal (30% of the times)
   */
  if (match.ballPossession.position === 'attack') {
    const randomNumber = getRandomNumber(0, 100);
    if (randomNumber < 60) {
      // Move the ball within the same area
      handleBallMovement(match);
      return;
    }

    if (randomNumber < 70) {
      // Pass the ball back to the midfield area
      handleBallPassToPreviousArea(match);
      return;
    }

    // Shoot the ball to the goal
    handleBallShoot(match, time, setScorer, increaseScore);
    return;
  }
}

function tickClock(
  time: number,
  matches: Match[],
  setScorer: (matchId: string, scorer: Scorer) => void,
  increaseScore: (matchId: string, scorerTeam: { isHomeTeam: boolean }) => void
): void {
  if (time === 0) {
    kickOff(matches);
  }

  matches.forEach((match) => {
    runMatchLogic(match, time, setScorer, increaseScore);
  });

  if (time === 90) {
    endMatch();
  }
}

const MatchSimulatorFunctions = {
  tickClock,
};

export default MatchSimulatorFunctions;
