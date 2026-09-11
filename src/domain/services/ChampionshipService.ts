import ChampionshipContainer from '../models/ChampionshipContainer';
import OperationResult from '../results/OperationResult';
import * as ChampionshipRepository from '../../infrastructure/repositories/ChampionshipRepository';
import { Team } from '../models/Team';
import Match from '../models/Match';
import { Championship } from '../models/Championship';
import ChampionshipPhase from '../models/ChampionshipPhase';
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
import { buildPhaseView, PhaseView } from '../features/phases/PhaseView';
import { RandomProvider } from '../features/match-simulation/types';
import { getRandomNumber } from '../utils/Utils';
import { runMatchTick } from '../features/match-simulation/MatchSimulationEngine';

type ChampionshipServiceDependencies = {
  rng?: RandomProvider;
};

const defaultDependencies: Required<ChampionshipServiceDependencies> = {
  rng: { nextInt: getRandomNumber },
};

/**
 * True when a championship has simply run out of rounds — its season is finished.
 *
 * Distinguished from a genuinely missing round, which is still an error: a finished season is a
 * no-op, so nothing can overflow the round lookup by being asked to play one round too many.
 */
function hasFinishedItsRounds(championship: Championship): boolean {
  const { currentRound, totalRounds, rounds } = championship.matchContainer;
  return currentRound > totalRounds && !rounds.some((round) => round.number === currentRound);
}

function startRound(championship: Championship): Championship {
  if (!championship?.matchContainer?.rounds) {
    throw new Error("Championship couldn't be found.");
  }

  if (hasFinishedItsRounds(championship)) return championship;

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

  if (hasFinishedItsRounds(championship)) return championship;

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
  // The shape is chosen before the fixtures are generated, so both the new season's rounds and the
  // championship that carries them describe the same competition.
  const phases = selectPhases(championship, teams);
  const nextSeasonMatchContainer = createMatches(teams, phases, championship.phaseEntrants);
  const currentSeason =
    championship.matchContainer.currentSeason || nextSeasonMatchContainer.currentSeason;

  // `initialisePhaseState` zeroes `currentPhaseIndex`, `survivingTeamIds`, `phaseParticipants`,
  // `accumulatedStandings`, `firstPhaseStandings` and `phaseStandings`, so a shape change carries no
  // phase state of the shape it replaced.
  return initialisePhaseState({
    ...championship,
    phases,
    teams,
    // A division's field can change size across a roll-over — A1 is being expanded to 20 — so the
    // seeded `numberOfTeams` is a starting value, not an invariant.
    numberOfTeams: teams.length,
    standings: buildStandings(teams),
    matchContainer: {
      ...nextSeasonMatchContainer,
      currentSeason: currentSeason + 1,
    },
  });
}

/**
 * How many clubs a division relegates this season.
 *
 * A division being expanded relegates fewer than it promotes until it reaches
 * `targetNumberOfTeams`, then switches to `numberOfRelegatableTeamsAtTarget` so it stops growing.
 * Driven entirely by the championship's own data — nothing here knows that A1's target is 20.
 */
function getRelegationCount(championship: Championship): number {
  if (!championship.isRelegatable) return 0;

  const target = championship.targetNumberOfTeams;
  const atTarget = target !== undefined && championship.teams.length >= target;

  return atTarget && championship.numberOfRelegatableTeamsAtTarget !== undefined
    ? championship.numberOfRelegatableTeamsAtTarget
    : championship.numberOfRelegatableTeams;
}

/**
 * The shape a competition is played in with a field of `fieldSize` clubs.
 *
 * A competition declaring `phaseVariants` is played in the first variant its field satisfies — the
 * list is seeded most demanding first, and the repository rejects one that is not. Everything else
 * keeps the single shape it declares. Driven entirely by the championship's own data: nothing here
 * knows which competition changes shape, or at what size.
 */
function selectPhasesForFieldSize(
  championship: Championship,
  fieldSize: number
): ChampionshipPhase[] | undefined {
  const variants = championship.phaseVariants;
  if (!variants?.length) return championship.phases;

  const variant = variants.find((candidate) => candidate.minNumberOfTeams <= fieldSize);
  return variant ? variant.phases : championship.phases;
}

/**
 * The shape a competition is played in with a given field. See `selectPhasesForFieldSize`.
 *
 * Exported so the selection boundaries can be pinned directly; the roll-over is the only caller.
 */
