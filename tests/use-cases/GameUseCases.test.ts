import { describe, expect, it } from '@jest/globals';
import GameUseCases from '../../use-cases/GameUseCases';
import { GameState } from '../../game-engine/GameState';
import { Championship } from '../../core/models/Championship';

function buildState(): GameState {
  return {
    championshipContainer: {
      playableChampionship: {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Mock Championship',
        internalName: 'mock-championship',
        numberOfTeams: 0,
        teams: [],
        standings: [],
        matchContainer: {
          timer: 0,
          currentSeason: 2026,
          currentRound: 1,
          totalRounds: 0,
          rounds: [],
        },
        type: 'double-round-robin',
        hasTeamControlledByHuman: false,
        isPromotable: false,
        isRelegatable: false,
      } as Championship,
    },
    hasError: false,
    errorMessage: '',
    currentScreen: 'home',
    gameConfig: {
      clockSpeed: 750,
    },
  };
}

describe('GameUseCases', () => {
  describe('setErrorMessage', () => {
    it('sets hasError=true and updates errorMessage', () => {
      const state = buildState();
      const useCases = new GameUseCases(state);

      const nextState = useCases.setErrorMessage('Something went wrong');

      expect(nextState.hasError).toBe(true);
      expect(nextState.errorMessage).toBe('Something went wrong');
      expect(nextState.currentScreen).toBe(state.currentScreen);
    });
  });

  describe('setCurrentScreen', () => {
    it('updates currentScreen', () => {
      const state = buildState();
      const useCases = new GameUseCases(state);

      const nextState = useCases.setCurrentScreen('match-simulator');

      expect(nextState.currentScreen).toBe('match-simulator');
      expect(nextState.gameConfig).toEqual(state.gameConfig);
    });
  });

  describe('updateClockSpeed', () => {
    it('updates only gameConfig.clockSpeed', () => {
      const state = buildState();
      const useCases = new GameUseCases(state);

      const nextState = useCases.updateClockSpeed(1200);

      expect(nextState.gameConfig.clockSpeed).toBe(1200);
      expect(nextState.currentScreen).toBe(state.currentScreen);
      expect(nextState.championshipContainer).toEqual(state.championshipContainer);
    });
  });
});
