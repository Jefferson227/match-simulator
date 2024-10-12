import { matchReducer } from './matchReducer';
import utils from '../utils/utils';

const { addPlayerAttributes } = utils;

jest.mock('../utils/utils', () => ({
  addPlayerAttributes: jest.fn(),
}));

const initialState = {
  matches: [],
  teamSquadView: null,
};

test('SET_MATCHES should add a match with home and visitor teams', () => {
  const homeTeam = { players: [], substitutes: [], name: 'Home Team' };
  const visitorTeam = { players: [], substitutes: [], name: 'Visitor Team' };

  addPlayerAttributes.mockImplementation((players) => players); // Mock the addPlayerAttributes function

  const action = {
    type: 'SET_MATCHES',
    payload: { homeTeam, visitorTeam },
  };

  const newState = matchReducer(initialState, action);

  expect(newState.matches.length).toBe(1);
  expect(newState.matches[0].homeTeam.name).toBe('Home Team');
  expect(newState.matches[0].visitorTeam.name).toBe('Visitor Team');
  expect(addPlayerAttributes).toHaveBeenCalledWith(homeTeam.players);
  expect(addPlayerAttributes).toHaveBeenCalledWith(visitorTeam.substitutes);
});

test('SET_SCORER should update the last scorer of a match', () => {
  const state = {
    matches: [
      { id: 'match1', homeTeam: {}, visitorTeam: {}, lastScorer: null },
    ],
  };

  const action = {
    type: 'SET_SCORER',
    payload: { matchId: 'match1', scorer: { playerName: 'John', time: '45' } },
  };

  const newState = matchReducer(state, action);

  expect(newState.matches[0].lastScorer).toEqual({
    playerName: 'John',
    time: '45',
  });
});

test('INCREASE_SCORE should increase the score of the correct team', () => {
  const state = {
    matches: [
      {
        id: 'match1',
        homeTeam: { isHomeTeam: true, score: 1 },
        visitorTeam: { isHomeTeam: false, score: 2 },
      },
    ],
  };

  const action = {
    type: 'INCREASE_SCORE',
    payload: { matchId: 'match1', scorerTeam: { isHomeTeam: true } },
  };

  const newState = matchReducer(state, action);

  expect(newState.matches[0].homeTeam.score).toBe(2); // Home team score incremented
  expect(newState.matches[0].visitorTeam.score).toBe(2); // Visitor team score unchanged
});

test('SET_TEAM_SQUAD_VIEW should set the teamSquadView', () => {
  const action = {
    type: 'SET_TEAM_SQUAD_VIEW',
    payload: { teamSquadView: { name: 'Team A' } },
  };

  const newState = matchReducer(initialState, action);

  expect(newState.teamSquadView).toEqual({ name: 'Team A' });
});

test('CONFIRM_SUBSTITUTION should update players and substitutes after substitution', () => {
  const state = {
    matches: [
      {
        id: 'match1',
        homeTeam: {
          isHomeTeam: true,
          players: [
            { id: 1, order: 1 },
            { id: 2, order: 2 },
          ],
          substitutes: [{ id: 3, order: 3 }],
        },
        visitorTeam: { isHomeTeam: false, players: [], substitutes: [] },
      },
    ],
  };

  const action = {
    type: 'CONFIRM_SUBSTITUTION',
    payload: {
      matchId: 'match1',
      team: { isHomeTeam: true },
      selectedPlayer: { id: 2 },
      selectedSubstitute: { id: 3, order: 2 },
    },
  };

  const newState = matchReducer(state, action);

  expect(newState.matches[0].homeTeam.players).toEqual([
    { id: 1, order: 1 },
    { id: 3, order: 2 }, // The substitute player replaces the selected player
  ]);
  expect(newState.matches[0].homeTeam.substitutes.length).toBe(0); // Substitute is removed
});
