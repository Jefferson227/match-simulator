import { ChampionshipState, ChampionshipUpdate } from '../../reducers/types';
import { BaseTeam, ChampionshipConfig, TableStanding } from '../../types';
import { SeasonRound } from '../teamService';
import { PromotionResult, RelegationResult, UpdatedTeams } from '../types';

function getTeamsByPerformance(
  championship: ChampionshipConfig,
  type: 'promotion' | 'relegation'
): BaseTeam[] {
  const teams: BaseTeam[] = championship.teamsControlledAutomatically || [];
  const teamCount =
    type === 'promotion' ? championship.promotionTeams : championship.relegationTeams;

  if (teams.length === 0 || !teamCount) return [];

  // Initialize win counters
  const winCounts: Record<string, number> = {};
  teams.forEach((team) => {
    winCounts[team.abbreviation] = 0;
  });

  // Each team plays every other team twice
  for (let i = 0; i < teams.length; i++) {
    for (let j = 0; j < teams.length; j++) {
      if (i === j) continue;
      const teamA = teams[i];
      const teamB = teams[j];

      // Calculate average strength for each team from all players
      const teamAAverageStrength =
        teamA.players.length > 0
          ? teamA.players.reduce((sum, player) => sum + player.strength, 0) / teamA.players.length
          : 0;
      const teamBAverageStrength =
        teamB.players.length > 0
          ? teamB.players.reduce((sum, player) => sum + player.strength, 0) / teamB.players.length
          : 0;

      // Play two matches (home and away)
      for (let match = 0; match < 2; match++) {
        let winner: BaseTeam | null = null;
        while (!winner) {
          const scoreA = Math.floor(Math.random() * (teamAAverageStrength + 1));
          const scoreB = Math.floor(Math.random() * (teamBAverageStrength + 1));
          if (scoreA > scoreB) {
            winner = teamA;
          } else if (scoreB > scoreA) {
            winner = teamB;
          }
          // If tie, repeat
        }
        winCounts[winner.abbreviation] += 1;
      }
    }
  }

  // Sort teams by win count (ascending for relegation, descending for promotion)
  const sortedTeams = [...teams].sort((a, b) => {
    if (type === 'promotion') {
      return winCounts[b.abbreviation] - winCounts[a.abbreviation]; // Most wins first
    } else {
      return winCounts[a.abbreviation] - winCounts[b.abbreviation]; // Fewest wins first
    }
  });

  // Return the appropriate number of teams
  return sortedTeams.slice(0, teamCount);
}

function removeTeamsFromChampionship(championshipTeams: BaseTeam[], teamsToRemove: BaseTeam[]) {
  const teamsToRemoveIds = teamsToRemove.map((team) => team.id);
  return championshipTeams.filter((team) => !teamsToRemoveIds.includes(team.id));
}

function getPromotionChampionship(currentChampionship: ChampionshipState): ChampionshipConfig {
  return currentChampionship.otherChampionships.find(
    (champ: ChampionshipConfig) => champ.internalName === currentChampionship.promotionChampionship!
  )!;
}

function getRelegationChampionship(currentChampionship: ChampionshipState): ChampionshipConfig {
  return currentChampionship.otherChampionships.find(
    (champ: ChampionshipConfig) =>
      champ.internalName === currentChampionship.relegationChampionship!
  )!;
}

function getRelegatedTeams(championship: ChampionshipConfig): BaseTeam[] {
  return getTeamsByPerformance(championship, 'relegation');
}

function getRelegatedTeamsFromCurrentChampionship(
  championship: ChampionshipState,
  updateChampionshipTeams: BaseTeam[]
): BaseTeam[] {
  if (!championship.relegationTeams || championship.relegationTeams === 0) return [];

  const relegatedTeamsIds: string[] = championship.tableStandings
    .slice(championship.tableStandings.length - championship.relegationTeams)
    .map((t: TableStanding) => t.teamId);

  return updateChampionshipTeams.filter((t: BaseTeam) => relegatedTeamsIds.includes(t.id));
}

function getPromotedTeamsFromOtherChampionship(championship: ChampionshipConfig): BaseTeam[] {
  return getTeamsByPerformance(championship, 'promotion');
}

