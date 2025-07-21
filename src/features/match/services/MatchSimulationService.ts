import { Match, Scorer } from '../../types';
import utils from '../../../utils/utils';

const {
  getRandomNumber,
  getPlayerPosition,
  getOpposingPosition,
  getNextFieldArea,
  getPreviousFieldArea,
  getMaxTeamStrength,
  getMaxShooterStrength,
  getMaxDefenseStrength,
} = utils;

const debugTeam = 'Ceará Sporting Club';

function kickOff(matches: Match[]): void {
  matches.forEach((match) => {
    const randomNumber = getRandomNumber(0, 100);
    match.ballPossession.isHomeTeam = randomNumber < 50;
    match.ballPossession.position = 'midfield';

    // Log the kick off
    if (match.homeTeam.name === debugTeam) {
      console.log(
        `kickOff(); team: ${match.ballPossession.isHomeTeam ? match.homeTeam.name : match.visitorTeam.name}; position: ${match.ballPossession.position}`
      );
    }
  });
}

function kickOffAfterGoal(match: Match): void {
  // Ball possession is switched to the opposing team after taking a goal
  match.ballPossession.isHomeTeam = !match.ballPossession.isHomeTeam;
  match.ballPossession.position = 'midfield';

  // Log the kick off after goal
  if (match.homeTeam.name === debugTeam) {
    console.log(
      `kickOffAfterGoal(); team: ${match.ballPossession.isHomeTeam ? match.homeTeam.name : match.visitorTeam.name}; position: ${match.ballPossession.position}`
    );
  }
}

function endMatch(): void {
  // Implementation of end match logic
}

function handleBallShoot(
  match: Match,
  time: number,
  setScorer: (matchId: string, scorer: Scorer) => void,
  increaseScore: (matchId: string, scorerTeam: { isHomeTeam: boolean }) => void
): void {
  // Implementation of handleBallShoot
}

function handleBallPassToNextArea(match: Match): void {
  // Implementation of handleBallPassToNextArea
}

function handleBallPassToPreviousArea(match: Match): void {
  // Implementation of handleBallPassToPreviousArea
}

function handleBallMovement(match: Match): void {
  // Implementation of handleBallMovement
}

function runMatchLogic(
  match: Match,
  time: number,
  setScorer: (matchId: string, scorer: Scorer) => void,
  increaseScore: (matchId: string, scorerTeam: { isHomeTeam: boolean }) => void
): void {
  // Implementation of runMatchLogic
}

function tickClock(
  time: number,
  matches: Match[],
  setScorer: (matchId: string, scorer: Scorer) => void,
  increaseScore: (matchId: string, scorerTeam: { isHomeTeam: boolean }) => void
): void {
  // Implementation of tickClock
}

const MatchSimulationService = {
  kickOff,
  kickOffAfterGoal,
  endMatch,
  handleBallShoot,
  handleBallPassToNextArea,
  handleBallPassToPreviousArea,
  handleBallMovement,
  runMatchLogic,
  tickClock,
};

export default MatchSimulationService;
