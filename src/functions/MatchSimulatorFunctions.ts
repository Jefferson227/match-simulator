import { Match, Player, Team, Scorer } from '../types';
import utils from '../utils/utils';
const { getRandomNumber, getPlayerPosition } = utils;

function kickOff(matches: Match[]): void {
  matches.forEach((match) => {
    var randomNumber = getRandomNumber(0, 100);
    match.ballPossession.isHomeTeam = randomNumber < 50;
  });
}

function getRandomDecimal(multiplier: number): number {
  return parseFloat((Math.random() * multiplier).toFixed(2));
}

function tryInterception(
  match: Match,
  player: Player,
  opponentTeam: Team,
  isShot = false
): boolean {
  if (!player.fieldPosition) return false;

  const nearbyOpponent = opponentTeam.players.find(
    (op) =>
      (isShot ? op.position === 'DF' || op.position === 'GK' : true) &&
      op.fieldPosition &&
      Math.abs(op.fieldPosition.column - player.fieldPosition!.column) <= 1 &&
      Math.abs(op.fieldPosition.row - player.fieldPosition!.row) <= 1
  );

  if (nearbyOpponent && match.ball) {
    const interceptionChance = getRandomDecimal(100);
    if (
      interceptionChance <
      (nearbyOpponent.strength / (player.strength + nearbyOpponent.strength)) *
        100
    ) {
      match.ball.possessedBy = {
        teamId: opponentTeam.id || '',
        playerId: nearbyOpponent.id,
      };
      match.ball.position = { ...nearbyOpponent.fieldPosition! };
      return true;
    }
  }
  return false;
}

function processBallAction(match: Match): void {
  if (!match.ball) return;

  const { ball, homeTeam, visitorTeam } = match;
  const currentTeam =
    ball.possessedBy.teamId === homeTeam.id ? homeTeam : visitorTeam;
  const currentPlayer = currentTeam.players.find(
    (p) => p.id === ball.possessedBy.playerId
  );

  if (!currentPlayer || !currentPlayer.fieldPosition) return; // Defensive guard

  const opponentTeam = currentTeam === homeTeam ? visitorTeam : homeTeam;
  const actionChance = getRandomDecimal(100) + currentPlayer.strength / 2;

  if (actionChance < 60) {
    // Interception check BEFORE pass
    const intercepted = tryInterception(match, currentPlayer, opponentTeam);
    if (intercepted) return;

    // Pass
    const teammates = currentTeam.players.filter(
      (p) => p.id !== currentPlayer.id && p.fieldPosition
    );

    if (teammates.length > 0) {
      const receiver = teammates[Math.floor(Math.random() * teammates.length)];
      match.ball.possessedBy.playerId = receiver.id;
      match.ball.position = { ...receiver.fieldPosition! };
    }
  } else if (actionChance < 85) {
    // Interception check BEFORE dribble
    const intercepted = tryInterception(match, currentPlayer, opponentTeam);
    if (intercepted) return;

    // Dribble
    if (currentTeam === homeTeam) {
      currentPlayer.fieldPosition.column = Math.min(
        10,
        currentPlayer.fieldPosition.column + 1
      );
    } else {
      currentPlayer.fieldPosition.column = Math.max(
        1,
        currentPlayer.fieldPosition.column - 1
      );
    }
    match.ball.position = { ...currentPlayer.fieldPosition };
  } else {
    // Attempt shot if near opponent goal
    const nearGoal =
      currentTeam === homeTeam
        ? currentPlayer.fieldPosition.column >= 9
        : currentPlayer.fieldPosition.column <= 2;

    if (nearGoal) {
      // Interception check BEFORE shot
      const intercepted = tryInterception(
        match,
        currentPlayer,
        opponentTeam,
        true
      );
      if (intercepted) return;

      // Shot logic
      const defensePlayers = opponentTeam.players.filter(
        (p) => p.position === 'DF' || p.position === 'GK'
      );

      if (defensePlayers.length === 0) return;

      const opponentDefense =
        defensePlayers.reduce((acc, p) => acc + p.strength, 0) /
        defensePlayers.length;

      const success =
        getRandomDecimal(100) <
        (currentPlayer.strength / (currentPlayer.strength + opponentDefense)) *
          100;

      if (success) {
        match.latestGoal = { scorerName: currentPlayer.name };
      }
    }
  }
}

