/// <reference types="@testing-library/jest-dom" />
/**
 * MS-108: the men's half of MS-107's promotion test, which MS-107 could not deliver.
 *
 * `TeamManagerAfterPromotion.test.tsx` proves the screen renders the human's new division after a
 * promoting roll-over, but it is played on the women's pyramid because the men's one did not fit in
 * `localStorage`: a played Série D season serialised to 5,132,127 code units against a 5,000,000
 * quota, so `SAVE_GAME` threw `QuotaExceededError`, `state.hasError` went true and the game was
 * silently not saved.
 *
 * This drives the real men's roll-over — Série D's 64 clubs, promoted into Série C — dispatches
 * `SAVE_GAME` through the engine, and demands no error and a rendered club.
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import TeamManager from './TeamManager';
import i18n from '../../../i18n';
import { GameEngineProvider } from '../../contexts/GameEngineContext';
import { GameEngine } from '../../../game-engine/GameEngine';
import ChampionshipService from '../../../domain/services/ChampionshipService';
import ChampionshipContainer from '../../../domain/models/ChampionshipContainer';
import type { GameState } from '../../../game-engine/GameState';
import { getPlayableChampionship } from '../../../domain/features/pyramid/Pyramid';
import { useUniqueTeamIds } from '../../../../tests/support/seasonHarness';
import { ScriptedSeason } from '../../../../tests/support/scriptedSeason';

let rolledOver: ChampionshipContainer;
let humanClubName: string;

beforeAll(() => {
  useUniqueTeamIds();
  i18n.changeLanguage('en');

  // Série D, human on the top seed: wins every tie, so it is one of the four promoted
  // semifinalists and the container's pointer moves to Série C.
  const season = new ScriptedSeason('brasileirao-serie-d');
  season.assignHuman(0);
  season.playToEnd();
  rolledOver = season.rollOver();

  humanClubName = ChampionshipService.getTeamControlledByHuman(
    getPlayableChampionship(rolledOver)
  ).getResult().fullName;
});

const stateOf = (championshipContainer: ChampionshipContainer): GameState => ({
  championshipContainer,
  hasError: false,
  errorMessage: '',
  leagueType: 'mens',
  coachName: 'Tester',
  currentScreen: 'TeamManager',
  gameConfig: { clockSpeed: 250 },
});

describe('the men’s flow after a promoting roll-over', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('points at Série C, the division the human was promoted into, within the whole pyramid', () => {
    expect(getPlayableChampionship(rolledOver).internalName).toBe('brasileirao-serie-c');
    expect(rolledOver.championships.map((championship) => championship.internalName)).toEqual([
      'brasileirao-serie-a',
      'brasileirao-serie-b',
      'brasileirao-serie-c',
      'brasileirao-serie-d',
    ]);
  });

  it('saves without an error — the failure MS-107 could not get past', () => {
    const engine = new GameEngine(stateOf(rolledOver));

    engine.dispatch({ type: 'SAVE_GAME' });

    expect(engine.getState().hasError).toBe(false);
    expect(engine.getState().errorMessage).toBe('');
  });

  it('reloads into the new division after that save', () => {
    const engine = new GameEngine(stateOf(rolledOver));
    engine.dispatch({ type: 'SAVE_GAME' });

    engine.dispatch({ type: 'LOAD_GAME' });

    const state = engine.getState();
    expect(state.hasError).toBe(false);
    expect(getPlayableChampionship(state.championshipContainer).internalName).toBe(
      'brasileirao-serie-c'
    );
    expect(
      ChampionshipService.getTeamControlledByHuman(
        getPlayableChampionship(state.championshipContainer)
      ).getResult().fullName
    ).toBe(humanClubName);
  });

  it('renders the human club and its new division after a save and a reload', () => {
    const engine = new GameEngine(stateOf(rolledOver));
    engine.dispatch({ type: 'SAVE_GAME' });
    engine.dispatch({ type: 'LOAD_GAME' });

    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <GameEngineProvider initialState={engine.getState()}>
          <TeamManager />
        </GameEngineProvider>
      </I18nextProvider>
    );

    expect(humanClubName).not.toBe('');
    expect(screen.getByText(humanClubName)).toBeTruthy();
    expect(screen.getByText(getPlayableChampionship(rolledOver).name)).toBeTruthy();
    expect(container.textContent).not.toContain('could not be found');
  });
});
