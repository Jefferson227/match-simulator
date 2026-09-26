import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it } from '@jest/globals';
import StaminaBar from './StaminaBar';
import i18n from '../../../i18n';

const renderStaminaBar = (stamina?: number) =>
  render(
    <I18nextProvider i18n={i18n}>
      <StaminaBar stamina={stamina} />
    </I18nextProvider>
  );

const fillWidth = (bar: HTMLElement) => (bar.lastElementChild as HTMLElement).style.width;

describe('StaminaBar', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('fills in proportion to stamina', () => {
    renderStaminaBar(85);
    const bar = screen.getByRole('progressbar', { name: 'STAMINA' });

    expect(bar.getAttribute('aria-valuenow')).toBe('85');
    expect(fillWidth(bar)).toBe('85%');
  });

  it('reads missing stamina as full, as the match engine does before the first tick', () => {
    renderStaminaBar(undefined);
    const bar = screen.getByRole('progressbar');

    expect(bar.getAttribute('aria-valuenow')).toBe('100');
    expect(fillWidth(bar)).toBe('100%');
  });

  it.each([
    [70, false],
    [69, true],
  ])('at stamina %i blinks: %s', (stamina, blinks) => {
    renderStaminaBar(stamina);

    expect(screen.getByRole('progressbar').classList.contains('animate-blink')).toBe(blinks);
  });
});
