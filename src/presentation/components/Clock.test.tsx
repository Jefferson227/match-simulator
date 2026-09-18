import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it } from '@jest/globals';
import Clock from './Clock';
import i18n from '../../i18n';

const renderClock = (clockSpeed: number) =>
  render(
    <I18nextProvider i18n={i18n}>
      <Clock time={45} clockSpeed={clockSpeed} handleClockClick={() => undefined} />
    </I18nextProvider>
  );

describe('Clock', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it.each([
    [1000, '1x'],
    [500, '2x'],
    [250, '4x'],
  ])('titles clock speed %i as %s in English', (clockSpeed, speed) => {
    renderClock(clockSpeed);

    expect(screen.getByTitle(`Clock Speed: ${speed}`)).toBeTruthy();
  });

  it('titles the clock speed in Brazilian Portuguese', async () => {
    await i18n.changeLanguage('pt-BR');
    renderClock(500);

    expect(screen.getByTitle('Velocidade do relógio: 2x')).toBeTruthy();
  });
});
