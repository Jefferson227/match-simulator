import React, { useContext } from 'react';
import { GeneralContext } from '@contexts/GeneralContext';
import { MatchContext } from '@contexts/MatchContext';
import { TableStanding } from '@types/championship';
import './TeamStandings.css';

interface TeamStandingsProps {
  standings?: TableStanding[];
}

const TeamStandings: React.FC<TeamStandingsProps> = ({ standings: propStandings = [] }) => {
  // Extract necessary values from contexts
  const { state: generalState } = useContext(GeneralContext);
  const { state: matchState } = useContext(MatchContext);

  // Use the provided standings prop or an empty array if not provided
  const standings = propStandings;

  return (
    <div className="team-standings">
      <h2>Team Standings</h2>
      <div className="standings-container">
        <table className="standings-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Team</th>
              <th>P</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>GF</th>
              <th>GA</th>
              <th>GD</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, index) => (
              <tr key={`${team.teamId}-${index}`}>
                <td>{index + 1}</td>
                <td>{team.teamName}</td>
                <td>{team.wins + team.draws + team.losses}</td>
                <td>{team.wins}</td>
                <td>{team.draws}</td>
                <td>{team.losses}</td>
                <td>{team.goalsFor}</td>
                <td>{team.goalsAgainst}</td>
                <td>{team.goalDifference}</td>
                <td>{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamStandings;
