import Team from '../interfaces/Team';
import GoalScorer from '../interfaces/GoalScorer';
import homeTeamJson from '../assets/ceara.json';
import visitorTeamJson from '../assets/fortaleza.json';

let anyTeamHasScored = false;

function loadHomeTeam(): Team {
  return homeTeamJson as Team;
}

function loadVisitorTeam(): Team {
  return visitorTeamJson as Team;
}

function kickOff() {
  // The action to start or restart the match
  anyTeamHasScored = false;
}

function runActionsForPlayers(homeTeam: Team, visitorTeam: Team) {
  // The action run for all players in the field
  runActionForPlayerWithTheBall();
  runActionForPlayersWithoutTheBall();
}

function runActionForPlayerWithTheBall() {}

function runActionForPlayersWithoutTheBall() {}

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

  if (time === 0 || anyTeamHasScored) {
    kickOff();
  }

  runActionsForPlayers(homeTeam, visitorTeam);

  // Simulate match events (e.g., goals)
  if (time === 15) {
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
  }
}

const MatchSimulatorFunctions = {
  loadHomeTeam,
  loadVisitorTeam,
  tickClock,
};

export default MatchSimulatorFunctions;
