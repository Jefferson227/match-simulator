import { SetStateAction } from 'react';
import { Match, Scorer, TeamSquadView } from '../../../types';
import { GeneralState } from '../../../reducers/types';

export interface RunMatchLogicParams {
  detailsMatchId: string;
  teamSquadView: TeamSquadView;
  time: number;
  setTime: (value: SetStateAction<number>) => void;
  state: GeneralState;
  matches: Match[];
  setScorer: (matchId: string, scorer: Scorer) => void;
  increaseScore: (matchId: string, scorerTeam: { isHomeTeam: boolean }) => void;
  standingsUpdated: boolean;
  standingsTimeoutSet: boolean;
  updateTableStandings: (matches: Match[]) => void;
  setStandingsUpdated: (value: SetStateAction<boolean>) => void;
  setStandingsTimeoutSet: (value: SetStateAction<boolean>) => void;
  updateTeamMorale: (matches: Match[]) => void;
  setIsRoundOver: (isRoundOver: boolean) => void;
  setScreenDisplayed: (screen: string) => void;
}
