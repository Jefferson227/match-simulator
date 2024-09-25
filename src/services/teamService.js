import homeTeamJson from '../assets/ceara.json';
import visitorTeamJson from '../assets/americarn.json';

function getTeams() {
  return {
    homeTeam: homeTeamJson,
    visitorTeam: visitorTeamJson,
  };
}

const teamService = { getTeams };

export default teamService;
