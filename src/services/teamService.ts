import cearaJson from '../assets/ceara.json';
import cearaTeamManagerJson from '../assets/ceara-team-manager.json';
import americaRnJson from '../assets/americarn.json';
import sampaioCorreaTeamManagerJson from '../assets/sampaio-correa-team-manager.json';
import fortalezaJson from '../assets/fortaleza.json';
import abcJson from '../assets/abc.json';
import { Team, Player, BaseTeam } from '../types';

function getTeams(matchNumber: number): { homeTeam: Team; visitorTeam: Team } {
  switch (matchNumber) {
    case 1:
      return {
        homeTeam: loadHomeTeam(cearaJson as Team),
        visitorTeam: loadVisitorTeam(fortalezaJson as Team),
      };
    case 2:
      return {
        homeTeam: loadHomeTeam(americaRnJson as Team),
        visitorTeam: loadVisitorTeam(abcJson as Team),
      };
    default:
      throw new Error(`Invalid match number: ${matchNumber}`);
  }
}

function transformToBaseTeam(jsonData: any): BaseTeam {
  return {
    id: crypto.randomUUID(),
    name: jsonData.name,
    abbreviation: jsonData.abbreviation,
    colors: jsonData.colors,
    players: jsonData.players.map((player: any) => ({
      ...player,
      id: crypto.randomUUID(),
      mood: 100, // Default mood
    })),
    morale: 100, // Default morale
    formation: '4-4-2', // Default formation
    overallMood: 100, // Default overall mood
    overallStrength: 0, // Will be calculated
    attackStrength: 0, // Will be calculated
    midfieldStrength: 0, // Will be calculated
    defenseStrength: 0, // Will be calculated
  };
}

function loadHomeTeam(homeTeamJson: Team): Team {
  const homeTeam = { ...homeTeamJson };
  homeTeam.players = homeTeam.players.map((player: Player, index: number) => {
    let column: number;
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

function loadVisitorTeam(visitorTeamJson: Team): Team {
  const visitorTeam = { ...visitorTeamJson };
  visitorTeam.players = visitorTeam.players.map(
    (player: Player, index: number) => {
      let column: number;
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
    }
  );
  return visitorTeam;
}

function getBaseTeam(): BaseTeam {
  return transformToBaseTeam(sampaioCorreaTeamManagerJson);
}

const teamService = { getTeams, getBaseTeam };

export default teamService;
