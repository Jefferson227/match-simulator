/// <reference types="@testing-library/jest-dom" />
/**
 * MS-107: the screen that used to break the moment the human's club was promoted.
 *
 * `TeamManager` reads the human's club off `playableChampionship`. Before the container was
 * re-centred at roll-over a promoted club sat in `promotionChampionship` instead, so the lookup
 * threw `Team controlled by human player could not be found.` and the screen rendered an empty
 * club. This drives a `GameState` produced by a real promoting roll-over over the real seeds.
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
import { useUniqueTeamIds } from '../../../../tests/support/seasonHarness';
import { ScriptedSeason } from '../../../../tests/support/scriptedSeason';

let recentred: ChampionshipContainer;
let humanClubName: string;

beforeAll(() => {
  useUniqueTeamIds();
  i18n.changeLanguage('en');

  // Série A3, human on the top seed: wins every tie, so it is promoted into A2.
  const season = new ScriptedSeason('brasileirao-feminino-serie-a3');
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
  it('is handed a container centred on the division the human was promoted into', () => {
    expect(recentred.playableChampionship.internalName).toBe('brasileirao-feminino-serie-a2');
    // The pre-MS-107 shape: A3 still playable, with the human sitting in the promotion slot.
    expect(recentred.promotionChampionship?.internalName).toBe('brasileirao-feminino-serie-a1');
  });

  it('renders the human club and its new division instead of an empty club', () => {
    renderAfterRollOver(recentred);

    // `getByText` throws when the text is absent, which is the assertion that matters here.
    expect(humanClubName).not.toBe('');
    expect(screen.getByText(humanClubName)).toBeTruthy();
    expect(screen.getByText(recentred.playableChampionship.name)).toBeTruthy();
  });

  it('surfaces no error, so the human-club lookup did not throw', () => {
    const { container } = renderAfterRollOver(recentred);

    expect(container.textContent).not.toContain('could not be found');
  });

  it('would find no human club in the division the season was played in', () => {
    // Guards the assertion above: this is exactly the lookup `TeamManager` made before MS-107, and
    // it still fails — the test passes because the container moved, not because the human did not.
    const playedDivision = recentred.relegationChampionship!;

    expect(playedDivision.internalName).toBe('brasileirao-feminino-serie-a3');
    expect(ChampionshipService.getTeamControlledByHuman(playedDivision).succeeded).toBe(false);
  });
});
