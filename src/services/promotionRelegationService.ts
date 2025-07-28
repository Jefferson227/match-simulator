import { ChampionshipState } from '../reducers/types';
import { BaseTeam, ChampionshipConfig } from '../types';
import { generateSeasonMatchCalendar, SeasonRound } from './teamService';
import { PromotionRelegationContext, PromotionResult, RelegationResult } from './types';
import {
  hasPromotionChampionship,
  hasRelegationChampionship,
  isHumanPlayerTeamPromoted,
  isHumanPlayerTeamRelegated,
  movePromotedTeamsToPromotionChampionship,
  moveRelegatedTeamsToRelegationChampionship,
} from './helpers/promotionRelegationHelper';

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

export const handlePromotionRelegationLogic = (
  context: PromotionRelegationContext,
  currentChamp: ChampionshipConfig,
  championshipState: ChampionshipState,
  standings: any[],
  humanPlayerTeam: BaseTeam
) => {
  /*
  # Main logic
  - If promotion championship doesn't exist, keep promoted teams from current championship in the same championship
  - If promotion championship exists:
    - Move promoted teams from current championship to promotion championship
    - Move relegated teams from promotion championship to current championship
  - If relegation championship doesn't exist, keep relegated teams from current championship in the same championship
  - If relegation championship exists:
    - Move relegated teams from current championship to relegation championship
    - Move promoted teams from relegation championship to current championship
  - If human player team was promoted, set promotion championship as the current championship
  - If human player team was relegated, set relegation championship as the current championship
  - If human player team was neither promoted nor relegated, set current championship as the current championship
  - Generate season match calendar for next season
  */
  /*
  # Pseudo code
  if (hasPromotionChampionship(currentChampionship)) {
    movePromotedTeamsToPromotionChampionship(currentChampionship);
    moveRelegatedTeamsToCurrentChampionship(promotionChampionship);
  }

  if (hasRelegationChampionship(currentChampionship)) {
    moveRelegatedTeamsToRelegationChampionship(currentChampionship);
    movePromotedTeamsToCurrentChampionship(relegationChampionship);
  }

  if (humanPlayerTeamWasPromoted) {
    setChampionship(currentChampionship, promotionChampionship);
  }

  if (humanPlayerTeamWasRelegated) {
    setChampionship(currentChampionship, relegationChampionship);
  }

  generateSeasonMatchCalendar(currentChampionship);
  */
  const currentChampionship = championshipState;
  let promotionResult = {} as PromotionResult;
  let relegationResult = {} as RelegationResult;

  if (hasPromotionChampionship(currentChampionship)) {
    promotionResult = movePromotedTeamsToPromotionChampionship(currentChampionship);
    // TODO: Run the addOrUpdateOtherChampionship for the promotion championship
  }

  if (hasRelegationChampionship(currentChampionship)) {
    relegationResult = moveRelegatedTeamsToRelegationChampionship(
      currentChampionship,
      promotionResult
    );
    // TODO: Run the addOrUpdateOtherChampionship for the relegation championship
  }

  // TODO: Replace this 4 by currentChampionship.promotionTeams
  let seasonCalendar: SeasonRound[] = [];
  if (isHumanPlayerTeamPromoted(currentChampionship, 4)) {
    context.setChampionship(currentChampionship.promotionChampionship!);
    seasonCalendar = generateSeasonMatchCalendar(
      humanPlayerTeam,
      promotionResult.promotionChampionshipTeams
    );
  }

  // TODO: Replace this 4 by currentChampionship.relegationTeams
  if (isHumanPlayerTeamRelegated(currentChampionship, 4)) {
    context.setChampionship(currentChampionship.relegationChampionship!);
    seasonCalendar = generateSeasonMatchCalendar(
      humanPlayerTeam,
      relegationResult.relegationChampionshipTeams
    );
  }

  context.setSeasonMatchCalendar(seasonCalendar);
};

