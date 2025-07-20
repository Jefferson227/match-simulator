import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { TeamState, TeamContextType } from '../types';
import { BaseTeam as Team } from '../../../types/team/team';
import { Player } from '../../../types/player/player';

const TeamContext = createContext<TeamContextType | undefined>(undefined);

type Action =
  | { type: 'SET_TEAM'; payload: Team | null }
  | { type: 'SET_PLAYERS'; payload: any[] }
  | { type: 'SET_FORMATION'; payload: string }
  | { type: 'SELECT_PLAYER'; payload: string | null }
  | { type: 'UPDATE_PLAYER_POSITION'; payload: { playerId: string; position: string } };

const teamReducer = (state: TeamState, action: Action): TeamState => {
  switch (action.type) {
    case 'SET_TEAM':
      return { 
        ...state, 
        selectedTeam: action.payload,
        availablePlayers: action.payload?.players || []
      };
    case 'SET_PLAYERS':
      return { ...state, availablePlayers: action.payload };
    case 'SET_FORMATION':
      return { ...state, selectedFormation: action.payload };
    case 'SELECT_PLAYER':
      return { ...state, selectedPlayerId: action.payload };
    case 'UPDATE_PLAYER_POSITION':
      return {
        ...state,
        availablePlayers: state.availablePlayers.map(player =>
          player.id === action.payload.playerId
            ? { ...player, position: action.payload.position }
            : player
        )
      };
    default:
      return state;
  }
};

const initialState: TeamState = {
  selectedTeam: null,
  availablePlayers: [],
  selectedFormation: '4-4-2',
  selectedPlayerId: null,
};

interface TeamProviderProps {
  initialTeam?: Team | null;
  children: React.ReactNode;
}

export const TeamProvider: React.FC<TeamProviderProps> = ({ 
  initialTeam = null, 
  children 
}) => {
  const [state, dispatch] = useReducer(teamReducer, {
    ...initialState,
    selectedTeam: initialTeam,
    availablePlayers: initialTeam?.players || []
  });

  // Update state if initialTeam changes
  useEffect(() => {
    if (initialTeam) {
      dispatch({ type: 'SET_TEAM', payload: initialTeam });
    }
  }, [initialTeam]);

  const selectTeam = (team: Team | null) => {
    dispatch({ type: 'SET_TEAM', payload: team });
  };

  const updateFormation = (formation: string) => {
    dispatch({ type: 'SET_FORMATION', payload: formation });
  };

  const selectPlayer = (playerId: string | null) => {
    dispatch({ type: 'SELECT_PLAYER', payload: playerId });
  };

  const updatePlayerPosition = (playerId: string, position: string) => {
    dispatch({ type: 'UPDATE_PLAYER_POSITION', payload: { playerId, position } });
  };

  const addPlayer = (player: any) => {
    dispatch({ type: 'SET_PLAYERS', payload: [...state.availablePlayers, player] });
  };

  const removePlayer = (playerId: string) => {
    dispatch({
      type: 'SET_PLAYERS',
      payload: state.availablePlayers.filter(p => p.id !== playerId)
    });
  };

  return (
    <TeamContext.Provider
      value={{
        ...state,
        selectTeam,
        updateFormation,
        selectPlayer,
        updatePlayerPosition,
        addPlayer,
        removePlayer,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = (): TeamContextType => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};