export function selectPhases(
  championship: Championship,
  teams: Team[]
): ChampionshipPhase[] | undefined {
  return selectPhasesForFieldSize(championship, teams.length);
}

/**
 * The smallest field a division can be played with, given the shape its first phase declares.
 * A group stage needs at least two clubs per group, or the bracket it feeds cannot be built.
 */
function getMinimumField(phases: ChampionshipPhase[] | undefined): number {
  if (!phases?.length) return 2;

  const firstPhase = phases[0];
  const groupFloor =
    firstPhase.kind === 'round-robin' && firstPhase.numberOfGroups > 1
      ? firstPhase.numberOfGroups * 2
      : 2;

  // The phase that follows must be fillable too: a knockout of N ties needs 2N qualifiers, and a
  // division that cannot fill its own quarter-finals is not playable.
  const secondPhase = phases[1];
  const bracketFloor = secondPhase?.kind === 'knockout' ? secondPhase.numberOfTies * 2 : 2;

  return Math.max(groupFloor, bracketFloor);
}

/**
 * Caps how many clubs a division can send up, so it is never emptied below a playable field.
 *
 * Série A3 has no backfill: CBF re-composes it every season from state champions, which the game
 * has no source for (`wiki/concepts/invented-data.md`), so it loses 2 clubs a season. The cap stops
 * that at a field its group stage can still be played with rather than letting it run to nothing.
 */
