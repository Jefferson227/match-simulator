import Standing from '../../core/models/Standing';
import { Team } from '../../core/models/Team';
import MatchContainer from '../../core/models/MatchContainer';
import ChampionshipType from '../../core/enums/ChampionshipType';

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
