import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../services/useGameState';
import { Team } from '../../../core/models/Team';
import TeamUseCases from '../../../use-cases/TeamUseCases';
import MainLayout from '../../components/MainLayout/MainLayout';
import { GameState } from '../../../game-engine/GameState';

const TEAMS_PER_PAGE = 9;

const TeamSelector: React.FC = () => {
  const { t } = useTranslation();

  // Game engine
  const engine = useGameEngine();
  const state = useGameState(engine);

  const [currentPage, setCurrentPage] = useState(0);
  const [teams, setTeams] = useState<Team[]>([]);

  const teamUseCases = new TeamUseCases({} as GameState);

  // Load teams
  useEffect(() => {
    let teamsToBeListed = [] as Team[];
    try {
      teamsToBeListed = teamUseCases.getTeamsToSelect(
        state.championshipContainer.playableChampionship
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      engine.dispatch({ type: 'SET_ERROR_MESSAGE', errorMessage });
    }

    setTeams(teamsToBeListed);
  }, []);

  useEffect(() => {
    if (state.hasError)
      engine.dispatch({ type: 'SET_ERROR_MESSAGE', errorMessage: state.errorMessage });
  }, [state]);

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

  const startIndex = currentPage * TEAMS_PER_PAGE;
  const selectedTeams = teams.slice(startIndex, startIndex + TEAMS_PER_PAGE);

  const selectTeam = (teamId: string) => {
    engine.dispatch({ type: 'SELECT_TEAM', teamId });
    engine.dispatch({ type: 'SET_CURRENT_SCREEN', screenName: 'TeamManager' });
  };

  return (
    <MainLayout>
      <h1 className="text-lg text-center mb-8">{t('teamSelector.selectATeam')}</h1>

      <div className="flex flex-col gap-4 w-full h-[560px] max-w-md px-6">
        {selectedTeams.map((team) => (
          <button
            key={team.id}
            onClick={() => selectTeam(team.id)}
            style={{
              backgroundColor: team.colors.background,
              borderColor: team.colors.outline,
              color: team.colors.text,
            }}
            className="w-[342px] h-[48px] px-4 border-4 text-lg uppercase mx-auto"
          >
            {team.shortName}
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
    </MainLayout>
  );
};

export default TeamSelector;
