import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorState } from "@/components/common/ErrorState";
import { ApiError } from "@/lib/api/errors";

describe("ErrorState", () => {
  it("shows session-expired copy for a 401", () => {
    render(<ErrorState error={new ApiError(401, "UNAUTHENTICATED", "")} />);
    expect(screen.getByText(/session expired/i)).toBeInTheDocument();
  });

  it("shows a permission message for a 403", () => {
    render(<ErrorState error={new ApiError(403, "UNAUTHORIZED", "")} />);
    expect(screen.getByText(/don't have access/i)).toBeInTheDocument();
  });

  it("shows a not-found message for a 404", () => {
    render(<ErrorState error={new ApiError(404, "NOT_FOUND", "")} />);
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });

  it("shows a network message for a network failure", () => {
    render(<ErrorState error={new ApiError(0, "NETWORK_ERROR", "")} />);
    expect(screen.getByText(/couldn't reach the server/i)).toBeInTheDocument();
  });

  it("never displays the raw backend error code", () => {
    render(<ErrorState error={new ApiError(500, "INTERNAL_ERROR", "raw backend detail")} />);
    expect(screen.queryByText("INTERNAL_ERROR")).not.toBeInTheDocument();
  });

  it("calls onRetry when the Try again button is clicked", () => {
    const onRetry = jest.fn();
    render(<ErrorState error={new ApiError(500, "INTERNAL_ERROR", "")} onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not render a retry button when onRetry is not provided", () => {
    render(<ErrorState error={new ApiError(500, "INTERNAL_ERROR", "")} />);
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });
});
