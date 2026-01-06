import Standing from '../models/Standing';
import { Team } from '../models/Team';
import MatchContainer from '../models/MatchContainer';
import ChampionshipType from '../enums/ChampionshipType';

type ChampionshipDTO = {
  name: string;
  internalName: string;
  numberOfTeams: number;
  startingTeams: Team;
  standings: Standing[];
  matches: MatchContainer;
  type: ChampionshipType;
  hasTeamControlledByHuman: boolean;
};

export default ChampionshipDTO;
