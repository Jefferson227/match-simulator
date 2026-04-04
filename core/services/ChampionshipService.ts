import ChampionshipContainer from '../models/ChampionshipContainer';
import OperationResult from '../results/OperationResult';
import * as ChampionshipRepository from '../../infra/repositories/ChampionshipRepository';
import { Team } from '../models/Team';
import Match from '../models/Match';
import MatchContainer from '../models/MatchContainer';
import Round from '../models/Round';
import { Championship } from '../models/Championship';
import Standing from '../models/Standing';

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

function endRound(championship: Championship): Championship {
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
  if (round.status === 'ended') return championship;

  const updatedStandings = updateStandings(championship.standings, round.matches);
  const updatedRounds = rounds.slice();
  updatedRounds[roundIndex] = {
    ...round,
    status: 'ended',
  };

  const nextRoundNumber =
    matchContainer.currentRound < matchContainer.totalRounds
      ? matchContainer.currentRound + 1
      : matchContainer.totalRounds + 1;

  return {
    ...championship,
    standings: updatedStandings,
    matchContainer: {
      ...matchContainer,
      rounds: updatedRounds,
      currentRound: nextRoundNumber,
      timer: 0,
    },
  };
}

function updateStandings(currentStandings: Standing[], matches: Match[]): Standing[] {
  const standingsMap = new Map<string, Standing>();

  for (const standing of currentStandings) {
    standingsMap.set(standing.team.id, {
      ...standing,
      team: { ...standing.team },
    });
  }

  for (const match of matches) {
    const homeStanding = standingsMap.get(match.homeTeam.id);
    const awayStanding = standingsMap.get(match.awayTeam.id);

    if (!homeStanding || !awayStanding) continue;

    homeStanding.goalsFor += match.homeTeamScore;
    homeStanding.goalsAgainst += match.awayTeamScore;
    awayStanding.goalsFor += match.awayTeamScore;
    awayStanding.goalsAgainst += match.homeTeamScore;

    if (match.homeTeamScore > match.awayTeamScore) {
      homeStanding.wins += 1;
      homeStanding.points += 3;
      awayStanding.losses += 1;
    } else if (match.homeTeamScore < match.awayTeamScore) {
      awayStanding.wins += 1;
      awayStanding.points += 3;
      homeStanding.losses += 1;
    } else {
      homeStanding.draws += 1;
      awayStanding.draws += 1;
      homeStanding.points += 1;
      awayStanding.points += 1;
    }
  }

  return Array.from(standingsMap.values())
    .sort((a, b) => {
      const pointsDifference = b.points - a.points;
      if (pointsDifference !== 0) return pointsDifference;

      const goalDifferenceA = a.goalsFor - a.goalsAgainst;
      const goalDifferenceB = b.goalsFor - b.goalsAgainst;
      const goalDifference = goalDifferenceB - goalDifferenceA;
      if (goalDifference !== 0) return goalDifference;

      const goalsForDifference = b.goalsFor - a.goalsFor;
      if (goalsForDifference !== 0) return goalsForDifference;

      return a.team.abbreviation.localeCompare(b.team.abbreviation);
    })
    .map((standing, index) => ({
      ...standing,
      position: index + 1,
    }));
}

function buildStandings(teams: Team[]): Standing[] {
  return teams.map((team, index) => ({
    team,
    position: index + 1,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  }));
}

function getPromotedTeams(championship: Championship, amount: number): Team[] {
  return championship.standings.slice(0, amount).map((standing) => standing.team);
}

function getRelegatedTeams(championship: Championship, amount: number): Team[] {
  if (amount <= 0) return [];
  return championship.standings.slice(-amount).map((standing) => standing.team);
}

function removeTeams(sourceTeams: Team[], teamsToRemove: Team[]): Team[] {
  const teamsToRemoveIds = new Set(teamsToRemove.map((team) => team.id));
  return sourceTeams.filter((team) => !teamsToRemoveIds.has(team.id));
}

