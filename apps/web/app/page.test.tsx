import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from './page';

describe('Home', () => {
  it('renders welcome heading', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome to sbozh');
  });

  it('renders button', () => {
    render(<Home />);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });
});
