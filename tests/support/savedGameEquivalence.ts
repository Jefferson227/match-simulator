/**
 * The MS-108 equivalence rule, as the requirements state it.
 *
 * A dehydrated save does not preserve the *historical snapshot* a played fixture carries — the
 * clubs' morale and their players' xp / strength / isStarter / isSub as they stood that round. On
 * reload every past match references the club as it is now, resolved from `championship.teams` by
 * id. The round about to be or being played is the exception: it is stored whole and must come back
 * byte-identical.
 *
 * So "the reloaded state equals the original" means: equal after the *original* has had the same
 * resolution applied to it. `expectEquivalent` is that comparison.
 *
 * Written against the model, not against `GameStateMapper`, so a test using it cannot pass by
 * sharing a bug with the code under test.
 *
 * Not a test file — `tests/support` is outside Jest's `*.test.ts` pattern.
 */
import { expect } from '@jest/globals';
import { Championship } from '../../src/domain/models/Championship';
import Player from '../../src/domain/models/Player';
import Standing from '../../src/domain/models/Standing';
import { Team } from '../../src/domain/models/Team';
import { GameState } from '../../src/game-engine/GameState';

function resolveChampionship(championship: Championship): Championship {
  const canonical = new Map(championship.teams.map((team) => [team.id, team]));
  const { currentRound } = championship.matchContainer;

  const currentRoundTeams = new Map(
    championship.matchContainer.rounds
      .filter((round) => round.number === currentRound)
      .flatMap((round) => round.matches)
      .flatMap((match) => [match.homeTeam, match.awayTeam])
      .map((team) => [team.id, team] as const)
  );

  const team = (candidate: Team) => canonical.get(candidate.id) ?? candidate;
  const standings = (rows: Standing[]) => rows.map((row) => ({ ...row, team: team(row.team) }));
  const playerOf = (player: Player, holder: Team) =>
    holder.players.find((candidate) => candidate.id === player.id) ?? player;

  return {
    ...championship,
    standings: standings(championship.standings),
    ...(championship.firstPhaseStandings && {
      firstPhaseStandings: standings(championship.firstPhaseStandings),
    }),
    ...(championship.phaseStandings && {
      phaseStandings: championship.phaseStandings.map(standings),
    }),
    ...(championship.accumulatedStandings && {
      accumulatedStandings: standings(championship.accumulatedStandings),
    }),
    ...(championship.phaseEntrants && {
      phaseEntrants: championship.phaseEntrants.map((entrants) => entrants.map(team)),
    }),
    matchContainer: {
      ...championship.matchContainer,
      rounds: championship.matchContainer.rounds.map((round) => ({
        ...round,
        matches: round.matches.map((match) => {
          const pick = (candidate: Team) =>
            round.number === currentRound
              ? (currentRoundTeams.get(candidate.id) ?? team(candidate))
              : team(candidate);
          const homeTeam = pick(match.homeTeam);
          const awayTeam = pick(match.awayTeam);
          return {
            ...match,
            homeTeam,
            awayTeam,
            scorers: match.scorers.map((scorer) => ({
              ...scorer,
              player: playerOf(scorer.player, scorer.scorerTeam === 'home' ? homeTeam : awayTeam),
            })),
          };
        }),
      })),
    },
  } as Championship;
}

/** The original state with every reference resolved the way a reload resolves it. */
export function resolveFromTeams(state: GameState): GameState {
  const { playableChampionship, promotionChampionship, relegationChampionship } =
    state.championshipContainer;

  return {
    ...state,
    championshipContainer: {
      playableChampionship: resolveChampionship(playableChampionship),
      ...(promotionChampionship && {
        promotionChampionship: resolveChampionship(promotionChampionship),
      }),
      ...(relegationChampionship && {
        relegationChampionship: resolveChampionship(relegationChampionship),
      }),
    },
  };
}

/** Asserts a reloaded state equals the original under the equivalence rule. */
export function expectEquivalent(reloaded: GameState, original: GameState): void {
  expect(reloaded).toEqual(resolveFromTeams(original));
}

/** The current round's fixtures, which must survive a round-trip byte-identically. */
export function currentRoundMatches(championship: Championship) {
  return championship.matchContainer.rounds
    .filter((round) => round.number === championship.matchContainer.currentRound)
    .flatMap((round) => round.matches);
}
