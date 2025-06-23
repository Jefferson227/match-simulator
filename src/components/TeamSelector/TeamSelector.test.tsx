import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamSelector from './TeamSelector';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'teamSelector.selectATeam') {
        return 'SELECT A TEAM';
      }
      return key;
    },
  }),
}));

describe('TeamSelector', () => {
  test('renders the component and initial teams', () => {
    render(<TeamSelector />);

    expect(screen.getByText('SELECT A TEAM')).toBeInTheDocument();

    expect(screen.getByText('FLAMENGO')).toBeInTheDocument();
    expect(screen.getByText('MIRASSOL')).toBeInTheDocument();
    expect(screen.queryByText('CORINTHIANS')).not.toBeInTheDocument();
  });

  test('paginates to the next page of teams', () => {
    render(<TeamSelector />);

    const nextButton = screen.getByText('>');
    fireEvent.click(nextButton);

    expect(screen.queryByText('FLAMENGO')).not.toBeInTheDocument();
    expect(screen.getByText('CORINTHIANS')).toBeInTheDocument();
  });
});
