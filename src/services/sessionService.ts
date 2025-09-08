import { GeneralState } from '../reducers/generalReducer';
import { ChampionshipState } from '../reducers/championshipReducer';
import { Match } from '../types';

export interface SessionState {
  general: GeneralState;
  championship: ChampionshipState;
  matches: Match[];
  timestamp: number;
}

const SESSION_STORAGE_KEY = 'match-simulator-session';

export const sessionService = {
  // Save the complete application state
  saveSession: (sessionState: Omit<SessionState, 'timestamp'>): void => {
    try {
      const sessionData: SessionState = {
        ...sessionState,
        timestamp: Date.now(),
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  },

  // Load the complete application state
  loadSession: (): SessionState | null => {
    try {
      const sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionData) {
        return null;
      }

      const parsedSession = JSON.parse(sessionData) as SessionState;

      // Validate that the session data is not too old (optional: 24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (Date.now() - parsedSession.timestamp > maxAge) {
        sessionService.clearSession();
        return null;
      }

      // Migration: ensure seasonMatchCalendarGroups exists for backward compatibility
      if (!parsedSession.championship.seasonMatchCalendarGroups) {
        parsedSession.championship.seasonMatchCalendarGroups = [];
      }

      return parsedSession;
    } catch (error) {
      console.error('Failed to load session:', error);
      sessionService.clearSession();
      return null;
    }
  },

  // Check if a saved session exists
  hasSession: (): boolean => {
    try {
      const sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionData) {
        return false;
      }

      const parsedSession = JSON.parse(sessionData) as SessionState;

      // Check if session is not too old
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (Date.now() - parsedSession.timestamp > maxAge) {
        sessionService.clearSession();
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  },

  // Clear the saved session
  clearSession: (): void => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  },
};

export default sessionService;
