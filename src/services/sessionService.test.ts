import sessionService from './sessionService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('sessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('saveSession', () => {
    it('should save session data to localStorage', () => {
      const mockSessionData = {
        general: {
          currentPage: 1,
          screenDisplayed: 'TeamManager',
          baseTeam: {
            id: 'test-team',
            name: 'Test Team',
            shortName: 'Test',
            abbreviation: 'TST',
            colors: { outline: '#000', background: '#fff', name: '#000' },
            players: [],
            morale: 50,
            formation: '4-4-2',
            overallMood: 50,
            initialOverallStrength: 70,
          },
          matchTeam: null,
          matchOtherTeams: [],
        },
        championship: {
          currentRound: 5,
          selectedChampionship: 'test',
          humanPlayerBaseTeam: null,
          teamsControlledAutomatically: [],
          seasonMatchCalendar: [],
          tableStandings: [],
        },
        matches: [],
      };

      sessionService.saveSession(mockSessionData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'match-simulator-session',
        expect.stringContaining('"currentPage":1')
      );
    });

    it('should handle errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const mockSessionData = {
        general: {
          currentPage: 1,
          screenDisplayed: 'InitialScreen',
          baseTeam: {
            id: 'test-team',
            name: 'Test Team',
            shortName: 'Test',
            abbreviation: 'TST',
            colors: { outline: '#000', background: '#fff', name: '#000' },
            players: [],
            morale: 50,
            formation: '4-4-2',
            overallMood: 50,
            initialOverallStrength: 70,
          },
          matchTeam: null,
          matchOtherTeams: [],
        },
        championship: {
          currentRound: 1,
          selectedChampionship: null,
          humanPlayerBaseTeam: null,
          teamsControlledAutomatically: [],
          seasonMatchCalendar: [],
          tableStandings: [],
        },
        matches: [],
      };

      expect(() => sessionService.saveSession(mockSessionData)).not.toThrow();
    });
  });

  describe('loadSession', () => {
    it('should return null when no session exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = sessionService.loadSession();

      expect(result).toBeNull();
    });

    it('should load and return session data', () => {
      const mockSessionData = {
        general: { currentPage: 1, screenDisplayed: 'TeamManager' },
        championship: { currentRound: 5, selectedChampionship: 'test' },
        matches: [],
        timestamp: Date.now(),
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSessionData));

      const result = sessionService.loadSession();

      expect(result).toEqual(mockSessionData);
    });

    it('should return null for expired sessions', () => {
      const mockSessionData = {
        general: { currentPage: 1 },
        championship: { currentRound: 1 },
        matches: [],
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSessionData));

      const result = sessionService.loadSession();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'match-simulator-session'
      );
    });

    it('should handle parsing errors gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = sessionService.loadSession();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'match-simulator-session'
      );
    });
  });

  describe('hasSession', () => {
    it('should return true when valid session exists', () => {
      const mockSessionData = {
        general: { currentPage: 1 },
        championship: { currentRound: 1 },
        matches: [],
        timestamp: Date.now(),
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSessionData));

      const result = sessionService.hasSession();

      expect(result).toBe(true);
    });

    it('should return false when no session exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = sessionService.hasSession();

      expect(result).toBe(false);
    });

    it('should return false for expired sessions', () => {
      const mockSessionData = {
        general: { currentPage: 1 },
        championship: { currentRound: 1 },
        matches: [],
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSessionData));

      const result = sessionService.hasSession();

      expect(result).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'match-simulator-session'
      );
    });
  });

  describe('clearSession', () => {
    it('should remove session from localStorage', () => {
      sessionService.clearSession();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'match-simulator-session'
      );
    });

    it('should handle errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => sessionService.clearSession()).not.toThrow();
    });
  });
});
