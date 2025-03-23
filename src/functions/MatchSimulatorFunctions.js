function kickOff(matches) {
  matches.forEach((match) => {
    const firstPossessor =
      match.homeTeam.players.find((p) => p.position === 'MF') ||
      match.homeTeam.players[0];
    match.ball = {
      possessedBy: { teamId: match.homeTeam.id, playerId: firstPossessor.id },
      position: { ...firstPossessor.fieldPosition },
    };
  });
}

function endMatch() {
  // The match ends
}

function processBallAction(match) {
  const { ball, homeTeam, visitorTeam } = match;
  const team = ball.possessedBy.teamId === homeTeam.id ? homeTeam : visitorTeam;
  const player = team.players.find((p) => p.id === ball.possessedBy.playerId);

  const actionChance = getRandomDecimal(100) + player.strength / 2;

  if (actionChance < 60) {
    // Pass
    const teammates = team.players.filter((p) => p.id !== player.id);
    const receiver = teammates[Math.floor(Math.random() * teammates.length)];
    match.ball.possessedBy.playerId = receiver.id;
    match.ball.position = { ...receiver.fieldPosition };
    // Opponent attempt to intercept or tackle
    const opponentTeam = team === homeTeam ? visitorTeam : homeTeam;
    const nearbyOpponent = opponentTeam.players.find(
      (op) =>
        Math.abs(op.fieldPosition.column - player.fieldPosition.column) <= 1 &&
        Math.abs(op.fieldPosition.row - player.fieldPosition.row) <= 1
    );

    if (nearbyOpponent) {
      const interceptionChance = getRandomDecimal(100);
      if (
        interceptionChance <
        (nearbyOpponent.strength /
          (player.strength + nearbyOpponent.strength)) *
          100
      ) {
        match.ball.possessedBy = {
          teamId: opponentTeam.id,
          playerId: nearbyOpponent.id,
        };
        match.ball.position = { ...nearbyOpponent.fieldPosition };
        return;
      }
    }
  } else if (actionChance < 85) {
    // Dribble forward
    if (team === homeTeam) {
      player.fieldPosition.column = Math.min(
        10,
        player.fieldPosition.column + 1
      );
    } else {
      player.fieldPosition.column = Math.max(
        1,
        player.fieldPosition.column - 1
      );
    }
    match.ball.position = { ...player.fieldPosition };
    // Opponent attempt to intercept or tackle
    const opponentTeam = team === homeTeam ? visitorTeam : homeTeam;
    const nearbyOpponent = opponentTeam.players.find(
      (op) =>
        Math.abs(op.fieldPosition.column - player.fieldPosition.column) <= 1 &&
        Math.abs(op.fieldPosition.row - player.fieldPosition.row) <= 1
    );

    if (nearbyOpponent) {
      const interceptionChance = getRandomDecimal(100);
      if (
        interceptionChance <
        (nearbyOpponent.strength /
          (player.strength + nearbyOpponent.strength)) *
          100
      ) {
        match.ball.possessedBy = {
          teamId: opponentTeam.id,
          playerId: nearbyOpponent.id,
        };
        match.ball.position = { ...nearbyOpponent.fieldPosition };
        return;
      }
    }
  } else {
    // Attempt shot if near opponent goal
    const nearGoal =
      team === homeTeam
        ? player.fieldPosition.column >= 9
        : player.fieldPosition.column <= 2;
    if (nearGoal) {
      const opponentTeam = team === homeTeam ? visitorTeam : homeTeam;

      // Check for interception by defenders
      const nearbyDefender = opponentTeam.players.find(
        (op) =>
          (op.position === 'DF' || op.position === 'GK') &&
          Math.abs(op.fieldPosition.column - player.fieldPosition.column) <=
            1 &&
          Math.abs(op.fieldPosition.row - player.fieldPosition.row) <= 1
      );

      if (nearbyDefender) {
        const interceptionChance = getRandomDecimal(100);
        if (
          interceptionChance <
          (nearbyDefender.strength /
            (player.strength + nearbyDefender.strength)) *
            100
        ) {
          match.ball.possessedBy = {
            teamId: opponentTeam.id,
            playerId: nearbyDefender.id,
          };
          match.ball.position = { ...nearbyDefender.fieldPosition };
          return;
        }
      }

      // If no interception, attempt shot
      const opponentDefense =
        opponentTeam.players
          .filter((p) => p.position === 'DF' || p.position === 'GK')
          .reduce((acc, p) => acc + p.strength, 0) /
        opponentTeam.players.length;

      const success =
        getRandomDecimal(100) <
        (player.strength / (player.strength + opponentDefense)) * 100;
      if (success) {
        match.latestGoal = { scorerName: player.name };
      }
    }
  }
}

function movePlayers(match) {
  const moveDirection = (player, teamType) => {
    let columnChange = 0;

    if (player.position === 'DF') {
      // Defenders move slightly forward or backward within their zone
      columnChange = teamType === 'home' ? 1 : -1;
    } else if (player.position === 'MF') {
      // Midfielders can shift within midfield
      columnChange =
        getRandomDecimal(3) > 1.5 ? (teamType === 'home' ? 1 : -1) : 0;
    } else if (player.position === 'FW') {
      // Forwards move forward toward opponent's goal
      columnChange = teamType === 'home' ? 1 : -1;
    }

    // Update position, ensuring they stay within field limits
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

function getRandomDecimal(multiplier) {
  return parseFloat((Math.random() * multiplier).toFixed(2));
}

function tickClock(time, setScorer, matches, increaseScore) {
  // This function runs on every 'second' of the match
  // and is responsible for performing all actions in a space of
  // one second (corresponding to one minute in real life)

  if (time === 0) {
    kickOff(matches);
  }

  matches.forEach((match) => {
    movePlayers(match);
    processBallAction(match);
  });

  matches.forEach((match) => {
    if (match.latestGoal) {
      setScorer(match.id, { playerName: match.latestGoal.scorerName, time });
      increaseScore(
        match.id,
        match.homeTeam.players.find(
          (p) => p.name === match.latestGoal.scorerName
        )
          ? match.homeTeam
          : match.visitorTeam
      );
      delete match.latestGoal;
    }
  });

  if (time === 90) {
    endMatch();
  }
}

const MatchSimulatorFunctions = {
  tickClock,
};

export default MatchSimulatorFunctions;
