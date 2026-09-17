import ChampionshipContainer from '../models/ChampionshipContainer';
import OperationResult from '../results/OperationResult';
import * as ChampionshipRepository from '../../infrastructure/repositories/ChampionshipRepository';
import { Team } from '../models/Team';
import Match from '../models/Match';
import { Championship } from '../models/Championship';
import ChampionshipPhase from '../models/ChampionshipPhase';
import Standing from '../models/Standing';
import { SeasonSummary, SeasonSummaryDivision, SeasonSummaryTeam } from '../models/SeasonSummary';
import LeagueType from '../enums/LeagueType';
import { createMatches } from '../features/fixture-generation/FixtureGenerator';
import { rankStandings } from '../features/standings/StandingsComparator';
import {
  buildFinalClassification,
  groupsOfPhase,
  initialisePhaseState,
  isPhasedChampionshipOver,
  resolveCompletedPhase,
} from '../features/phases/PhaseProgression';
import { buildPhaseView, PhaseView, PhaseViewOptions } from '../features/phases/PhaseView';
import { RandomProvider } from '../features/match-simulation/types';
import { getRandomNumber } from '../utils/Utils';
import { runMatchTick } from '../features/match-simulation/MatchSimulationEngine';
import { getSeasonRoundCount } from '../features/phases/SeasonRoundCount';
import {
  getDivisionAbove,
  getDivisionBelow,
  getPlayableChampionship,
  replaceChampionship,
  updatePlayableChampionship,
} from '../features/pyramid/Pyramid';

type ChampionshipServiceDependencies = {
  /** The playable division's draws: its shootouts, and the human's club draw. */
  rng?: RandomProvider;
  /**
   * Each AI division's own stream, by `internalName`. Every AI match minute and shootout draws from
   * its division's stream alone, so how the AI rounds are spread across the season — dripped per
   * playable round or played in one pass — cannot change any division's results under an injected
   * rng. Defaults to `rng` for every division, which in production is the unseeded shared provider.
   */
  rngForDivision?: (internalName: string) => RandomProvider;
};

const defaultRng: RandomProvider = { nextInt: getRandomNumber };

function resolveDependencies(
  dependencies: ChampionshipServiceDependencies
): Required<ChampionshipServiceDependencies> {
  const rng = dependencies.rng ?? defaultRng;
  return { rng, rngForDivision: dependencies.rngForDivision ?? (() => rng) };
}

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

  return resolveCompletedPhase(championship, { rng: resolveDependencies(dependencies).rng });
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
 * The top of each group of the phase `promotionPhaseIndex` points at, read off that phase's kept
 * table — group winners first, then runners-up, each block in table order. Série C promotes the top
 * 2 of each 2ª Fase group, so a club that won the 1ª Fase and finished last in its group stays down,
 * and the final only awards the title (REC C Art. 5º).
 */
function getPhaseGroupPositionPromoted(championship: Championship): Team[] {
  if (!championship.isPromotable) return [];

  const phaseIndex = championship.promotionPhaseIndex;
  if (phaseIndex === undefined) return [];

  const phase = championship.phases?.[phaseIndex];
  const table = championship.phaseStandings?.[phaseIndex];
  if (phase?.kind !== 'round-robin' || !table?.length) return [];

  const perGroup = Math.floor(championship.numberOfPromotableTeams / phase.numberOfGroups);
  const groups = groupsOfPhase(championship.matchContainer.rounds, phaseIndex);
  const taken = new Map<number, number>();
  const promoted: { team: Team; groupPosition: number; overall: number }[] = [];

  rankStandings(table).forEach((standing, overall) => {
    const group = groups.get(standing.team.id);
    if (group === undefined) return;

    const groupPosition = (taken.get(group) ?? 0) + 1;
    taken.set(group, groupPosition);
    if (groupPosition <= perGroup) promoted.push({ team: standing.team, groupPosition, overall });
  });

  return promoted
    .sort((a, b) => a.groupPosition - b.groupPosition || a.overall - b.overall)
    .map((entry) => entry.team);
}

