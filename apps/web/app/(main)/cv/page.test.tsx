import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CVPage from './page';

describe('CVPage', () => {
  it('renders CV heading', () => {
    render(<CVPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('CV');
  });

  it('renders coming soon message', () => {
    render(<CVPage />);
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });
});
