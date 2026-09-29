import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = jest.fn();
const refreshUserMock = jest.fn().mockResolvedValue(undefined);

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock })
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ refreshUser: refreshUserMock })
}));

global.fetch = jest.fn();

import LoginPage from "@/app/(auth)/login/page";

describe("LoginPage", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows an error when login fails", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Invalid credentials" })
    });
    
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "wrong@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it("calls login and navigates to the dashboard on valid submission", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "tanu@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith("/api/auth/login", expect.any(Object)));
    await waitFor(() => expect(refreshUserMock).toHaveBeenCalled());
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));
  });
});
