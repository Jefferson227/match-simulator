import React from 'react';
import { useTeamManagement } from '../../hooks';

interface FormationSelectorProps {
  availableFormations?: string[];
  className?: string;
}

const FormationSelector: React.FC<FormationSelectorProps> = ({
  availableFormations = ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '3-4-3'],
  className = '',
}) => {
  const { formation, updateFormation } = useTeamManagement();

  const handleFormationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFormation(e.target.value);
  };

  return (
    <div className={`formation-selector ${className}`}>
      <label htmlFor="formation-select" className="block text-sm font-medium text-gray-700">
        Formation
      </label>
      <select
        id="formation-select"
        value={formation}
        onChange={handleFormationChange}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        {availableFormations.map((form) => (
          <option key={form} value={form}>
            {form}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FormationSelector;
