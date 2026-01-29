import TeamJSONDTO from '../../core/data-transfer-objects/TeamJSONDTO';
import PlayerPosition from '../../core/enums/PlayerPosition';
import { Team } from '../../core/models/Team';
import { getRandomPlayerStrength } from '../../core/utils/Utils';
import teamsData from '../../assets/teams.json';

let teamsByInternalName: Record<string, TeamJSONDTO> = {};

function initTeams(): void {
  const nextTeamsByInternalName: Record<string, TeamJSONDTO> = {};
  for (const team of teamsData as TeamJSONDTO[]) {
    nextTeamsByInternalName[team.internalName] = team;
  }

  teamsByInternalName = nextTeamsByInternalName;
}

function getTeam(internalName: string): Team {
  if (Object.keys(teamsByInternalName).length === 0) initTeams();

  const teamJSONDTO = teamsByInternalName[internalName];
  if (!teamJSONDTO) throw new Error(`Team not found: ${internalName}.`);

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
