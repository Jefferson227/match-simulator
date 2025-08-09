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

function handlePromotion(championshipState: ChampionshipState): PromotionResult {
  if (!hasPromotionChampionship(championshipState)) {
    return {
      updatedCurrentChampionshipTeams: [
        ...championshipState.teamsControlledAutomatically,
        championshipState.humanPlayerBaseTeam,
      ],
    };
  }

  const promotionUpdatedTeams = movePromotedTeamsToPromotionChampionship(championshipState);
  const updatedCurrentChampionshipTeams = [...promotionUpdatedTeams.currentChampionshipTeams];
  const newPromotionChampionshipConfig = getNewChampionship(
    promotionUpdatedTeams.promotionChampionshipTeams!,
    championshipState.otherChampionships,
    championshipState.promotionChampionship!
  );

  return {
    newPromotionChampionshipConfig,
    promotionUpdatedTeams,
    updatedCurrentChampionshipTeams,
  };
}

function handleRelegation(
  championshipState: ChampionshipState,
  updatedCurrentChampionshipTeamsAfterPromotion: BaseTeam[]
): RelegationResult {
  if (!hasRelegationChampionship(championshipState)) {
    return {
      updatedCurrentChampionshipTeams: [
        ...championshipState.teamsControlledAutomatically,
        championshipState.humanPlayerBaseTeam,
      ],
    };
  }

  const relegationUpdatedTeams = moveRelegatedTeamsToRelegationChampionship(
    championshipState,
    updatedCurrentChampionshipTeamsAfterPromotion
  );
  const updatedCurrentChampionshipTeams = [...relegationUpdatedTeams.currentChampionshipTeams];
  const newRelegationChampionshipConfig = getNewChampionship(
    relegationUpdatedTeams.relegationChampionshipTeams,
    championshipState.otherChampionships,
    championshipState.relegationChampionship!
  );

  return {
    newRelegationChampionshipConfig,
    relegationUpdatedTeams,
    updatedCurrentChampionshipTeams,
  };
}

export const handlePromotionRelegationLogic = (
  updateChampionshipState: (championshipUpdateObject: ChampionshipUpdate) => void,
  championshipState: ChampionshipState
) => {
  const currentChampionship = championshipState;
  let newPromotionChampionshipConfig: ChampionshipConfig | undefined;
  let updatedCurrentChampionshipTeams: BaseTeam[];

  const promotionResult = handlePromotion(championshipState);
  const relegationResult = handleRelegation(
    championshipState,
    promotionResult.updatedCurrentChampionshipTeams
  );

  let seasonCalendar: SeasonRound[] = [];
  let updatedTeamsControlledAutomatically: BaseTeam[] = [];
  let previousChampionship: ChampionshipConfig | undefined;
  let championshipUpdateObject = {} as ChampionshipUpdate;

  if (isHumanPlayerTeamPromoted(currentChampionship)) {
    const promotionChampionshipTeamsWithoutHumanTeam =
      promotionResult.promotionUpdatedTeams!.promotionChampionshipTeams.filter(
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
        relegationResult.updatedCurrentChampionshipTeams
      );

      championshipUpdateObject = getNewChampionshipStateAttributes(
        currentChampionship,
        currentChampionship.promotionChampionship
      );
    }
  }

  if (isHumanPlayerTeamRelegated(currentChampionship)) {
    const relegationChampionshipTeamsWithoutHumanTeam =
      relegationResult.relegationUpdatedTeams!.relegationChampionshipTeams.filter(
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
        relegationResult.updatedCurrentChampionshipTeams
      );

      championshipUpdateObject = getNewChampionshipStateAttributes(
        currentChampionship,
        currentChampionship.relegationChampionship
      );
    }
  }

  if (seasonCalendar.length === 0) {
    updatedTeamsControlledAutomatically = relegationResult.updatedCurrentChampionshipTeams.filter(
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
