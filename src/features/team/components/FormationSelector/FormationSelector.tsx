import React, { useState, useEffect } from 'react';

interface FormationSelectorProps {
  selectedFormation: string;
  onFormationChange: (formation: string) => Promise<void>;
  availableFormations?: string[];
  className?: string;
  disabled?: boolean;
}

const FormationSelector: React.FC<FormationSelectorProps> = ({
  selectedFormation,
  onFormationChange,
  availableFormations = ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '3-4-3'],
  className = '',
  disabled = false,
}) => {
  const [isChanging, setIsChanging] = useState(false);
  const [localFormation, setLocalFormation] = useState(selectedFormation);

  // Update local state when selectedFormation prop changes
  useEffect(() => {
    setLocalFormation(selectedFormation);
  }, [selectedFormation]);

  const handleFormationChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFormation = e.target.value;
    setLocalFormation(newFormation);
    
    try {
      setIsChanging(true);
      await onFormationChange(newFormation);
    } catch (error) {
      // Revert to previous formation on error
      setLocalFormation(selectedFormation);
      console.error('Failed to update formation:', error);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className={`formation-selector ${className}`}>
      <label htmlFor="formation-select" className="block text-sm font-medium text-gray-700">
        Formation
      </label>
      <select
        id="formation-select"
        value={localFormation}
        onChange={handleFormationChange}
        disabled={disabled || isChanging}
        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${
          disabled || isChanging ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
        }`}
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