export const handlePromotionLogic = (
  context: PromotionRelegationContext,
  currentChamp: ChampionshipConfig,
  championshipState: any,
  standings: any[],
  humanPlayerTeam: BaseTeam
) => {
  // Load all teams from the promotion championship from the context
  const promotionChampionship = championshipState.otherChampionships.find(
    (champ: ChampionshipConfig) => champ.internalName === currentChamp.promotionChampionship
  );

  if (promotionChampionship) {
    // Get the relegated teams from the promotion championship
    const relegatedTeamsFromPromotionChampionship = getTeamsByPerformance(
      promotionChampionship!,
      'relegation'
    );

    // Get the teams from the promotion championship
    const promotionChampionshipTeams = promotionChampionship?.teamsControlledAutomatically;

    // Remove the relegated teams from the promotion championship
    const promotionChampionshipWithoutRelegatedTeams = promotionChampionshipTeams?.filter(
      (t: BaseTeam) =>
        !relegatedTeamsFromPromotionChampionship.map((team) => team.id).includes(t.id)
    );

    // Get the abbreviations of the promoted teams from the current championship
    const promotedTeamsAbbreviations = standings
      .slice(0, currentChamp?.promotionTeams ?? 0)
      .map((t: any) => t.team);

    // Get the promoted teams from the current championship
    const promotedTeamsFromCurrentChampionship =
      championshipState.teamsControlledAutomatically.filter((t: BaseTeam) =>
        promotedTeamsAbbreviations.includes(t.abbreviation)
      );

    // Get the teams to be controlled automatically for the next season
    const teamsToBeControlledAutomatically = [
      ...(promotionChampionshipWithoutRelegatedTeams ?? []),
      ...promotedTeamsFromCurrentChampionship,
    ];

    // Update the context state with the teams to be controlled automatically for the next season
    context.setTeamsControlledAutomatically(teamsToBeControlledAutomatically);

    // Generate and set the season match calendar for the next season
    const seasonCalendar = generateSeasonMatchCalendar(
      humanPlayerTeam,
      teamsToBeControlledAutomatically
    );
    context.setSeasonMatchCalendar(seasonCalendar);

    // Get the relegated teams abbreviations from the current championship
    const relegatedTeamsAbbreviations = standings
      .slice(-(currentChamp?.relegationTeams ?? 0))
      .map((t: any) => t.team);

    // Get the remaining teams from the current championship, not considering the relegated teams and the promoted teams
    const remainingTeamsFromCurrentChampionship =
      championshipState.teamsControlledAutomatically.filter(
        (t: BaseTeam) =>
          !relegatedTeamsAbbreviations.includes(t.abbreviation) &&
          !promotedTeamsAbbreviations.includes(t.abbreviation)
      );

    // Get the relegation championship
    const relegationChampionship = championshipState.otherChampionships.find(
      (c: ChampionshipConfig) => c.internalName === currentChamp.relegationChampionship
    );

    // Get the teams from the relegation championship
    const relegationChampionshipTeams = relegationChampionship?.teamsControlledAutomatically;

    // Get the promoted teams from the relegation championship
    const promotedTeamsFromRelegationChampionship = getTeamsByPerformance(
      relegationChampionship!,
      'promotion'
    );

    // Gather the teams to be controlled automatically for the next season into a single array
    const adjustedTeamsToBeControlledAutomatically = [
      ...remainingTeamsFromCurrentChampionship,
      ...relegatedTeamsFromPromotionChampionship,
      ...promotedTeamsFromRelegationChampionship,
    ];

    // Create a new ChampionshipConfig object, as the current championship will be included in the otherChampionships array in the context
    const newChampionshipConfig = {
      ...currentChamp,
      teamsControlledAutomatically: adjustedTeamsToBeControlledAutomatically,
    };

    // Get the relegated teams from the current championship
    const relegatedTeamsFromCurrentChampionship =
      championshipState.teamsControlledAutomatically.filter((t: BaseTeam) =>
        relegatedTeamsAbbreviations.includes(t.abbreviation)
      );

    // Get the remaining teams from the relegation championship, not including the promoted teams
    const remainingTeamsFromRelegationChampionship = relegationChampionshipTeams?.filter(
      (t: BaseTeam) =>
        !promotedTeamsFromRelegationChampionship
          .map((promotedTeam: BaseTeam) => promotedTeam.id)
          .includes(t.id)
    );

    // Gather the teams to be controlled automatically to be set to the relegation championship
    const teamsToBeControlledAutomaticallyForRelegationChampionship = [
      ...remainingTeamsFromRelegationChampionship,
      ...relegatedTeamsFromCurrentChampionship,
    ];

    // Create a new ChampionshipConfig object for the relegation championship
    const newRelegationChampionshipConfig = {
      ...relegationChampionship!,
      teamsControlledAutomatically: teamsToBeControlledAutomaticallyForRelegationChampionship,
    };

    // Add the new ChampionshipConfig object in the context (championshipState.otherChampionships)
    context.addOrUpdateOtherChampionship(newChampionshipConfig);

    // Add the new ChampionshipConfig object for the relegation championship in the context (championshipState.otherChampionships)
    context.addOrUpdateOtherChampionship(newRelegationChampionshipConfig);

    // Set the promotion championship as the current championship
    if (currentChamp.promotionChampionship) {
      context.setChampionship(currentChamp.promotionChampionship);
    }

    return;
  }

  // In case there is no promotion championship
  // Get the relegated teams abbreviations from the current championship
  const relegatedTeamsAbbreviations = standings
    .slice(-(currentChamp?.relegationTeams ?? 0))
    .map((t: any) => t.team);

  // Get the remaining teams from the current championship, not considering the relegated teams
  const remainingTeamsFromCurrentChampionship =
    championshipState.teamsControlledAutomatically.filter(
      (t: BaseTeam) => !relegatedTeamsAbbreviations.includes(t.abbreviation)
    );

  // Get the relegation championship
  const relegationChampionship = championshipState.otherChampionships.find(
    (c: ChampionshipConfig) => c.internalName === currentChamp.relegationChampionship
  );

  // Get the promoted teams from the relegation championship
  const promotedTeamsFromRelegationChampionship = getTeamsByPerformance(
    relegationChampionship!,
    'promotion'
  );

  // Get the teams to be controlled automatically for the next season
  const teamsToBeControlledAutomatically = [
    ...remainingTeamsFromCurrentChampionship,
    ...promotedTeamsFromRelegationChampionship,
  ];

  // Update the context state with the teams to be controlled automatically for the next season
  context.setTeamsControlledAutomatically(teamsToBeControlledAutomatically);

  // Generate and set the season match calendar for the next season
  const seasonCalendar = generateSeasonMatchCalendar(
    humanPlayerTeam,
    teamsToBeControlledAutomatically
  );
  context.setSeasonMatchCalendar(seasonCalendar);

  // Get the teams from the relegation championship
  const relegationChampionshipTeams = relegationChampionship?.teamsControlledAutomatically;

  // Get the remaining teams from the relegation championship, not including the promoted teams
  const remainingTeamsFromRelegationChampionship = relegationChampionshipTeams?.filter(
    (t: BaseTeam) =>
      !promotedTeamsFromRelegationChampionship
        .map((promotedTeam: BaseTeam) => promotedTeam.id)
        .includes(t.id)
  );

  // Get the relegated teams from the current championship
  const relegatedTeamsFromCurrentChampionship =
    championshipState.teamsControlledAutomatically.filter((t: BaseTeam) =>
      relegatedTeamsAbbreviations.includes(t.abbreviation)
    );

  // Gather the teams to be controlled automatically to be set to the relegation championship
  const teamsToBeControlledAutomaticallyForRelegationChampionship = [
    ...remainingTeamsFromRelegationChampionship,
    ...relegatedTeamsFromCurrentChampionship,
  ];

  // Create a new ChampionshipConfig object for the relegation championship
  const newRelegationChampionshipConfig = {
    ...relegationChampionship!,
    teamsControlledAutomatically: teamsToBeControlledAutomaticallyForRelegationChampionship,
  };

  // Add the new ChampionshipConfig object for the relegation championship in the context (championshipState.otherChampionships)
  context.addOrUpdateOtherChampionship(newRelegationChampionshipConfig);
};

