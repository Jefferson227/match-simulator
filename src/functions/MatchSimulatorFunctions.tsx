import Team from '../interfaces/Team';
import homeTeam from '../assets/ceara.json';
import visitorTeam from '../assets/fortaleza.json';

function loadHomeTeam(): Team {
  return homeTeam as Team;
}

function loadVisitorTeam(): Team {
  return visitorTeam as Team;
}

function clock(): void {
  // This function runs on every 'second' of the match
  // and is responsible for performing all actions in a space of
  // one second (corresponding to one minute in real life)
}

const MatchSimulatorFunctions = {
  loadHomeTeam,
  loadVisitorTeam,
  clock,
};

export default MatchSimulatorFunctions;
