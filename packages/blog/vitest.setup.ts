import "@testing-library/jest-dom/vitest";

// Mock IntersectionObserver for components that use scroll tracking
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
  get root() {
    return null;
  }
  get rootMargin() {
    return "";
  }
  get thresholds() {
    return [];
  }
} as any;
