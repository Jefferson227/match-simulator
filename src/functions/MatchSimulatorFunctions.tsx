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

function getCalculatedForces(sumForces: number) {
  const random = getRandomDecimal(99);

  if (parseInt(random.toFixed(0)) % 2 === 0) {
    return sumForces * random;
  }

  return sumForces / random;
}

function rollAction(
  time: number,
  homeTeam: Team,
  visitorTeam: Team,
  setHomeTeamScore: React.Dispatch<React.SetStateAction<number>>,
  setVisitorTeamScore: React.Dispatch<React.SetStateAction<number>>,
  setScorer: (goalScorer: GoalScorer) => void
) {
  // Getting the sum of forces of all players from both teams
  let sumForcesHomeTeam = homeTeam.players.reduce(
    (accumulator, player) => accumulator + player.strength,
    0
  );
  let sumForcesVisitorTeam = visitorTeam.players.reduce(
    (accumulator, player) => accumulator + player.strength,
    0
  );

  // The forces for each team is calculated
  let calculatedForcesHomeTeam = getCalculatedForces(sumForcesHomeTeam);
  let calculatedForcesVisitorTeam = getCalculatedForces(sumForcesVisitorTeam);

  let winnerTeamParam = '';

  if (calculatedForcesHomeTeam > calculatedForcesVisitorTeam) {
    winnerTeamParam = 'home';
  } else if (calculatedForcesHomeTeam < calculatedForcesVisitorTeam) {
    winnerTeamParam = 'visitor';
  }

  // Each clock tick has a chance of 2.5% of scoring
  let percentage = getRandomDecimal(100);
  console.log(`home: ${calculatedForcesHomeTeam}`);
  console.log(`visitor: ${calculatedForcesVisitorTeam}`);
  console.log(`percentage: ${percentage}`);
  console.log(`winner: ${winnerTeamParam}`);
  console.log('');

  if (percentage >= 2.5) {
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
    let players = winnerTeam?.players.filter(
      (player) => player.position === 'DF'
    );
    let randomIndex = getRandomDecimal((players?.length || 1) - 1);
    let index = parseInt(randomIndex.toFixed(0));

    scorer = players ? players[index] : null;
  } else if (percentagePosition > 2 && percentagePosition <= 20) {
    let players = winnerTeam?.players.filter(
      (player) => player.position === 'MF'
    );
    let randomIndex = getRandomDecimal((players?.length || 1) - 1);
    let index = parseInt(randomIndex.toFixed(0));

    scorer = players ? players[index] : null;
  } else if (percentagePosition > 20 && percentagePosition <= 100) {
    let players = winnerTeam?.players.filter(
      (player) => player.position === 'MF'
    );
    let randomIndex = getRandomDecimal((players?.length || 1) - 1);
    let index = parseInt(randomIndex.toFixed(0));

    scorer = players ? players[index] : null;
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
