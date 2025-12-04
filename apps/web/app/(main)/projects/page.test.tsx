import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProjectsPage from './page';

describe('ProjectsPage', () => {
  it('renders projects heading', () => {
    render(<ProjectsPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Projects');
  });

  it('renders coming soon message', () => {
    render(<ProjectsPage />);
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });
});
