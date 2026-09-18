import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import App from './App';
import i18n from './i18n';
import { createInitialGameState } from './game-engine/initialGameState';

jest.mock('./game-engine/initialGameState', () => ({
  createInitialGameState: jest.fn(),
}));

describe('App routing', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await i18n.changeLanguage('en');
  });

  it('renders the language selector for the LanguageSelector screen', () => {
    jest.mocked(createInitialGameState).mockReturnValue({
      championshipContainer: { championships: [], playableInternalName: '' },
      leagueType: 'mens',
      coachName: '',
      currentScreen: 'LanguageSelector',
    } as unknown as ReturnType<typeof createInitialGameState>);

    render(<App />);

    expect(screen.getByRole('heading', { name: 'SELECT LANGUAGE' })).toBeTruthy();
  });
});
