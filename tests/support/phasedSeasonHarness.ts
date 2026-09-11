/**
 * Plays phased fixture championships round by round through `ChampionshipService`, with results
 * decided by a script rather than the match engine.
 *
 * Not a test file — `tests/support` is outside Jest's `*.test.ts` pattern.
 */
import ChampionshipService from '../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../src/domain/models/Championship';
import ChampionshipPhase from '../../src/domain/models/ChampionshipPhase';
import Match from '../../src/domain/models/Match';
import Player from '../../src/domain/models/Player';
import { Team } from '../../src/domain/models/Team';
import { createMatches } from '../../src/domain/features/fixture-generation/FixtureGenerator';
import {
  groupsOfPhase,
  initialisePhaseState,
} from '../../src/domain/features/phases/PhaseProgression';
import { RandomProvider } from '../../src/domain/features/match-simulation/types';

const rng: RandomProvider = { nextInt: (min) => min };

const POSITIONS = ['GK', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW', 'FW'] as const;

export function buildTeam(index: number): Team {
  return {
    id: `team-${String(index).padStart(3, '0')}` as Team['id'],
    fullName: `Team ${index}`,
    shortName: `T${index}`,
    abbreviation: `T${String(index).padStart(3, '0')}`,
    colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
    players: POSITIONS.map((position, playerIndex) => ({
      id: `player-${index}-${playerIndex}` as Player['id'],
      position,
      name: `Player ${index}-${playerIndex}`,
      strength: 50,
      xp: 0,
      isStarter: true,
      isSub: false,
    })),
    morale: 50,
    isControlledByHuman: false,
  };
}

export const number = (team: Team) => Number(team.id.replace('team-', ''));

export function buildChampionship(teamCount: number, phases: ChampionshipPhase[]): Championship {
  const teams = Array.from({ length: teamCount }, (_, index) => buildTeam(index + 1));

  return initialisePhaseState({
    id: 'fixture',
    name: 'fixture',
    internalName: 'fixture',
    numberOfTeams: teamCount,
    teams,
    standings: teams.map((team, index) => ({
      team,
      position: index + 1,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    })),
    matchContainer: createMatches(teams, phases),
    type: 'group-stage-knockout',
    leagueType: 'mens',
    hasTeamControlledByHuman: true,
    phases,
    isPromotable: false,
    isRelegatable: false,
  });
}

/** Decides a match: `[homeGoals, awayGoals]`. */
export type Script = (match: Match, phaseIndex: number) => [number, number];

/** The lower-numbered club always wins 2-0, so every table follows club number. */
export const lowerNumberWins: Script = (match) =>
  number(match.homeTeam) < number(match.awayTeam) ? [2, 0] : [0, 2];

export function playRound(championship: Championship, script: Script): Championship {
  const container: ChampionshipContainer = { playableChampionship: championship };
  const started = ChampionshipService.startRoundForAllChampionships(container);
  if (!started.succeeded) throw new Error(started.error?.message);

  const current = started.getResult().playableChampionship;
  const { currentRound } = current.matchContainer;
  const rounds = current.matchContainer.rounds.map((round) =>
    round.number !== currentRound
      ? round
      : {
          ...round,
          matches: round.matches.map((match) => {
            const [homeTeamScore, awayTeamScore] = script(match, round.phaseIndex ?? 0);
            return { ...match, homeTeamScore, awayTeamScore };
          }),
        }
  );

  const ended = ChampionshipService.endRoundForAllChampionships(
    { playableChampionship: { ...current, matchContainer: { ...current.matchContainer, rounds } } },
    { rng }
  );
  if (!ended.succeeded) throw new Error(ended.error?.message);
  return ended.getResult().playableChampionship;
}

/** Plays until `until` holds, or the season ends. */
export function playUntil(
  championship: Championship,
  script: Script,
  until: (championship: Championship) => boolean = () => false
): Championship {
  let current = championship;
  for (let guard = 0; guard < 200; guard++) {
    if (until(current)) return current;
    const { currentRound, rounds } = current.matchContainer;
    if (!rounds.some((round) => round.number === currentRound)) return current;
    current = playRound(current, script);
  }
  throw new Error('Season did not finish');
}

export const inPhase = (index: number) => (championship: Championship) =>
  (championship.currentPhaseIndex ?? 0) >= index;

export function matchesOf(championship: Championship, phaseIndex: number): Match[] {
  return championship.matchContainer.rounds
    .filter((round) => round.phaseIndex === phaseIndex)
    .flatMap((round) => round.matches);
}

/** Clubs of each group of a phase, by club number, in ascending order. */
export function groupMembers(championship: Championship, phaseIndex: number): number[][] {
  const groups = groupsOfPhase(championship.matchContainer.rounds, phaseIndex);
  const members: number[][] = [];
  for (const [teamId, group] of groups) {
    (members[group] ??= []).push(Number(teamId.replace('team-', '')));
  }
  return members.map((group) => group.sort((a, b) => a - b));
}

/** Pairs of a knockout phase as sorted club-number pairs, in tie order. */
export function tiePairs(championship: Championship, phaseIndex: number): number[][] {
  const firstLegs = matchesOf(championship, phaseIndex).filter((match) => match.leg === 1);
  return firstLegs.map((match) =>
    [number(match.homeTeam), number(match.awayTeam)].sort((a, b) => a - b)
  );
}
