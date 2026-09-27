import { render, screen, waitFor } from "@testing-library/react";

const replaceMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: jest.fn() })
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn()
}));

import { useAuth } from "@/hooks/useAuth";
import { DashboardShell } from "@/components/layout/DashboardShell";

const mockedUseAuth = useAuth as jest.Mock;

describe("DashboardShell route protection", () => {
  afterEach(() => {
    replaceMock.mockClear();
  });

  it("redirects to /login when the user is unauthenticated", async () => {
    mockedUseAuth.mockReturnValue({ status: "unauthenticated" });
    render(<DashboardShell>{"protected content"}</DashboardShell>);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });

  it("shows a loading state without redirecting while auth status is loading", () => {
    mockedUseAuth.mockReturnValue({ status: "loading" });
    render(<DashboardShell>{"protected content"}</DashboardShell>);

    expect(replaceMock).not.toHaveBeenCalled();
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
    expect(screen.getByText(/loading your workspace/i)).toBeInTheDocument();
  });
});
