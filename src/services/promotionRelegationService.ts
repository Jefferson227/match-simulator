import { ChampionshipState, ChampionshipUpdate } from '../reducers/types';
import { BaseTeam, ChampionshipConfig } from '../types';
import { generateSeasonMatchCalendar, SeasonRound } from './teamService';
import { PromotionResult, RelegationResult } from './types';
import {
  hasPromotionChampionship,
  hasRelegationChampionship,
  isHumanPlayerTeamPromoted,
  isHumanPlayerTeamRelegated,
  movePromotedTeamsToPromotionChampionship,
  moveRelegatedTeamsToRelegationChampionship,
  getNewChampionship,
  getChampionshipConfigFromState,
  getNewChampionshipStateAttributes,
} from './helpers/promotionRelegationHelper';

export const handlePromotionRelegationLogic = (
  updateChampionshipState: (championshipUpdateObject: ChampionshipUpdate) => void,
  championshipState: ChampionshipState
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

  // TODO: If a team is promoted from série B to série A, séries A and C get updated, but not série B, and it needs to be fixed
  const currentChampionship = championshipState;
  let promotionResult = {} as PromotionResult;
  let newPromotionChampionshipConfig: ChampionshipConfig | undefined;
  let updatedCurrentChampionshipTeams: BaseTeam[];

  if (hasPromotionChampionship(currentChampionship)) {
    promotionResult = movePromotedTeamsToPromotionChampionship(currentChampionship);
    updatedCurrentChampionshipTeams = [...promotionResult.currentChampionshipTeams];

    newPromotionChampionshipConfig = getNewChampionship(
      promotionResult.promotionChampionshipTeams,
      currentChampionship.otherChampionships,
      currentChampionship.promotionChampionship!
    );
  } else {
    updatedCurrentChampionshipTeams = [
      ...currentChampionship.teamsControlledAutomatically,
      currentChampionship.humanPlayerBaseTeam,
    ];
  }

  let relegationResult = {} as RelegationResult;
  let newRelegationChampionshipConfig: ChampionshipConfig | undefined;

  if (hasRelegationChampionship(currentChampionship)) {
    relegationResult = moveRelegatedTeamsToRelegationChampionship(
      currentChampionship,
      updatedCurrentChampionshipTeams
    );
    updatedCurrentChampionshipTeams = [...relegationResult.currentChampionshipTeams];

    newRelegationChampionshipConfig = getNewChampionship(
      relegationResult.relegationChampionshipTeams,
      currentChampionship.otherChampionships,
      currentChampionship.relegationChampionship!
    );
  } else {
    updatedCurrentChampionshipTeams = [
      ...currentChampionship.teamsControlledAutomatically,
      currentChampionship.humanPlayerBaseTeam,
    ];
  }

  let seasonCalendar: SeasonRound[] = [];
  let updatedTeamsControlledAutomatically: BaseTeam[] = [];
  let previousChampionship: ChampionshipConfig | undefined;
  let championshipUpdateObject = {} as ChampionshipUpdate;

  if (isHumanPlayerTeamPromoted(currentChampionship)) {
    const promotionChampionshipTeamsWithoutHumanTeam =
      promotionResult.promotionChampionshipTeams.filter(
        (t) => t.id !== currentChampionship.humanPlayerBaseTeam.id
      );

    seasonCalendar = generateSeasonMatchCalendar(
      currentChampionship.humanPlayerBaseTeam,
      promotionChampionshipTeamsWithoutHumanTeam
    );

    updatedTeamsControlledAutomatically = [...promotionChampionshipTeamsWithoutHumanTeam];

    if (currentChampionship.promotionChampionship) {
      previousChampionship = getChampionshipConfigFromState(
        currentChampionship,
        updatedCurrentChampionshipTeams
      );

      championshipUpdateObject = getNewChampionshipStateAttributes(
        currentChampionship,
        currentChampionship.promotionChampionship
      );
    }
  }

  if (isHumanPlayerTeamRelegated(currentChampionship)) {
    const relegationChampionshipTeamsWithoutHumanTeam =
      relegationResult.relegationChampionshipTeams.filter(
        (t) => t.id !== currentChampionship.humanPlayerBaseTeam.id
      );

    seasonCalendar = generateSeasonMatchCalendar(
      currentChampionship.humanPlayerBaseTeam,
      relegationChampionshipTeamsWithoutHumanTeam
    );

    updatedTeamsControlledAutomatically = [...relegationChampionshipTeamsWithoutHumanTeam];

    if (currentChampionship.relegationChampionship) {
      previousChampionship = getChampionshipConfigFromState(
        currentChampionship,
        updatedCurrentChampionshipTeams
      );

      championshipUpdateObject = getNewChampionshipStateAttributes(
        currentChampionship,
        currentChampionship.relegationChampionship
      );
    }
  }

  if (seasonCalendar.length === 0) {
    updatedTeamsControlledAutomatically = updatedCurrentChampionshipTeams.filter(
      (t) => t.id !== currentChampionship.humanPlayerBaseTeam.id
    );

    seasonCalendar = generateSeasonMatchCalendar(
      currentChampionship.humanPlayerBaseTeam,
      updatedTeamsControlledAutomatically
    );
  }

  updateChampionshipState({
    ...championshipUpdateObject,
    newPromotionChampionshipConfig,
    newRelegationChampionshipConfig,
    previousChampionship,
    updatedTeamsControlledAutomatically,
    seasonCalendar,
  });
};
