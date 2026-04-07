import { beforeEach, describe, expect, it } from '@jest/globals';
import GameRepository from '../../../infra/repositories/GameRepository';
import { GameState } from '../../../game-engine/GameState';
import { Championship } from '../../../core/models/Championship';

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
    currentScreen: 'TeamManager',
    gameConfig: {
      clockSpeed: 1000,
    },
  };
}

describe('GameRepository', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saves and loads the game state from local storage', () => {
    const state = buildState();

    GameRepository.saveGame(state);

    expect(GameRepository.loadGame()).toEqual(state);
  });

  it('throws when no saved game exists', () => {
    expect(() => GameRepository.loadGame()).toThrow('Saved game could not be found.');
  });
});
