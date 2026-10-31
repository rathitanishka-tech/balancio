import { render, screen } from "@testing-library/react";

jest.mock("@clerk/nextjs", () => ({
  SignIn: () => <div data-testid="clerk-sign-in">Clerk Sign In</div>
}));

import LoginPage from "@/app/(auth)/login/page";

describe("LoginPage", () => {
  it("renders Clerk SignIn component", () => {
    render(<LoginPage />);
    expect(screen.getByTestId("clerk-sign-in")).toBeInTheDocument();
  });
});
