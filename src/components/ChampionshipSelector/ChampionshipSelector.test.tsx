import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChampionshipSelector from './ChampionshipSelector';

// Mock the generalService
jest.mock('../../services/generalService', () => ({
  __esModule: true,
  default: {
    getAllChampionships: () => [
      { id: '1', name: 'BRASILEIRÃO SÉRIE A' },
      { id: '2', name: 'BRASILEIRÃO SÉRIE B' },
      { id: '3', name: 'BRASILEIRÃO SÉRIE C' },
      { id: '4', name: 'BRASILEIRÃO SÉRIE D' },
      { id: '5', name: 'PREMIER LEAGUE' },
      { id: '6', name: 'BUNDESLIGA' },
      { id: '7', name: 'LA LIGA' },
      { id: '8', name: 'SERIE A' },
      { id: '9', name: 'LIGUE 1' },
    ],
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'championshipSelector.selectChampionship') {
        return 'SELECT CHAMPIONSHIP';
      }
      return key;
    },
  }),
}));

// Mock the GeneralContext
const mockSetScreenDisplayed = jest.fn();

jest.mock('../../contexts/GeneralContext', () => ({
  GeneralContext: {
    Consumer: ({ children }: { children: any }) =>
      children({
        setScreenDisplayed: mockSetScreenDisplayed,
      }),
  },
}));

// Mock React's useContext to return our mock context
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(() => ({
    setScreenDisplayed: mockSetScreenDisplayed,
  })),
}));

describe('ChampionshipSelector', () => {
  beforeEach(() => {
    mockSetScreenDisplayed.mockClear();
  });

  test('renders the component and initial championships', () => {
    render(<ChampionshipSelector />);

    expect(screen.getByText('SELECT CHAMPIONSHIP')).toBeInTheDocument();

    expect(screen.getByText('BRASILEIRÃO SÉRIE A')).toBeInTheDocument();
    expect(screen.getByText('BUNDESLIGA')).toBeInTheDocument();
    expect(screen.queryByText('LA LIGA')).not.toBeInTheDocument();
  });

  test('only the "BRASILEIRÃO SÉRIE A" button is enabled', () => {
    render(<ChampionshipSelector />);

    const serieAButton = screen.getByText('BRASILEIRÃO SÉRIE A');
    const serieBButton = screen.getByText('BRASILEIRÃO SÉRIE B');
    const bundesligaButton = screen.getByText('BUNDESLIGA');

    expect(serieAButton).not.toBeDisabled();
    expect(serieBButton).toBeDisabled();
    expect(bundesligaButton).toBeDisabled();
  });

  test('previous button is disabled on the first page', () => {
    render(<ChampionshipSelector />);
    const prevButton = screen.getByText('<');
    expect(prevButton).toBeDisabled();
  });

  test('next button is enabled on the first page', () => {
    render(<ChampionshipSelector />);
    const nextButton = screen.getByText('>');
    expect(nextButton).not.toBeDisabled();
  });

  test('paginates to the next page of championships', () => {
    render(<ChampionshipSelector />);

    const nextButton = screen.getByText('>');
    fireEvent.click(nextButton);

    expect(screen.queryByText('BRASILEIRÃO SÉRIE A')).not.toBeInTheDocument();
    expect(screen.getByText('LA LIGA')).toBeInTheDocument();
    expect(screen.getByText('LIGUE 1')).toBeInTheDocument();
  });

  test('next button is disabled on the last page', () => {
    render(<ChampionshipSelector />);

    const nextButton = screen.getByText('>');
    fireEvent.click(nextButton); // Click to go to the last page

    expect(nextButton).toBeDisabled();
  });

  test('paginates to the previous page of championships', () => {
    render(<ChampionshipSelector />);

    const nextButton = screen.getByText('>');
    fireEvent.click(nextButton); // Go to next page

    const prevButton = screen.getByText('<');
    fireEvent.click(prevButton); // Go back to previous page

    expect(screen.getByText('BRASILEIRÃO SÉRIE A')).toBeInTheDocument();
    expect(screen.queryByText('LA LIGA')).not.toBeInTheDocument();
  });

  test('calls setScreenDisplayed when clicking on BRASILEIRÃO SÉRIE A', () => {
    render(<ChampionshipSelector />);

    const serieAButton = screen.getByText('BRASILEIRÃO SÉRIE A');
    fireEvent.click(serieAButton);

    expect(mockSetScreenDisplayed).toHaveBeenCalledWith('TeamSelector');
  });

  test('does not call setScreenDisplayed when clicking on disabled championships', () => {
    render(<ChampionshipSelector />);

    const serieBButton = screen.getByText('BRASILEIRÃO SÉRIE B');
    fireEvent.click(serieBButton);

    expect(mockSetScreenDisplayed).not.toHaveBeenCalled();
  });
});
