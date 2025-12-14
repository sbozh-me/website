import { renderHook, act } from '@testing-library/react';
import { useAnalytics } from '../useAnalytics';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('useAnalytics', () => {
  beforeEach(() => {
    // Mock window.umami
    (window as any).umami = {
      track: vi.fn(),
    };
  });

  afterEach(() => {
    delete (window as any).umami;
  });

  it('tracks custom events', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.track('test_event', { value: 123 });
    });

    expect(window.umami!.track).toHaveBeenCalledWith('test_event', { value: 123 });
  });

  it('tracks clicks with category', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackClick('button_1', 'header');
    });

    expect(window.umami!.track).toHaveBeenCalledWith('click', {
      category: 'header',
      label: 'button_1',
    });
  });

  it('tracks form submissions', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackFormSubmit('contact_form');
    });

    expect(window.umami!.track).toHaveBeenCalledWith('form_submit', {
      form: 'contact_form',
    });
  });

  it('tracks errors with context', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackError('API Error', { endpoint: '/api/users' });
    });

    expect(window.umami!.track).toHaveBeenCalledWith('error', {
      error: 'API Error',
      endpoint: '/api/users',
    });
  });

  it('tracks search queries', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackSearch('test query', 10);
    });

    expect(window.umami!.track).toHaveBeenCalledWith('search', {
      query: 'test query',
      results: 10,
    });
  });

  it('tracks share events', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackShare('twitter', 'https://example.com');
    });

    expect(window.umami!.track).toHaveBeenCalledWith('share', {
      platform: 'twitter',
      url: 'https://example.com',
    });
  });

  it('tracks downloads', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackDownload('report.pdf', 'pdf');
    });

    expect(window.umami!.track).toHaveBeenCalledWith('download', {
      file: 'report.pdf',
      type: 'pdf',
    });
  });

  it('handles missing umami gracefully', () => {
    delete (window as any).umami;
    const { result } = renderHook(() => useAnalytics());

    expect(() => {
      result.current.track('test_event');
    }).not.toThrow();
  });

  it('logs to console in development when umami is not available', () => {
    delete (window as any).umami;
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const consoleSpy = vi.spyOn(console, 'log');

    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.track('test_event', { test: true });
    });

    expect(consoleSpy).toHaveBeenCalledWith('[Analytics Dev]', 'test_event', { test: true });

    consoleSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });
});