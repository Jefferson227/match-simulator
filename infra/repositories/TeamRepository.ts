import TeamJSONDTO from '../../core/data-transfer-objects/TeamJSONDTO';
import { Team } from '../../core/models/Team';

const filePath = '../../assets/teams/';

async function getTeam(internalName: string): Promise<Team | undefined> {
  try {
    const path = `${filePath}${internalName}.json`;
    const response = await fetch(path);

    if (!response.ok) {
      return undefined;
    }

    const teamJSONDTO = (await response.json()) as TeamJSONDTO;
    // TODO: Map teamJSONDTO into Team
    const mappedTeam = {} as Team;

    return mappedTeam;
  } catch {
    return undefined;
  }
}

export default { getTeam };