function movePlayers(match: Match): void {
  const moveDirection = (
    player: Player,
    teamType: 'home' | 'visitor'
  ): void => {
    if (!player.fieldPosition) return;

    let columnChange = 0;

    if (player.position === 'DF') {
      columnChange = teamType === 'home' ? 1 : -1;
    } else if (player.position === 'MF') {
      columnChange =
        getRandomDecimal(3) > 1.5 ? (teamType === 'home' ? 1 : -1) : 0;
    } else if (player.position === 'FW') {
      columnChange = teamType === 'home' ? 1 : -1;
    }

    player.fieldPosition.column = Math.max(
      1,
      Math.min(10, player.fieldPosition.column + columnChange)
    );
  };

  match.homeTeam.players.forEach((player) => moveDirection(player, 'home'));
  match.visitorTeam.players.forEach((player) =>
    moveDirection(player, 'visitor')
  );
}

function endMatch(): void {
  // Placeholder for match end logic if needed
}

function runMatchLogic(match: Match): void {
  // TODO: Implement one small part at a time
  /**
   * If the ball is in the midfield, the team with the ball possession must roll the dice to decide what to do:
   * - Move the ball within the same area (80% of the times)
   * - Pass the ball to the attacking area (19% of the times)
   * - Shoot the ball to the goal (1% of the times)
   */
  if (match.ballPossession.position === 'midfield') {
    const randomNumber = getRandomNumber(0, 100);
    if (randomNumber < 80) {
      // Move the ball within the same area
      handleBallMovement(match, 'midfield');
      return;
    }

    if (randomNumber < 99) {
      // Pass the ball to the attacking area
      handleMidfieldBallPass(match);
      return;
    }

    // Shoot the ball to the goal
    handleMidfieldBallShoot(match);
    return;
  }

  /**
   * If the ball is in the attack field, the team with the ball possession must roll the dice to decide what to do:
   * - Move the ball within the same area (90% of the times)
   * - Pass the ball back to the midfield area (5% of the times)
   * - Shoot the ball to the goal (5% of the times)
   */
  if (match.ballPossession.position === 'attack') {
    const randomNumber = getRandomNumber(0, 100);
    if (randomNumber < 90) {
      // Move the ball within the same area
      // handleAttackBallMovement(match);
      return;
    }
    return;
  }
}

function handleMidfieldBallShoot(match: Match): void {
  /**
   * Get all MF players from the team with the ball possession
   * Roll the dice to choose one MF player to dispute against the opposing team
   * Get the sum of the strength of all DF players plus the GK from the opposing team
   */
  // Get the team with the ball possession
  const teamWithBallPossession = match.ballPossession.isHomeTeam
    ? match.homeTeam
    : match.visitorTeam;

  // Get the opposing team
  const opposingTeam = match.ballPossession.isHomeTeam
    ? match.visitorTeam
    : match.homeTeam;

  // Get all MF players from the team with the ball possession
  const mfPlayers = teamWithBallPossession.players.filter(
    (p) => p.position === 'MF'
  );

  // Roll the dice to choose one MF player to dispute against the opposing team
  const shooter = mfPlayers[getRandomNumber(0, mfPlayers.length - 1)];
  const shooterMaxStrength = shooter.strength;

  // Get the sum of the strength of all DF players plus the GK from the opposing team
  const defensePlayersMaxStrength = opposingTeam.players
    .filter((p) => p.position === 'DF' || p.position === 'GK')
    .reduce((acc, player) => acc + player.strength, 0);

  // Roll the dice to see if the MF player can score a goal
  const shooterStrength = getRandomNumber(1, shooterMaxStrength);
  const defenseStrength = getRandomNumber(1, defensePlayersMaxStrength);

  // If the shooter strength is greater than the defense strength, the shooter scores a goal
  if (shooterStrength > defenseStrength) {
    match.latestGoal = { scorerName: shooter.name };

    teamWithBallPossession.score++;
    return;
  }

  // Otherwise, the ball possession is switched to the opposing team
  if (match.ballPossession.isHomeTeam) {
    match.ballPossession.isHomeTeam = false;
    return;
  }

  match.ballPossession.isHomeTeam = true;
  return;
}

