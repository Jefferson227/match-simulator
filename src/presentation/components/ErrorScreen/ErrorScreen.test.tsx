import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from '@jest/globals';
import ErrorScreen from './ErrorScreen';
import i18n from '../../../i18n';
import { GameEngineProvider } from '../../contexts/GameEngineContext';
import type { GameState } from '../../../game-engine/GameState';

const renderErrorScreen = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <GameEngineProvider
        initialState={{ hasError: true, errorMessage: 'Boom' } as unknown as GameState}
      >
        <ErrorScreen />
      </GameEngineProvider>
    </I18nextProvider>
  );

describe('ErrorScreen', () => {
  it('renders the apology, the untranslated error and the reset button in English', async () => {
    await i18n.changeLanguage('en');
    renderErrorScreen();

    expect(
      screen.getByText('Sorry, but an error has occurred and the game needs to be reset.')
    ).toBeTruthy();
    expect(screen.getByText('Error message: Boom')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reset Game' })).toBeTruthy();
  });

  it('renders in Brazilian Portuguese', async () => {
    await i18n.changeLanguage('pt-BR');
    renderErrorScreen();

    expect(
      screen.getByText('Desculpe, ocorreu um erro e o jogo precisa ser reiniciado.')
    ).toBeTruthy();
    expect(screen.getByText('Mensagem de erro: Boom')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reiniciar Jogo' })).toBeTruthy();
  });
});
