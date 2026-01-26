import TeamJSONDTO from '../../core/data-transfer-objects/TeamJSONDTO';
import PlayerPosition from '../../core/enums/PlayerPosition';
import { Team } from '../../core/models/Team';
import { getRandomPlayerStrength } from '../../core/utils/Utils';

const filePath = '../../assets/teams/';

async function getTeam(internalName: string): Promise<Team | undefined> {
  try {
    const path = `${filePath}${internalName}.json`;
    const response = await fetch(path);

    if (!response.ok) {
      return undefined;
    }

    const teamJSONDTO = (await response.json()) as TeamJSONDTO;
    const mappedTeam: Team = {
      id: crypto.randomUUID(),
      fullName: teamJSONDTO.name,
      shortName: teamJSONDTO.shortName,
      abbreviation: teamJSONDTO.abbreviation,
      colors: {
        outline: teamJSONDTO.colors.outline,
        background: teamJSONDTO.colors.background,
        text: teamJSONDTO.colors.name,
      },
      players: teamJSONDTO.players.map((player) => ({
        id: crypto.randomUUID(),
        position: player.position as PlayerPosition,
        name: player.name,
        strength: getRandomPlayerStrength(teamJSONDTO.initialOverallStrength),
      })),
      morale: 50,
      isControlledByHuman: false,
    };

    return mappedTeam;
  } catch {
    return undefined;
  }
}

export default { getTeam };
