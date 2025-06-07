import React from 'react';
import { render, screen } from '@testing-library/react';
import TeamManager from './TeamManager';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { describe, it, expect } from '@jest/globals';

describe('TeamManager', () => {
  it('renders the team name, formation, player list, and button labels correctly', () => {
    i18n.changeLanguage('en'); // Force English for the test
    render(
      <I18nextProvider i18n={i18n}>
        <TeamManager />
      </I18nextProvider>
    );

    // Check if the team name is displayed
    expect(screen.getByText('CEARÁ SPORTING CLUB')).toBeTruthy();

    // Check if the formation is displayed
    expect(screen.getByText('4-3-3')).toBeTruthy();

    // Check if the player list is displayed
    expect(screen.getByText('RICHARD')).toBeTruthy();
    expect(screen.getByText('DAVID RICARDO')).toBeTruthy();
    expect(screen.getByText('MATHEUS BAHIA')).toBeTruthy();
    expect(screen.getByText('MATHEUS FELIPE')).toBeTruthy();
    expect(screen.getByText('RAÍ RAMOS')).toBeTruthy();
    expect(screen.getByText('RICHARDSON')).toBeTruthy();
    expect(screen.getByText('LOURENÇO')).toBeTruthy();
    expect(screen.getByText('G. CASTILHO')).toBeTruthy();
    expect(screen.getByText('ERICK PULGA')).toBeTruthy();
    expect(screen.getByText('BARCELÓ')).toBeTruthy();
    expect(screen.getByText('AYLON')).toBeTruthy();

    // Check if the button labels are displayed
    expect(screen.getByText('CHOOSE FORMATION')).toBeTruthy();
    expect(screen.getByText('PREVIOUS PAGE')).toBeTruthy();
    expect(screen.getByText('NEXT PAGE')).toBeTruthy();
    expect(screen.getByText('START MATCH')).toBeTruthy();
  });
});
