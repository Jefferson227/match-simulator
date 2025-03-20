import cearaJson from '../assets/ceara.json';
import americaRnJson from '../assets/americarn.json';
import fortalezaJson from '../assets/fortaleza.json';
import abcJson from '../assets/abc.json';

function getTeams(matchNumber) {
  switch (matchNumber) {
    case 1:
      return {
        homeTeam: loadHomeTeam(cearaJson),
        visitorTeam: loadVisitorTeam(fortalezaJson),
      };
    case 2:
      return {
        homeTeam: loadHomeTeam(americaRnJson),
        visitorTeam: loadVisitorTeam(abcJson),
      };
  }
}

function loadHomeTeam(homeTeamJson) {
  const homeTeam = { ...homeTeamJson };
  homeTeam.players = homeTeam.players.map((player, index) => {
    let column;
    switch (player.position) {
      case 'GK':
        column = 1;
        break;
      case 'DF':
        column = 2;
        break;
      case 'MF':
        column = 4 + (index % 4); // spread MFs across center field
        break;
      case 'FW':
        column = 6 + (index % 2);
        break;
      default:
        column = 4;
    }
    return {
      ...player,
      fieldPosition: { row: (index % 5) + 1, column }, // rows 1 to 5
    };
  });
  return homeTeam;
}

function loadVisitorTeam(visitorTeamJson) {
  const visitorTeam = { ...visitorTeamJson };
  visitorTeam.players = visitorTeam.players.map((player, index) => {
    let column;
    switch (player.position) {
      case 'GK':
        column = 10;
        break;
      case 'DF':
        column = 9;
        break;
      case 'MF':
        column = 7 - (index % 4); // spread MFs across center field
        break;
      case 'FW':
        column = 5 - (index % 2);
        break;
      default:
        column = 7;
    }
    return {
      ...player,
      fieldPosition: { row: (index % 5) + 1, column },
    };
  });
  return visitorTeam;
}

const teamService = { getTeams };

export default teamService;
