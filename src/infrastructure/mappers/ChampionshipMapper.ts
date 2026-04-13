import ChampionshipDTO from '../data-transfer-objects/ChampionshipDTO';
import { Championship } from '../../domain/models/Championship';

function toChampionshipDTO(championship: Championship): ChampionshipDTO {
  return {
    name: championship.name,
    internalName: championship.internalName,
    numberOfTeams: championship.numberOfTeams,
    startingTeams: championship.startingTeams,
    standings: championship.standings,
    matchContainer: championship.matchContainer,
    type: championship.type,
    hasTeamControlledByHuman: championship.hasTeamControlledByHuman,
  } as ChampionshipDTO;
}

export default { toChampionshipDTO };
