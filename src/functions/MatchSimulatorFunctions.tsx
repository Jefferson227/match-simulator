import Team from '../interfaces/Team';
import GoalScorer from '../interfaces/GoalScorer';
import Player from '../interfaces/Player';
import homeTeamJson from '../assets/ceara.json';
import visitorTeamJson from '../assets/americarn.json';

function loadHomeTeam(): Team {
  return homeTeamJson as Team;
}

function loadVisitorTeam(): Team {
  return visitorTeamJson as Team;
}

function kickOff() {
  // The match starts
}

function endMatch() {
  // The match ends
}

function getCalculatedForces(sumForces: number) {
  const random = getRandomDecimal(99);

  if (parseInt(random.toFixed(0)) % 2 === 0) {
    return sumForces * random;
  }

  return sumForces / random;
}

function getWinnerTeamParam(homeTeam: Team, visitorTeam: Team) {
  const sumForces = (team: Team) =>
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

function getWinnerTeamData(
  param: string,
  homeTeam: Team,
  visitorTeam: Team,
  setHomeTeamScore: React.Dispatch<React.SetStateAction<number>>,
  setVisitorTeamScore: React.Dispatch<React.SetStateAction<number>>
) {
  switch (param) {
    case 'home':
      return { team: homeTeam, setScore: setHomeTeamScore };
    case 'visitor':
      return { team: visitorTeam, setScore: setVisitorTeamScore };
    default:
      return { team: null, setScore: () => {} };
  }
}

function findScorer(team: Team | null): Player | null {
  if (!team) return null;

  const percentagePosition = getRandomDecimal(100);
  let position: string;

  if (percentagePosition <= 2) position = 'DF';
  else if (percentagePosition <= 10) position = 'MF';
  else position = 'FW';

  const players = team.players.filter((player) => player.position === position);
  const randomIndex = Math.floor(getRandomDecimal(players.length));

  return players[randomIndex] || null;
}

function runAction(
  time: number,
  homeTeam: Team,
  visitorTeam: Team,
  setHomeTeamScore: React.Dispatch<React.SetStateAction<number>>,
  setVisitorTeamScore: React.Dispatch<React.SetStateAction<number>>,
  setScorer: (goalScorer: GoalScorer) => void
) {
  // Any of the teams has a chance of scoring of 2.5%
  const percentage = getRandomDecimal(100);
  if (percentage >= 2.5) {
    return;
  }

  // Getting which team will score
  const winnerTeamParam = getWinnerTeamParam(homeTeam, visitorTeam);
  if (winnerTeamParam === '') return;

  const { team: winnerTeam, setScore: setWinnerTeamScore } = getWinnerTeamData(
    winnerTeamParam,
    homeTeam,
    visitorTeam,
    setHomeTeamScore,
    setVisitorTeamScore
  );

  // Getting the scorer in the scorer team
  const scorer = findScorer(winnerTeam);

  // Setting the scorer and updating the scoreboard
  const goalScorer: GoalScorer = {
    playerName: scorer?.name || '',
    time: time,
  };

  setScorer(goalScorer);
  setWinnerTeamScore((prevScore) => prevScore + 1);
}

function getRandomDecimal(multiplier: number): number {
  return parseFloat((Math.random() * multiplier).toFixed(2));
}

function tickClock(
  time: number,
  homeTeam: Team,
  visitorTeam: Team,
  setHomeTeamScore: React.Dispatch<React.SetStateAction<number>>,
  setVisitorTeamScore: React.Dispatch<React.SetStateAction<number>>,
  setScorer: (goalScorer: GoalScorer) => void
): void {
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
    setScorer
  );

  // Simulate match events (e.g., goals)
  /* if (time === 15) {
    const homeTeamScorer =
      homeTeam?.players[Math.floor(Math.random() * homeTeam.players.length)];

    if (homeTeamScorer) {
      const goalScorer: GoalScorer = {
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
      const goalScorer: GoalScorer = {
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
