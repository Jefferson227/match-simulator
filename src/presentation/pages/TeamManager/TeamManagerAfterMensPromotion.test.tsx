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
import { useUniqueTeamIds } from '../../../../tests/support/seasonHarness';
import { ScriptedSeason } from '../../../../tests/support/scriptedSeason';

let recentred: ChampionshipContainer;
let humanClubName: string;

beforeAll(() => {
  useUniqueTeamIds();
  i18n.changeLanguage('en');

  // Série D, human on the top seed: wins every tie, so it is one of the four promoted
  // semifinalists and the container re-centres on Série C.
  const season = new ScriptedSeason('brasileirao-serie-d');
  season.assignHuman(0);
  season.playToEnd();
  recentred = season.rollOver();

  humanClubName = ChampionshipService.getTeamControlledByHuman(
    recentred.playableChampionship
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

  it('re-centres on Série C, the division the human was promoted into', () => {
    expect(recentred.playableChampionship.internalName).toBe('brasileirao-serie-c');
    expect(recentred.relegationChampionship?.internalName).toBe('brasileirao-serie-d');
  });

  it('saves without an error — the failure MS-107 could not get past', () => {
    const engine = new GameEngine(stateOf(recentred));

    engine.dispatch({ type: 'SAVE_GAME' });

    expect(engine.getState().hasError).toBe(false);
    expect(engine.getState().errorMessage).toBe('');
  });

  it('reloads into the new division after that save', () => {
    const engine = new GameEngine(stateOf(recentred));
    engine.dispatch({ type: 'SAVE_GAME' });

    engine.dispatch({ type: 'LOAD_GAME' });

    const state = engine.getState();
    expect(state.hasError).toBe(false);
    expect(state.championshipContainer.playableChampionship.internalName).toBe(
      'brasileirao-serie-c'
    );
    expect(
      ChampionshipService.getTeamControlledByHuman(
        state.championshipContainer.playableChampionship
      ).getResult().fullName
    ).toBe(humanClubName);
  });

  it('renders the human club and its new division after a save and a reload', () => {
    const engine = new GameEngine(stateOf(recentred));
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
    expect(screen.getByText(recentred.playableChampionship.name)).toBeTruthy();
    expect(container.textContent).not.toContain('could not be found');
  });
});
