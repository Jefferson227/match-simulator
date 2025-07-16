import { BaseTeam, ChampionshipConfig } from '../types';
import { generateSeasonMatchCalendar } from './teamService';

interface PromotionRelegationContext {
  setTeamsControlledAutomatically: (teams: BaseTeam[]) => void;
  setSeasonMatchCalendar: (calendar: any) => void;
  setChampionship: (championship: string) => void;
  addOrUpdateOtherChampionship: (championship: ChampionshipConfig) => void;
}

function getRelegatedTeamsAutomatically(championship: ChampionshipConfig): BaseTeam[] {
  const teams: BaseTeam[] = championship.teamsControlledAutomatically || [];
  if (teams.length === 0 || !championship.relegationTeams) return [];

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
      // Play two matches (home and away)
      for (let match = 0; match < 2; match++) {
        let winner: BaseTeam | null = null;
        while (!winner) {
          const scoreA = Math.floor(Math.random() * (teamA.initialOverallStrength + 1));
          const scoreB = Math.floor(Math.random() * (teamB.initialOverallStrength + 1));
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

  // Sort teams by win count ascending (fewest wins first)
  const sortedTeams = [...teams].sort(
    (a, b) => winCounts[a.abbreviation] - winCounts[b.abbreviation]
  );
  // Return the teams with the fewest wins (relegationTeams)
  return sortedTeams.slice(0, championship.relegationTeams);
}

function getPromotedTeamsAutomatically(championship: ChampionshipConfig): BaseTeam[] {
  const teams: BaseTeam[] = championship.teamsControlledAutomatically || [];
  if (teams.length === 0 || !championship.promotionTeams) return [];

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
      // Play two matches (home and away)
      for (let match = 0; match < 2; match++) {
        let winner: BaseTeam | null = null;
        while (!winner) {
          const scoreA = Math.floor(Math.random() * (teamA.initialOverallStrength + 1));
          const scoreB = Math.floor(Math.random() * (teamB.initialOverallStrength + 1));
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

  // Sort teams by win count descending (most wins first)
  const sortedTeams = [...teams].sort(
    (a, b) => winCounts[b.abbreviation] - winCounts[a.abbreviation]
  );
  // Return the teams with the most wins (promotionTeams)
  return sortedTeams.slice(0, championship.promotionTeams);
}

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

  // Get the teams from the promotion championship without the relegated teams
  const promotionChampionshipTeams = promotionChampionship?.teamsControlledAutomatically;

  // Remove the relegated teams from the promotion championship
  const promotionChampionshipWithoutRelegatedTeams = promotionChampionshipTeams?.slice(
    0,
    promotionChampionshipTeams?.length - (currentChamp?.promotionTeams ?? 0)
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

  // Get the relegated teams from the promotion championship
  const relegatedTeamsFromPromotionChampionship =
    promotionChampionshipTeams?.slice(-(promotionChampionship?.relegationTeams ?? 0)) ?? [];

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
  const promotedTeamsFromRelegationChampionship =
    relegationChampionshipTeams?.slice(0, relegationChampionship?.promotionTeams ?? 0) ?? [];

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
  const remainingTeamsFromRelegationChampionship =
    relegationChampionshipTeams
      ?.filter(
        (t: BaseTeam) =>
          !promotedTeamsFromRelegationChampionship
            .map((promotedTeam: BaseTeam) => promotedTeam.id)
            .includes(t.id)
      )
      .slice(-(relegationChampionship?.promotionTeams ?? 0)) ?? [];

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

  // Remove the promoted teams from the relegation championship
  const relegationChampionshipWithoutPromotedTeams = relegationChampionshipTeams?.slice(
    0,
    relegationChampionshipTeams?.length - (relegationChampionship?.promotionTeams ?? 0)
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

  // Get the promoted teams from the relegation championship
  const promotedTeamsFromRelegationChampionship =
    relegationChampionshipTeams?.slice(0, relegationChampionship?.promotionTeams ?? 0) ?? [];

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
  const relegatedTeamsFromPromotionChampionship =
    promotionChampionshipTeams?.slice(-(promotionChampionship?.relegationTeams ?? 0)) ?? [];

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
  // Get the abbreviations of the relegated teams from the current championship
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

  // Load all teams from the promotion championship from the context
  const promotionChampionship = championshipState.otherChampionships.find(
    (champ: ChampionshipConfig) => champ.internalName === currentChamp.promotionChampionship
  );

  // Get the teams from the promotion championship without the relegated teams
  const promotionChampionshipTeams = promotionChampionship?.teamsControlledAutomatically;

  // Get the relegated teams from the promotion championship
  const relegatedTeamsFromPromotionChampionship =
    promotionChampionshipTeams?.slice(-(promotionChampionship?.relegationTeams ?? 0)) ?? [];

  // Get the relegation championship from the context
  const relegationChampionship = championshipState.otherChampionships.find(
    (champ: ChampionshipConfig) => champ.internalName === currentChamp.relegationChampionship
  );

  // Get the teams from the relegation championship
  const relegationChampionshipTeams = relegationChampionship?.teamsControlledAutomatically;

  // Get the promoted teams from the relegation championship
  const promotedTeamsFromRelegationChampionship =
    relegationChampionshipTeams?.slice(0, relegationChampionship?.promotionTeams ?? 0) ?? [];

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

  // Get the remaining teams from the relegation championship, not including the promoted teams
  const remainingTeamsFromRelegationChampionship =
    relegationChampionshipTeams
      ?.filter(
        (t: BaseTeam) =>
          !promotedTeamsFromRelegationChampionship
            .map((promotedTeam: BaseTeam) => promotedTeam.id)
            .includes(t.id)
      )
      .slice(-(relegationChampionship?.promotionTeams ?? 0)) ?? [];

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
