import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
  usePathname: () => "/",
}));

const mockAuth = {
  user: null as any,
  status: "unauthenticated",
  logout: jest.fn(),
};

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockAuth,
}));

jest.mock("@/components/layout/ThemeToggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">ThemeToggle</div>,
}));

// Mock DebtSimplificationVisual to avoid complex SVG animations in Jest jsdom
jest.mock("@/components/landing/DebtSimplificationVisual", () => ({
  DebtSimplificationVisual: () => <div data-testid="debt-simplification-visual">Debt Simplification Network</div>,
}));

import { LandingView } from "@/components/landing/LandingView";

beforeAll(() => {
  global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
});

describe("Cinematic Landing Page — Balancio", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.user = null;
    mockAuth.status = "unauthenticated";
  });

  it("renders the primary hero headline, eyebrow, and CTAs", () => {
    render(<LandingView />);

    expect(screen.getByText(/YOUR MONEY, IN BETTER BALANCE/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: /Good times together\.\s*Money, sorted\./i })).toBeInTheDocument();
    expect(
      screen.getByText(/Shared expenses without the awkwardness\. Track spending, settle up, and keep every group in balance\./i)
    ).toBeInTheDocument();

    const getStartedBtns = screen.getAllByRole("button", { name: /Get Started/i });
    expect(getStartedBtns.length).toBeGreaterThan(0);
    fireEvent.click(getStartedBtns[0]);
    expect(mockPush).toHaveBeenCalledWith("/register");
  });

  it("renders authenticated state with 'Go to Dashboard' CTA", () => {
    mockAuth.user = { id: "u1", name: "Alex" };
    mockAuth.status = "authenticated";

    render(<LandingView />);

    const dashboardBtns = screen.getAllByRole("button", { name: /Go to Dashboard/i });
    expect(dashboardBtns.length).toBeGreaterThan(0);
    fireEvent.click(dashboardBtns[0]);
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("renders the single 3D tilt card with group overview and expense breakdown", () => {
    const scrollIntoViewMock = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    const { container } = render(<LandingView />);

    // Verify asymmetric two-column layout structure & cohesive showcase container
    const leftColumn = container.querySelector(".lg\\:col-span-5");
    const rightColumn = container.querySelector(".lg\\:col-span-7");
    expect(leftColumn).toBeInTheDocument();
    expect(rightColumn).toBeInTheDocument();

    const previewStage = screen.getByTestId("hero-preview-stage");
    expect(previewStage).toBeInTheDocument();
    expect(screen.getByText(/Your Balance/i)).toBeInTheDocument();
    expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument();

    // Verify Single Card Content
    expect(screen.getAllByText(/Group overview/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/WEEKEND TRIP/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/₹8,400/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Accommodation/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Food & Dining/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Transport/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Everyone's settled/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/All balances clear/i).length).toBeGreaterThanOrEqual(1);

    // Verify Explore Balancio secondary CTA triggers smooth scroll
    const exploreBtn = screen.getByRole("button", { name: /Explore Balancio/i });
    expect(exploreBtn).toBeInTheDocument();
    fireEvent.click(exploreBtn);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth" });
  });

  it("supports pointer movements over the hero dashboard container without errors", () => {
    render(<LandingView />);
    const previewContainer = screen.getByTestId("hero-preview-stage");
    expect(previewContainer).toBeInTheDocument();

    fireEvent.pointerMove(previewContainer, { clientX: 200, clientY: 150 });
    fireEvent.pointerLeave(previewContainer);
  });

  it("renders social proof value strip items", () => {
    render(<LandingView />);

    expect(screen.getByText("Know who paid.")).toBeInTheDocument();
    expect(screen.getByText("Split expenses fairly.")).toBeInTheDocument();
    expect(screen.getByText("See the bigger picture.")).toBeInTheDocument();
    expect(screen.getByText("Settle up with confidence.")).toBeInTheDocument();
  });

  it("renders the 4 core feature cards", () => {
    render(<LandingView />);

    expect(screen.getByText("Effortless Expense Splitting")).toBeInTheDocument();
    expect(screen.getByText("Group Balance Tracking")).toBeInTheDocument();
    expect(screen.getByText("Spending Insights")).toBeInTheDocument();
    expect(screen.getByText("AI-Powered Assistance")).toBeInTheDocument();
  });

  it("renders the 3 how-it-works workflow steps", () => {
    render(<LandingView />);

    expect(screen.getByText("Create or join a group")).toBeInTheDocument();
    expect(screen.getByText("Add shared expenses")).toBeInTheDocument();
    expect(screen.getByText("Understand and settle balances")).toBeInTheDocument();
  });

  it("switches tabs in the product showcase", async () => {
    render(<LandingView />);

    expect(screen.getAllByText("Debt Simplification").length).toBeGreaterThan(0);
    expect(screen.getByTestId("debt-simplification-visual")).toBeInTheDocument();

    // Switch to Group Ledger tab
    const ledgerTabBtn = screen.getByRole("button", { name: /Group Ledger/i });
    fireEvent.click(ledgerTabBtn);
    expect(await screen.findByText(/Rahul Sharma/i)).toBeInTheDocument();
    expect(await screen.findByText(/Priya Patel/i)).toBeInTheDocument();

    // Switch to AI Assistant tab
    const aiTabBtn = screen.getByRole("button", { name: /AI Financial Assistant/i });
    fireEvent.click(aiTabBtn);
    expect(await screen.findByText(/Balancio AI Assistant/i)).toBeInTheDocument();
    expect(await screen.findByText(/What are my top 3 expenses from last month's Goa trip\?/i)).toBeInTheDocument();
  });

  it("toggles the responsive mobile navigation drawer", () => {
    render(<LandingView />);

    const menuToggleBtn = screen.getByRole("button", { name: /Open menu/i });
    expect(menuToggleBtn).toBeInTheDocument();

    fireEvent.click(menuToggleBtn);
    expect(screen.getByRole("button", { name: /Close menu/i })).toBeInTheDocument();
  });

  it("renders the footer with navigation, branding, and copyright", () => {
    render(<LandingView />);

    expect(
      screen.getByText(/Balancio is an intelligent expense-sharing workspace/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
  });
});
