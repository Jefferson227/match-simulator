import Match from './Match';
import RoundStatus from '../enums/RoundStatus';

type Round = {
  id: string;
  number: number;
  matches: Match[];
  status: RoundStatus;
};

export default Round;
