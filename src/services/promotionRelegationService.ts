import { ChampionshipState, ChampionshipUpdate } from '../reducers/types';
import { BaseTeam, ChampionshipConfig } from '../types';
import { generateSeasonMatchCalendar } from './teamService';
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

function getChampionshipUpdateObject(
  championshipState: ChampionshipState,
  promotionOrRelegationTeams: BaseTeam[],
  updatedCurrentChampionshipTeams: BaseTeam[],
  isHumanPromotedOrRelegated: (championshipState: ChampionshipState) => boolean
): ChampionshipUpdate {
  if (!isHumanPromotedOrRelegated(championshipState)) return {} as ChampionshipUpdate;

  const promotionOrRelegationTeamsWithoutHumanTeam = promotionOrRelegationTeams.filter(
    (t) => t.id !== championshipState.humanPlayerBaseTeam.id
  );

  const updatedTeamsControlledAutomatically = [...promotionOrRelegationTeamsWithoutHumanTeam];

  const seasonCalendar = generateSeasonMatchCalendar(
    championshipState.humanPlayerBaseTeam,
    promotionOrRelegationTeamsWithoutHumanTeam
  );

  let championshipUpdateObject = {} as ChampionshipUpdate;
  let previousChampionship = {} as ChampionshipConfig;

  if (championshipState.promotionChampionship) {
    previousChampionship = getChampionshipConfigFromState(
      championshipState,
      updatedCurrentChampionshipTeams
    );

    championshipUpdateObject = getNewChampionshipStateAttributes(
      championshipState,
      championshipState.promotionChampionship
    );
  }

  return {
    ...championshipUpdateObject,
    seasonCalendar,
    previousChampionship,
    updatedTeamsControlledAutomatically,
  };
}

function getSeasonCalendarForCurrentChampionship(
  championshipState: ChampionshipState,
  updatedCurrentChampionshipTeams: BaseTeam[]
) {
  const updatedTeamsControlledAutomatically = updatedCurrentChampionshipTeams.filter(
    (t) => t.id !== championshipState.humanPlayerBaseTeam.id
  );

  return generateSeasonMatchCalendar(
    championshipState.humanPlayerBaseTeam,
    updatedTeamsControlledAutomatically
  );
}

function handleChampionshipUpdateObject(
  championshipState: ChampionshipState,
  promotionChampionshipTeams: BaseTeam[],
  relegationChampionshipTeams: BaseTeam[],
  updatedCurrentChampionshipTeams: BaseTeam[]
): ChampionshipUpdate {
  if (isHumanPlayerTeamPromoted(championshipState)) {
    return getChampionshipUpdateObject(
      championshipState,
      promotionChampionshipTeams,
      updatedCurrentChampionshipTeams,
      isHumanPlayerTeamPromoted
    );
  }

  if (isHumanPlayerTeamRelegated(championshipState)) {
    return getChampionshipUpdateObject(
      championshipState,
      relegationChampionshipTeams,
      updatedCurrentChampionshipTeams,
      isHumanPlayerTeamRelegated
    );
  }

  const seasonCalendar = getSeasonCalendarForCurrentChampionship(
    championshipState,
    updatedCurrentChampionshipTeams
  );

  return { seasonCalendar } as ChampionshipUpdate;
}

export const handlePromotionRelegationLogic = (
  updateChampionshipState: (championshipUpdateObject: ChampionshipUpdate) => void,
  championshipState: ChampionshipState
) => {
  const promotionResult = handlePromotion(championshipState);
  const relegationResult = handleRelegation(
    championshipState,
    promotionResult.updatedCurrentChampionshipTeams
  );

  let championshipUpdateObject = handleChampionshipUpdateObject(
    championshipState,
    promotionResult.promotionUpdatedTeams!.promotionChampionshipTeams,
    relegationResult.relegationUpdatedTeams!.relegationChampionshipTeams,
    relegationResult.updatedCurrentChampionshipTeams
  );

  updateChampionshipState({
    ...championshipUpdateObject,
    newPromotionChampionshipConfig: promotionResult.newPromotionChampionshipConfig,
    newRelegationChampionshipConfig: relegationResult.newRelegationChampionshipConfig,
  });
};
