import Match from './Match';

type Round = {
  id: string;
  number: number;
  matches: Match[];
  // status: RoundStatus; // It should be an enum with the possible values 'not-started', 'in-progress' and 'finished'
};

export default Round;
