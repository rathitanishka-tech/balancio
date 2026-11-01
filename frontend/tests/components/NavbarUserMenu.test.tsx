import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";

const mockLogout = jest.fn();
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: "u1",
      name: "Tanishka Rathi",
      email: "tanishka@example.com",
    },
    logout: mockLogout,
    status: "authenticated",
  }),
}));

jest.mock("@/components/glass", () => {
  const actual = jest.requireActual("@/components/glass");
  return {
    ...actual,
    GlassDropdown: ({ trigger, items }: { trigger: React.ReactNode; items: Array<{ label: string; onSelect: () => void }> }) => (
      <div data-testid="glass-dropdown">
        {trigger}
        <div data-testid="dropdown-items">
          {items.map((item) => (
            <button key={item.label} onClick={item.onSelect} role="menuitem">
              {item.label}
            </button>
          ))}
        </div>
      </div>
    ),
  };
});

jest.mock("@/components/layout/ThemeToggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

jest.mock("@/components/notifications/NotificationBell", () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

import { Navbar } from "@/components/layout/Navbar";
import { UserMenu } from "@/components/layout/UserMenu";
import { ProfileForm } from "@/components/profile/ProfileForm";

describe("Mobile Logout and UserMenu verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Navbar renders visible user controls and accessible logout button without mobile breakpoint hiding", () => {
    const { container } = render(<Navbar onOpenSearch={jest.fn()} onOpenAi={jest.fn()} />);

    // Verify user controls container is NOT hidden on mobile (no 'hidden sm:flex')
    const userControlsDiv = container.querySelector(".flex.items-center.gap-1");
    expect(userControlsDiv).toBeInTheDocument();
    expect(userControlsDiv?.className).not.toContain("hidden sm:flex");

    // Verify direct LogOut button is present and accessible
    const logoutBtn = screen.getByRole("button", { name: /^log out$/i });
    expect(logoutBtn).toBeInTheDocument();

    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("UserMenu renders accessible trigger and handles Log out selection", async () => {
    render(<UserMenu collapsed align="end" />);

    const trigger = screen.getByRole("button", { name: /user menu for tanishka rathi/i });
    expect(trigger).toBeInTheDocument();

    const logoutItem = screen.getByRole("menuitem", { name: /log out/i });
    expect(logoutItem).toBeInTheDocument();

    fireEvent.click(logoutItem);
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("ProfileForm renders Session section with Log out button", async () => {
    render(<ProfileForm />);

    expect(screen.getByText("Session")).toBeInTheDocument();
    const logoutBtn = screen.getByRole("button", { name: /log out/i });
    expect(logoutBtn).toBeInTheDocument();

    fireEvent.click(logoutBtn);
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });
});
