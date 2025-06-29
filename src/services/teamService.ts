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
  const homeTeam: Team = {
    ...homeTeamJson,
    substitutes: [],
    score: 0,
    isHomeTeam: true,
  };
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

function loadVisitorTeam(visitorTeamJson: BaseTeam): Team {
  const visitorTeam: Team = {
    ...visitorTeamJson,
    substitutes: [],
    score: 0,
    isHomeTeam: false,
  };
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
  fileName: string;
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
          fileName: teamFileName,
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

export const loadSpecificTeam = async (
  championshipInternalName: string,
  teamFileName: string
): Promise<BaseTeam | null> => {
  try {
    const teamData = await import(
      `../assets/championship-teams/${championshipInternalName}/${teamFileName}.json`
    );
    const teamDataObj = teamData.default;

    const initialOverallStrength = teamDataObj.initialOverallStrength || 80;

    // Transform the team data to BaseTeam format
    return {
      id: crypto.randomUUID(),
      name: teamDataObj.name,
      shortName: teamDataObj.shortName,
      abbreviation: teamDataObj.abbreviation,
      colors: teamDataObj.colors,
      players: teamDataObj.players.map((player: any) => {
        // Calculate random strength based on team's initialOverallStrength
        const minStrength = Math.max(1, initialOverallStrength - 5);
        const maxStrength = Math.min(100, initialOverallStrength + 5);
        const randomStrength =
          Math.floor(Math.random() * (maxStrength - minStrength + 1)) +
          minStrength;

        return {
          ...player,
          id: crypto.randomUUID(),
          strength: randomStrength, // Set calculated strength
          mood: 100, // Default mood
        };
      }),
      morale: 100, // Default morale
      formation: '4-4-2', // Default formation
      overallMood: 100, // Default overall mood
      initialOverallStrength: initialOverallStrength,
    };
  } catch (error) {
    console.error(`Failed to load team ${teamFileName}:`, error);
    return null;
  }
};

export const loadAllTeamsExceptOne = async (
  championshipInternalName: string,
  excludedTeamFileName: string
): Promise<BaseTeam[]> => {
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

    const teams: BaseTeam[] = [];

    // Load each team's data except the excluded one
    for (const teamFileName of championship.teams) {
      if (teamFileName === excludedTeamFileName) {
        continue; // Skip the excluded team
      }

      try {
        const teamData = await import(
          `../assets/championship-teams/${championshipInternalName}/${teamFileName}.json`
        );
        const teamDataObj = teamData.default;

        const initialOverallStrength = teamDataObj.initialOverallStrength || 80;

        // Transform the team data to BaseTeam format
        const baseTeam: BaseTeam = {
          id: crypto.randomUUID(),
          name: teamDataObj.name,
          shortName: teamDataObj.shortName,
          abbreviation: teamDataObj.abbreviation,
          colors: teamDataObj.colors,
          players: teamDataObj.players.map((player: any) => {
            // Calculate random strength based on team's initialOverallStrength
            const minStrength = Math.max(1, initialOverallStrength - 5);
            const maxStrength = Math.min(100, initialOverallStrength + 5);
            const randomStrength =
              Math.floor(Math.random() * (maxStrength - minStrength + 1)) +
              minStrength;

            return {
              ...player,
              id: crypto.randomUUID(),
              strength: randomStrength, // Set calculated strength
              mood: 100, // Default mood
            };
          }),
          morale: 100, // Default morale
          formation: '4-4-2', // Default formation
          overallMood: 100, // Default overall mood
          initialOverallStrength: initialOverallStrength,
        };

        teams.push(baseTeam);
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

export interface SeasonMatch {
  id: string;
  round: number;
  homeTeam: BaseTeam;
  awayTeam: BaseTeam;
  isPlayed: boolean;
  homeTeamScore?: number;
  awayTeamScore?: number;
}

export interface SeasonRound {
  roundNumber: number;
  matches: SeasonMatch[];
}

export const generateSeasonMatchCalendar = (
  humanPlayerTeam: BaseTeam,
  teamsControlledAutomatically: BaseTeam[]
): SeasonRound[] => {
  // Combine all teams
  const allTeams = [humanPlayerTeam, ...teamsControlledAutomatically];

  // Shuffle the teams to ensure random match distribution
  const shuffledTeams = [...allTeams];
  for (let i = shuffledTeams.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledTeams[i], shuffledTeams[j]] = [shuffledTeams[j], shuffledTeams[i]];
  }

  const totalTeams = shuffledTeams.length;

  // Calculate number of rounds: (totalTeams * 2) - 2
  const totalRounds = totalTeams * 2 - 2;

  // Calculate matches per round: totalTeams / 2
  const matchesPerRound = totalTeams / 2;

  const seasonRounds: SeasonRound[] = [];

  // Generate rounds
  for (let round = 1; round <= totalRounds; round++) {
    const roundMatches: SeasonMatch[] = [];

    // For each round, create matches between teams
    // This is a simplified round-robin algorithm
    for (let i = 0; i < matchesPerRound; i++) {
      const homeTeamIndex = i;
      const awayTeamIndex = totalTeams - 1 - i;

      // Skip if we're trying to match a team with itself
      if (homeTeamIndex !== awayTeamIndex) {
        const homeTeam = shuffledTeams[homeTeamIndex];
        const awayTeam = shuffledTeams[awayTeamIndex];

        const match: SeasonMatch = {
          id: crypto.randomUUID(),
          round: round,
          homeTeam: homeTeam,
          awayTeam: awayTeam,
          isPlayed: false,
        };

        roundMatches.push(match);
      }
    }

    // Rotate teams for the next round (except the first team)
    if (round < totalRounds) {
      const teamsToRotate = shuffledTeams.slice(1);
      const lastTeam = teamsToRotate.pop();
      if (lastTeam) {
        teamsToRotate.unshift(lastTeam);
      }
      shuffledTeams.splice(1, shuffledTeams.length - 1, ...teamsToRotate);
    }

    seasonRounds.push({
      roundNumber: round,
      matches: roundMatches,
    });
  }

  return seasonRounds;
};

export const getCurrentRoundMatches = (
  seasonCalendar: SeasonRound[],
  currentRound: number,
  humanPlayerTeam: BaseTeam,
  humanPlayerMatchTeam?: MatchTeam
): { homeTeam: MatchTeam; visitorTeam: MatchTeam }[] => {
  // Find the current round
  const currentRoundData = seasonCalendar.find(
    (round) => round.roundNumber === currentRound
  );

  if (!currentRoundData) {
    // If round not found, return empty array
    return [];
  }

  // Transform season matches to MatchTeam format for MatchSimulator
  return currentRoundData.matches.map((seasonMatch) => {
    // Check if the human player's team is playing in this match
    const isHumanPlayerHome = seasonMatch.homeTeam.id === humanPlayerTeam.id;
    const isHumanPlayerAway = seasonMatch.awayTeam.id === humanPlayerTeam.id;

    // Transform home team
    let homeMatchTeam: MatchTeam;
    if (isHumanPlayerHome && humanPlayerMatchTeam) {
      // Use the human player's match team (with correct formation and players)
      homeMatchTeam = {
        ...humanPlayerMatchTeam,
        isHomeTeam: true,
      };
    } else {
      // Use automatic selection for AI teams
      homeMatchTeam = {
        ...seasonMatch.homeTeam,
        starters: getAutomaticStarters(seasonMatch.homeTeam.players),
        substitutes: getAutomaticSubstitutes(
          seasonMatch.homeTeam.players.filter(
            (player) =>
              !getAutomaticStarters(seasonMatch.homeTeam.players).some(
                (starter) => starter.id === player.id
              )
          )
        ),
        isHomeTeam: true,
        score: 0,
        morale: 100,
        overallMood: 100,
      };
    }

    // Transform away team
    let awayMatchTeam: MatchTeam;
    if (isHumanPlayerAway && humanPlayerMatchTeam) {
      // Use the human player's match team (with correct formation and players)
      awayMatchTeam = {
        ...humanPlayerMatchTeam,
        isHomeTeam: false,
      };
    } else {
      // Use automatic selection for AI teams
      awayMatchTeam = {
        ...seasonMatch.awayTeam,
        starters: getAutomaticStarters(seasonMatch.awayTeam.players),
        substitutes: getAutomaticSubstitutes(
          seasonMatch.awayTeam.players.filter(
            (player) =>
              !getAutomaticStarters(seasonMatch.awayTeam.players).some(
                (starter) => starter.id === player.id
              )
          )
        ),
        isHomeTeam: false,
        score: 0,
        morale: 100,
        overallMood: 100,
      };
    }

    return {
      homeTeam: homeMatchTeam,
      visitorTeam: awayMatchTeam,
    };
  });
};

const teamService = {
  getTeams,
  getBaseTeam,
  getOtherMatchTeams,
  loadTeamsForChampionship,
  loadSpecificTeam,
  loadAllTeamsExceptOne,
  generateSeasonMatchCalendar,
  getCurrentRoundMatches,
};

export default teamService;
