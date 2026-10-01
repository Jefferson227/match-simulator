import ChampionshipContainer from '../models/ChampionshipContainer';
import { Championship } from '../models/Championship';
import Coach from '../models/Coach';
import Player from '../models/Player';
import RetiredCoach from '../models/RetiredCoach';
import RetiredPlayer from '../models/RetiredPlayer';
import RetirementReport, { RetirementReportEntry } from '../models/RetirementReport';
import { Team } from '../models/Team';
import OperationResult from '../results/OperationResult';
import { RandomProvider } from '../features/match-simulation/types';
import { rollChance, shouldRetire } from '../features/retirement/RetirementPolicy';
import {
  createReplacementCoach,
  createYouthPlayer,
  getPlayerGender,
} from '../features/retirement/ReplacementFactory';
import { getPlayableChampionship } from '../features/pyramid/Pyramid';
import { PLAYER_TO_COACH_CHANCE } from '../constants/RetirementConstants';
import { getRandomNumber } from '../utils/Utils';
import {
  SeasonRetirements,
  buildSeasonRetirements,
} from '../features/retirement/SeasonRetirements';

/**
 * Season ageing and retirement (MS-113). The rules are `wiki/specs/player-retirement.md`.
 *
 * Runs once per season, on the finished season's container and *before* the pyramid roll-over, so
 * the next season's fixtures and standings are built from the aged, replaced squads.
 */

export type SeasonAgeingInput = {
  championshipContainer: ChampionshipContainer;
  coachPool: Coach[];
  retiredPlayers: RetiredPlayer[];
  retiredCoaches: RetiredCoach[];
};

export type SeasonAgeingOutput = SeasonAgeingInput & {
  /** The human's club's retirements. Absent when no club in the container is the human's. */
  report?: RetirementReport;
};

const defaultRng: RandomProvider = { nextInt: getRandomNumber };

/** Everything one run accumulates while it walks the pyramid. Local to a single run. */
type AgeingRun = {
  season: number;
  rng: RandomProvider;
  /** Every name in use, so a generated name is not a second copy of one. Grows as names are made. */
  takenNames: Set<string>;
  newPoolCoaches: Coach[];
  retiredPlayers: RetiredPlayer[];
  retiredCoaches: RetiredCoach[];
  report?: RetirementReport;
  /** Each club once, by id: a club listed in more than one championship is aged only once. */
  agedTeams: Map<Team['id'], Team>;
};

function collectTakenNames(container: ChampionshipContainer, coachPool: Coach[]): Set<string> {
  const names = new Set<string>(coachPool.map((coach) => coach.name));
  const championships = [...container.championships, ...(container.cups ?? [])];

  for (const championship of championships) {
    for (const team of championship.teams) {
      team.players.forEach((player) => names.add(player.name));
      if (team.coach) names.add(team.coach.name);
    }
  }

  return names;
}

function toRetiredPlayer(
  player: Player,
  team: Team,
  championship: Championship,
  season: number,
  becameCoach: boolean
): RetiredPlayer {
  // The match- and season-scoped fields are left behind: a retiree never plays again.
  const {
    stamina,
    enteredAtMinute,
    leftAtMinute,
    isStarter,
    isSub,
    seasonGames,
    seasonGoals,
    ...career
  } = player;
  return {
    ...career,
    isRetired: true,
    retiredInSeason: season,
    lastTeamId: team.id,
    lastTeamShortName: team.shortName,
    lastChampionshipInternalName: championship.internalName,
    becameCoach,
  };
}

/** A retiring player's second career: the coach pool gets someone of the same name and age. */
function toPoolCoach(player: Player): Coach {
  return { name: player.name, age: player.age, nationalities: [...player.nationalities] };
}

/**
 * `team`'s squad a year older, with every retiree replaced in place by a generated youth player.
 * The retirement roll reads the age just reached.
 */
function ageSquad(team: Team, championship: Championship, run: AgeingRun): Team {
  let aged: Team = {
    ...team,
    players: team.players.map((player) => ({ ...player, age: player.age + 1 })),
  };
  const gender = getPlayerGender(championship.leagueType);
  const entries: RetirementReportEntry[] = [];

  for (const player of [...aged.players]) {
    if (!shouldRetire(player.age, 'player', run.rng)) continue;

    const becameCoach = rollChance(PLAYER_TO_COACH_CHANCE, run.rng);
    if (becameCoach) run.newPoolCoaches.push(toPoolCoach(player));

    const retired = toRetiredPlayer(player, team, championship, run.season, becameCoach);
    run.retiredPlayers.push(retired);

    const replacement = createYouthPlayer(player, aged, gender, run.takenNames, run.rng);
    run.takenNames.add(replacement.name);
    aged = {
      ...aged,
      players: aged.players.map((candidate) =>
        candidate.id === player.id ? replacement : candidate
      ),
    };

    entries.push({ retired, replacement, becameCoach });
  }

  if (team.isControlledByHuman) {
    run.report = { season: run.season, teamId: team.id, entries };
  }

  return aged;
}

