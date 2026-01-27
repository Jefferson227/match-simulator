import ChampionshipJSONDTO from '../../core/data-transfer-objects/ChampionshipJSONDTO';
import championshipsJSON from '../../assets/championships.json';
import { Championship } from '../../core/models/Championship';
import TeamRepository from './TeamRepository';

export function getChampionship(
  championshipInternalName: string,
  hasTeamControlledByHuman: boolean
): Championship | undefined {
  const championshipsJSONDTO = championshipsJSON as ChampionshipJSONDTO[];
  const championshipJSONDTO = championshipsJSONDTO.find(
    (champ) => champ.internalName === championshipInternalName
  );

  if (!championshipJSONDTO) return undefined;

  let mappedChampionship = {
    id: '0',
    name: championshipJSONDTO.name,
    internalName: championshipJSONDTO.internalName,
    numberOfTeams: championshipJSONDTO.numberOfTeams,
    startingTeams: [],
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

  if (
    'numberOfRelegatableTeams' in championshipJSONDTO &&
    'relegationChampionshipInternalName' in championshipJSONDTO
  ) {
    if (
      championshipJSONDTO.numberOfRelegatableTeams < 1 ||
      championshipJSONDTO.numberOfRelegatableTeams > championshipJSONDTO.numberOfTeams
    ) {
      return undefined;
    }

    if (!championshipJSONDTO.relegationChampionshipInternalName) {
      return undefined;
    }

    mappedChampionship = {
      ...mappedChampionship,
      isRelegatable: true,
      numberOfRelegatableTeams: championshipJSONDTO.numberOfRelegatableTeams,
      relegationChampionshipInternalName: championshipJSONDTO.relegationChampionshipInternalName,
    };
  }

  if (
    'numberOfPromotableTeams' in championshipJSONDTO &&
    'promotionChampionshipInternalName' in championshipJSONDTO
  ) {
    if (
      championshipJSONDTO.numberOfPromotableTeams < 1 ||
      championshipJSONDTO.numberOfPromotableTeams > championshipJSONDTO.numberOfTeams
    ) {
      return undefined;
    }

    if (!championshipJSONDTO.promotionChampionshipInternalName) {
      return undefined;
    }

    mappedChampionship = {
      ...mappedChampionship,
      isPromotable: true,
      numberOfPromotableTeams: championshipJSONDTO.numberOfPromotableTeams,
      promotionChampionshipInternalName: championshipJSONDTO.promotionChampionshipInternalName,
    };
  }

  const startingTeams = championshipJSONDTO.teamNames
    .map((teamName) => TeamRepository.getTeam(teamName))
    .filter((team): team is NonNullable<typeof team> => Boolean(team));

  if (startingTeams.length !== championshipJSONDTO.teamNames.length) {
    return undefined;
  }

  mappedChampionship = {
    ...mappedChampionship,
    startingTeams,
  };

  // TODO: Init standings

  // TODO: Init matches

  return mappedChampionship;
}
