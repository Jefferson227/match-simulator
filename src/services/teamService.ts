import cearaJson from '../assets/ceara.json';
import cearaTeamManagerJson from '../assets/ceara-team-manager.json';
import fortalezaTeamManagerJson from '../assets/fortaleza-team-manager.json';
import americaRnJson from '../assets/americarn.json';
import americaRnTeamManagerJson from '../assets/americarn-team-manager.json';
import sampaioCorreaTeamManagerJson from '../assets/sampaio-correa-team-manager.json';
import santaCruzTeamManagerJson from '../assets/santa-cruz-team-manager.json';
import amazonasTeamManagerJson from '../assets/amazonas-team-manager.json';
import fortalezaJson from '../assets/fortaleza.json';
import abcJson from '../assets/abc.json';
import { Team, Player, BaseTeam, MatchTeam } from '../types';
import matchService from './matchService';
import generalParameters from '../assets/general-parameters.json';

function getTeams(matchNumber: number): { homeTeam: Team; visitorTeam: Team } {
  switch (matchNumber) {
    case 1:
      return {
        homeTeam: loadHomeTeam(transformToBaseTeam(cearaJson)),
        visitorTeam: loadVisitorTeam(transformToBaseTeam(fortalezaJson)),
      };
    case 2:
      return {
        homeTeam: loadHomeTeam(transformToBaseTeam(americaRnJson)),
        visitorTeam: loadVisitorTeam(transformToBaseTeam(abcJson)),
      };
    default:
      throw new Error(`Invalid match number: ${matchNumber}`);
  }
}

function transformToBaseTeam(jsonData: any): BaseTeam {
  return {
    id: crypto.randomUUID(),
    name: jsonData.name,
    shortName: jsonData.shortName,
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
    initialOverallStrength: jsonData.initialOverallStrength || 80, // Default strength
  };
}

function loadHomeTeam(homeTeamJson: BaseTeam): Team {
  const homeTeam = { ...homeTeamJson } as Team;
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
  homeTeam.substitutes = [];
  homeTeam.score = 0;
  homeTeam.isHomeTeam = true;
  return homeTeam;
}

function loadVisitorTeam(visitorTeamJson: BaseTeam): Team {
  const visitorTeam = { ...visitorTeamJson } as Team;
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
  visitorTeam.substitutes = [];
  visitorTeam.score = 0;
  visitorTeam.isHomeTeam = false;
  return visitorTeam;
}

function getBaseTeam(): BaseTeam {
  return transformToBaseTeam(cearaTeamManagerJson);
}

function getOtherMatchTeams(): MatchTeam[] {
  return [
    transformToMatchTeam(transformToBaseTeam(sampaioCorreaTeamManagerJson)),
    transformToMatchTeam(transformToBaseTeam(fortalezaTeamManagerJson)),
    transformToMatchTeam(transformToBaseTeam(americaRnTeamManagerJson)),
    transformToMatchTeam(transformToBaseTeam(santaCruzTeamManagerJson)),
    transformToMatchTeam(transformToBaseTeam(amazonasTeamManagerJson)),
  ];
}

function transformToMatchTeam(baseTeam: BaseTeam): MatchTeam {
  const starters = getAutomaticStarters(baseTeam.players);
  const substitutes = getAutomaticSubstitutes(
    baseTeam.players.filter(
      (player) => !starters.some((starter) => starter.id === player.id)
    )
  );

  return {
    ...baseTeam,
    starters: starters,
    substitutes: substitutes,
    isHomeTeam: false,
    score: 0,
    morale: 100,
    overallMood: 100,
  };
}

function getAutomaticStarters(players: Player[]): Player[] {
  // Get a random formation
  const formation = matchService.getRandomFormation();

  // Parse formation numbers
  const [defCount, midCount, fwdCount] = formation.split('-').map(Number);

  // Sort players by strength within each position
  const goalkeepers = players
    .filter((p) => p.position === 'GK')
    .sort((a, b) => b.strength - a.strength);
  const defenders = players
    .filter((p) => p.position === 'DF')
    .sort((a, b) => b.strength - a.strength);
  const midfielders = players
    .filter((p) => p.position === 'MF')
    .sort((a, b) => b.strength - a.strength);
  const forwards = players
    .filter((p) => p.position === 'FW')
    .sort((a, b) => b.strength - a.strength);

  // Select starters based on formation
  const starters: Player[] = [
    ...goalkeepers.slice(0, 1), // 1 GK
    ...defenders.slice(0, defCount), // Defenders based on formation
    ...midfielders.slice(0, midCount), // Midfielders based on formation
    ...forwards.slice(0, fwdCount), // Forwards based on formation
  ];

  return starters;
}

function getAutomaticSubstitutes(players: Player[]): Player[] {
  // Sort players by strength within each position
  const goalkeepers = players
    .filter((p) => p.position === 'GK')
    .sort((a, b) => b.strength - a.strength);
  const defenders = players
    .filter((p) => p.position === 'DF')
    .sort((a, b) => b.strength - a.strength);
  const midfielders = players
    .filter((p) => p.position === 'MF')
    .sort((a, b) => b.strength - a.strength);
  const forwards = players
    .filter((p) => p.position === 'FW')
    .sort((a, b) => b.strength - a.strength);

  // Get substitutes based on position
  const substitutes: Player[] = [
    ...goalkeepers.slice(0, 1), // 1 GK
    ...defenders.slice(0, 2), // 2 DF
    ...midfielders.slice(0, 2), // 2 MF
    ...forwards.slice(0, 2), // 2 FW
  ].filter((player) => player !== undefined); // Remove any undefined entries if we don't have enough players

  // Limit to 7 substitutes
  return substitutes.slice(0, 7);
}

export interface TeamSelectorTeam {
  name: string;
  colors: {
    bg: string;
    border: string;
    text: string;
  };
}

export const loadTeamsForChampionship = async (
  championshipInternalName: string
): Promise<TeamSelectorTeam[]> => {
  try {
    // Find the championship configuration
    const championship = generalParameters.championships.find(
      (champ) => champ.internalName === championshipInternalName
    );

    if (!championship || !championship.teams) {
      throw new Error(
        `Championship ${championshipInternalName} not found or has no teams`
      );
    }

    const teams: TeamSelectorTeam[] = [];

    // Load each team's data
    for (const teamFileName of championship.teams) {
      try {
        const teamData = await import(
          `../assets/championship-teams/${championshipInternalName}/${teamFileName}.json`
        );
        const teamDataObj = teamData.default;

        // Convert team colors to the format expected by TeamSelector
        teams.push({
          name: teamDataObj.shortName.toUpperCase(),
          colors: {
            bg: teamDataObj.colors.background,
            border: teamDataObj.colors.outline,
            text: teamDataObj.colors.name,
          },
        });
      } catch (error) {
        console.error(`Failed to load team ${teamFileName}:`, error);
        // Continue loading other teams even if one fails
      }
    }

    return teams;
  } catch (error) {
    console.error('Error loading teams:', error);
    throw error;
  }
};

const teamService = {
  getTeams,
  getBaseTeam,
  getOtherMatchTeams,
  loadTeamsForChampionship,
};

export default teamService;
