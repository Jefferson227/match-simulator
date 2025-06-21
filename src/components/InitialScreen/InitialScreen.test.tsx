import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InitialScreen from './InitialScreen';
import { GeneralContext } from '../../contexts/GeneralContext';

const mockSetScreenDisplayed = jest.fn();

const mockGeneralContextValue = {
  setScreenDisplayed: mockSetScreenDisplayed,
  state: {
    currentPage: 1,
    baseTeam: {},
    matchTeam: null,
    matchOtherTeams: [],
    screenDisplayed: 'InitialScreen',
  },
  setCurrentPage: jest.fn(),
  getBaseTeam: jest.fn(),
  setMatchTeam: jest.fn(),
  setMatchOtherTeams: jest.fn(),
};

const renderWithContext = (component: React.ReactElement) => {
  return render(
    <GeneralContext.Provider value={mockGeneralContextValue as any}>
      {component}
    </GeneralContext.Provider>
  );
};

describe('InitialScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all main elements', () => {
    renderWithContext(<InitialScreen />);

    expect(screen.getByText('<LOGO HERE>')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /new game/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /load game/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/developed by/i)).toBeInTheDocument();
    expect(screen.getByText(/jefferson227/i)).toBeInTheDocument();
  });

  test('calls setScreenDisplayed with "TeamManager" when New Game button is clicked', () => {
    renderWithContext(<InitialScreen />);

    const newGameButton = screen.getByRole('button', { name: /new game/i });
    fireEvent.click(newGameButton);

    expect(mockSetScreenDisplayed).toHaveBeenCalledWith('TeamManager');
    expect(mockSetScreenDisplayed).toHaveBeenCalledTimes(1);
  });
});
