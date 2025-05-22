import { Match, Player, Team, Scorer } from '../types';
import utils from '../utils/utils';
const { getRandomNumber } = utils;

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
      handleMidfieldBallMovement(match);
    } else if (randomNumber < 99) {
      // Pass the ball to the attacking area
    } else {
      // Shoot the ball to the goal
    }
  }

  function handleMidfieldBallMovement(match: Match): void {
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

    // Considering the home team has the ball possession and won the dispute, so the possession is maintained
    if (
      homeMidfieldStrengthForDispute >= visitorMidfieldStrengthForDispute &&
      match.ballPossession.isHomeTeam
    ) {
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

    // Considering the home team has the ball possession and lost the dispute, so the possession is switched to the visitor team
    if (
      homeMidfieldStrengthForDispute < visitorMidfieldStrengthForDispute &&
      match.ballPossession.isHomeTeam
    ) {
      match.ballPossession.isHomeTeam = false;
      return;
    }

    // Considering the visitor team has the ball possession and won the dispute, so the possession is maintained
    if (
      homeMidfieldStrengthForDispute < visitorMidfieldStrengthForDispute &&
      !match.ballPossession.isHomeTeam
    ) {
      return;
    }
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
