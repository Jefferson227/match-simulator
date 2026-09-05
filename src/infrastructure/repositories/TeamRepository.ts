import TeamJSONDTO from '../data-transfer-objects/TeamJSONDTO';
import PlayerPosition from '../../domain/enums/PlayerPosition';
import { Team } from '../../domain/models/Team';
import { getRandomPlayerStrength } from '../../domain/utils/Utils';
import LeagueType from '../../domain/enums/LeagueType';
import mensTeamsData from '../data/teams.json';
import womensTeamsData from '../data/teams-womens.json';

const teamsDataByLeagueType: Record<LeagueType, TeamJSONDTO[]> = {
  mens: mensTeamsData as TeamJSONDTO[],
  womens: womensTeamsData as TeamJSONDTO[],
};

// Cached per league type so the two seed files cannot cross-contaminate each other.
const teamsByLeagueType: Partial<Record<LeagueType, Record<string, TeamJSONDTO>>> = {};

function initTeams(leagueType: LeagueType): Record<string, TeamJSONDTO> {
  const nextTeamsByInternalName: Record<string, TeamJSONDTO> = {};
  for (const team of teamsDataByLeagueType[leagueType]) {
    nextTeamsByInternalName[team.internalName] = team;
  }

  teamsByLeagueType[leagueType] = nextTeamsByInternalName;
  return nextTeamsByInternalName;
}

function getTeam(internalName: string, leagueType: LeagueType = 'mens'): Team {
  const teamsByInternalName = teamsByLeagueType[leagueType] ?? initTeams(leagueType);

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
      xp: 0,
      isStarter: false,
      isSub: false,
    })),
    morale: 50,
    isControlledByHuman: false,
  };

  return mappedTeam;
}

export default { getTeam };
