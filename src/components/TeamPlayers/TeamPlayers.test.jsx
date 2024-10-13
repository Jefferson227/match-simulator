import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MatchContext } from '../../contexts/MatchContext';
import TeamPlayers from './TeamPlayers';
import { useTranslation } from 'react-i18next';

// Mock the translation function
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key, // return the key for simplicity
  }),
}));

describe('TeamPlayers Component', () => {
  const mockConfirmSubstitution = jest.fn();
  const mockSetTeamSquadView = jest.fn();

  const teamSquadView = {
    matchId: 1,
    team: {
      name: 'Team A',
      colors: {
        background: '#FFFFFF',
        outline: '#000000',
        name: '#000000',
      },
      players: [
        { id: 1, name: 'Player 1', position: 'FW', strength: 90 },
        { id: 2, name: 'Player 2', position: 'MF', strength: 80 },
      ],
      substitutes: [
        { id: 3, name: 'Substitute 1', position: 'DF', strength: 75 },
        { id: 4, name: 'Substitute 2', position: 'GK', strength: 70 },
      ],
    },
  };

  beforeEach(() => {
    render(
      <MatchContext.Provider
        value={{
          setTeamSquadView: mockSetTeamSquadView,
          confirmSubstitution: mockConfirmSubstitution,
        }}
      >
        <TeamPlayers teamSquadView={teamSquadView} />
      </MatchContext.Provider>
    );
  });

  it('should select a player and show the substitute button', async () => {
    // Click on Player 1 to select
    fireEvent.click(screen.getByText('Player 1'));

    // Verify Player 1 is selected
    expect(screen.getByText('Player 1').parentElement).toHaveStyle(
      'color: #FFFFFF'
    ); // Selected player's text color
    expect(screen.getByText('Player 1').parentElement).toHaveStyle(
      'background-color: #000000'
    ); // Selected player's background color

    // Click to see substitutes
    fireEvent.click(screen.getByText('teamPlayers.seeSubstitutes'));

    // Verify substitutes are displayed
    expect(screen.getByText('Substitute 1')).toBeInTheDocument();
    expect(screen.getByText('Substitute 2')).toBeInTheDocument();
  });

  it('should confirm substitution when a substitute is selected', async () => {
    // Select Player 1
    fireEvent.click(screen.getByText('Player 1'));

    // Show substitutes
    fireEvent.click(screen.getByText('teamPlayers.seeSubstitutes'));

    // Select Substitute 1
    fireEvent.click(screen.getByText('Substitute 1'));

    // Confirm substitution
    fireEvent.click(screen.getByText('teamPlayers.confirmSubstitution'));

    // Wait for the confirmSubstitution mock to be called
    await waitFor(() => {
      expect(mockConfirmSubstitution).toHaveBeenCalledWith({
        matchId: teamSquadView.matchId,
        team: teamSquadView.team,
        selectedPlayer: teamSquadView.team.players[0], // Player 1
        selectedSubstitute: teamSquadView.team.substitutes[0], // Substitute 1
      });
    });
  });

  it('should show back to main team button when substitutes are visible', () => {
    // Click to see substitutes
    fireEvent.click(screen.getByText('teamPlayers.seeSubstitutes'));

    // Verify the back to main team button is visible
    expect(screen.getByText('teamPlayers.backToMainTeam')).toBeVisible();
  });

  it('should navigate back to the main team view', () => {
    // Click on back to match button
    fireEvent.click(screen.getByText('teamPlayers.backToMatch'));

    expect(mockSetTeamSquadView).toHaveBeenCalledWith(null); // Ensure setTeamSquadView is called with null
  });
});
