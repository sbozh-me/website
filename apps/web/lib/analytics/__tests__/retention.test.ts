import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { dataRetentionPolicy, configureDataRetention } from '../retention';

describe('dataRetentionPolicy', () => {
  it('has correct analytics retention period', () => {
    expect(dataRetentionPolicy.analytics).toBe(90); // 3 months
  });

  it('has correct errors retention period', () => {
    expect(dataRetentionPolicy.errors).toBe(30); // 1 month
  });

  it('has correct performance retention period', () => {
    expect(dataRetentionPolicy.performance).toBe(7); // 1 week
  });

  it('has correct userJourney retention period', () => {
    expect(dataRetentionPolicy.userJourney).toBe(1); // Session only
  });

  it('exports all required retention policies', () => {
    expect(dataRetentionPolicy).toHaveProperty('analytics');
    expect(dataRetentionPolicy).toHaveProperty('errors');
    expect(dataRetentionPolicy).toHaveProperty('performance');
    expect(dataRetentionPolicy).toHaveProperty('userJourney');
  });
});

describe('configureDataRetention', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('runs cleanup immediately on call', () => {
    const consoleSpy = vi.spyOn(console, 'log');

    configureDataRetention();

    expect(consoleSpy).toHaveBeenCalledWith('[Privacy] Data cleanup completed');
  });

  it('schedules daily cleanup', () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval');

    configureDataRetention();

    expect(setIntervalSpy).toHaveBeenCalledWith(
      expect.any(Function),
      24 * 60 * 60 * 1000 // 24 hours
    );
  });

  it('runs cleanup after 24 hours', () => {
    const consoleSpy = vi.spyOn(console, 'log');

    configureDataRetention();

    // Clear initial call
    consoleSpy.mockClear();

    // Fast-forward 24 hours
    vi.advanceTimersByTime(24 * 60 * 60 * 1000);

    expect(consoleSpy).toHaveBeenCalledWith('[Privacy] Data cleanup completed');
  });
});

describe('data cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('removes expired analytics data', () => {
    // Set data that's older than 90 days
    const oldTimestamp = Date.now() - 91 * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      'analytics_last_event',
      JSON.stringify({ timestamp: oldTimestamp, data: 'old' })
    );

    configureDataRetention();

    expect(localStorage.getItem('analytics_last_event')).toBeNull();
  });

  it('keeps recent analytics data', () => {
    // Set data that's within 90 days
    const recentTimestamp = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const data = JSON.stringify({ timestamp: recentTimestamp, data: 'recent' });
    localStorage.setItem('analytics_last_event', data);

    configureDataRetention();

    expect(localStorage.getItem('analytics_last_event')).toBe(data);
  });

  it('removes expired performance metrics', () => {
    const oldTimestamp = Date.now() - 91 * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      'performance_metrics',
      JSON.stringify({ timestamp: oldTimestamp, metrics: {} })
    );

    configureDataRetention();

    expect(localStorage.getItem('performance_metrics')).toBeNull();
  });

  it('removes expired user preferences', () => {
    const oldTimestamp = Date.now() - 91 * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      'user_preferences',
      JSON.stringify({ timestamp: oldTimestamp, prefs: {} })
    );

    configureDataRetention();

    expect(localStorage.getItem('user_preferences')).toBeNull();
  });

  it('removes invalid JSON data', () => {
    localStorage.setItem('analytics_last_event', 'invalid json');

    configureDataRetention();

    expect(localStorage.getItem('analytics_last_event')).toBeNull();
  });

  it('handles data without timestamp', () => {
    localStorage.setItem(
      'analytics_last_event',
      JSON.stringify({ data: 'no timestamp' })
    );

    configureDataRetention();

    // Data without timestamp should remain (no timestamp to check)
    expect(localStorage.getItem('analytics_last_event')).not.toBeNull();
  });

  it('does not affect unrelated localStorage keys', () => {
    localStorage.setItem('unrelated_key', 'some value');

    configureDataRetention();

    expect(localStorage.getItem('unrelated_key')).toBe('some value');
  });

  it('cleans up multiple keys in one pass', () => {
    const oldTimestamp = Date.now() - 91 * 24 * 60 * 60 * 1000;

    localStorage.setItem(
      'analytics_last_event',
      JSON.stringify({ timestamp: oldTimestamp })
    );
    localStorage.setItem(
      'performance_metrics',
      JSON.stringify({ timestamp: oldTimestamp })
    );
    localStorage.setItem(
      'user_preferences',
      JSON.stringify({ timestamp: oldTimestamp })
    );

    configureDataRetention();

    expect(localStorage.getItem('analytics_last_event')).toBeNull();
    expect(localStorage.getItem('performance_metrics')).toBeNull();
    expect(localStorage.getItem('user_preferences')).toBeNull();
  });
});
