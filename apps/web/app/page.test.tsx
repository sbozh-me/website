import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from './page';

describe('Home', () => {
  it('renders site title', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('sbozh.me');
  });

  it('renders tagline', () => {
    render(<Home />);
    expect(screen.getByText('Developer & Creator')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Home />);
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog');
    expect(screen.getByRole('link', { name: 'CV' })).toHaveAttribute('href', '/cv');
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
  });

  it('renders tech stack section', () => {
    render(<Home />);
    expect(screen.getByText('Built with')).toBeInTheDocument();
    expect(screen.getByTitle('Next.js')).toBeInTheDocument();
    expect(screen.getByTitle('React')).toBeInTheDocument();
    expect(screen.getByTitle('Tailwind')).toBeInTheDocument();
  });
});