/**
 * Promotion, dispatched on the rule the championship declares.
 *
 * - `'semifinalists'` — everyone who reached the semifinal goes up, whatever their table position.
 *   A club can finish 8th in the league phase, win a quarter-final and be promoted ahead of the
 *   club that finished 1st (REC A2 Art. 5º, REC A3 Art. 5º).
 * - `'phase-group-position'` — the top of each group of a chosen phase (Série C, REC C Art. 5º).
 * - `'table-position'` — the top of the table, the default and the men's divisions' behaviour.
 *
 * A cap from `getSustainablePromotionCount` trims the group-position list from the end, so group
 * winners are the last to lose their place.
 */
function getPromotedTeams(championship: Championship, amount: number): Team[] {
  if (amount <= 0) return [];

  const rule = championship.isPromotable ? championship.promotionRule : undefined;

  if (rule === 'phase-group-position') {
    const promoted = getPhaseGroupPositionPromoted(championship);
    if (promoted.length) return promoted.slice(0, amount);
  }

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

/**
 * A division's team list for next season: the outgoing clubs leave and the incoming ones join.
 *
 * By default the incoming clubs are appended. A division declaring `rolloverSlotting:
 * 'replace-in-place'` puts each incoming club, in order, at the list position an outgoing club
 * vacated, so every other club keeps its position — and, since groups are dealt in declared order,
 * its group. Surplus incoming clubs are appended; if fewer arrive than leave, the gaps close up.
 * Série D keeps its 60 non-exchanged clubs in their regional groups this way; where the newcomers land
 * is invented (`wiki/concepts/invented-data.md`).
 */
function exchangeTeams(championship: Championship, outgoing: Team[], incoming: Team[]): Team[] {
  if (championship.rolloverSlotting !== 'replace-in-place') {
    return [...removeTeams(championship.teams, outgoing), ...incoming];
  }

  const outgoingIds = new Set(outgoing.map((team) => team.id));
  const queue = [...incoming];
  const slotted = championship.teams
    .map((team) => (outgoingIds.has(team.id) ? queue.shift() : team))
    .filter((team): team is Team => team !== undefined);

  return [...slotted, ...queue];
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
 *
 * A round-robin second phase is dealt from the first phase's qualifiers, so the division must still
 * hold all of them once its relegated clubs have left: Série C needs its 8 qualifiers plus the 4 it
 * relegates (REC C Arts. 6º, 15).
 *
 * Exported so the floor can be pinned directly; `getSustainablePromotionCount` is the only caller.
 */
export function getMinimumField(
  phases: ChampionshipPhase[] | undefined,
  relegationCount = 0
): number {
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

  const qualifierFloor =
    secondPhase?.kind === 'round-robin' && firstPhase.kind === 'round-robin'
      ? firstPhase.numberOfGroups * firstPhase.advancingPerGroup + relegationCount
      : 2;

  return Math.max(groupFloor, bracketFloor, qualifierFloor);
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
  const floor = getMinimumField(
    selectPhasesForFieldSize(championship, prospectiveField),
    getRelegationCount(championship)
  );

  const affordable = championship.teams.length + incoming - floor;
  return Math.max(0, Math.min(declared, affordable));
}

function isChampionshipOver(championship: Championship): boolean {
  // A phased championship is over when its final is decided, not when its rounds run out — the
  // round list grows as each phase is generated, so the round count means nothing until then.
  if (championship.phases?.length) return isPhasedChampionshipOver(championship);

  return championship.matchContainer.currentRound >= championship.matchContainer.totalRounds;
}

/** Who crosses one boundary of the pyramid: a division and the one directly below it. */
type BoundaryExchange = {
  /** Clubs going down out of the upper division. */
  relegatedDown: Team[];
  /** Clubs going up out of the lower division. */
  promotedUp: Team[];
};

/** Every boundary's exchange, keyed by the *upper* division's `internalName`. */
type PyramidExchange = Record<string, BoundaryExchange>;

/** One division's side of the roll-over, gathered from the two boundaries it touches. */
type DivisionMoves = {
  /** Clubs going up out of the division. */
  promoted: Team[];
  /** Clubs going down out of the division. */
  relegated: Team[];
  /** Clubs coming down into the division from the one above. */
  relegatedFromAbove: Team[];
  /** Clubs coming up into the division from the one below. */
  promotedFromBelow: Team[];
};

/**
 * Who moves across every boundary of the pyramid at the end of the season.
 *
 * Every boundary is computed from the pre-roll-over tables before any club moves, so a middle
 * division both loses its promoted and relegated clubs and gains the clubs coming from above and
 * below in the same roll-over — nothing a boundary reads has been changed by another boundary.
 *
 * Each division's own counts drive its own side of a boundary. Before MS-103 both sides of every
 * exchange used the *playable* championship's count, which kept the club totals stable only by
 * making A1 relegate 4 when its REC says 2, and A3 promote 2 when its REC says 4. The promotion cap
 * of `getSustainablePromotionCount` is applied per boundary, against the clubs coming down it.
 *
 * Before MS-109 only the boundaries touching the playable division were exchanged, so with the
 * human in Série D, Série C's top clubs never reached Série B.
 *
 * Read twice at roll-over — once by `runEndOfChampionshipActionsForAllChampionships` to move the
 * clubs and once by `buildSeasonSummary` to report the move — so the calculation lives here rather
 * than in either caller, where the two copies could drift apart.
 */
function computePyramidExchange(championshipContainer: ChampionshipContainer): PyramidExchange {
  const exchange: PyramidExchange = {};

  for (const upper of championshipContainer.championships) {
    const lower = getDivisionBelow(championshipContainer, upper);
    if (!upper.isRelegatable || !lower?.isPromotable) continue;

    const relegatedDown = getRelegatedTeams(upper, getRelegationCount(upper));
    const promotedUp = getPromotedTeams(
      lower,
      getSustainablePromotionCount(lower, lower.numberOfPromotableTeams, relegatedDown.length)
    );

    exchange[upper.internalName] = { relegatedDown, promotedUp };
  }

  return exchange;
}

/** `division`'s side of `exchange`: the boundary above it and the boundary below it. */
function movesOfDivision(
  championshipContainer: ChampionshipContainer,
  exchange: PyramidExchange,
  division: Championship
): DivisionMoves {
  const above = getDivisionAbove(championshipContainer, division);
  const boundaryAbove = above ? exchange[above.internalName] : undefined;
  const boundaryBelow = exchange[division.internalName];

  return {
    promoted: boundaryAbove?.promotedUp ?? [],
    relegated: boundaryBelow?.relegatedDown ?? [],
    relegatedFromAbove: boundaryAbove?.relegatedDown ?? [],
    promotedFromBelow: boundaryBelow?.promotedUp ?? [],
  };
}

/**
 * Rolls the whole pyramid over into the next season once the playable division is over: every
 * boundary's exchange is applied at once, every division is reset for the new season, and the
 * playable pointer follows the human's club.
 *
 * The AI divisions are already finished by then — `endRoundForAllChampionships` plays each one to
 * its end on the playable division's last round.
 */
function runEndOfChampionshipActionsForAllChampionships(
  championshipContainer: ChampionshipContainer
): ChampionshipContainer {
  if (!isChampionshipOver(getPlayableChampionship(championshipContainer))) {
    return championshipContainer;
  }

  const exchange = computePyramidExchange(championshipContainer);

  const championships = championshipContainer.championships.map((division) => {
    const moves = movesOfDivision(championshipContainer, exchange, division);
    const teams = exchangeTeams(
      division,
      [...moves.promoted, ...moves.relegated],
      [...moves.relegatedFromAbove, ...moves.promotedFromBelow]
    );
    return resetChampionshipForNewSeason(division, teams);
  });

  return followHumanClub({ ...championshipContainer, championships });
}

/**
 * The one predicate for "this club is the human player's", shared by every lookup so the two
 * definitions cannot drift apart.
 */
const isTeamControlledByHuman = (team: Team): boolean => team.isControlledByHuman;

/**
 * Points the container at the division now holding the human's club, and keeps every division's
 * `hasTeamControlledByHuman` in step with that pointer.
 *
 * The exchange moves clubs, not the pointer: a promoted or relegated human club ends up in another
 * division of the pyramid, which already holds its own state. Nothing is loaded or reseeded — the
 * pointer simply follows the club. A container where no division holds the human's club keeps its
 * pointer.
 */
function followHumanClub(container: ChampionshipContainer): ChampionshipContainer {
  const humanDivision = container.championships.find((championship) =>
    championship.teams.some(isTeamControlledByHuman)
  );
  const playableInternalName = humanDivision?.internalName ?? container.playableInternalName;

  return {
    ...container,
    playableInternalName,
    championships: container.championships.map((championship) => {
      const hasTeamControlledByHuman = championship.internalName === playableInternalName;
      return championship.hasTeamControlledByHuman === hasTeamControlledByHuman
        ? championship
        : { ...championship, hasTeamControlledByHuman };
    }),
  };
}

/**
 * Reads a division from the seed data and initialises it the way a new game does — fixtures
 * generated, phase state zeroed.
 *
 * Throws the repository's plain `Error`s; `initChampionships` runs it inside an `OperationResult`
 * try/catch.
 */
function loadInitialisedChampionship(
  internalName: string,
  hasTeamControlledByHuman: boolean
): Championship {
  const championship = ChampionshipRepository.getChampionship(
    internalName,
    hasTeamControlledByHuman
  );

  return initialisePhaseState({
    ...championship,
    matchContainer: createMatches(
      championship.teams,
      championship.phases,
      championship.phaseEntrants
    ),
  });
}

/**
 * A new game's container: every league division of the entry division's league type, top tier
 * first, with the entry division playable. Cups are not loaded (MS-109).
 */
const initChampionships = (
  championshipInternalName: string
): OperationResult<ChampionshipContainer> => {
  try {
    const entry = ChampionshipRepository.getChampionships().find(
      (championship) => championship.internalName === championshipInternalName
    );
    if (!entry) throw new Error('Championship not found.');
    if (entry.tier === undefined) {
      throw new Error(`${championshipInternalName} is not a league division.`);
    }

    const divisions = ChampionshipRepository.getChampionships(entry.leagueType)
      .filter((championship) => championship.tier !== undefined)
      .sort((a, b) => (a.tier as number) - (b.tier as number))
      .map((championship) =>
        loadInitialisedChampionship(
          championship.internalName,
          championship.internalName === championshipInternalName
        )
      );

    // Every division is generated in the same instant, but the season is aligned explicitly so the
    // pyramid can never start straddling a new year.
    const currentSeason = divisions.find(
      (championship) => championship.internalName === championshipInternalName
    )!.matchContainer.currentSeason;

    const championshipContainer: ChampionshipContainer = {
      championships: divisions.map((championship) => ({
        ...championship,
        matchContainer: { ...championship.matchContainer, currentSeason },
      })),
      playableInternalName: championshipInternalName,
    };

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
    const team = championship.teams.find(isTeamControlledByHuman);
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

/** Draws the human player's club uniformly from every club in the championship. */
const drawTeamForHumanPlayer = (
  championship: Championship,
  dependencies: ChampionshipServiceDependencies = {}
): OperationResult<Team> => {
  try {
    const { rng } = resolveDependencies(dependencies);
    const { teams } = championship;
    if (teams.length === 0) throw new Error('Championship has no teams to draw from.');

    const result = new OperationResult<Team>(teams[rng.nextInt(0, teams.length - 1)]);
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

/** How many of a championship's rounds have been played to the whistle and ended. */
function countCompletedRounds(championship: Championship): number {
  return championship.matchContainer.rounds.filter((round) => round.status === 'ended').length;
}

/**
 * Plays an AI division's rounds, one whole round at a time, until it has completed
 * `targetCompletedRounds` of them or has none left — every phase it completes on the way is resolved.
 * `Infinity` plays it to the end of its season.
 *
 * A championship with no round left to play is returned untouched, so a division that finished
 * early can never overflow its round lookup (MS-103).
 */
function playRoundsOwed(
  championship: Championship,
  targetCompletedRounds: number,
  dependencies: ChampionshipServiceDependencies
): Championship {
  if (!championship?.matchContainer?.rounds) return championship;

  // The division's own stream plays its matches *and* resolves its phases, so a shootout draw
  // cannot leak into another division's results.
  const rng = resolveDependencies(dependencies).rngForDivision(championship.internalName);
  let current = championship;

  for (let guard = 0; guard < MAX_CATCH_UP_ROUNDS; guard++) {
    if (countCompletedRounds(current) >= targetCompletedRounds) break;

    const matchContainer = current.matchContainer;
    const hasRoundToPlay = matchContainer.rounds.some(
      (round) => round.number === matchContainer.currentRound
    );
    if (!hasRoundToPlay) break;

    current = endRound(simulateRoundInOnePass(startRound(current), rng), { rng });
  }

  return current;
}

/**
 * The rounds an AI division should have completed to keep pace with the playable one: the same
 * fraction of its own season, rounded up, so it is never behind. A1 plays 23 rounds to A3's 14, so
 * with the human in A3 it plays two rounds on some A3 rounds and one on others.
 */
function paceTarget(playable: Championship, division: Championship): number {
  const playableSeason = getSeasonRoundCount(playable);
  const divisionSeason = getSeasonRoundCount(division);
  if (playableSeason <= 0) return divisionSeason;

  // Multiplied before dividing, so a round that lands exactly on the pace is an exact integer and
  // is not pushed up a round by floating-point error.
  return Math.ceil((countCompletedRounds(playable) * divisionSeason) / playableSeason);
}

/**
 * Starts the playable championship's round. The AI championships are **not** started here — each
 * round of theirs is started, played and ended in one pass by `endRoundForAllChampionships`, so
 * starting one here would only reset scores they are about to play for themselves.
 */
const startRoundForAllChampionships = (
  championshipContainer: ChampionshipContainer
): OperationResult<ChampionshipContainer> => {
  try {
    const updatedChampionshipContainer = updatePlayableChampionship(
      championshipContainer,
      startRound
    );

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
 * Ends the playable championship's round, then plays each AI division the rounds it owes to keep
 * pace with it (`paceTarget`), each from its own random stream. When the playable season is over,
 * every AI division is played to its end instead — the guarantee that promotion, relegation and the
 * season summary never read an unfinished table.
 *
 * Before MS-103 this stepped the divisions round for round, which only worked because Série A and B
 * both play 38 rounds; the women's divisions do not, and the pairing threw `Championship couldn't be
 * found.` as soon as the shorter one ran out. MS-103 then caught the AI divisions up in one pass at
 * the playable division's phase boundaries and season end. MS-109 holds the whole pyramid, so that
 * pass became a visible stall, and the rounds are dripped across the season instead.
 */
const endRoundForAllChampionships = (
  championshipContainer: ChampionshipContainer,
  dependencies: ChampionshipServiceDependencies = {}
): OperationResult<ChampionshipContainer> => {
  try {
    const previousChampionship = getPlayableChampionship(championshipContainer);
    const playableChampionship = endRound(previousChampionship, dependencies);

    let updatedChampionshipContainer = replaceChampionship(
      championshipContainer,
      playableChampionship
    );

    const seasonIsOver = isChampionshipOver(playableChampionship);

    updatedChampionshipContainer = {
      ...updatedChampionshipContainer,
      championships: updatedChampionshipContainer.championships.map((championship) =>
        championship.internalName === playableChampionship.internalName
          ? championship
          : playRoundsOwed(
              championship,
              seasonIsOver ? Infinity : paceTarget(playableChampionship, championship),
              dependencies
            )
      ),
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

function toSeasonSummaryTeam(team: Team): SeasonSummaryTeam {
  return {
    id: team.id,
    shortName: team.shortName,
    abbreviation: team.abbreviation,
    colors: team.colors,
  };
}

/**
 * One division's line in the summary. `promoted` and `relegated` are left out rather than passed
 * empty when the container never computed that half of the division's exchange — see
 * `SeasonSummaryDivision`. A division with no neighbour on that side is empty rather than unknown,
 * whether the container computed it or not: the top of the pyramid promotes nobody.
 */
function buildSummaryDivision(
  championship: Championship,
  exchange: { promoted?: Team[]; relegated?: Team[] }
): SeasonSummaryDivision {
  const classification = buildFinalClassification(championship);
  const champion = classification[0]?.team;
  const runnerUp = classification[1]?.team;

  // The top two are named above the list, so they come out of it: "also promoted" is the rest of
  // the promotion, which for the men's divisions is third and fourth place.
  const topTwoIds = new Set([champion?.id, runnerUp?.id].filter(Boolean));
  const promoted = championship.isPromotable ? exchange.promoted : [];
  const relegated = championship.isRelegatable ? exchange.relegated : [];

  return {
    divisionName: championship.name,
    champion: champion && toSeasonSummaryTeam(champion),
    runnerUp: runnerUp && toSeasonSummaryTeam(runnerUp),
    isPromotable: championship.isPromotable,
    isRelegatable: championship.isRelegatable,
    otherPromotedTeams: promoted
      ?.filter((team) => !topTwoIds.has(team.id))
      .map(toSeasonSummaryTeam),
    relegatedTeams: relegated?.map(toSeasonSummaryTeam),
  };
}

/**
 * The end-of-season report for every division the container held, top of the pyramid first.
 *
 * Must run *before* `runEndOfChampionshipActions`, which resets each championship and throws away
 * the tables this reads.
 */
const buildSeasonSummary = (
  championshipContainer: ChampionshipContainer
): OperationResult<SeasonSummary> => {
  try {
    const playableChampionship = getPlayableChampionship(championshipContainer);
    const promotionChampionship = getDivisionAbove(championshipContainer, playableChampionship);
    const relegationChampionship = getDivisionBelow(championshipContainer, playableChampionship);
    const exchange = computePyramidExchange(championshipContainer);
    const moves = movesOfDivision(championshipContainer, exchange, playableChampionship);

    const divisions: SeasonSummaryDivision[] = [];

    if (promotionChampionship && playableChampionship.isPromotable) {
      divisions.push(
        buildSummaryDivision(promotionChampionship, { relegated: moves.relegatedFromAbove })
      );
    }

    divisions.push(
      buildSummaryDivision(playableChampionship, {
        promoted: moves.promoted,
        relegated: moves.relegated,
      })
    );

    if (relegationChampionship && playableChampionship.isRelegatable) {
      divisions.push(
        buildSummaryDivision(relegationChampionship, { promoted: moves.promotedFromBelow })
      );
    }

    const result = new OperationResult<SeasonSummary>({
      season: playableChampionship.matchContainer.currentSeason,
      divisions,
    });
    result.setSuccess();
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const result = new OperationResult<SeasonSummary>({ season: 0, divisions: [] });
    result.setError({ errorCode: 'exception', message });
    return result;
  }
};

const getPhaseView = (championship: Championship, options?: PhaseViewOptions): PhaseView =>
  buildPhaseView(championship, options);

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
  drawTeamForHumanPlayer,
  getMatchesForCurrentRound,
  startRoundForAllChampionships,
  endRoundForAllChampionships,
  runEndOfChampionshipActions,
  buildSeasonSummary,
};
