import ChampionshipContainer from '../models/ChampionshipContainer';
import OperationResult from '../results/OperationResult';
import * as ChampionshipRepository from '../../infrastructure/repositories/ChampionshipRepository';
import { Team } from '../models/Team';
import Match from '../models/Match';
import { Championship } from '../models/Championship';
import Standing from '../models/Standing';
import LeagueType from '../enums/LeagueType';
import { createMatches } from '../features/fixture-generation/FixtureGenerator';
import { rankStandings } from '../features/standings/StandingsComparator';
import {
  buildFinalClassification,
  initialisePhaseState,
  isPhasedChampionshipOver,
  resolveCompletedPhase,
} from '../features/phases/PhaseProgression';
import { RandomProvider } from '../features/match-simulation/types';
import { getRandomNumber } from '../utils/Utils';

type ChampionshipServiceDependencies = {
  rng?: RandomProvider;
};

const defaultDependencies: Required<ChampionshipServiceDependencies> = {
  rng: { nextInt: getRandomNumber },
};

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

function endRound(
  championship: Championship,
  dependencies: ChampionshipServiceDependencies = {}
): Championship {
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

  const withRoundEnded: Championship = {
    ...championship,
    standings: updatedStandings,
    matchContainer: {
      ...matchContainer,
      rounds: updatedRounds,
    },
  };

  // A phased championship does not end when its rounds run out — it resolves the phase and
  // generates the next one, which appends rounds and grows `totalRounds`. So the phase is resolved
  // before the next round number is worked out.
  const resolved = withPhaseResolution(withRoundEnded, dependencies);
  const resolvedContainer = resolved.matchContainer;

  const nextRoundNumber =
    resolvedContainer.currentRound < resolvedContainer.totalRounds
      ? resolvedContainer.currentRound + 1
      : resolvedContainer.totalRounds + 1;

  return {
    ...resolved,
    matchContainer: {
      ...resolvedContainer,
      currentRound: nextRoundNumber,
      timer: 0,
    },
  };
}

