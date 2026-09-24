import { describe, expect, it } from '@jest/globals';
import ChampionshipPhase from '../../../../src/domain/models/ChampionshipPhase';
import { Championship } from '../../../../src/domain/models/Championship';
import { isPhasedChampionshipOver } from '../../../../src/domain/features/phases/PhaseProgression';
import GameStateMapper from '../../../../src/infrastructure/mappers/GameStateMapper';
import { GameState } from '../../../../src/game-engine/GameState';
import { getPlayableChampionship } from '../../../../src/domain/features/pyramid/Pyramid';
import { containerOf } from '../../../support/containerOf';
import {
  buildChampionship,
  inPhase,
  lowerNumberWins,
  matchesOf,
  number,
  playRound,
  playUntil,
  Script,
} from '../../../support/phasedSeasonHarness';

/**
 * Série D 2026's tail in miniature: a league of 8 → quarter-finals → a semifinal with a playoff
 * among the quarter-final losers (REC D 2026 Art. 21) → the final.
 *
 * Under `lowerNumberWins` the league ranks the clubs 1..8, the quarter-finals send 1, 4, 2, 3 on and
 * knock 8, 5, 7, 6 out, and the losers' accumulated points rank them 5, 6, 7, 8 — Bloco II.
 */
const phases: ChampionshipPhase[] = [
  {
    kind: 'round-robin',
    name: 'Liga',
    numberOfGroups: 1,
    teamsPerGroup: 8,
    legs: 1,
    advancingPerGroup: 8,
  },
  {
    kind: 'knockout',
    name: 'Quartas',
    numberOfTies: 4,
    legs: 2,
    secondLegHost: 'higher-seed',
    tiebreakers: ['goal-difference', 'penalties'],
  },
  {
    kind: 'knockout',
    name: 'Semifinal',
    numberOfTies: 2,
    legs: 2,
    secondLegHost: 'accumulated-points',
    tiebreakers: ['goal-difference', 'penalties'],
    playoff: {
      name: 'Playoffs',
      from: 'previous-phase-losers',
      pairs: [
        [1, 4],
        [2, 3],
      ],
      secondLegHost: 'higher-seed',
      tiebreakers: ['goal-difference', 'seed'],
    },
  },
  {
    kind: 'knockout',
    name: 'Final',
    numberOfTies: 1,
    legs: 2,
    secondLegHost: 'accumulated-points',
    tiebreakers: ['goal-difference', 'penalties'],
  },
];

const SEMIFINAL = 2;
const FINAL = 3;

const inSemifinal = playUntil(buildChampionship(8, phases), lowerNumberWins, inPhase(SEMIFINAL));
const playoffMatches = (championship: Championship) =>
  matchesOf(championship, SEMIFINAL).filter((match) => match.bracket === 'playoff');
const pairsOf = (matches: ReturnType<typeof playoffMatches>) =>
  matches
    .filter((match) => match.leg === 1)
    .map((match) => [number(match.homeTeam), number(match.awayTeam)].sort((a, b) => a - b));

describe('phase progression — playoff alongside the semifinal (REC D 2026 Art. 21)', () => {
  it('builds the playoff from the quarter-final losers, paired Bloco II 1º×4º and 2º×3º', () => {
    expect(pairsOf(playoffMatches(inSemifinal))).toEqual([
      [5, 8],
      [6, 7],
    ]);
  });

  it('gives the 1º and 2º of Bloco II the second leg', () => {
    const secondLegs = playoffMatches(inSemifinal).filter((match) => match.leg === 2);
    expect(secondLegs.map((match) => number(match.homeTeam))).toEqual([5, 6]);
  });

  it('plays the playoff in the semifinal’s own rounds, adding none', () => {
    const rounds = inSemifinal.matchContainer.rounds.filter(
      (round) => round.phaseIndex === SEMIFINAL
    );
    expect(rounds).toHaveLength(2);
    expect(rounds.map((round) => round.matches.length)).toEqual([4, 4]);
  });

  it('keeps the playoff clubs out of the survivors but in the phase table', () => {
    expect(inSemifinal.survivingTeamIds?.map((id) => Number(id.slice(5)))).toEqual([1, 4, 2, 3]);
    expect(inSemifinal.standings.map((standing) => number(standing.team)).sort()).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
  });

  it('waits for the playoff before resolving the semifinal', () => {
    const afterOneLeg = playRound(inSemifinal, lowerNumberWins);

    expect(afterOneLeg.currentPhaseIndex).toBe(SEMIFINAL);
    expect(afterOneLeg.playoffWinnerIds).toBeUndefined();
  });

  describe('once the semifinal is resolved', () => {
    const inFinal = playUntil(inSemifinal, lowerNumberWins, inPhase(FINAL));

    it('stores the playoff winners', () => {
      expect(inFinal.playoffWinnerIds?.map((id) => Number(id.slice(5)))).toEqual([5, 6]);
    });

    it('sends only the semifinal winners to the final', () => {
      const finalists = matchesOf(inFinal, FINAL).map((match) =>
        [number(match.homeTeam), number(match.awayTeam)].sort()
      );
      expect(finalists).toEqual([
        [1, 2],
        [1, 2],
      ]);
    });

    it('records the semifinalists as the phase’s participants, not the playoff clubs', () => {
      const semifinalists = inFinal.phaseParticipants?.[SEMIFINAL]?.map((id) =>
        Number(id.slice(5))
      );
      expect(semifinalists?.sort()).toEqual([1, 2, 3, 4]);
    });

    it('counts the playoff legs in the accumulated points', () => {
      const club5 = inFinal.accumulatedStandings?.find((standing) => number(standing.team) === 5);
      // League: beat 6, 7, 8 (9 pts). Quarter-final: lost both legs to 4. Playoff: beat 8 twice.
      expect(club5?.points).toBe(15);
      expect(club5?.wins).toBe(5);
    });

    it('is not over until the final is played', () => {
      expect(isPhasedChampionshipOver(inFinal)).toBe(false);
      expect(isPhasedChampionshipOver(playUntil(inFinal, lowerNumberWins))).toBe(true);
    });

    it('keeps the playoff winners across save and load', () => {
      const state = {
        championshipContainer: containerOf(inFinal),
        hasError: false,
        errorMessage: '',
        leagueType: 'mens',
        coachName: '',
        currentScreen: 'TeamManager',
        gameConfig: { clockSpeed: 1000 },
      } as GameState;
      const saved = JSON.parse(JSON.stringify(GameStateMapper.dehydrate(state)));
      const loaded = getPlayableChampionship(GameStateMapper.hydrate(saved).championshipContainer);

      expect(loaded.playoffWinnerIds).toEqual(inFinal.playoffWinnerIds);
      expect(playoffMatches(loaded).every((match) => match.bracket === 'playoff')).toBe(true);
      expect(playoffMatches(loaded)).toHaveLength(4);
    });
  });

  it('decides a fully level playoff on the better seed, with no shootout', () => {
    const levelPlayoffs: Script = (match, phaseIndex) =>
      phaseIndex === SEMIFINAL && match.bracket === 'playoff'
        ? [1, 1]
        : lowerNumberWins(match, phaseIndex);

    const inFinal = playUntil(inSemifinal, levelPlayoffs, inPhase(FINAL));

    expect(inFinal.playoffWinnerIds?.map((id) => Number(id.slice(5)))).toEqual([5, 6]);
    expect(playoffMatches(inFinal).some((match) => match.penaltyShootout)).toBe(false);
  });
});
