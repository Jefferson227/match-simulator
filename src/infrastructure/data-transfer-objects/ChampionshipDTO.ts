import Standing from '../../domain/models/Standing';
import { Team } from '../../domain/models/Team';
import MatchContainer from '../../domain/models/MatchContainer';
import ChampionshipType from '../../domain/enums/ChampionshipType';

type ChampionshipDTO = {
  name: string;
  internalName: string;
  numberOfTeams: number;
  startingTeams: Team;
  standings: Standing[];
  matchContainer: MatchContainer;
  type: ChampionshipType;
  hasTeamControlledByHuman: boolean;
};

export default ChampionshipDTO;
