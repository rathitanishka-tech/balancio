import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = jest.fn();
const loginMock = jest.fn().mockResolvedValue(undefined);
const enterDemoMock = jest.fn().mockResolvedValue(undefined);

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock })
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ login: loginMock, enterDemo: enterDemoMock })
}));

import LoginPage from "@/app/(auth)/login/page";

describe("LoginPage", () => {
  afterEach(() => jest.clearAllMocks());

  it("shows validation errors for an invalid email and empty password", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("calls login and navigates to the dashboard on valid submission", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "tanu@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => expect(loginMock).toHaveBeenCalledWith("tanu@example.com", "password123"));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));
  });

  it("enters demo mode when Explore Demo is clicked", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /explore demo/i }));

    await waitFor(() => expect(enterDemoMock).toHaveBeenCalled());
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));
  });
});
