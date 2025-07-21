import React, { useState, useEffect, useContext } from 'react';
import { useChampionship } from '../../../features/championship/hooks/useChampionship';
import { GeneralContext } from '../../../contexts/GeneralContext';
import type { ChampionshipState } from '../../../types/championship';

// Define TeamStanding interface to match the expected data structure
type TeamStanding = {
  team: string;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];
};



// Import styles
import './Standings.css';


// Define props interface
interface StandingsProps {
  onContinue?: () => void;
}

// Define table columns with proper typing
const columns = [
  { id: 'position', label: '#', align: 'center' as const, width: '5%' },
  { id: 'team', label: 'Team', align: 'left' as const, width: '25%' },
  { id: 'played', label: 'Pld', align: 'center' as const, width: '8%' },
  { id: 'wins', label: 'W', align: 'center' as const, width: '8%' },
  { id: 'draws', label: 'D', align: 'center' as const, width: '8%' },
  { id: 'losses', label: 'L', align: 'center' as const, width: '8%' },
  { id: 'goalsFor', label: 'GF', align: 'center' as const, width: '8%' },
  { id: 'goalsAgainst', label: 'GA', align: 'center' as const, width: '8%' },
  { id: 'goalDifference', label: 'GD', align: 'center' as const, width: '8%' },
  { id: 'points', label: 'Pts', align: 'center' as const, width: '8%' },
  { id: 'form', label: 'Form', align: 'center' as const, width: '16%' },
] as const;

const Standings: React.FC<StandingsProps> = ({ onContinue }) => {
  const { setScreenDisplayed } = useContext(GeneralContext);
  const championship = useChampionship() as unknown as ChampionshipState;
  // Initialize state for standings data
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize standings data
  useEffect(() => {
    const loadStandings = () => {
      try {
        setIsLoading(true);
        // Transform tableStandings to match TeamStanding type
        const data = (championship.tableStandings || []).map((standing: any) => ({
          team: standing.team,
          position: standing.position || 0,
          played: (standing.w || 0) + (standing.d || 0) + (standing.l || 0),
          wins: standing.w || 0,
          draws: standing.d || 0,
          losses: standing.l || 0,
          goalsFor: standing.gf || 0,
          goalsAgainst: standing.ga || 0,
          goalDifference: standing.gd || 0,
          points: standing.pts || 0,
          form: [], // Empty array for form as it's not in the source data
        }));
        setStandings(data);
      } catch (error) {
        console.error('Error loading standings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStandings();
  }, [championship.tableStandings, championship.selectedChampionship]);

  // Handle page change - will be implemented when pagination is needed
  // Commented out for now as it's not currently used
  // const handlePageChange = (newPage: number) => {
  //   setCurrentPage(newPage);
  // };

  // Handle continue button click
  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      setScreenDisplayed('matchSimulation');
    }
  };

  if (isLoading) {
    return <div className="standings-loading">Loading standings...</div>;
  }

  return (
    <div className="standings-container">
      <div className="standings-header">
        <h2>
          {championship.selectedChampionship || 'Standings'}
          {championship.year && ` ${championship.year}`}
        </h2>
        {championship.seasonMatchCalendar?.length > 0 && (
          <div className="round-info">
            Round {championship.currentRound} of {championship.seasonMatchCalendar.length}
          </div>
        )}
      </div>

      <div className="standings-table-container">
        <table className="standings-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  style={{
                    width: column.width,
                    textAlign: column.align || 'left',
                  }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standings.map((row, index) => (
              <tr key={`${row.team}-${index}`} className={index % 2 === 0 ? 'even' : 'odd'}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td>{row.team}</td>
                <td style={{ textAlign: 'center' }}>{row.played}</td>
                <td style={{ textAlign: 'center' }}>{row.wins}</td>
                <td style={{ textAlign: 'center' }}>{row.draws}</td>
                <td style={{ textAlign: 'center' }}>{row.losses}</td>
                <td style={{ textAlign: 'center' }}>{row.goalsFor > 0 ? row.goalsFor : '-'}</td>
                <td style={{ textAlign: 'center' }}>{row.goalsAgainst > 0 ? row.goalsAgainst : '-'}</td>
                <td style={{ textAlign: 'center' }}>{row.goalDifference}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.points}</td>
                <td style={{ textAlign: 'center' }}>{row.form.join(' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {championship.currentRound >= championship.seasonMatchCalendar.length && (
        <div className="season-complete">
          <p>Season complete!</p>
          <button onClick={handleContinue} className="continue-button">
            Continue to Next Season
          </button>
        </div>
      )}
    </div>
  );
};

export default Standings;