function withPhaseResolution(
  championship: Championship,
  dependencies: ChampionshipServiceDependencies
): Championship {
  if (!championship.phases?.length) return championship;

  const deps = { ...defaultDependencies, ...dependencies };
  return resolveCompletedPhase(championship, { rng: deps.rng });
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

  return rankStandings(Array.from(standingsMap.values()));
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

/**
 * The clubs that reached the semifinal, best first by final classification.
 *
 * The semifinal is the second-to-last phase in every seeded format — A1/A2 index 2 of 4, A3 index 3
 * of 5 — and `phaseParticipants` records who played it (task 04).
 */
function getSemifinalists(championship: Championship): Team[] {
  const phases = championship.phases;
  if (!phases?.length) return [];

  const semifinalIndex = phases.length - 2;
  const semifinalists = championship.phaseParticipants?.[semifinalIndex];
  if (!semifinalists?.length) return [];

  const alive = new Set<string>(semifinalists);
  return buildFinalClassification(championship)
    .filter((standing) => alive.has(standing.team.id))
    .map((standing) => standing.team);
}

/**
 * Promotion, dispatched on the rule the championship declares.
 *
 * - `'semifinalists'` — everyone who reached the semifinal goes up, whatever their table position.
 *   A club can finish 8th in the league phase, win a quarter-final and be promoted ahead of the
 *   club that finished 1st (REC A2 Art. 5º, REC A3 Art. 5º).
 * - `'table-position'` — the top of the table, the default and the men's divisions' behaviour.
 */
function getPromotedTeams(championship: Championship, amount: number): Team[] {
  if (amount <= 0) return [];

  const rule = championship.isPromotable ? championship.promotionRule : undefined;

  if (rule === 'semifinalists') {
    const semifinalists = getSemifinalists(championship);
    // `amount` is `numberOfPromotableTeams`, which is 4 for both A2 and A3 — exactly the number of
    // semifinalists. It is applied so a mismatched count can never inflate the promoted field.
    if (semifinalists.length) return semifinalists.slice(0, amount);
  }

  return buildFinalClassification(championship)
    .slice(0, amount)
    .map((standing) => standing.team);
}

/**
 * Relegation, dispatched on the rule the championship declares.
 *
 * - `'first-phase-table-position'` — the bottom of the **1ª Fase** table, not the final
 *   classification (REC A1 Art. 26, REC A2 Art. 25).
 * - `'table-position'` — the bottom of the table, the default and the men's divisions' behaviour.
 */
function getRelegatedTeams(championship: Championship, amount: number): Team[] {
  if (amount <= 0) return [];

  const rule = championship.isRelegatable ? championship.relegationRule : undefined;

  if (rule === 'first-phase-table-position' && championship.firstPhaseStandings?.length) {
    return rankStandings(championship.firstPhaseStandings)
      .slice(-amount)
      .map((standing) => standing.team);
  }

  return buildFinalClassification(championship)
    .slice(-amount)
    .map((standing) => standing.team);
}

function removeTeams(sourceTeams: Team[], teamsToRemove: Team[]): Team[] {
  const teamsToRemoveIds = new Set(teamsToRemove.map((team) => team.id));
  return sourceTeams.filter((team) => !teamsToRemoveIds.has(team.id));
}

function resetChampionshipForNewSeason(championship: Championship, teams: Team[]): Championship {
  const nextSeasonMatchContainer = createMatches(teams, championship.phases);
  const currentSeason =
    championship.matchContainer.currentSeason || nextSeasonMatchContainer.currentSeason;

  return initialisePhaseState({
    ...championship,
    teams,
    standings: buildStandings(teams),
    matchContainer: {
      ...nextSeasonMatchContainer,
      currentSeason: currentSeason + 1,
    },
  });
}

function isChampionshipOver(championship: Championship): boolean {
  // A phased championship is over when its final is decided, not when its rounds run out — the
  // round list grows as each phase is generated, so the round count means nothing until then.
  if (championship.phases?.length) return isPhasedChampionshipOver(championship);

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
    playableChampionship = initialisePhaseState({
      ...playableChampionship,
      matchContainer: createMatches(playableChampionship.teams, playableChampionship.phases),
    });

    championshipContainer = {
      ...championshipContainer,
      playableChampionship,
    };

    if (playableChampionship.isPromotable) {
      let promotionChampionship = ChampionshipRepository.getChampionship(
        playableChampionship.promotionChampionshipInternalName,
        false
      );

      promotionChampionship = initialisePhaseState({
        ...promotionChampionship,
        matchContainer: createMatches(promotionChampionship.teams, promotionChampionship.phases),
      });

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

      relegationChampionship = initialisePhaseState({
        ...relegationChampionship,
        matchContainer: createMatches(relegationChampionship.teams, relegationChampionship.phases),
      });

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

const getChampionships = (leagueType?: LeagueType): OperationResult<Championship[]> => {
  try {
    const result = new OperationResult(ChampionshipRepository.getChampionships(leagueType));
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
  championshipContainer: ChampionshipContainer,
  dependencies: ChampionshipServiceDependencies = {}
): OperationResult<ChampionshipContainer> => {
  try {
    let updatedChampionshipContainer = { ...championshipContainer };

    const updatedPlayableChampionship = endRound(
      championshipContainer.playableChampionship,
      dependencies
    );
    updatedChampionshipContainer = {
      ...updatedChampionshipContainer,
      playableChampionship: updatedPlayableChampionship,
    };

    let updatedPromotionChampionship: Championship | undefined;
    if (championshipContainer.playableChampionship.isPromotable) {
      updatedPromotionChampionship = endRound(
        championshipContainer.promotionChampionship!,
        dependencies
      );

      updatedChampionshipContainer = {
        ...updatedChampionshipContainer,
        promotionChampionship: updatedPromotionChampionship,
      };
    }

    let updatedRelegationChampionship: Championship | undefined;
    if (championshipContainer.playableChampionship.isRelegatable) {
      updatedRelegationChampionship = endRound(
        championshipContainer.relegationChampionship!,
        dependencies
      );

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

const getFinalClassification = (championship: Championship): OperationResult<Standing[]> => {
  try {
    const result = new OperationResult<Standing[]>(buildFinalClassification(championship));
    result.setSuccess();
    return result;
  } catch (error) {
    const result = new OperationResult<Standing[]>([]);
    const message = error instanceof Error ? error.message : String(error);
    result.setError({ errorCode: 'exception', message });
    return result;
  }
};

export default {
  initChampionships,
  getFinalClassification,
  getChampionships,
  getTeamControlledByHuman,
  getMatchesForCurrentRound,
  startRoundForAllChampionships,
  endRoundForAllChampionships,
  runEndOfChampionshipActions,
};
