/// <reference types="@testing-library/jest-dom" />
/**
 * MS-107: the screen that used to break the moment the human's club was promoted.
 *
 * `TeamManager` reads the human's club off the playable division. Before MS-107 a promoted club sat
 * in another division while the container still pointed at the old one, so the lookup threw `Team
 * controlled by human player could not be found.` and the screen rendered an empty club. Since
 * MS-109 the container holds the whole pyramid and the roll-over moves its playable pointer. This
 * drives a `GameState` produced by a real promoting roll-over over the real seeds.
 *
 * Played on the women's pyramid to keep a component test's container small.
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { beforeAll, describe, expect, it } from '@jest/globals';
import TeamManager from './TeamManager';
import i18n from '../../../i18n';
import { GameEngineProvider } from '../../contexts/GameEngineContext';
import ChampionshipService from '../../../domain/services/ChampionshipService';
import ChampionshipContainer from '../../../domain/models/ChampionshipContainer';
import type { GameState } from '../../../game-engine/GameState';
import {
  getChampionshipByInternalName,
  getPlayableChampionship,
} from '../../../domain/features/pyramid/Pyramid';
import { useUniqueTeamIds } from '../../../../tests/support/seasonHarness';
import { ScriptedSeason } from '../../../../tests/support/scriptedSeason';

let rolledOver: ChampionshipContainer;
let humanClubName: string;

beforeAll(() => {
  useUniqueTeamIds();
  i18n.changeLanguage('en');

  // Série A3, human on the top seed: wins every tie, so it is promoted into A2.
  const season = new ScriptedSeason('brasileirao-feminino-serie-a3');
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
  leagueType: 'womens',
  coachName: 'Tester',
  currentScreen: 'TeamManager',
  gameConfig: { clockSpeed: 250 },
});

const renderAfterRollOver = (container: ChampionshipContainer) =>
  render(
    <I18nextProvider i18n={i18n}>
      <GameEngineProvider initialState={stateOf(container)}>
        <TeamManager />
      </GameEngineProvider>
    </I18nextProvider>
  );

describe('TeamManager after a promoting roll-over', () => {
  it('is handed a container pointing at the division the human was promoted into', () => {
    expect(rolledOver.playableInternalName).toBe('brasileirao-feminino-serie-a2');
    expect(getPlayableChampionship(rolledOver).internalName).toBe('brasileirao-feminino-serie-a2');
  });

  it('renders the human club and its new division instead of an empty club', () => {
    renderAfterRollOver(rolledOver);

    // `getByText` throws when the text is absent, which is the assertion that matters here.
    expect(humanClubName).not.toBe('');
    expect(screen.getByText(humanClubName)).toBeTruthy();
    expect(screen.getByText(getPlayableChampionship(rolledOver).name)).toBeTruthy();
  });

  it('surfaces no error, so the human-club lookup did not throw', () => {
    const { container } = renderAfterRollOver(rolledOver);

    expect(container.textContent).not.toContain('could not be found');
  });

  it('would find no human club in the division the season was played in', () => {
    // Guards the assertion above: this is exactly the lookup `TeamManager` made before MS-107, and
    // it still fails — the test passes because the pointer moved, not because the human did not.
    const playedDivision = getChampionshipByInternalName(
      rolledOver,
      'brasileirao-feminino-serie-a3'
    )!;

    expect(playedDivision.internalName).toBe('brasileirao-feminino-serie-a3');
    expect(ChampionshipService.getTeamControlledByHuman(playedDivision).succeeded).toBe(false);
  });
});
