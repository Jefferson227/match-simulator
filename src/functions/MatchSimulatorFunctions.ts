import { Match, Player, Team, Scorer } from '../types';
import utils from '../utils/utils';
const {
  getRandomNumber,
  getPlayerPosition,
  getOpposingPosition,
  getNextFieldArea,
  getPreviousFieldArea,
} = utils;

function kickOff(matches: Match[]): void {
  matches.forEach((match) => {
    var randomNumber = getRandomNumber(0, 100);
    match.ballPossession.isHomeTeam = randomNumber < 50;
    match.ballPossession.position = 'midfield';
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

  // Get the opposing team
  const opposingTeam = match.ballPossession.isHomeTeam
    ? match.visitorTeam
    : match.homeTeam;

  // Get all players from the current position from the team with the ball possession
  const offensivePlayers = teamWithBallPossession.players.filter(
    (p) => p.position === getPlayerPosition(match.ballPossession.position)
  );

  // Roll the dice to choose one player from the current position to dispute against the opposing team
  const shooter =
    offensivePlayers[getRandomNumber(0, offensivePlayers.length - 1)];
  const shooterMaxStrength = shooter.strength;

  // Get the sum of the strength of all DF players plus the GK from the opposing team
  const defensePlayersMaxStrength = opposingTeam.players
    .filter((p) => p.position === 'DF' || p.position === 'GK')
    .reduce((acc, player) => acc + player.strength, 0);

  // Roll the dice to see if the shooter can score a goal
  const shooterStrength = getRandomNumber(1, shooterMaxStrength);
  const defenseStrength = getRandomNumber(1, defensePlayersMaxStrength);

  // If the shooter strength is greater than the defense strength, the shooter scores a goal
  if (shooterStrength > defenseStrength) {
    match.latestGoal = { scorerName: shooter.name };

    setScorer(match.id, { playerName: shooter.name, time });
    increaseScore(match.id, { isHomeTeam: match.ballPossession.isHomeTeam });
    return;
  }

  // Otherwise, the ball possession is switched to the opposing team
  match.ballPossession.isHomeTeam = !match.ballPossession.isHomeTeam;
  match.ballPossession.position = getOpposingPosition(
    match.ballPossession.position
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
  const maxTeamWithBallPossessionStrength = teamWithBallPossession.players
    .filter(
      (p) => p.position === getPlayerPosition(match.ballPossession.position)
    )
    .reduce((acc, player) => acc + player.strength, 0);

  // Get the opposing position
  const opposingPosition = getOpposingPosition(match.ballPossession.position);

  // Get the sum of the strength of all players in the opposing position from the opposing team
  const maxOpposingTeamStrength = opposingTeam.players
    .filter((p) => p.position === getPlayerPosition(opposingPosition))
    .reduce((acc, player) => acc + player.strength, 0);

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
    return;
  }

  // Otherwise, the ball possession is switched to the opposing team
  match.ballPossession.isHomeTeam = !match.ballPossession.isHomeTeam;
  match.ballPossession.position = opposingPosition;
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
  const maxTeamWithBallPossessionStrength = teamWithBallPossession.players
    .filter(
      (p) => p.position === getPlayerPosition(match.ballPossession.position)
    )
    .reduce((acc, player) => acc + player.strength, 0);

  // Get the opposing position
  const opposingPosition = getOpposingPosition(match.ballPossession.position);

  // Get the sum of the strength of all players in the opposing position from the opposing team
  const maxOpposingTeamStrength = opposingTeam.players
    .filter((p) => p.position === getPlayerPosition(opposingPosition))
    .reduce((acc, player) => acc + player.strength, 0);

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
    return;
  }

  // Otherwise, the ball possession is switched to the opposing team
  match.ballPossession.isHomeTeam = !match.ballPossession.isHomeTeam;
  match.ballPossession.position = opposingPosition;
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
  const maxTeamWithBallPossessionStrength = teamWithBallPossession.players
    .filter(
      (p) => p.position === getPlayerPosition(match.ballPossession.position)
    )
    .reduce((acc, player) => acc + player.strength, 0);

  // Get the opposing position
  const opposingPosition = getOpposingPosition(match.ballPossession.position);

  // Get the sum of the strength of all players in the opposing position from the opposing team
  const maxOpposingTeamStrength = opposingTeam.players
    .filter((p) => p.position === getPlayerPosition(opposingPosition))
    .reduce((acc, player) => acc + player.strength, 0);

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
  )
    return;

  // Otherwise, the possession is switched to the opposing team
  match.ballPossession.isHomeTeam = !match.ballPossession.isHomeTeam;
  match.ballPossession.position = opposingPosition;
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
      handleBallMovement(match, match.ballPossession.position);
      return;
    }

    if (randomNumber < 99) {
      // Pass the ball to the attacking area
      handleBallPassToNextArea(match, match.ballPossession.position);
      return;
    }

    // Shoot the ball to the goal
    handleBallShoot(
      match,
      match.ballPossession.position,
      time,
      setScorer,
      increaseScore
    );
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
      handleBallMovement(match, match.ballPossession.position);
      return;
    }

    if (randomNumber < 98) {
      // Pass the ball to the attacking area
      handleBallPassToNextArea(match, match.ballPossession.position);
      return;
    }

    // Shoot the ball to the goal
    handleBallShoot(
      match,
      match.ballPossession.position,
      time,
      setScorer,
      increaseScore
    );
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
      handleBallMovement(match);
      return;
    }

    if (randomNumber < 95) {
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
