import ChampionshipContainer from '../models/ChampionshipContainer';
import OperationResult from '../results/OperationResult';
import * as ChampionshipRepository from '../../infra/repositories/ChampionshipRepository';
import { Team } from '../models/Team';
import Match from '../models/Match';
import MatchContainer from '../models/MatchContainer';
import Round from '../models/Round';
import { Championship } from '../models/Championship';

function createMatches(startingTeams: Team[]): MatchContainer {
  const teams = [...startingTeams];
  const roundsPerLeg = teams.length - 1;
  const matchesPerRound = teams.length / 2;
  const totalRounds = roundsPerLeg * 2;
  const rounds: Round[] = [];
  let roundNumber = 1;

  for (let round = 0; round < roundsPerLeg; round++) {
    const matches: Match[] = [];
    for (let i = 0; i < matchesPerRound; i++) {
      const homeTeam = teams[i];
      const awayTeam = teams[teams.length - 1 - i];
      matches.push({
        id: crypto.randomUUID(),
        homeTeam,
        homeTeamScore: 0,
        awayTeamScore: 0,
        awayTeam,
        scorers: [],
      });
    }
    rounds.push({
      id: crypto.randomUUID(),
      number: roundNumber,
      matches,
      status: 'not-started',
    });
    roundNumber += 1;

    const lastTeam = teams.pop()!;
    teams.splice(1, 0, lastTeam);
  }

  const firstLegRoundsCount = rounds.length;
  for (let i = 0; i < firstLegRoundsCount; i++) {
    const matches: Match[] = [];
    const round = rounds[i];
    for (let j = 0; j < round.matches.length; j++) {
      const match = round.matches[j];
      matches.push({
        id: crypto.randomUUID(),
        homeTeam: match.awayTeam,
        homeTeamScore: 0,
        awayTeamScore: 0,
        awayTeam: match.homeTeam,
        scorers: [],
      });
    }
    rounds.push({
      id: crypto.randomUUID(),
      number: roundNumber,
      matches,
      status: 'not-started',
    });
    roundNumber += 1;
  }

  return {
    timer: 0,
    currentSeason: new Date().getFullYear(),
    currentRound: 1,
    totalRounds,
    rounds,
  };
}

function startRound(championship: Championship): Championship {
  if (!championship?.matchContainer?.rounds) {
    throw new Error("Championship couldn't be found.");
  }

  const matchContainer = championship.matchContainer;
  const rounds = matchContainer.rounds;

  let roundIndex = -1;
  for (let i = 0; i < rounds.length; i++) {
    if (rounds[i].number === matchContainer.currentRound) {
      roundIndex = i;
      break;
    }
  }

  if (roundIndex === -1) {
    throw new Error("Championship couldn't be found.");
  }

  const round = rounds[roundIndex];
  const currentMatches = round.matches;
  const updatedMatches = currentMatches.slice();
  let hasMatchChanges = false;

  for (let i = 0; i < currentMatches.length; i++) {
    const match = currentMatches[i];
    if (match.homeTeamScore !== 0 || match.awayTeamScore !== 0 || match.scorers.length > 0) {
      updatedMatches[i] = {
        ...match,
        homeTeamScore: 0,
        awayTeamScore: 0,
        scorers: [],
      };
      hasMatchChanges = true;
    }
  }

  if (!hasMatchChanges && round.status === 'in-progress') return championship;

  const updatedRounds = rounds.slice();
  updatedRounds[roundIndex] = {
    ...round,
    matches: hasMatchChanges ? updatedMatches : currentMatches,
    status: 'in-progress',
  };

  return {
    ...championship,
    matchContainer: {
      ...matchContainer,
      rounds: updatedRounds,
    },
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
      matchContainer: createMatches(playableChampionship.teams),
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
        matchContainer: createMatches(promotionChampionship.teams),
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
        matchContainer: createMatches(relegationChampionship.teams),
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

const getChampionships = (): OperationResult<Championship[]> => {
  try {
    const result = new OperationResult(ChampionshipRepository.getChampionships());
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

const getTeamControlledByHuman = (championship: Championship): OperationResult<Team> => {
  try {
    const team = championship.teams.find((t) => t.isControlledByHuman);
    if (!team) throw new Error('CHampionship has no team controlled by human.');

    const result = new OperationResult<Team>(team);
    result.setSuccess();
    return result;
  } catch (error) {
    const result = new OperationResult<Team>({} as Team);
    const message = error instanceof Error ? error.message : String(error);
    result.setError({
      errorCode: 'exception',
      message,
    });

    return result;
  }
};

const getMatchesForCurrentRound = (championship: Championship): OperationResult<Match[]> => {
  try {
    const currentRoundNumber = championship.matchContainer.currentRound;
    const currentRound = championship.matchContainer.rounds.filter(
      (round) => round.number === currentRoundNumber
    );

    if (!currentRound) throw new Error('Current round not found.');

    if (currentRound.length > 1)
      throw new Error(`Multiple rounds are set as round number ${currentRoundNumber}`);

    const result = new OperationResult<Match[]>(currentRound[0].matches);
    result.setSuccess();
    return result;
  } catch (error) {
    const result = new OperationResult<Match[]>([]);
    const message = error instanceof Error ? error.message : String(error);
    result.setError({
      errorCode: 'exception',
      message,
    });

    return result;
  }
};

const startRoundForAllChampionships = (
  championshipContainer: ChampionshipContainer
): OperationResult<ChampionshipContainer> => {
  try {
    let updatedChampionshipContainer = { ...championshipContainer };

    const updatedPlayableChampionship = startRound(championshipContainer.playableChampionship);
    updatedChampionshipContainer = {
      ...updatedChampionshipContainer,
      playableChampionship: updatedPlayableChampionship,
    };

    let updatedPromotionChampionship: Championship | undefined;
    if (championshipContainer.playableChampionship.isPromotable) {
      updatedPromotionChampionship = startRound(championshipContainer.promotionChampionship!);

      updatedChampionshipContainer = {
        ...updatedChampionshipContainer,
        promotionChampionship: updatedPromotionChampionship,
      };
    }

    let updatedRelegationChampionship: Championship | undefined;
    if (championshipContainer.playableChampionship.isRelegatable) {
      updatedRelegationChampionship = startRound(championshipContainer.promotionChampionship!);

      updatedChampionshipContainer = {
        ...updatedChampionshipContainer,
        relegationChampionship: updatedRelegationChampionship,
      };
    }

    const result = new OperationResult<ChampionshipContainer>(updatedChampionshipContainer);
    result.setSuccess();
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const result = new OperationResult<ChampionshipContainer>({} as ChampionshipContainer);
    result.setError({ errorCode: 'exception', message: errorMessage });
    return result;
  }
};

export default {
  initChampionships,
  getChampionships,
  getTeamControlledByHuman,
  getMatchesForCurrentRound,
  startRoundForAllChampionships,
};
