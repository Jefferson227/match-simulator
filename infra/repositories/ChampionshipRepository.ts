import ChampionshipJSONDTO from '../../core/data-transfer-objects/ChampionshipJSONDTO';
import championshipsJSON from '../../assets/championships.json';
import { Championship } from '../../core/models/Championship';
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
    id: '0',
    name: championshipJSONDTO.name,
    internalName: championshipJSONDTO.internalName,
    numberOfTeams: championshipJSONDTO.numberOfTeams,
    teams: [],
    standings: [],
    matches: {
      timer: 0,
      currentSeason: 0,
      currentRound: 0,
      totalRounds: 0,
      matches: [],
    },
    type: championshipJSONDTO.type,
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
    };
  }

  const teams = championshipJSONDTO.teamNames
    .map((teamName) => TeamRepository.getTeam(teamName))
    .filter((team): team is NonNullable<typeof team> => Boolean(team));

  if (teams.length !== championshipJSONDTO.teamNames.length) {
    throw new Error(
      `Number of teams found is not the same as expected. Found: ${teams.length}; Expected: ${championshipJSONDTO.teamNames.length}.`
    );
  }

  const standings = teams.map((team, index) => ({
    team,
    position: index + 1,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  }));

  mappedChampionship = {
    ...mappedChampionship,
    teams,
    standings,
  };

  return mappedChampionship;
}

export function getChampionships(): Championship[] {
  const championshipsJSONDTO = championshipsJSON as ChampionshipJSONDTO[];
  const internalNames = championshipsJSONDTO.map((json) => {
    return {
      internalName: json.internalName,
      name: json.name,
    } as Championship;
  });

  if (!internalNames.length) throw new Error('No championship internal names have been found.');

  return internalNames;
}