function getPromotedTeamsFromCurrentChampionship(championship: ChampionshipState): BaseTeam[] {
  if (!championship.promotionTeams || championship.promotionTeams === 0) return [];

  const promotedTeamsIds: string[] = championship.tableStandings
    .slice(0, championship.promotionTeams)
    .map((t: TableStanding) => t.teamId);

  return championship.teamsControlledAutomatically.filter((t: BaseTeam) =>
    promotedTeamsIds.includes(t.id)
  );
}

export const isHumanPlayerTeamPromoted = (championship: ChampionshipState): boolean => {
  if (!championship?.promotionTeams) return false;

  const humanPlayerPosition =
    championship.tableStandings.findIndex(
      (standing) => standing.teamId === championship.humanPlayerBaseTeam?.id
    ) + 1; // +1 because array index is 0-based but position is 1-based

  return humanPlayerPosition <= championship.promotionTeams;
};

export const isHumanPlayerTeamRelegated = (championship: ChampionshipState): boolean => {
  if (!championship?.relegationTeams) return false;

  const humanPlayerPosition =
    championship.tableStandings.findIndex(
      (standing) => standing.teamId === championship.humanPlayerBaseTeam?.id
    ) + 1; // +1 because array index is 0-based but position is 1-based

  const championshipTeamsCount = championship.tableStandings.length;
  return humanPlayerPosition > championshipTeamsCount - championship.relegationTeams;
};

export const hasPromotionChampionship = (championship: ChampionshipState): boolean => {
  return championship.promotionChampionship !== undefined;
};

export const hasRelegationChampionship = (championship: ChampionshipState): boolean => {
  return championship.relegationChampionship !== undefined;
};

export const movePromotedTeamsToPromotionChampionship = (
  currentChampionship: ChampionshipState
): UpdatedTeams => {
  /**
   * - If the human player team is among the promoted teams:
   *   - Get the promoted teams (without the human player team) from the current championship
   *   - Get the relegated teams from the promotion championship
   *   - Get the teams from the promotion championship without the relegated teams
   *   - Get the teams from the current championship without the promoted teams
   *   - Add the promoted teams from the current championship to the promotion championship
   *   - Add the relegated teams from the promotion championship to the current championship
   *   - Return a new object containing the updated teams from the promotion championship and the current championship
   * - If the human player team is not among the promoted teams:
   *   - Get the promoted teams from the current championship
   *   - Get the relegated teams from the promotion championship
   *   - Get the teams from the promotion championship without the relegated teams
   *   - Get the teams from the current championship without the promoted teams
   *   - Add the promoted teams from the current championship to the promotion championship
   *   - Add the relegated teams from the promotion championship to the current championship
   *   - Return a new object containing the updated teams from the promotion championship and the current championship
   */

  const promotedTeamsFromCurrentChampionship =
    getPromotedTeamsFromCurrentChampionship(currentChampionship);

  const promotionChampionship = getPromotionChampionship(currentChampionship);
  const relegatedTeamsFromPromotionChampionship = getRelegatedTeams(promotionChampionship);

  const teamsFromPromotionChampionshipWithoutRelegatedTeams = removeTeamsFromChampionship(
    promotionChampionship.teamsControlledAutomatically!,
    relegatedTeamsFromPromotionChampionship
  );
  const teamsFromCurrentChampionshipWithoutPromotedTeams = removeTeamsFromChampionship(
    currentChampionship.teamsControlledAutomatically!,
    promotedTeamsFromCurrentChampionship
  );
  const updatedPromotionChampionshipTeams = [
    ...teamsFromPromotionChampionshipWithoutRelegatedTeams,
    ...promotedTeamsFromCurrentChampionship,
  ];
  const updatedCurrentChampionshipTeams = [
    ...teamsFromCurrentChampionshipWithoutPromotedTeams,
    ...relegatedTeamsFromPromotionChampionship,
  ];
  return {
    promotionChampionshipTeams: updatedPromotionChampionshipTeams,
    relegationChampionshipTeams: [],
    currentChampionshipTeams: updatedCurrentChampionshipTeams,
  };
};