export const handleRelegationLogic = (
  context: PromotionRelegationContext,
  currentChamp: ChampionshipConfig,
  championshipState: any,
  standings: any[],
  humanPlayerTeam: BaseTeam
) => {
  // Get the relegation championship from the context
  const relegationChampionship = championshipState.otherChampionships.find(
    (champ: ChampionshipConfig) => champ.internalName === currentChamp.relegationChampionship
  );

  // Get all teams from the relegation championship
  const relegationChampionshipTeams = relegationChampionship?.teamsControlledAutomatically;

  // Get the promoted teams from the relegation championship
  const promotedTeamsFromRelegationChampionship = getTeamsByPerformance(
    relegationChampionship!,
    'promotion'
  );

  // Remove the promoted teams from the relegation championship
  const relegationChampionshipWithoutPromotedTeams = relegationChampionshipTeams?.filter(
    (t: BaseTeam) => !promotedTeamsFromRelegationChampionship.map((team) => team.id).includes(t.id)
  );

  // Get the abbreviations of the relegated teams from the current championship
  const relegatedTeamsAbbreviations = standings
    .slice(-(currentChamp?.relegationTeams ?? 0))
    .map((t: any) => t.team);

  // Get the relegated teams from the current championship
  const relegatedTeamsFromCurrentChampionship =
    championshipState.teamsControlledAutomatically.filter((t: BaseTeam) =>
      relegatedTeamsAbbreviations.includes(t.abbreviation)
    );

  // Get the teams to be controlled automatically for the next season
  const teamsToBeControlledAutomatically = [
    ...(relegationChampionshipWithoutPromotedTeams ?? []),
    ...relegatedTeamsFromCurrentChampionship,
  ];

  // Update the context state with the teams to be controlled automatically for the next season
  context.setTeamsControlledAutomatically(teamsToBeControlledAutomatically);

  // Generate and set the season match calendar for the next season
  const seasonCalendar = generateSeasonMatchCalendar(
    humanPlayerTeam,
    teamsToBeControlledAutomatically
  );
  context.setSeasonMatchCalendar(seasonCalendar);

  // Get the promoted teams abbreviations from the current championship
  const promotedTeamsAbbreviations = standings
    .slice(0, currentChamp?.promotionTeams ?? 0)
    .map((t: any) => t.team);

  // Get the remaining teams from the current championship, not considering the relegated teams and the promoted teams
  const remainingTeamsFromCurrentChampionship =
    championshipState.teamsControlledAutomatically.filter(
      (t: BaseTeam) =>
        !relegatedTeamsAbbreviations.includes(t.abbreviation) &&
        !promotedTeamsAbbreviations.includes(t.abbreviation)
    );

  // Get the promotion championship
  const promotionChampionship = championshipState.otherChampionships.find(
    (c: ChampionshipConfig) => c.internalName === currentChamp.promotionChampionship
  );

  // Get the teams from the promotion championship
  const promotionChampionshipTeams = promotionChampionship?.teamsControlledAutomatically;

  // Get the relegated teams from the promotion championship
  const relegatedTeamsFromPromotionChampionship = getTeamsByPerformance(
    promotionChampionship!,
    'relegation'
  );

  // Gather the teams to be controlled automatically for the next season into a single array
  const adjustedTeamsToBeControlledAutomatically = [
    ...remainingTeamsFromCurrentChampionship,
    ...relegatedTeamsFromPromotionChampionship,
    ...promotedTeamsFromRelegationChampionship,
  ];

  // Create a new ChampionshipConfig object, as the current championship will be included in the otherChampionships array in the context
  const newChampionshipConfig = {
    ...currentChamp,
    teamsControlledAutomatically: adjustedTeamsToBeControlledAutomatically,
  };

  // Get the promoted teams from the current championship
  const promotedTeamsFromCurrentChampionship =
    championshipState.teamsControlledAutomatically.filter((t: BaseTeam) =>
      promotedTeamsAbbreviations.includes(t.abbreviation)
    );

  // Get the remaining teams from the promotion championship, not including the relegated teams
  const remainingTeamsFromPromotionChampionship = promotionChampionshipTeams?.filter(
    (t: BaseTeam) =>
      !relegatedTeamsFromPromotionChampionship
        .map((relegatedTeam: BaseTeam) => relegatedTeam.id)
        .includes(t.id)
  );

  // Gather the teams to be controlled automatically to be set to the promotion championship
  const teamsToBeControlledAutomaticallyForPromotionChampionship = [
    ...remainingTeamsFromPromotionChampionship,
    ...promotedTeamsFromCurrentChampionship,
  ];

  // Create a new ChampionshipConfig object for the promotion championship
  const newPromotionChampionshipConfig = {
    ...promotionChampionship!,
    teamsControlledAutomatically: teamsToBeControlledAutomaticallyForPromotionChampionship,
  };

  // Add the new ChampionshipConfig object in the context (championshipState.otherChampionships)
  context.addOrUpdateOtherChampionship(newChampionshipConfig);

  // Add the new ChampionshipConfig object for the promotion championship in the context (championshipState.otherChampionships)
  context.addOrUpdateOtherChampionship(newPromotionChampionshipConfig);

  // Set the relegation championship as the current championship
  if (currentChamp.relegationChampionship) {
    context.setChampionship(currentChamp.relegationChampionship);
  }
};