function resetChampionshipForNewSeason(championship: Championship, teams: Team[]): Championship {
  const nextSeasonMatchContainer = createMatches(teams);
  const currentSeason =
    championship.matchContainer.currentSeason || nextSeasonMatchContainer.currentSeason;

  return {
    ...championship,
    teams,
    standings: buildStandings(teams),
    matchContainer: {
      ...nextSeasonMatchContainer,
      currentSeason: currentSeason + 1,
    },
  };
}

function isChampionshipOver(championship: Championship): boolean {
  return championship.matchContainer.currentRound >= championship.matchContainer.totalRounds;
}

function runEndOfChampionshipActionsForAllChampionships(
  championshipContainer: ChampionshipContainer
): ChampionshipContainer {
  const { playableChampionship, promotionChampionship, relegationChampionship } =
    championshipContainer;

  if (!isChampionshipOver(playableChampionship)) return championshipContainer;

  const promotedTeams =
    playableChampionship.isPromotable && promotionChampionship
      ? getPromotedTeams(playableChampionship, playableChampionship.numberOfPromotableTeams)
      : [];
  const relegatedFromPromotion =
    playableChampionship.isPromotable && promotionChampionship
      ? getRelegatedTeams(promotionChampionship, playableChampionship.numberOfPromotableTeams)
      : [];

  const relegatedTeams =
    playableChampionship.isRelegatable && relegationChampionship
      ? getRelegatedTeams(playableChampionship, playableChampionship.numberOfRelegatableTeams)
      : [];
  const promotedFromRelegation =
    playableChampionship.isRelegatable && relegationChampionship
      ? getPromotedTeams(relegationChampionship, playableChampionship.numberOfRelegatableTeams)
      : [];

  const nextPlayableTeams = [
    ...removeTeams(playableChampionship.teams, [...promotedTeams, ...relegatedTeams]),
    ...relegatedFromPromotion,
    ...promotedFromRelegation,
  ];

  const updatedContainer: ChampionshipContainer = {
    ...championshipContainer,
    playableChampionship: resetChampionshipForNewSeason(playableChampionship, nextPlayableTeams),
  };

  if (promotionChampionship && playableChampionship.isPromotable) {
    updatedContainer.promotionChampionship = resetChampionshipForNewSeason(promotionChampionship, [
      ...removeTeams(promotionChampionship.teams, relegatedFromPromotion),
      ...promotedTeams,
    ]);
  }

  if (relegationChampionship && playableChampionship.isRelegatable) {
    updatedContainer.relegationChampionship = resetChampionshipForNewSeason(
      relegationChampionship,
      [...removeTeams(relegationChampionship.teams, promotedFromRelegation), ...relegatedTeams]
    );
  }

  return updatedContainer;
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
      updatedRelegationChampionship = startRound(championshipContainer.relegationChampionship!);

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

const endRoundForAllChampionships = (
  championshipContainer: ChampionshipContainer
): OperationResult<ChampionshipContainer> => {
  try {
    let updatedChampionshipContainer = { ...championshipContainer };

    const updatedPlayableChampionship = endRound(championshipContainer.playableChampionship);
    updatedChampionshipContainer = {
      ...updatedChampionshipContainer,
      playableChampionship: updatedPlayableChampionship,
    };

    let updatedPromotionChampionship: Championship | undefined;
    if (championshipContainer.playableChampionship.isPromotable) {
      updatedPromotionChampionship = endRound(championshipContainer.promotionChampionship!);

      updatedChampionshipContainer = {
        ...updatedChampionshipContainer,
        promotionChampionship: updatedPromotionChampionship,
      };
    }

    let updatedRelegationChampionship: Championship | undefined;
    if (championshipContainer.playableChampionship.isRelegatable) {
      updatedRelegationChampionship = endRound(championshipContainer.relegationChampionship!);

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

const runEndOfChampionshipActions = (
  championshipContainer: ChampionshipContainer
): OperationResult<ChampionshipContainer> => {
  try {
    const updatedChampionshipContainer =
      runEndOfChampionshipActionsForAllChampionships(championshipContainer);

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
  endRoundForAllChampionships,
  runEndOfChampionshipActions,
};
