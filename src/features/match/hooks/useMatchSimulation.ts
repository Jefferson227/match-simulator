import { useState, useEffect, useCallback } from 'react';
import { Match, MatchTeam, Scorer } from '../types';
import { useMatchContext } from '../contexts/MatchContext';

interface UseMatchSimulationProps {
  initialMatches?: Match[];
  onMatchEnd?: (matches: Match[]) => void;
  onTimeUpdate?: (time: number) => void;
  onGoalScored?: (match: Match, scorer: Scorer) => void;
  onMatchStart?: (matches: Match[]) => void;
  onMatchPause?: () => void;
  onMatchResume?: () => void;
  clockSpeed?: number;
  autoStart?: boolean;
}

const useMatchSimulation = ({
  initialMatches = [],
  onMatchEnd,
  onTimeUpdate,
  onGoalScored,
  onMatchStart,
  onMatchPause,
  onMatchResume,
  clockSpeed: initialClockSpeed = 1000,
  autoStart = false,
}: UseMatchSimulationProps = {}) => {
  const { matches, setMatches, setScorer, increaseScore } = useMatchContext();
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [clockSpeed, setClockSpeed] = useState(initialClockSpeed);
  const [isFinished, setIsFinished] = useState(false);

  // Initialize matches if provided
  useEffect(() => {
    if (initialMatches.length > 0) {
      setMatches(
        initialMatches.map((match) => ({
          ...match,
          homeTeam: { ...match.homeTeam, score: 0 },
          visitorTeam: { ...match.visitorTeam, score: 0 },
          lastScorer: null,
          scorers: [],
          isFinished: false,
        }))
      );
      
      if (onMatchStart) {
        onMatchStart(initialMatches);
      }
    }
  }, [initialMatches, onMatchStart, setMatches]);

  // Handle match simulation timer
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isRunning && time < 90) {
      timer = setTimeout(() => {
        const newTime = time + 1;
        setTime(newTime);
        
        if (onTimeUpdate) {
          onTimeUpdate(newTime);
        }

        // Simulate match events
        if (matches.length > 0) {
          simulateMatchEvents(newTime);
        }
      }, clockSpeed);
    } else if (time >= 90 && !isFinished) {
      // Match ended
      setIsFinished(true);
      if (onMatchEnd) {
        onMatchEnd(matches);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [time, isRunning, matches, clockSpeed, isFinished, onTimeUpdate, onMatchEnd]);

  // Simulate match events (goals, cards, etc.)
  const simulateMatchEvents = useCallback((currentTime: number) => {
    // This is a simplified simulation - in a real app, this would be more sophisticated
    matches.forEach((match) => {
      // Random chance of a goal
      if (Math.random() < 0.02) {
        const isHomeTeam = Math.random() > 0.5;
        const team = isHomeTeam ? match.homeTeam : match.visitorTeam;
        
        if (team.players && team.players.length > 0) {
          const randomPlayer = team.players[Math.floor(Math.random() * team.players.length)];
          
          const scorer: Scorer = {
            playerId: randomPlayer.id,
            playerName: randomPlayer.name,
            time: currentTime,
            isHomeTeam,
          };
          
          setScorer(match.id, scorer);
          increaseScore(match.id, { isHomeTeam });
          
          if (onGoalScored) {
            onGoalScored(match, scorer);
          }
        }
      }
    });
  }, [matches, onGoalScored, setScorer, increaseScore]);

  const startMatch = useCallback(() => {
    setIsRunning(true);
    if (onMatchResume) onMatchResume();
  }, [onMatchResume]);

  const pauseMatch = useCallback(() => {
    setIsRunning(false);
    if (onMatchPause) onMatchPause();
  }, [onMatchPause]);

  const resetMatch = useCallback(() => {
    setTime(0);
    setIsRunning(false);
    setIsFinished(false);
    
    if (initialMatches.length > 0) {
      setMatches(
        initialMatches.map((match) => ({
          ...match,
          homeTeam: { ...match.homeTeam, score: 0 },
          visitorTeam: { ...match.visitorTeam, score: 0 },
          lastScorer: null,
          scorers: [],
          isFinished: false,
        }))
      );
    }
  }, [initialMatches, setMatches]);

  const changeClockSpeed = useCallback((speed: number) => {
    setClockSpeed(speed);
  }, []);

  return {
    time,
    isRunning,
    isFinished,
    clockSpeed,
    matches,
    startMatch,
    pauseMatch,
    resetMatch,
    changeClockSpeed,
  };
};

export default useMatchSimulation;
