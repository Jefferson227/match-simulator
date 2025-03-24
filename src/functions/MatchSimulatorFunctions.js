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

function getRandomDecimal(multiplier) {
  return parseFloat((Math.random() * multiplier).toFixed(2));
}

function tryInterception(match, player, opponentTeam, isShot = false) {
  const nearbyOpponent = opponentTeam.players.find(
    (op) =>
      (isShot ? op.position === 'DF' || op.position === 'GK' : true) &&
      Math.abs(op.fieldPosition.column - player.fieldPosition.column) <= 1 &&
      Math.abs(op.fieldPosition.row - player.fieldPosition.row) <= 1
  );

  if (nearbyOpponent) {
    const interceptionChance = getRandomDecimal(100);
    if (
      interceptionChance <
      (nearbyOpponent.strength / (player.strength + nearbyOpponent.strength)) *
        100
    ) {
      match.ball.possessedBy = {
        teamId: opponentTeam.id,
        playerId: nearbyOpponent.id,
      };
      match.ball.position = { ...nearbyOpponent.fieldPosition };
      return true;
    }
  }
  return false;
}

function processBallAction(match) {
  const { ball, homeTeam, visitorTeam } = match;
  const currentTeam =
    ball.possessedBy.teamId === homeTeam.id ? homeTeam : visitorTeam;
  const currentPlayer = currentTeam.players.find(
    (p) => p.id === ball.possessedBy.playerId
  );

  if (!currentPlayer) return; // Defensive guard

  const opponentTeam = currentTeam === homeTeam ? visitorTeam : homeTeam;
  const actionChance = getRandomDecimal(100) + currentPlayer.strength / 2;

  if (actionChance < 60) {
    // Interception check BEFORE pass
    const intercepted = tryInterception(match, currentPlayer, opponentTeam);
    if (intercepted) return;

    // Pass
    const teammates = currentTeam.players.filter(
      (p) => p.id !== currentPlayer.id
    );
    const receiver = teammates[Math.floor(Math.random() * teammates.length)];
    match.ball.possessedBy.playerId = receiver.id;
    match.ball.position = { ...receiver.fieldPosition };
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
      const opponentDefense =
        opponentTeam.players
          .filter((p) => p.position === 'DF' || p.position === 'GK')
          .reduce((acc, p) => acc + p.strength, 0) /
        opponentTeam.players.length;

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

function movePlayers(match) {
  const moveDirection = (player, teamType) => {
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

function endMatch() {
  // Placeholder for match end logic if needed
}

function tickClock(time, setScorer, matches, increaseScore) {
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
