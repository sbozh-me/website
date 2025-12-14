interface RetentionPolicy {
  analytics: number; // days
  errors: number; // days
  performance: number; // days
  userJourney: number; // days
}

export const dataRetentionPolicy: RetentionPolicy = {
  analytics: 90, // 3 months
  errors: 30, // 1 month
  performance: 7, // 1 week
  userJourney: 1, // Session only
};

// This configuration should match your Umami and GlitchTip settings
export function configureDataRetention() {
  // Umami: Configure in dashboard settings
  // GlitchTip: Configure in project settings

  // Client-side cleanup
  scheduleDataCleanup();
}

function scheduleDataCleanup() {
  if (typeof window === 'undefined') return;

  // Run cleanup daily
  setInterval(() => {
    cleanupOldData();
  }, 24 * 60 * 60 * 1000);

  // Run on page load
  cleanupOldData();
}

function cleanupOldData() {
  if (typeof window === 'undefined') return;

  const now = Date.now();

  // Clean localStorage
  const keysToCheck = [
    'analytics_last_event',
    'performance_metrics',
    'user_preferences',
  ];

  keysToCheck.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.timestamp && (now - parsed.timestamp) > dataRetentionPolicy.analytics * 24 * 60 * 60 * 1000) {
          localStorage.removeItem(key);
        }
      } catch {
        // Invalid data, remove it
        localStorage.removeItem(key);
      }
    }
  });

  // Log cleanup
  console.log('[Privacy] Data cleanup completed');
}