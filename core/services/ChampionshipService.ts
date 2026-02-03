import ChampionshipContainer from '../models/ChampionshipContainer';
import OperationResult from '../results/OperationResult';
import * as ChampionshipRepository from '../../infra/repositories/ChampionshipRepository';
import { Team } from '../models/Team';
import Match from '../models/Match';
import MatchContainer from '../models/MatchContainer';

function createMatches(startingTeams: Team[]): MatchContainer {
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

  return {
    timer: 0,
    currentSeason: new Date().getFullYear(),
    currentRound: 1,
    totalRounds,
    matches,
  };
}

const initChampionships = (
  championshipInternalName: string
): OperationResult<ChampionshipContainer> => {
  try {
    let championshipContainer = {} as ChampionshipContainer;

    let playableChampionship = ChampionshipRepository.getChampionship(
      championshipInternalName,
      true
    );
    playableChampionship = {
      ...playableChampionship,
      matches: createMatches(playableChampionship.startingTeams),
    };

    championshipContainer = {
      ...championshipContainer,
      playableChampionship,
    };

    if (playableChampionship.isPromotable) {
      let promotionChampionship = ChampionshipRepository.getChampionship(
        playableChampionship.promotionChampionshipInternalName,
        false
      );

      promotionChampionship = {
        ...promotionChampionship,
        matches: createMatches(promotionChampionship.startingTeams),
      };

      championshipContainer = {
        ...championshipContainer,
        promotionChampionship,
      };
    }

    if (playableChampionship.isRelegatable) {
      let relegationChampionship = ChampionshipRepository.getChampionship(
        playableChampionship.relegationChampionshipInternalName,
        false
      );

      relegationChampionship = {
        ...relegationChampionship,
        matches: createMatches(relegationChampionship.startingTeams),
      };

      championshipContainer = {
        ...championshipContainer,
        relegationChampionship,
      };
    }

    const result = new OperationResult(championshipContainer);
    result.setSuccess();
    return result;
  } catch (error) {
    const result = new OperationResult({} as ChampionshipContainer);
    const message = error instanceof Error ? error.message : String(error);
    result.setError({
      errorCode: 'exception',
      message,
    });

    return result;
  }
};

const getChampionshipInternalNames = (): OperationResult<string[]> => {
  try {
    const result = new OperationResult(getInternalNames());
    result.setSuccess();

    return result;
  } catch (error) {
    const result = new OperationResult([]);
    const message = error instanceof Error ? error.message : String(error);
    result.setError({
      errorCode: 'exception',
      message,
    });

    return result;
  }
};

export default {
  initChampionships,
  getChampionshipInternalNames,
};
