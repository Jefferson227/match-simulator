import TeamJSONDTO from '../data-transfer-objects/TeamJSONDTO';
import PlayerPosition from '../../domain/enums/PlayerPosition';
import { Team } from '../../domain/models/Team';
import Coach from '../../domain/models/Coach';
import { getRandomPlayerStrength } from '../../domain/utils/Utils';
import LeagueType from '../../domain/enums/LeagueType';
import {
  clampToScale,
  StrengthRange,
} from '../../domain/features/strength-progression/StrengthRange';
import { rollPlayerStrength } from '../../domain/features/strength-progression/SeedStrength';
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

function mapCoach(coach: NonNullable<TeamJSONDTO['coach']>): Coach {
  return {
    name: coach.name,
    age: coach.age,
    ...(coach.nationalities && { nationalities: [...coach.nationalities] }),
  };
}

function getTeamJSONDTO(internalName: string, leagueType: LeagueType): TeamJSONDTO {
  const teamsByInternalName = teamsByLeagueType[leagueType] ?? initTeams(leagueType);

  const teamJSONDTO = teamsByInternalName[internalName];
  if (!teamJSONDTO) throw new Error(`Team not found: ${internalName}.`);
  return teamJSONDTO;
}

/** The club's seed `initialOverallStrength`, which a division's ranges are mapped from. */
function getInitialOverallStrength(internalName: string, leagueType: LeagueType = 'mens'): number {
  return getTeamJSONDTO(internalName, leagueType).initialOverallStrength;
}

/**
 * Where a club's squad starts within its division (MS-115): every player is rolled around `target`
 * and kept inside `range`. See `features/strength-progression/SeedStrength.ts`.
 */
export type StartingStrength = { target: number; range: StrengthRange };

/**
 * A fresh copy of the club. With `startingStrength` its squad starts inside the division's range;
 * without it — a club outside the pyramid — every player is rolled around the seed strength.
 */
function getTeam(
  internalName: string,
  leagueType: LeagueType = 'mens',
  startingStrength?: StartingStrength
): Team {
  const teamJSONDTO = getTeamJSONDTO(internalName, leagueType);

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
      strength: startingStrength
        ? rollPlayerStrength(startingStrength.target, startingStrength.range)
        : clampToScale(getRandomPlayerStrength(teamJSONDTO.initialOverallStrength)),
      age: player.age,
      nationalities: [...player.nationalities],
      seasonGames: 0,
      seasonGoals: 0,
      strengthProgressGames: 0,
      isStarter: false,
      isSub: false,
    })),
    morale: 50,
    isControlledByHuman: false,
    ...(teamJSONDTO.coach && { coach: mapCoach(teamJSONDTO.coach) }),
  };

  return mappedTeam;
}

export default { getTeam, getInitialOverallStrength };
