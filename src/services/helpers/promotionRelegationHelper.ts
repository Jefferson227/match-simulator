import { ChampionshipState } from '../../reducers/types/ChampionshipState';

export const hasPromotionChampionship = (championship: ChampionshipState): boolean => {
  return championship.promotionChampionship !== undefined;
};

export const hasRelegationChampionship = (championship: ChampionshipState): boolean => {
  return championship.relegationChampionship !== undefined;
};
