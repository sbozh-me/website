import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BlogPage from './page';

describe('BlogPage', () => {
  it('renders blog heading', () => {
    render(<BlogPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Blog');
  });

  it('renders coming soon message', () => {
    render(<BlogPage />);
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });
});
