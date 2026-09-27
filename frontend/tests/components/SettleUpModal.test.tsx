import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mutateAsyncMock = jest.fn().mockResolvedValue({ _id: "s1" });

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { _id: "demo-tanu", name: "Tanu" } })
}));

jest.mock("@/hooks/useSettlements", () => ({
  useCreateSettlement: () => ({ mutateAsync: mutateAsyncMock, isPending: false })
}));

jest.mock("@/hooks/useMediaQuery", () => ({
  useIsMobile: () => false
}));

import { SettleUpModal } from "@/components/settlements/SettleUpModal";

describe("SettleUpModal - critical settlement UX", () => {
  afterEach(() => jest.clearAllMocks());

  it("prefills the suggested amount and payee", () => {
    render(
      <SettleUpModal
        open
        onOpenChange={jest.fn()}
        groupId="group-1"
        toUserId="user-rahul"
        toUserName="Rahul"
        suggestedAmount={50000}
        currency="INR"
      />
    );

    expect(screen.getByText(/recording a payment to Rahul/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toHaveValue(500);
  });

  it("submits the settlement with the current user as fromUser", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    render(
      <SettleUpModal
        open
        onOpenChange={onOpenChange}
        groupId="group-1"
        toUserId="user-rahul"
        toUserName="Rahul"
        suggestedAmount={50000}
        currency="INR"
      />
    );

    await user.click(screen.getByRole("button", { name: /confirm settlement/i }));

    await waitFor(() =>
      expect(mutateAsyncMock).toHaveBeenCalledWith(
        expect.objectContaining({
          groupId: "group-1",
          fromUser: "demo-tanu",
          toUser: "user-rahul",
          amount: 50000,
          paymentMethod: "UPI"
        })
      )
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("closes without submitting when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    render(
      <SettleUpModal
        open
        onOpenChange={onOpenChange}
        groupId="group-1"
        toUserId="user-rahul"
        toUserName="Rahul"
        suggestedAmount={50000}
      />
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mutateAsyncMock).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
