import homeTeamJson from '../assets/ceara.json';
import visitorTeamJson from '../assets/americarn.json';

function loadHomeTeam() {
  return homeTeamJson;
}

function loadVisitorTeam() {
  return visitorTeamJson;
}

function kickOff() {
  // The match starts
}

function endMatch() {
  // The match ends
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

  const calculatedForcesHomeTeam = getCalculatedForces(
    sumForces(homeTeam)
  );
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

  const players = team.players.filter(
    (player) => player.position === position
  );
  const randomIndex = Math.floor(getRandomDecimal(players.length));

  return players[randomIndex] || null;
}

function runAction(
  time,
  homeTeam,
  visitorTeam,
  setHomeTeamScore,
  setVisitorTeamScore,
  setScorer,
  matchId,
  increaseScore
) {
  // Any of the teams has a chance of scoring of 2.5%
  const percentage = getRandomDecimal(100);
  if (percentage >= 2.5) {
    return;
  }

  // Getting which team will score
  const scorerTeamParam = getScorerTeamParam(homeTeam, visitorTeam);
  if (scorerTeamParam === '') return;

  const scorerTeam = getScorerTeamData(
    scorerTeamParam,
    homeTeam,
    visitorTeam
  );

  // Getting the scorer in the scorer team
  const scorer = findScorer(scorerTeam);

  // Setting the scorer and updating the scoreboard
  const goalScorer = {
    playerName: scorer?.name || '',
    time: time,
  };

  setScorer(goalScorer);
  increaseScore(matchId, scorerTeam);
}

function getRandomDecimal(multiplier) {
  return parseFloat((Math.random() * multiplier).toFixed(2));
}

function tickClock(
  time,
  homeTeam,
  visitorTeam,
  setHomeTeamScore,
  setVisitorTeamScore,
  setScorer,
  matchId,
  increaseScore
) {
  // This function runs on every 'second' of the match
  // and is responsible for performing all actions in a space of
  // one second (corresponding to one minute in real life)

  if (time === 0) {
    kickOff();
  }

  runAction(
    time,
    homeTeam,
    visitorTeam,
    setHomeTeamScore,
    setVisitorTeamScore,
    setScorer,
    matchId,
    increaseScore
  );

  // Simulate match events (e.g., goals)
  /* if (time === 15) {
    const homeTeamScorer =
      homeTeam?.players[Math.floor(Math.random() * homeTeam.players.length)];

    if (homeTeamScorer) {
      const goalScorer = {
        playerName: homeTeamScorer.name,
        time,
      };

      setHomeTeamScore((prevScore) => prevScore + 1);
      setScorer(goalScorer);
    }
  } else if (time === 30) {
    const visitorTeamScorer =
      visitorTeam?.players[
        Math.floor(Math.random() * visitorTeam.players.length)
      ];

    if (visitorTeamScorer) {
      const goalScorer = {
        playerName: visitorTeamScorer.name,
        time,
      };

      setVisitorTeamScore((prevScore) => prevScore + 1);
      setScorer(goalScorer);
    }
  } */

  if (time === 90) {
    endMatch();
  }
}

const MatchSimulatorFunctions = {
  loadHomeTeam,
  loadVisitorTeam,
  tickClock,
};

export default MatchSimulatorFunctions;
