import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChampionshipSelector from './ChampionshipSelector';

describe('ChampionshipSelector', () => {
  test('renders the component and initial championships', () => {
    render(<ChampionshipSelector />);

    expect(screen.getByText('SELECT CHAMPIONSHIP')).toBeInTheDocument();

    expect(screen.getByText('BRASILEIRÃO SÉRIE A')).toBeInTheDocument();
    expect(screen.getByText('BUNDESLIGA')).toBeInTheDocument();
    expect(screen.queryByText('LA LIGA')).not.toBeInTheDocument();
  });

  test('previous button is disabled on the first page', () => {
    render(<ChampionshipSelector />);
    const prevButton = screen.getByText('<');
    expect(prevButton).toBeDisabled();
  });

  test('next button is enabled on the first page', () => {
    render(<ChampionshipSelector />);
    const nextButton = screen.getByText('>');
    expect(nextButton).not.toBeDisabled();
  });

  test('paginates to the next page of championships', () => {
    render(<ChampionshipSelector />);

    const nextButton = screen.getByText('>');
    fireEvent.click(nextButton);

    expect(screen.queryByText('BRASILEIRÃO SÉRIE A')).not.toBeInTheDocument();
    expect(screen.getByText('LA LIGA')).toBeInTheDocument();
    expect(screen.getByText('LIGUE 1')).toBeInTheDocument();
  });

  test('next button is disabled on the last page', () => {
    render(<ChampionshipSelector />);

    const nextButton = screen.getByText('>');
    fireEvent.click(nextButton); // Click to go to the last page

    expect(nextButton).toBeDisabled();
  });

  test('paginates to the previous page of championships', () => {
    render(<ChampionshipSelector />);

    const nextButton = screen.getByText('>');
    fireEvent.click(nextButton); // Go to next page

    const prevButton = screen.getByText('<');
    fireEvent.click(prevButton); // Go back to previous page

    expect(screen.getByText('BRASILEIRÃO SÉRIE A')).toBeInTheDocument();
    expect(screen.queryByText('LA LIGA')).not.toBeInTheDocument();
  });
});