export const handleNoPromotionAndNoRelegationLogic = (
  context: PromotionRelegationContext,
  currentChamp: ChampionshipConfig,
  championshipState: any,
  standings: any[],
  humanPlayerTeam: BaseTeam
) => {
  // Get the relegated teams abbreviations from the current championship
  const relegatedTeamsAbbreviations = standings
    .slice(-(currentChamp?.relegationTeams ?? 0))
    .map((t: any) => t.team);

  // Get the promoted teams abbreviations from the current championship
  const promotedTeamsAbbreviations = standings
    .slice(0, currentChamp?.promotionTeams ?? 0)
    .map((t: any) => t.team);

  // Get the remaining teams from the current championship, not considering the relegated teams and the promoted teams
  const remainingTeamsFromCurrentChampionship =
    championshipState.teamsControlledAutomatically.filter(
      (t: BaseTeam) =>
        !relegatedTeamsAbbreviations.includes(t.abbreviation) &&
        !promotedTeamsAbbreviations.includes(t.abbreviation)
    );

  // Get the promotion championship
  const promotionChampionship = championshipState.otherChampionships.find(
    (champ: ChampionshipConfig) => champ.internalName === currentChamp.promotionChampionship
  );

  // Get the relegated teams from the promotion championship
  const relegatedTeamsFromPromotionChampionship = getTeamsByPerformance(
    promotionChampionship!,
    'relegation'
  );

  // Get the relegation championship
  const relegationChampionship = championshipState.otherChampionships.find(
    (champ: ChampionshipConfig) => champ.internalName === currentChamp.relegationChampionship
  );

  // Get the promoted teams from the relegation championship
  const promotedTeamsFromRelegationChampionship = getTeamsByPerformance(
    relegationChampionship!,
    'promotion'
  );

  // Gather the teams to be controlled automatically for the next season into a single array
  const teamsToBeControlledAutomatically = [
    ...remainingTeamsFromCurrentChampionship,
    ...relegatedTeamsFromPromotionChampionship,
    ...promotedTeamsFromRelegationChampionship,
  ];

  // Update the context state with the teams to be controlled automatically for the next season
  context.setTeamsControlledAutomatically(teamsToBeControlledAutomatically);

  // Generate and set the season match calendar for the next season
  const seasonCalendar = generateSeasonMatchCalendar(
    humanPlayerTeam,
    teamsToBeControlledAutomatically
  );
  context.setSeasonMatchCalendar(seasonCalendar);

  // Get the relegated teams from the current championship
  const relegatedTeamsFromCurrentChampionship =
    championshipState.teamsControlledAutomatically.filter((t: BaseTeam) =>
      relegatedTeamsAbbreviations.includes(t.abbreviation)
    );

  // Get all teams from the relegation championship
  const relegationChampionshipTeams = relegationChampionship?.teamsControlledAutomatically;

  // Get the remaining teams from the relegation championship, not including the promoted teams
  const remainingTeamsFromRelegationChampionship = relegationChampionshipTeams?.filter(
    (t: BaseTeam) =>
      !promotedTeamsFromRelegationChampionship
        .map((promotedTeam: BaseTeam) => promotedTeam.id)
        .includes(t.id)
  );

  // Gather the teams to be controlled automatically to be set to the relegation championship
  const teamsToBeControlledAutomaticallyForRelegationChampionship = [
    ...remainingTeamsFromRelegationChampionship,
    ...relegatedTeamsFromCurrentChampionship,
  ];

  // Create a new ChampionshipConfig object for the relegation championship
  const newRelegationChampionshipConfig = {
    ...relegationChampionship!,
    teamsControlledAutomatically: teamsToBeControlledAutomaticallyForRelegationChampionship,
  };

  // Add the new ChampionshipConfig object for the relegation championship in the context (championshipState.otherChampionships)
  context.addOrUpdateOtherChampionship(newRelegationChampionshipConfig);

  // Get the promoted teams from the current championship
  const promotedTeamsFromCurrentChampionship =
    championshipState.teamsControlledAutomatically.filter((t: BaseTeam) =>
      promotedTeamsAbbreviations.includes(t.abbreviation)
    );

  // Get all teams from the promotion championship
  const promotionChampionshipTeams = promotionChampionship?.teamsControlledAutomatically;

  // Get the remaining teams from the promotion championship, not including the relegated teams
  const remainingTeamsFromPromotionChampionship = promotionChampionshipTeams?.filter(
    (t: BaseTeam) =>
      !relegatedTeamsFromPromotionChampionship
        .map((relegatedTeam: BaseTeam) => relegatedTeam.id)
        .includes(t.id)
  );

  // Gather the teams to be controlled automatically to be set to the promotion championship
  const teamsToBeControlledAutomaticallyForPromotionChampionship = [
    ...remainingTeamsFromPromotionChampionship,
    ...promotedTeamsFromCurrentChampionship,
  ];

  // Create a new ChampionshipConfig object for the promotion championship
  const newPromotionChampionshipConfig = {
    ...promotionChampionship!,
    teamsControlledAutomatically: teamsToBeControlledAutomaticallyForPromotionChampionship,
  };

  // Add the new ChampionshipConfig object for the promotion championship in the context (championshipState.otherChampionships)
  context.addOrUpdateOtherChampionship(newPromotionChampionshipConfig);
};
