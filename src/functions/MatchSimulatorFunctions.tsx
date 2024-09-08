import Team from '../interfaces/Team';
import GoalScorer from '../interfaces/GoalScorer';
import Player from '../interfaces/Player';
import homeTeamJson from '../assets/ceara.json';
import visitorTeamJson from '../assets/fortaleza.json';

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

function rollAction(
  time: number,
  homeTeam: Team,
  visitorTeam: Team,
  setHomeTeamScore: React.Dispatch<React.SetStateAction<number>>,
  setVisitorTeamScore: React.Dispatch<React.SetStateAction<number>>,
  setScorer: (goalScorer: GoalScorer) => void
) {
  // The sum of forces of all players in the team is multiplied by a random number returned
  // by the getRandomDecimal()
  let sumForcesHomeTeam = homeTeam.players.reduce(
    (accumulator, player) => accumulator + player.strength,
    0
  );
  let sumForcesVisitorTeam = visitorTeam.players.reduce(
    (accumulator, player) => accumulator + player.strength,
    0
  );

  // The calculated numbers from each team are compared, and the winner number is multiplied
  // by 0.021
  let calculatedForcesHomeTeam = sumForcesHomeTeam * getRandomDecimal(0.1);
  let calculatedForcesVisitorTeam =
    sumForcesVisitorTeam * getRandomDecimal(0.1);

  let winnerTeamParam = '';
  let winnerNumber = 0;
  let winnerCalculatedForces = 0;

  if (calculatedForcesHomeTeam > calculatedForcesVisitorTeam) {
    winnerTeamParam = 'home';
    winnerCalculatedForces = calculatedForcesHomeTeam;
  } else if (calculatedForcesHomeTeam < calculatedForcesVisitorTeam) {
    winnerTeamParam = 'visitor';
    winnerCalculatedForces = calculatedForcesVisitorTeam;
  }

  // If the result is greater or equals 20, the score is marked to the team with the winner number
  const multiplier = 1;
  winnerNumber = winnerCalculatedForces * multiplier;
  console.log(winnerNumber);

  if (winnerNumber < 5) {
    return;
  }

  // GK has no chance of scoring
  // DF has a chance of 2% of scoring
  // MF has a chance of 20% of scoring
  // FW has a chance of 88% of scoring
  let winnerTeam: Team | null = null;
  let setWinnerTeamScore: React.Dispatch<
    React.SetStateAction<number>
  > = () => {};

  switch (winnerTeamParam) {
    case 'home':
      winnerTeam = homeTeam;
      setWinnerTeamScore = setHomeTeamScore;
      break;
    case 'visitor':
      winnerTeam = visitorTeam;
      setWinnerTeamScore = setVisitorTeamScore;
      break;
  }

  let percentagePosition = getRandomDecimal(100);
  let scorer: Player | null = null;

  if (percentagePosition > 0 && percentagePosition <= 2) {
    scorer =
      winnerTeam?.players.filter((player) => player.position === 'DF')[0] ||
      null;
  } else if (percentagePosition > 2 && percentagePosition <= 20) {
    scorer =
      winnerTeam?.players.filter((player) => player.position === 'MF')[0] ||
      null;
  } else if (percentagePosition > 20 && percentagePosition <= 100) {
    scorer =
      winnerTeam?.players.filter((player) => player.position === 'FW')[0] ||
      null;
  }

  let goalScorer: GoalScorer = {
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

  rollAction(
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
