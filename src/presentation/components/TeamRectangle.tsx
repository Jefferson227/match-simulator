import { FC } from 'react';
import { Team } from '../../domain/models/Team';

interface TeamRectangleProps {
  team: Team;
  runFunction: () => void;
}

const TeamRectangle: FC<TeamRectangleProps> = ({ team, runFunction }) => {
  return (
    <div
      className="w-[95px] h-[39px] border-[4px] box-content cursor-pointer"
      style={{ borderColor: team.colors.outline }}
      onClick={runFunction}
    >
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: team.colors.background }}
      >
        <h2 className="font-press-start text-[22px]" style={{ color: team.colors.text }}>
          {team.abbreviation}
        </h2>
      </div>
    </div>
  );
};

export default TeamRectangle;