function getSustainablePromotionCount(
  championship: Championship,
  declared: number,
  incoming: number
): number {
  // The floor comes from the shape the division will *next* be played in, not the one it has just
  // played: a division that has shrunk out of its group stage is not held to that stage's floor.
  // The prospective field assumes the whole declared promotion goes through, which is the shape the
  // roll-over then selects whenever the cap does not bind.
  const prospectiveField = championship.teams.length + incoming - declared;
  const floor = getMinimumField(selectPhasesForFieldSize(championship, prospectiveField));

  const affordable = championship.teams.length + incoming - floor;
  return Math.max(0, Math.min(declared, affordable));
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

  // Each division's own counts drive its own exchange. Before MS-103 both sides of every exchange
  // used the *playable* championship's count, which kept the club totals stable only by making A1
  // relegate 4 when its REC says 2, and A3 promote 2 when its REC says 4.
  const promotesUp = playableChampionship.isPromotable && Boolean(promotionChampionship);
  const relegatesDown = playableChampionship.isRelegatable && Boolean(relegationChampionship);

  const relegatedFromPromotion =
    promotesUp && promotionChampionship
      ? getRelegatedTeams(promotionChampionship, getRelegationCount(promotionChampionship))
      : [];
  const promotedTeams = promotesUp
    ? getPromotedTeams(
        playableChampionship,
        getSustainablePromotionCount(
          playableChampionship,
          playableChampionship.isPromotable ? playableChampionship.numberOfPromotableTeams : 0,
          relegatedFromPromotion.length
        )
      )
    : [];

  const relegatedTeams = relegatesDown
    ? getRelegatedTeams(playableChampionship, getRelegationCount(playableChampionship))
    : [];
  const promotedFromRelegation =
    relegatesDown && relegationChampionship
      ? getPromotedTeams(
          relegationChampionship,
          getSustainablePromotionCount(
            relegationChampionship,
            relegationChampionship.isPromotable
              ? relegationChampionship.numberOfPromotableTeams
              : 0,
            relegatedTeams.length
          )
        )
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
      matchContainer: createMatches(
        playableChampionship.teams,
        playableChampionship.phases,
        playableChampionship.phaseEntrants
      ),
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
        matchContainer: createMatches(
          promotionChampionship.teams,
          promotionChampionship.phases,
          promotionChampionship.phaseEntrants
        ),
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
        matchContainer: createMatches(
          relegationChampionship.teams,
          relegationChampionship.phases,
          relegationChampionship.phaseEntrants
        ),
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

/**
 * A guard, not a rule. No seeded competition owes anywhere near this many rounds; it stops a
 * malformed fixture list from looping forever.
 */
const MAX_CATCH_UP_ROUNDS = 500;

/** Plays a whole round of an AI championship in one pass, 90 minutes at a time. */
function simulateRoundInOnePass(championship: Championship, rng: RandomProvider): Championship {
  const matchContainer = championship.matchContainer;
  const roundIndex = matchContainer.rounds.findIndex(
    (round) => round.number === matchContainer.currentRound
  );
  if (roundIndex === -1) return championship;

  const round = matchContainer.rounds[roundIndex];
  let matches = round.matches;
  for (let minute = 0; minute < 90; minute++) {
    matches = matches.map((match) => runMatchTick(match, minute, rng));
  }

  const rounds = matchContainer.rounds.slice();
  rounds[roundIndex] = { ...round, matches };

  return {
    ...championship,
    matchContainer: { ...matchContainer, rounds, timer: 90 },
  };
}

/**
 * Brings an AI championship up to date in a single execution: every round it still owes, and every
 * phase it completes on the way.
 *
 * The playable championship is the clock, and the AI divisions no longer have matching round counts
 * — A1 plays 23, A2 21, A3 14 — so they cannot be stepped in pairs with it. They are caught up at
 * the playable championship's phase boundaries and at the end of its season, which is the last
 * point before promotion and relegation read their semifinalists and 1ª Fase tables.
 *
 * A championship with no round left to play is returned untouched, so a division that finished
 * early can never overflow its round lookup.
 */
function catchUpChampionship(
  championship: Championship | undefined,
  dependencies: ChampionshipServiceDependencies
): Championship | undefined {
  if (!championship?.matchContainer?.rounds) return championship;

  const deps = { ...defaultDependencies, ...dependencies };
  let current = championship;

  for (let guard = 0; guard < MAX_CATCH_UP_ROUNDS; guard++) {
    const matchContainer = current.matchContainer;
    const hasRoundToPlay = matchContainer.rounds.some(
      (round) => round.number === matchContainer.currentRound
    );
    if (!hasRoundToPlay) break;

    current = endRound(simulateRoundInOnePass(startRound(current), deps.rng), dependencies);
  }

  return current;
}

/**
 * Starts the playable championship's round. The AI championships are **not** started here — they are
 * played in one pass at the sync points in `endRoundForAllChampionships`, so starting a round for
 * them would only reset scores they are about to play for themselves.
 */
const startRoundForAllChampionships = (
  championshipContainer: ChampionshipContainer
): OperationResult<ChampionshipContainer> => {
  try {
    const updatedChampionshipContainer: ChampionshipContainer = {
      ...championshipContainer,
      playableChampionship: startRound(championshipContainer.playableChampionship),
    };

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

/**
 * Advances the playable championship by one round, and brings the AI championships up to date at
 * the sync points: the end of each of the playable championship's phases, and the end of its
 * season.
 *
 * Before MS-103 this stepped all three round for round, which only worked because Série A and B
 * both play 38 rounds. The women's divisions do not — A1 plays 23 rounds, A2 21, A3 14 — and the
 * pairing threw `Championship couldn't be found.` as soon as the shorter one ran out.
 */
const endRoundForAllChampionships = (
  championshipContainer: ChampionshipContainer,
  dependencies: ChampionshipServiceDependencies = {}
): OperationResult<ChampionshipContainer> => {
  try {
    const previousChampionship = championshipContainer.playableChampionship;
    const playableChampionship = endRound(previousChampionship, dependencies);

    let updatedChampionshipContainer: ChampionshipContainer = {
      ...championshipContainer,
      playableChampionship,
    };

    const crossedPhaseBoundary =
      (previousChampionship.currentPhaseIndex ?? 0) !==
      (playableChampionship.currentPhaseIndex ?? 0);
    const seasonIsOver = isChampionshipOver(playableChampionship);

    if (crossedPhaseBoundary || seasonIsOver) {
      updatedChampionshipContainer = {
        ...updatedChampionshipContainer,
        promotionChampionship: catchUpChampionship(
          championshipContainer.promotionChampionship,
          dependencies
        ),
        relegationChampionship: catchUpChampionship(
          championshipContainer.relegationChampionship,
          dependencies
        ),
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

const getPhaseView = (championship: Championship): PhaseView => buildPhaseView(championship);

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
  getPhaseView,
  getChampionships,
  getTeamControlledByHuman,
  getMatchesForCurrentRound,
  startRoundForAllChampionships,
  endRoundForAllChampionships,
  runEndOfChampionshipActions,
};
