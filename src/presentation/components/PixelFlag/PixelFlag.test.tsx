import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it } from '@jest/globals';
import PixelFlag, { FlagCountry } from './PixelFlag';
import i18n from '../../../i18n';

const renderFlag = (country: FlagCountry) =>
  render(
    <I18nextProvider i18n={i18n}>
      <PixelFlag country={country} />
    </I18nextProvider>
  );

const fillsOf = (element: Element) =>
  new Set(Array.from(element.querySelectorAll('rect')).map((rect) => rect.getAttribute('fill')));

describe('PixelFlag', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it.each<[FlagCountry, string]>([
    ['us', 'United States flag'],
    ['br', 'Brazil flag'],
  ])('renders the %s flag with an accessible name', (country, name) => {
    renderFlag(country);

    const flag = screen.getByRole('img', { name });
    expect(flag.getAttribute('data-testid')).toBe(`pixel-flag-${country}`);
    expect(flag.getAttribute('shape-rendering')).toBe('crispEdges');
    expect(flag.getAttribute('width')).toBe('32');
    expect(flag.getAttribute('height')).toBe('22');
  });

  it('draws the two flags in their own colours', () => {
    renderFlag('us');
    renderFlag('br');

    expect(fillsOf(screen.getByTestId('pixel-flag-us'))).toEqual(
      new Set(['#3c3b6e', '#ffffff', '#b22234'])
    );
    expect(fillsOf(screen.getByTestId('pixel-flag-br'))).toEqual(
      new Set(['#009c3b', '#ffdf00', '#002776', '#ffffff'])
    );
  });

  it('covers every pixel of the 16x11 grid exactly once', () => {
    renderFlag('br');

    const rects = Array.from(screen.getByTestId('pixel-flag-br').querySelectorAll('rect'));
    const area = rects.reduce((sum, rect) => sum + Number(rect.getAttribute('width')), 0);
    expect(area).toBe(16 * 11);
  });

  it('names the flags in Brazilian Portuguese', async () => {
    await i18n.changeLanguage('pt-BR');
    renderFlag('us');
    renderFlag('br');

    expect(screen.getByRole('img', { name: 'Bandeira dos Estados Unidos' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Bandeira do Brasil' })).toBeTruthy();
  });
});
