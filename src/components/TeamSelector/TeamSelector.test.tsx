import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamSelector from './TeamSelector';
import { GeneralContext } from '../../contexts/GeneralContext';

const mockSetScreenDisplayed = jest.fn();

const mockGeneralContextValue = {
  setScreenDisplayed: mockSetScreenDisplayed,
  state: {
    currentPage: 1,
    baseTeam: {},
    matchTeam: null,
    matchOtherTeams: [],
    screenDisplayed: 'TeamSelector',
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

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'teamSelector.selectATeam') {
        return 'SELECT A TEAM';
      }
      return key;
    },
  }),
}));

describe('TeamSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the component and initial teams', () => {
    renderWithContext(<TeamSelector />);

    expect(screen.getByText('SELECT A TEAM')).toBeInTheDocument();

    expect(screen.getByText('FLAMENGO')).toBeInTheDocument();
    expect(screen.getByText('MIRASSOL')).toBeInTheDocument();
    expect(screen.queryByText('CORINTHIANS')).not.toBeInTheDocument();
  });

  test('paginates to the next page of teams', () => {
    renderWithContext(<TeamSelector />);

    const nextButton = screen.getByText('>');
    fireEvent.click(nextButton);

    expect(screen.queryByText('FLAMENGO')).not.toBeInTheDocument();
    expect(screen.getByText('CORINTHIANS')).toBeInTheDocument();
  });

  test('calls setScreenDisplayed with "TeamManager" when a team is clicked', () => {
    renderWithContext(<TeamSelector />);

    const flamengoButton = screen.getByText('FLAMENGO');
    fireEvent.click(flamengoButton);

    expect(mockSetScreenDisplayed).toHaveBeenCalledWith('TeamManager');
    expect(mockSetScreenDisplayed).toHaveBeenCalledTimes(1);
  });

  test('calls setScreenDisplayed with "TeamManager" when any team is clicked', () => {
    renderWithContext(<TeamSelector />);

    const cruzeiroButton = screen.getByText('CRUZEIRO');
    fireEvent.click(cruzeiroButton);

    expect(mockSetScreenDisplayed).toHaveBeenCalledWith('TeamManager');
    expect(mockSetScreenDisplayed).toHaveBeenCalledTimes(1);
  });

  test('previous button is disabled on the first page', () => {
    renderWithContext(<TeamSelector />);
    const prevButton = screen.getByText('<');
    expect(prevButton).toBeDisabled();
  });

  test('next button is enabled on the first page', () => {
    renderWithContext(<TeamSelector />);
    const nextButton = screen.getByText('>');
    expect(nextButton).not.toBeDisabled();
  });

  test('next button is disabled on the last page', () => {
    renderWithContext(<TeamSelector />);

    const nextButton = screen.getByText('>');
    fireEvent.click(nextButton); // Click to go to the last page

    expect(nextButton).toBeDisabled();
  });

  test('paginates to the previous page of teams', () => {
    renderWithContext(<TeamSelector />);

    const nextButton = screen.getByText('>');
    fireEvent.click(nextButton); // Go to next page

    const prevButton = screen.getByText('<');
    fireEvent.click(prevButton); // Go back to previous page

    expect(screen.getByText('FLAMENGO')).toBeInTheDocument();
    expect(screen.queryByText('CORINTHIANS')).not.toBeInTheDocument();
  });
});
