import ChampionshipType from '../enums/ChampionshipType';

type DTO = {
  id: string;
  name: string;
  internalName: string;
  numberOfTeams: number;
  promotionTeams?: number;
  relegationTeams?: number;
  promotionChampionship?: string;
  relegationChampionship?: string;
  type: ChampionshipType;
  teams?: string[];
};

type Promotable = {
  isPromotable: boolean;
  numberOfPromotedTeams: number;
  promotionChampionshipInternalName: string;
};

type Relegatable = {
  isRelegatable: boolean;
  numberOfRelegatedTeams: number;
  relegationChampionshipInternalName: string;
};

type PromotableFields = { isPromotable: false } | ({ isPromotable: true } & Promotable);

type RelegatableFields = { isRelegatable: false } | ({ isRelegatable: true } & Relegatable);

type ChampionshipJSONDTO = DTO & PromotableFields & RelegatableFields;

export default ChampionshipJSONDTO;