/**
 * `team`'s coach a year older, replaced by a generated coach when they retire. The human is the
 * coach of their own club, so that club's `coach` is left alone; a club with no coach keeps none.
 */
function ageCoach(team: Team, championship: Championship, run: AgeingRun): Team {
  if (team.isControlledByHuman || !team.coach) return team;

  const coach: Coach = { ...team.coach, age: team.coach.age + 1 };
  if (!shouldRetire(coach.age, 'coach', run.rng)) return { ...team, coach };

  run.retiredCoaches.push({
    ...coach,
    isRetired: true,
    retiredInSeason: run.season,
    lastTeamId: team.id,
    lastTeamShortName: team.shortName,
    lastChampionshipInternalName: championship.internalName,
  });

  const replacement = createReplacementCoach(
    championship.leagueType,
    run.takenNames,
    run.rng,
    coach.name
  );
  run.takenNames.add(replacement.name);

  return { ...team, coach: replacement };
}

function ageChampionship(championship: Championship, run: AgeingRun): Championship {
  const teams = championship.teams.map((team) => {
    const alreadyAged = run.agedTeams.get(team.id);
    if (alreadyAged) return alreadyAged;

    const aged = ageCoach(ageSquad(team, championship, run), championship, run);
    run.agedTeams.set(team.id, aged);
    return aged;
  });

  return { ...championship, teams };
}

/**
 * The pool a year older, less the coaches who retire out of it. Only the coaches who were in the
 * pool before this run are rolled: a player who has just become a coach is not rolled again until
 * next season.
 */
function agePool(coachPool: Coach[], run: AgeingRun): Coach[] {
  const staying: Coach[] = [];

  for (const poolCoach of coachPool) {
    const coach: Coach = { ...poolCoach, age: poolCoach.age + 1 };
    if (shouldRetire(coach.age, 'coach', run.rng)) {
      run.retiredCoaches.push({ ...coach, isRetired: true, retiredInSeason: run.season });
    } else {
      staying.push(coach);
    }
  }

  return staying;
}

function ageContainer(input: SeasonAgeingInput, rng: RandomProvider): SeasonAgeingOutput {
  const { championshipContainer, coachPool } = input;

  const run: AgeingRun = {
    season: getPlayableChampionship(championshipContainer).matchContainer.currentSeason,
    rng,
    takenNames: collectTakenNames(championshipContainer, coachPool),
    newPoolCoaches: [],
    retiredPlayers: [...input.retiredPlayers],
    retiredCoaches: [...input.retiredCoaches],
    agedTeams: new Map(),
  };

  const championships = championshipContainer.championships.map((championship) =>
    ageChampionship(championship, run)
  );
  const cups = championshipContainer.cups?.map((cup) => ageChampionship(cup, run));
  const agedPool = agePool(coachPool, run);

  return {
    championshipContainer: {
      ...championshipContainer,
      championships,
      ...(cups && { cups }),
    },
    coachPool: [...agedPool, ...run.newPoolCoaches],
    retiredPlayers: run.retiredPlayers,
    retiredCoaches: run.retiredCoaches,
    ...(run.report && { report: run.report }),
  };
}

/**
 * Ages every player and coach in the container and the coach pool by a year, then rolls each for
 * retirement: a retired player is replaced in their club by a generated youth player and may join
 * the coach pool, a retired club coach is replaced by a generated coach, and a retired pool coach
 * simply leaves the pool. Every retiree is appended to the retired lists.
 *
 * Nothing in `input` is mutated.
 */
const runSeasonAgeing = (
  input: SeasonAgeingInput,
  dependencies: { rng?: RandomProvider } = {}
): OperationResult<SeasonAgeingOutput> => {
  try {
    const result = new OperationResult<SeasonAgeingOutput>(
      ageContainer(input, dependencies.rng ?? defaultRng)
    );
    result.setSuccess();
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const result = new OperationResult<SeasonAgeingOutput>({} as SeasonAgeingOutput);
    result.setError({ errorCode: 'exception', message: errorMessage });
    return result;
  }
};

/** Everyone who retired in `season`, grouped by division for the Retirements screen. */
const getSeasonRetirements = (
  input: Omit<SeasonAgeingInput, 'coachPool'>,
  season: number
): OperationResult<SeasonRetirements> => {
  try {
    const result = new OperationResult<SeasonRetirements>(
      buildSeasonRetirements(
        input.championshipContainer,
        input.retiredPlayers,
        input.retiredCoaches,
        season
      )
    );
    result.setSuccess();
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const result = new OperationResult<SeasonRetirements>({} as SeasonRetirements);
    result.setError({ errorCode: 'exception', message: errorMessage });
    return result;
  }
};

export default {
  runSeasonAgeing,
  getSeasonRetirements,
};
