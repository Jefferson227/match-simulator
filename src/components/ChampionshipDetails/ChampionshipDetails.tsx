import React, { useContext, useEffect } from 'react';
import { GeneralContext } from '../../contexts/GeneralContext';
import { useChampionshipContext } from '../../contexts/ChampionshipContext';
import { MatchContext } from '../../contexts/MatchContext';
import { TopScorer } from '../TeamStandings/types';
import sessionService from '../../services/sessionService';
import generalService from '../../services/generalService';
import utils from '../../utils/utils';

const ChampionshipDetails: React.FC = () => {
  const { setScreenDisplayed, state: generalState } = useContext(GeneralContext);
  const { state: championshipState } = useChampionshipContext();
  const { matches } = useContext(MatchContext);

  // Save session when ChampionshipDetails is displayed
  useEffect(() => {
    sessionService.saveSession({
      general: generalState,
      championship: championshipState,
      matches,
    });
  }, [generalState, championshipState, matches]);

  // Get top scorers with player and team names
  const getTopScorersWithNames = () => {
    return championshipState.topScorers
      .slice(0, 10)
      .map((scorer, index) => {
        // Find player name from teams
        let playerName = 'Unknown Player';
        let teamAbbreviation = 'UNK';

        // Check human player team
        if (championshipState.humanPlayerBaseTeam.id === scorer.teamId) {
          const player = championshipState.humanPlayerBaseTeam.players.find(p => p.id === scorer.playerId);
          if (player) {
            playerName = player.name;
            teamAbbreviation = championshipState.humanPlayerBaseTeam.abbreviation;
          }
        } else {
          // Check AI teams
          const team = championshipState.teamsControlledAutomatically.find(t => t.id === scorer.teamId);
          if (team) {
            const player = team.players.find(p => p.id === scorer.playerId);
            if (player) {
              playerName = player.name;
              teamAbbreviation = team.abbreviation;
            }
          }
        }

        return {
          playerName,
          teamAbbreviation,
          goals: scorer.goals,
          position: index + 1,
        };
      });
  };

  const topScorers = getTopScorersWithNames();

  // Get championship display name
  let championshipName = championshipState.selectedChampionship;
  if (championshipState.selectedChampionship) {
    const allChamps = generalService.getAllChampionships();
    const foundChamp = allChamps.find(
      (c) => c.internalName === championshipState.selectedChampionship
    );
    if (foundChamp) championshipName = foundChamp.name;
  }

  const handleBack = () => {
    setScreenDisplayed('TeamAdditionalInfo');
  };

  return (
    <div className="font-press-start min-h-screen" style={{ backgroundColor: '#3d7a33' }}>
      <div className="text-center text-[16px] text-white mt-6 mb-2 tracking-wider uppercase">
        {championshipName}
      </div>
      <div className="text-center text-[14px] text-white mb-2 uppercase">
        {championshipState.year} - TOP SCORERS
      </div>
      <div
        className="w-[350px] h-[610px] mx-auto mt-0 mb-0 flex flex-col items-center"
        style={{ backgroundColor: '#397a33', border: '4px solid #e2e2e2' }}
      >
        <div className="w-full mt-[14px]" style={{ maxHeight: 587, overflowY: 'auto' }}>
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-[18px] text-white">
                <th className="font-normal w-[56px] text-center"></th>
                <th className="font-normal w-[140px] text-center"></th>
                <th className="font-normal w-[80px] text-center"></th>
                <th className="font-normal w-[80px] text-center pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {topScorers.map((scorer, idx) => (
                <React.Fragment key={scorer.playerName}>
                  <tr className="text-[14px] text-white">
                    <td className="w-[56px] text-center py-4">{scorer.position}</td>
                    <td className="w-[140px] uppercase">
                      {scorer.playerName.length > 12
                        ? utils.shortenPlayerName(scorer.playerName)
                        : scorer.playerName}
                    </td>
                    <td className="w-[80px] text-center">{scorer.teamAbbreviation}</td>
                    <td className="w-[80px] text-center pr-0">{scorer.goals}</td>
                  </tr>
                  {idx < topScorers.length - 1 && (
                    <tr>
                      <td colSpan={4} style={{ padding: 0, border: 0 }}>
                        <div
                          style={{
                            height: '4px',
                            background: '#e2e2e2',
                            width: '100%',
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {topScorers.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-white text-[16px] py-8">
                    NO GOALS SCORED YET
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-center w-[350px] mt-4 mx-auto">
        <button
          className="border-4 border-white w-[180px] h-[56px] flex items-center justify-center text-[18px] text-white bg-transparent hover:bg-white hover:text-[#397a33] transition cursor-pointer"
          onClick={handleBack}
        >
          BACK
        </button>
      </div>
    </div>
  );
};

export default ChampionshipDetails;