function handleMidfieldBallPass(match: Match): void {
  // Get the sum of the strength of all players in the midfield from both teams
  const maxHomeMidfieldStrength = match.homeTeam.players
    .filter((p) => p.position === 'MF')
    .reduce((acc, player) => acc + player.strength, 0);
  const maxVisitorMidfieldStrength = match.visitorTeam.players
    .filter((p) => p.position === 'MF')
    .reduce((acc, player) => acc + player.strength, 0);

  // Roll the dice for each sum to get the values to be disputed
  const homeMidfieldStrengthForDispute = getRandomNumber(
    1,
    maxHomeMidfieldStrength
  );
  const visitorMidfieldStrengthForDispute = getRandomNumber(
    1,
    maxVisitorMidfieldStrength
  );

  // Considering the home team has the ball possession and won the dispute, so the ball is passed to the attacking area
  if (
    homeMidfieldStrengthForDispute >= visitorMidfieldStrengthForDispute &&
    match.ballPossession.isHomeTeam
  ) {
    match.ballPossession.position = 'attack';
    return;
  }

  // Considering the visitor team has the ball possession and won the dispute, so the ball is passed to the attacking area
  if (
    homeMidfieldStrengthForDispute < visitorMidfieldStrengthForDispute &&
    !match.ballPossession.isHomeTeam
  ) {
    match.ballPossession.position = 'attack';
    return;
  }

  // Considering the home team has the ball possession and lost the dispute, so the possession is switched to the visitor team
  if (
    homeMidfieldStrengthForDispute < visitorMidfieldStrengthForDispute &&
    match.ballPossession.isHomeTeam
  ) {
    match.ballPossession.isHomeTeam = false;
    return;
  }

  // Considering the visitor team has the ball possession and lost the dispute, so the possession is switched to the home team
  if (
    homeMidfieldStrengthForDispute >= visitorMidfieldStrengthForDispute &&
    !match.ballPossession.isHomeTeam
  ) {
    match.ballPossession.isHomeTeam = true;
    return;
  }
}

function handleBallMovement(
  match: Match,
  position: 'defense' | 'midfield' | 'attack'
): void {
  // Get the sum of the strength of all players in the position from both teams
  const maxHomeStrength = match.homeTeam.players
    .filter((p) => p.position === getPlayerPosition(position))
    .reduce((acc, player) => acc + player.strength, 0);
  const maxVisitorStrength = match.visitorTeam.players
    .filter((p) => p.position === getPlayerPosition(position))
    .reduce((acc, player) => acc + player.strength, 0);

  // Roll the dice for each sum to get the values to be disputed
  const homeStrengthForDispute = getRandomNumber(1, maxHomeStrength);
  const visitorStrengthForDispute = getRandomNumber(1, maxVisitorStrength);

  // Considering the home team has the ball possession and won the dispute, so the possession is maintained
  if (
    homeStrengthForDispute >= visitorStrengthForDispute &&
    match.ballPossession.isHomeTeam
  ) {
    return;
  }

  // Considering the visitor team has the ball possession and lost the dispute, so the possession is switched to the home team
  if (
    homeStrengthForDispute >= visitorStrengthForDispute &&
    !match.ballPossession.isHomeTeam
  ) {
    match.ballPossession.isHomeTeam = true;
    return;
  }

  // Considering the home team has the ball possession and lost the dispute, so the possession is switched to the visitor team
  if (
    homeStrengthForDispute < visitorStrengthForDispute &&
    match.ballPossession.isHomeTeam
  ) {
    match.ballPossession.isHomeTeam = false;
    return;
  }

  // Considering the visitor team has the ball possession and won the dispute, so the possession is maintained
  if (
    homeStrengthForDispute < visitorStrengthForDispute &&
    !match.ballPossession.isHomeTeam
  ) {
    return;
  }
}

function tickClock(
  time: number,
  setScorer: (matchId: string, scorer: Scorer) => void,
  matches: Match[],
  increaseScore: (matchId: string, scorerTeam: { isHomeTeam: boolean }) => void
): void {
  if (time === 0) {
    kickOff(matches);
  }

  matches.forEach((match) => {
    runMatchLogic(match);
  });

  if (time === 90) {
    endMatch();
  }
}

const MatchSimulatorFunctions = {
  tickClock,
};

export default MatchSimulatorFunctions;
