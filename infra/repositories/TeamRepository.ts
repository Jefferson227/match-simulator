import TeamJSONDTO from '../../core/data-transfer-objects/TeamJSONDTO';
import PlayerPosition from '../../core/enums/PlayerPosition';
import { Team } from '../../core/models/Team';
import { getRandomPlayerStrength } from '../../core/utils/Utils';

// TODO: Refactor this part to get all teams from a single JSON file
const teamModules = import.meta.glob('../../assets/teams/*.json', { eager: true });
const teamsByInternalName = Object.entries(teamModules).reduce(
  (acc, [modulePath, moduleValue]) => {
    const match = /\/([^/]+)\.json$/.exec(modulePath);
    if (!match) return acc;

    acc[match[1]] = (moduleValue as { default: TeamJSONDTO }).default;
    return acc;
  },
  {} as Record<string, TeamJSONDTO>
);

function getTeam(internalName: string): Team | undefined {
  const teamJSONDTO = teamsByInternalName[internalName];
  if (!teamJSONDTO) return undefined;

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
