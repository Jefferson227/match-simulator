import TeamJSONDTO from '../../core/data-transfer-objects/TeamJSONDTO';
import PlayerPosition from '../../core/enums/PlayerPosition';
import { Team } from '../../core/models/Team';
import { getRandomPlayerStrength } from '../../core/utils/Utils';
import { readFileSync } from 'fs';
import path from 'path';

const filePath = '../../assets/teams/';

function getTeam(internalName: string): Team | undefined {
  const resolvedPath = path.resolve(__dirname, filePath, `${internalName}.json`);
  const fileContents = readFileSync(resolvedPath, 'utf-8');
  const teamJSONDTO = JSON.parse(fileContents) as TeamJSONDTO;
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
}

export default { getTeam };
