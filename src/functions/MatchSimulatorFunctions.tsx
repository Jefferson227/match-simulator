import Team from '../interfaces/Team';
import homeTeam from '../assets/ceara.json';
import visitorTeam from '../assets/fortaleza.json';

function loadHomeTeam(): Team {
  return homeTeam as Team;
}

function loadVisitorTeam(): Team {
  return visitorTeam as Team;
}

const MatchSimulatorFunctions = {
  loadHomeTeam,
  loadVisitorTeam,
};

export default MatchSimulatorFunctions;
