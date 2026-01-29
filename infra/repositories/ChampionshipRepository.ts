import ChampionshipJSONDTO from '../../core/data-transfer-objects/ChampionshipJSONDTO';
import championshipsJSON from '../../assets/championships.json';
import { Championship } from '../../core/models/Championship';
import TeamRepository from './TeamRepository';
import type Match from '../../core/models/Match';

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

  const startingTeams = championshipJSONDTO.teamNames
    .map((teamName) => TeamRepository.getTeam(teamName))
    .filter((team): team is NonNullable<typeof team> => Boolean(team));

  if (startingTeams.length !== championshipJSONDTO.teamNames.length) {
    throw new Error(
      `Number of starting teams found is not the same as expected. Found: ${startingTeams.length}; Expected: ${championshipJSONDTO.teamNames.length}.`
    );
  }

  const standings = startingTeams.map((team, index) => ({
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
    startingTeams,
    standings,
  };

  // TODO: Group this logic in a separate function
  const teams = [...startingTeams];
  const roundsPerLeg = teams.length - 1;
  const matchesPerRound = teams.length / 2;
  const totalRounds = roundsPerLeg * 2;
  const matches: Match[] = [];
  let matchId = 1;

  for (let round = 0; round < roundsPerLeg; round++) {
    for (let i = 0; i < matchesPerRound; i++) {
      const homeTeam = teams[i];
      const awayTeam = teams[teams.length - 1 - i];
      matches.push({
        id: matchId++,
        homeTeam,
        awayTeam,
        scorers: [],
      });
    }

    const lastTeam = teams.pop()!;
    teams.splice(1, 0, lastTeam);
  }

  const firstLegMatchesCount = matches.length;
  for (let i = 0; i < firstLegMatchesCount; i++) {
    const match = matches[i];
    matches.push({
      id: matchId++,
      homeTeam: match.awayTeam,
      awayTeam: match.homeTeam,
      scorers: [],
    });
  }

  mappedChampionship = {
    ...mappedChampionship,
    matches: {
      ...mappedChampionship.matches,
      currentRound: 1,
      totalRounds,
      matches,
    },
  };

  return mappedChampionship;
}
