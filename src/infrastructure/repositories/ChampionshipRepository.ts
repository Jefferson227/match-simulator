import ChampionshipJSONDTO from '../data-transfer-objects/ChampionshipJSONDTO';
import championshipsJSON from '../data/championships.json';
import { Championship } from '../../domain/models/Championship';
import LeagueType from '../../domain/enums/LeagueType';
import TeamRepository from './TeamRepository';

export function getChampionship(
  championshipInternalName: string,
  hasTeamControlledByHuman: boolean
): Championship {
  const championshipsJSONDTO = championshipsJSON as ChampionshipJSONDTO[];
  const championshipJSONDTO = championshipsJSONDTO.find(
    (champ) => champ.internalName === championshipInternalName
  );

  if (!championshipJSONDTO) throw new Error('Championship not found.');

  let mappedChampionship = {
    id: crypto.randomUUID(),
    name: championshipJSONDTO.name,
    internalName: championshipJSONDTO.internalName,
    numberOfTeams: championshipJSONDTO.numberOfTeams,
    targetNumberOfTeams: championshipJSONDTO.targetNumberOfTeams,
    teams: [],
    standings: [],
    matchContainer: {
      timer: 0,
      currentSeason: 0,
      currentRound: 0,
      totalRounds: 0,
      rounds: [],
    },
    type: championshipJSONDTO.type,
    leagueType: championshipJSONDTO.leagueType,
    phases: championshipJSONDTO.phases,
    hasTeamControlledByHuman,
    isPromotable: false,
    isRelegatable: false,
  } as Championship;

  const numberOfRelegatableTeams =
    'numberOfRelegatableTeams' in championshipJSONDTO
      ? Number(championshipJSONDTO.numberOfRelegatableTeams)
      : 0;
  const relegationChampionshipInternalName =
    'relegationChampionshipInternalName' in championshipJSONDTO
      ? String(championshipJSONDTO.relegationChampionshipInternalName)
      : '';
  if (numberOfRelegatableTeams > 0 && relegationChampionshipInternalName.length > 0) {
    mappedChampionship = {
      ...mappedChampionship,
      isRelegatable: true,
      numberOfRelegatableTeams,
      relegationChampionshipInternalName,
      relegationRule: championshipJSONDTO.relegationRule ?? 'table-position',
      numberOfRelegatableTeamsAtTarget: championshipJSONDTO.numberOfRelegatableTeamsAtTarget,
    };
  }

  const numberOfPromotableTeams =
    'numberOfPromotableTeams' in championshipJSONDTO
      ? Number(championshipJSONDTO.numberOfPromotableTeams)
      : 0;
  const promotionChampionshipInternalName =
    'promotionChampionshipInternalName' in championshipJSONDTO
      ? String(championshipJSONDTO.promotionChampionshipInternalName)
      : '';
  if (numberOfPromotableTeams > 0 && promotionChampionshipInternalName.length > 0) {
    mappedChampionship = {
      ...mappedChampionship,
      isPromotable: true,
      numberOfPromotableTeams,
      promotionChampionshipInternalName,
      promotionRule: championshipJSONDTO.promotionRule ?? 'table-position',
    };
  }

  const teams = championshipJSONDTO.teamNames
    .map((teamName) => TeamRepository.getTeam(teamName, championshipJSONDTO.leagueType))
    .filter((team): team is NonNullable<typeof team> => Boolean(team));

  const teamsByName = new Map(
    championshipJSONDTO.teamNames.map((teamName, index) => [teamName, teams[index]])
  );

  if (teams.length !== championshipJSONDTO.teamNames.length) {
    throw new Error(
      `Number of teams found is not the same as expected. Found: ${teams.length}; Expected: ${championshipJSONDTO.teamNames.length}.`
    );
  }

  // Staggered entry: a phase may name the clubs joining at it. Resolved here, where the seed names
  // are still in scope; the domain only ever sees `Team` objects.
  const phaseEntrants = championshipJSONDTO.phases?.map((phase) =>
    phase.kind === 'knockout' && phase.entrants?.length
      ? phase.entrants
          .map((teamName) => teamsByName.get(teamName))
          .filter((team): team is NonNullable<typeof team> => Boolean(team))
      : []
  );

  if (
    phaseEntrants?.some((entrants, index) => {
      const declared = championshipJSONDTO.phases?.[index];
      return declared?.kind === 'knockout' && (declared.entrants?.length ?? 0) !== entrants.length;
    })
  ) {
    throw new Error(`Some phase entrants of ${championshipInternalName} are not seeded teams.`);
  }

  const hasLeagueTable = championshipJSONDTO.hasLeagueTable !== false;

  const standings = hasLeagueTable
    ? teams.map((team, index) => ({
        team,
        position: index + 1,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      }))
    : [];

  mappedChampionship = {
    ...mappedChampionship,
    teams,
    standings,
    hasLeagueTable,
    ...(phaseEntrants?.some((entrants) => entrants.length) ? { phaseEntrants } : {}),
  };

  return mappedChampionship;
}

export function getChampionships(leagueType?: LeagueType): Championship[] {
  const championshipsJSONDTO = championshipsJSON as ChampionshipJSONDTO[];

  if (!championshipsJSONDTO.length)
    throw new Error('No championship internal names have been found.');

  return championshipsJSONDTO
    .filter((json) => !leagueType || json.leagueType === leagueType)
    .map((json) => {
      return {
        internalName: json.internalName,
        name: json.name,
        leagueType: json.leagueType,
      } as Championship;
    });
}