export const moveRelegatedTeamsToRelegationChampionship = (
  currentChampionship: ChampionshipState,
  currentChampionshipTeams: BaseTeam[]
): RelegationResult => {
  /**
   *   - Get the relegated teams from the current championship (don't include the human player team, if it's among the relegated teams)
   *   - Get the promoted teams from the relegation championship
   *   - Get the teams from the relegation championship without the promoted teams
   *   - Get the teams from the current championship without the relegated teams
   *   - Add the relegated teams from the current championship to the relegation championship
   *   - Add the promoted teams from the relegation championship to the current championship
   *   - Return a new object containing the updated teams from the relegation championship and the current championship
   */

  const relegatedTeamsFromCurrentChampionship = getRelegatedTeamsFromCurrentChampionship(
    currentChampionship,
    currentChampionshipTeams
  );

  const relegationChampionship = getRelegationChampionship(currentChampionship);
  const promotedTeamsFromRelegationChampionship =
    getPromotedTeamsFromOtherChampionship(relegationChampionship);

  const teamsFromRelegationChampionshipWithoutPromotedTeams = removeTeamsFromChampionship(
    relegationChampionship.teamsControlledAutomatically!,
    promotedTeamsFromRelegationChampionship
  );
  const teamsFromCurrentChampionshipWithoutRelegatedTeams = removeTeamsFromChampionship(
    currentChampionshipTeams,
    relegatedTeamsFromCurrentChampionship
  );
  const updatedRelegationChampionshipTeams = [
    ...teamsFromRelegationChampionshipWithoutPromotedTeams,
    ...relegatedTeamsFromCurrentChampionship,
  ];
  const updatedCurrentChampionshipTeams = [
    ...teamsFromCurrentChampionshipWithoutRelegatedTeams,
    ...promotedTeamsFromRelegationChampionship,
  ];
  return {
    relegationChampionshipTeams: updatedRelegationChampionshipTeams,
    currentChampionshipTeams: updatedCurrentChampionshipTeams,
  };
};

export const getNewChampionship = (
  championshipTeams: BaseTeam[],
  otherChampionships: ChampionshipConfig[],
  championshipName: string
) => {
  if (!championshipTeams) return;

  const newChampionship = otherChampionships.find(
    (championship) => championship.internalName === championshipName
  );

  return {
    ...newChampionship,
    teamsControlledAutomatically: championshipTeams,
  } as ChampionshipConfig;
};

export const getChampionshipConfigFromState = (
  championshipState: ChampionshipState,
  updatedChampionshipTeams: BaseTeam[]
) => {
  championshipState;
  const numberOfTeams = [
    ...championshipState.teamsControlledAutomatically,
    championshipState.humanPlayerBaseTeam,
  ].length;

  return {
    id: championshipState.championshipConfigId,
    name: championshipState.name,
    internalName: championshipState.selectedChampionship,
    numberOfTeams,
    promotionTeams: championshipState.promotionTeams,
    relegationTeams: championshipState.relegationChampionship,
    promotionChampionship: championshipState.promotionChampionship,
    relegationChampionship: championshipState.relegationChampionship,
    teamsControlledAutomatically: updatedChampionshipTeams,
  } as ChampionshipConfig;
};

export const getChampionshipFullName = (
  championshipState: ChampionshipState,
  internalName: string
) => {
  const championship = championshipState.otherChampionships.find(
    (t) => t.internalName === internalName
  );

  return championship?.name || '';
};

export const getNewChampionshipStateAttributes = (
  championshipState: ChampionshipState,
  championshipInternalName: string
): ChampionshipUpdate => {
  const championship = championshipState.otherChampionships.find(
    (t) => t.internalName === championshipInternalName
  );

  return {
    newSelectedChampionship: championship?.internalName || '',
    newChampionshipFullName: championship?.name || '',
    newPromotionChampionshipName: championship?.promotionChampionship || '',
    newRelegationChampionshipName: championship?.relegationChampionship || '',
    newPromotionTeams: championship?.promotionTeams,
    newRelegationTeams: championship?.relegationTeams,
    newPromotionChampionshipConfig: {} as ChampionshipConfig,
    newRelegationChampionshipConfig: {} as ChampionshipConfig,
    previousChampionship: {} as ChampionshipConfig,
    updatedTeamsControlledAutomatically: [] as BaseTeam[],
    seasonCalendar: [] as SeasonRound[],
  };
};
