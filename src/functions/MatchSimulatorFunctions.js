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

  const actionChance = getRandomDecimal(100);

  if (actionChance < 60) {
    // Pass
    const teammates = team.players.filter((p) => p.id !== player.id);
    const receiver = teammates[Math.floor(Math.random() * teammates.length)];
    match.ball.possessedBy.playerId = receiver.id;
    match.ball.position = { ...receiver.fieldPosition };
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
  } else {
    // Attempt shot if near opponent goal
    const nearGoal =
      team === homeTeam
        ? player.fieldPosition.column >= 9
        : player.fieldPosition.column <= 2;
    if (nearGoal) {
      const success = getRandomDecimal(100) < player.strength;
      if (success) {
        match.latestGoal = { scorerName: player.name };
      }
    }
  }
}

function getCalculatedForces(sumForces) {
  const random = getRandomDecimal(99);

  if (parseInt(random.toFixed(0)) % 2 === 0) {
    return sumForces * random;
  }

  return sumForces / random;
}

function getScorerTeamParam(homeTeam, visitorTeam) {
  const sumForces = (team) =>
    team.players.reduce((acc, player) => acc + player.strength, 0);

  const calculatedForcesHomeTeam = getCalculatedForces(sumForces(homeTeam));
  const calculatedForcesVisitorTeam = getCalculatedForces(
    sumForces(visitorTeam)
  );

  return calculatedForcesHomeTeam > calculatedForcesVisitorTeam
    ? 'home'
    : calculatedForcesHomeTeam < calculatedForcesVisitorTeam
    ? 'visitor'
    : '';
}

function getScorerTeamData(param, homeTeam, visitorTeam) {
  switch (param) {
    case 'home':
      return homeTeam;
    case 'visitor':
      return visitorTeam;
    default:
      return { team: null, setScore: () => {} };
  }
}

function findScorer(team) {
  if (!team) return null;

  const percentagePosition = getRandomDecimal(100);
  let position;

  if (percentagePosition <= 2) position = 'DF';
  else if (percentagePosition <= 10) position = 'MF';
  else position = 'FW';

  const players = team.players.filter((player) => player.position === position);
  const randomIndex = Math.floor(getRandomDecimal(players.length));

  return players[randomIndex] || null;
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

function runAction(time, setScorer, matches, increaseScore) {
  matches.forEach((match) => {
    // Any of the teams has a chance of scoring of 2.5%
    const percentage = getRandomDecimal(100);
    if (percentage >= 2.5) {
      return;
    }

    // Getting which team will score
    const scorerTeamParam = getScorerTeamParam(
      match.homeTeam,
      match.visitorTeam
    );
    if (scorerTeamParam === '') return;

    const scorerTeam = getScorerTeamData(
      scorerTeamParam,
      match.homeTeam,
      match.visitorTeam
    );

    // Getting the scorer in the scorer team
    const scorer = findScorer(scorerTeam);

    // Setting the scorer and updating the scoreboard
    const goalScorer = {
      playerName: scorer?.name || '',
      time: time,
    };

    setScorer(match.id, goalScorer);
    increaseScore(match.id, scorerTeam);
  });
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
  runAction(time, setScorer, matches, increaseScore);

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
