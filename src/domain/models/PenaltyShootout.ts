/**
 * The result of a penalty shootout, recorded on the match that ended the tie.
 *
 * A shootout never changes the match score — `homeTeamScore` / `awayTeamScore` keep their
 * regulation values. It only decides who advances (A1 Art. 17, A2 Art. 16, A3 Art. 17).
 */

/** One kick, in the order it was taken. */
export type PenaltyKick = {
  team: 'home' | 'away';
  playerId: string;
  scored: boolean;
};

type PenaltyShootout = {
  homeScore: number;
  awayScore: number;
  /** Every kick in order, including sudden death. */
  kicks: PenaltyKick[];
};

export default PenaltyShootout;
