import { ChampionshipState, ChampionshipUpdate } from '../reducers/types';
import { BaseTeam, ChampionshipConfig } from '../types';
import { generateSeasonMatchCalendar } from './teamService';
import { PromotionResult, RelegationResult } from './types';
import utils from '../utils/utils';
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
      promotionChampionshipTeams: [],
      updatedCurrentChampionshipTeams: [
        ...championshipState.teamsControlledAutomatically,
        championshipState.humanPlayerBaseTeam,
      ],
    };
  }

  const promotionUpdatedTeams = movePromotedTeamsToPromotionChampionship(championshipState);
  const updatedCurrentChampionshipTeams = [...promotionUpdatedTeams.currentChampionshipTeams];
  const promotionChampionshipTeams = promotionUpdatedTeams.promotionChampionshipTeams || [];

  const newPromotionChampionshipConfig = getNewChampionship(
    promotionChampionshipTeams,
    championshipState.otherChampionships,
    championshipState.promotionChampionship!
  );

  return {
    newPromotionChampionshipConfig,
    promotionChampionshipTeams,
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
  promotionOrRelegationChampionshipName: string | undefined | null,
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

  if (!utils.isNullOrWhitespace(promotionOrRelegationChampionshipName)) {
    previousChampionship = getChampionshipConfigFromState(
      championshipState,
      updatedCurrentChampionshipTeams
    );

    championshipUpdateObject = getNewChampionshipStateAttributes(
      championshipState,
      promotionOrRelegationChampionshipName
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
      championshipState.promotionChampionship,
      isHumanPlayerTeamPromoted
    );
  }

  if (isHumanPlayerTeamRelegated(championshipState)) {
    return getChampionshipUpdateObject(
      championshipState,
      relegationChampionshipTeams,
      updatedCurrentChampionshipTeams,
      championshipState.relegationChampionship,
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
    promotionResult.promotionChampionshipTeams || [],
    relegationResult.relegationUpdatedTeams?.relegationChampionshipTeams || [],
    relegationResult.updatedCurrentChampionshipTeams
  );

  updateChampionshipState({
    ...championshipUpdateObject,
    newPromotionChampionshipConfig: promotionResult.newPromotionChampionshipConfig,
    newRelegationChampionshipConfig: relegationResult.newRelegationChampionshipConfig,
  });
};
