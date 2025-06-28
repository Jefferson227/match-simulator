import React, { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GeneralContext } from '../../contexts/GeneralContext';
import { useChampionshipContext } from '../../contexts/ChampionshipContext';
import {
  loadTeamsForChampionship,
  TeamSelectorTeam,
  loadSpecificTeam,
  loadAllTeamsExceptOne,
} from '../../services/teamService';

const TEAMS_PER_PAGE = 9;

const TeamSelector: React.FC = () => {
  const { t } = useTranslation();
  const { setScreenDisplayed } = useContext(GeneralContext);
  const {
    setHumanPlayerBaseTeam,
    setTeamsControlledAutomatically,
    setSeasonMatchCalendar,
  } = useChampionshipContext();
  const [currentPage, setCurrentPage] = useState(0);
  const [teams, setTeams] = useState<TeamSelectorTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoading(true);
        const loadedTeams = await loadTeamsForChampionship(
          'brasileirao-serie-a'
        );
        setTeams(loadedTeams);
        setError(null);
      } catch (err) {
        console.error('Failed to load teams:', err);
        setError('Failed to load teams');
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, []);

  const totalPages = Math.ceil(teams.length / TEAMS_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleTeamClick = async (teamFileName: string) => {
    try {
      if (teamFileName) {
        // Load the specific team data
        const baseTeam = await loadSpecificTeam(
          'brasileirao-serie-a',
          teamFileName
        );

        if (baseTeam) {
          // Set the loaded team as the human player's base team
          setHumanPlayerBaseTeam(baseTeam);

          // Load all other teams in the championship for automatic control
          const automaticTeams = await loadAllTeamsExceptOne(
            'brasileirao-serie-a',
            teamFileName
          );

          // Set the automatically controlled teams
          setTeamsControlledAutomatically(automaticTeams);

          // Set the season match calendar (empty for now)
          setSeasonMatchCalendar([]);

          setScreenDisplayed('TeamManager');
        } else {
          console.error('Failed to load team data');
          setError('Failed to load team data');
        }
      } else {
        console.error(`No file name mapping found for team: ${teamFileName}`);
        setError('Team not found');
      }
    } catch (err) {
      console.error('Failed to load team:', err);
      setError('Failed to load team');
    }
  };

  const startIndex = currentPage * TEAMS_PER_PAGE;
  const selectedTeams = teams.slice(startIndex, startIndex + TEAMS_PER_PAGE);

  if (loading) {
    return (
      <div
        className="font-press-start flex flex-col items-center justify-center py-8"
        style={{ backgroundColor: '#3d7a33', color: 'white' }}
      >
        <h1 className="text-lg mb-8">{t('teamSelector.selectATeam')}</h1>
        <div className="text-center">Loading teams...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="font-press-start flex flex-col items-center justify-center py-8"
        style={{ backgroundColor: '#3d7a33', color: 'white' }}
      >
        <h1 className="text-lg mb-8">{t('teamSelector.selectATeam')}</h1>
        <div className="text-center text-red-300">{error}</div>
      </div>
    );
  }

  return (
    <div
      className="font-press-start flex flex-col items-center justify-center py-8"
      style={{ backgroundColor: '#3d7a33', color: 'white' }}
    >
      <h1 className="text-lg mb-8">{t('teamSelector.selectATeam')}</h1>

      <div className="flex flex-col gap-4 w-full h-[560px] max-w-md px-6">
        {selectedTeams.map((team) => (
          <button
            key={team.fileName}
            onClick={() => handleTeamClick(team.fileName)}
            style={{
              backgroundColor: team.colors.bg,
              borderColor: team.colors.border,
              color: team.colors.text,
            }}
            className="w-[342px] h-[48px] px-4 border-4 text-lg uppercase"
          >
            {team.name}
          </button>
        ))}
      </div>

      <div className="flex justify-between w-[390px] px-6 max-w-md mt-8">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 0}
          className="border-4 border-white w-20 h-20 flex items-center justify-center text-lg transition hover:bg-white hover:text-[#3d7a33] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &lt;
        </button>
        <button
          onClick={handleNextPage}
          disabled={currentPage >= totalPages - 1}
          className="border-4 border-white w-20 h-20 flex items-center justify-center text-lg transition hover:bg-white hover:text-[#3d7a33] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default TeamSelector;
