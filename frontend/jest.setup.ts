import "@testing-library/jest-dom";

// jsdom doesn't implement matchMedia - several components (useMediaQuery,
// prefers-reduced-motion checks) rely on it.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// jsdom doesn't implement scrollIntoView / ResizeObserver, which Radix
// primitives (Select, Dialog) probe for.
Element.prototype.scrollIntoView = jest.fn();

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
