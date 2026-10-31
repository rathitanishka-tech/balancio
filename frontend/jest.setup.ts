import "@testing-library/jest-dom";

if (typeof Request === 'undefined') {
  global.Request = class Request {} as any;
}
if (typeof Response === 'undefined') {
  global.Response = class Response {} as any;
}
if (typeof Headers === 'undefined') {
  global.Headers = class Headers {} as any;
}

if (typeof window !== "undefined") {
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
  if (typeof Element !== "undefined") {
    Element.prototype.scrollIntoView = jest.fn();
  }
}

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

jest.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }: { children: any }) => children,
  SignIn: () => "Sign In",
  SignUp: () => "Sign Up",
  UserButton: () => "User Button",
}));

jest.mock("@clerk/nextjs/server", () => ({
  auth: () => ({ userId: "mock-clerk-id" }),
  currentUser: () => ({ emailAddresses: [{ emailAddress: "mock@example.com" }] }),
  clerkMiddleware: () => jest.fn(),
  createRouteMatcher: () => jest.fn(),
}));
