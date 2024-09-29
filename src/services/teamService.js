import cearaJson from '../assets/ceara.json';
import americaRnJson from '../assets/americarn.json';
import fortalezaJson from '../assets/fortaleza.json';
import abcJson from '../assets/abc.json';

function getTeams(matchNumber) {
  switch (matchNumber) {
    case 1:
      return {
        homeTeam: cearaJson,
        visitorTeam: fortalezaJson,
      };
    case 2:
      return {
        homeTeam: americaRnJson,
        visitorTeam: abcJson,
      };
  }
}

const teamService = { getTeams };

export default teamService;
