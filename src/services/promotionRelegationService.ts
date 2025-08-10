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

function handleChampionshipUpdateObject(
  championshipState: ChampionshipState,
  promotionChampionshipTeams: BaseTeam[],
  relegationChampionshipTeams: BaseTeam[],
  updatedCurrentChampionshipTeams: BaseTeam[]
): ChampionshipUpdate {
  let championshipUpdateObject = {} as ChampionshipUpdate;
  let seasonCalendar = [] as SeasonRound[];

  if (isHumanPlayerTeamPromoted(championshipState)) {
    const promotionChampionshipTeamsWithoutHumanTeam = promotionChampionshipTeams.filter(
      (t) => t.id !== championshipState.humanPlayerBaseTeam.id
    );

    seasonCalendar = generateSeasonMatchCalendar(
      championshipState.humanPlayerBaseTeam,
      promotionChampionshipTeamsWithoutHumanTeam
    );

    if (championshipState.promotionChampionship) {
      const previousChampionship = getChampionshipConfigFromState(
        championshipState,
        updatedCurrentChampionshipTeams
      );

      championshipUpdateObject = getNewChampionshipStateAttributes(
        championshipState,
        championshipState.promotionChampionship
      );
    }
  }

  if (isHumanPlayerTeamRelegated(championshipState)) {
    const relegationChampionshipTeamsWithoutHumanTeam = relegationChampionshipTeams.filter(
      (t) => t.id !== championshipState.humanPlayerBaseTeam.id
    );

    seasonCalendar = generateSeasonMatchCalendar(
      championshipState.humanPlayerBaseTeam,
      relegationChampionshipTeamsWithoutHumanTeam
    );

    if (championshipState.relegationChampionship) {
      const previousChampionship = getChampionshipConfigFromState(
        championshipState,
        updatedCurrentChampionshipTeams
      );

      championshipUpdateObject = getNewChampionshipStateAttributes(
        championshipState,
        championshipState.relegationChampionship
      );
    }
  }

  if (seasonCalendar.length === 0) {
    const updatedTeamsControlledAutomatically = updatedCurrentChampionshipTeams.filter(
      (t) => t.id !== championshipState.humanPlayerBaseTeam.id
    );

    seasonCalendar = generateSeasonMatchCalendar(
      championshipState.humanPlayerBaseTeam,
      updatedTeamsControlledAutomatically
    );
  }

  return championshipUpdateObject;
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

  const championshipUpdateObject = handleChampionshipUpdateObject(
    championshipState,
    promotionResult.promotionUpdatedTeams!.promotionChampionshipTeams,
    relegationResult.relegationUpdatedTeams!.relegationChampionshipTeams,
    relegationResult.updatedCurrentChampionshipTeams
  );

  updateChampionshipState(championshipUpdateObject);
};
