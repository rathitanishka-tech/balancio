import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SplitTypeSelector, type SplitParticipant } from "@/components/expenses/SplitTypeSelector";

function makeParticipants(): SplitParticipant[] {
  return [
    { userId: "u1", name: "Tanu", included: true, percentage: 25, shareAmount: 600 },
    { userId: "u2", name: "Rahul", included: true, percentage: 25, shareAmount: 600 },
    { userId: "u3", name: "Priya", included: true, percentage: 25, shareAmount: 600 },
    { userId: "u4", name: "Aman", included: true, percentage: 25, shareAmount: 600 }
  ];
}

describe("SplitTypeSelector - Equal split", () => {
  it("shows each included participant's equal share and a satisfied total", () => {
    render(
      <SplitTypeSelector
        amount={2400}
        currency="INR"
        splitType="EQUAL"
        onSplitTypeChange={jest.fn()}
        participants={makeParticipants()}
        onParticipantsChange={jest.fn()}
      />
    );

    // 2400 / 4 = 600 each, shown for every participant
    expect(screen.getAllByText(/₹600\.00|₹600/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Split total/i)).toBeInTheDocument();
  });

  it("recalculates shares when a participant is excluded", () => {
    const onChange = jest.fn();
    render(
      <SplitTypeSelector
        amount={2400}
        currency="INR"
        splitType="EQUAL"
        onSplitTypeChange={jest.fn()}
        participants={makeParticipants()}
        onParticipantsChange={onChange}
      />
    );

    const checkboxes = screen.getAllByRole("button", { name: /remove .* from this expense/i });
    fireEvent.click(checkboxes[0]);

    expect(onChange).toHaveBeenCalled();
    const updated = onChange.mock.calls[0][0] as SplitParticipant[];
    expect(updated.find((p) => p.userId === "u1")?.included).toBe(false);
  });
});

describe("SplitTypeSelector - Percentage split", () => {
  it("flags an invalid total when percentages do not add up to 100", () => {
    const participants: SplitParticipant[] = [
      { userId: "u1", name: "Tanu", included: true, percentage: 40, shareAmount: 0 },
      { userId: "u2", name: "Rahul", included: true, percentage: 40, shareAmount: 0 }
    ];
    render(
      <SplitTypeSelector
        amount={1000}
        currency="INR"
        splitType="PERCENTAGE"
        onSplitTypeChange={jest.fn()}
        participants={participants}
        onParticipantsChange={jest.fn()}
      />
    );
    expect(screen.getByText("80.0%")).toBeInTheDocument();
  });

  it("shows a satisfied total when percentages add up to exactly 100", () => {
    const participants: SplitParticipant[] = [
      { userId: "u1", name: "Tanu", included: true, percentage: 60, shareAmount: 0 },
      { userId: "u2", name: "Rahul", included: true, percentage: 40, shareAmount: 0 }
    ];
    render(
      <SplitTypeSelector
        amount={1000}
        currency="INR"
        splitType="PERCENTAGE"
        onSplitTypeChange={jest.fn()}
        participants={participants}
        onParticipantsChange={jest.fn()}
      />
    );
    expect(screen.getByText("100.0%")).toBeInTheDocument();
  });

  it("updates a participant's percentage when typed", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const participants: SplitParticipant[] = [
      { userId: "u1", name: "Tanu", included: true, percentage: 50, shareAmount: 0 },
      { userId: "u2", name: "Rahul", included: true, percentage: 50, shareAmount: 0 }
    ];
    render(
      <SplitTypeSelector
        amount={1000}
        currency="INR"
        splitType="PERCENTAGE"
        onSplitTypeChange={jest.fn()}
        participants={participants}
        onParticipantsChange={onChange}
      />
    );

    const input = screen.getByLabelText("Tanu's percentage");
    await user.clear(input);
    await user.type(input, "70");

    expect(onChange).toHaveBeenCalled();
  });
});

describe("SplitTypeSelector - Custom split", () => {
  it("flags an invalid total when custom shares don't add up to the amount", () => {
    const participants: SplitParticipant[] = [
      { userId: "u1", name: "Tanu", included: true, percentage: 0, shareAmount: 900 },
      { userId: "u2", name: "Rahul", included: true, percentage: 0, shareAmount: 600 }
    ];
    render(
      <SplitTypeSelector
        amount={2400}
        currency="INR"
        splitType="CUSTOM"
        onSplitTypeChange={jest.fn()}
        participants={participants}
        onParticipantsChange={jest.fn()}
      />
    );
    // 900 + 600 = 1500, not 2400
    expect(screen.getByText(/1,500.*2,400|1500.*2400/)).toBeInTheDocument();
  });

  it("shows a satisfied total when custom shares add up exactly", () => {
    const participants: SplitParticipant[] = [
      { userId: "u1", name: "Tanu", included: true, percentage: 0, shareAmount: 900 },
      { userId: "u2", name: "Rahul", included: true, percentage: 0, shareAmount: 600 },
      { userId: "u3", name: "Priya", included: true, percentage: 0, shareAmount: 500 },
      { userId: "u4", name: "Aman", included: true, percentage: 0, shareAmount: 400 }
    ];
    const { container } = render(
      <SplitTypeSelector
        amount={2400}
        currency="INR"
        splitType="CUSTOM"
        onSplitTypeChange={jest.fn()}
        participants={participants}
        onParticipantsChange={jest.fn()}
      />
    );
    // The total row should render with the "ok" (emerald) styling class
    const totalRow = container.querySelector(".text-accent-emerald");
    expect(totalRow).toBeInTheDocument();
  });
});

describe("SplitTypeSelector - tab switching", () => {
  it("calls onSplitTypeChange when a different tab is clicked", async () => {
    const user = userEvent.setup();
    const onSplitTypeChange = jest.fn();
    render(
      <SplitTypeSelector
        amount={2400}
        currency="INR"
        splitType="EQUAL"
        onSplitTypeChange={onSplitTypeChange}
        participants={makeParticipants()}
        onParticipantsChange={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Percentage" }));
    expect(onSplitTypeChange).toHaveBeenCalledWith("PERCENTAGE");
  });
});
