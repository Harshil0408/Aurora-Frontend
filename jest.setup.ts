import '@testing-library/jest-dom';

/**
 * Global test hardening:
 * - jsdom gaps (matchMedia, observers) stubbed for MUI.
 * - stable crypto.randomUUID so snapshots don't flake.
 * - storage cleared per-test so tokens never bleed across cases.
 * - fail loudly on unintended real network.
 */

if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (window as unknown as Record<string, unknown>).ResizeObserver = ResizeObserver;
}

if (typeof window !== 'undefined' && !window.IntersectionObserver) {
  class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (window as unknown as Record<string, unknown>).IntersectionObserver =
    IntersectionObserver;
}

if (typeof window !== 'undefined' && !window.scrollTo) {
  (window as unknown as Record<string, unknown>).scrollTo = jest.fn();
}

// crypto.randomUUID exists in Node 19+ but jsdom may lack it
if (typeof crypto !== 'undefined' && !('randomUUID' in crypto)) {
  Object.defineProperty(crypto, 'randomUUID', {
    value: () => 'test-request-id-0000-0000-000000000000',
  });
}

beforeEach(() => {
  try {
    window.localStorage.clear();
  } catch {}
  try {
    window.sessionStorage.clear();
  } catch {}
});

// Safety net: any test that reaches the real network fails with a clear message.
// Mocks (axios adapter, apiClient.request, RTK Query) bypass fetch, so legit
// unit tests are unaffected.
const realFetch = global.fetch;
beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.reject(
      new Error(
        'Blocked real network call in Jest. Mock apiClient / RTK Query instead.',
      ),
    ),
  ) as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = realFetch;
});
