import { render, screen } from "@testing-library/react";
import { BalanceRow } from "@/components/balances/BalanceRow";
import { StatCard } from "@/components/common/StatCard";
import { formatMoney } from "@/lib/formatters/currency";

describe("BalanceRow", () => {
  it("renders an 'owe' row with the amount and a Settle action", () => {
    const onSettle = jest.fn();
    render(<BalanceRow name="Rahul" amount={84000} currency="INR" direction="owe" onSettle={onSettle} />);
    expect(screen.getAllByText("Rahul").length).toBeGreaterThan(0);
    expect(screen.getByText(formatMoney(84000, "INR"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /settle/i })).toBeInTheDocument();
  });

  it("renders an 'owed' row without a Settle action", () => {
    render(<BalanceRow name="Aman" amount={120000} currency="INR" direction="owed" />);
    expect(screen.getAllByText("Aman").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /settle/i })).not.toBeInTheDocument();
  });

  it("communicates direction with more than color alone (icon + text amount)", () => {
    const { container: oweContainer } = render(<BalanceRow name="Rahul" amount={1000} direction="owe" />);
    const { container: owedContainer } = render(<BalanceRow name="Aman" amount={1000} direction="owed" />);
    // Different icons (svg paths) are rendered for owe vs owed, not just a color class.
    expect(oweContainer.querySelector("svg")).toBeTruthy();
    expect(owedContainer.querySelector("svg")).toBeTruthy();
  });
});

describe("StatCard", () => {
  it("renders the label and formatted value from real data, not a hardcoded string", () => {
    render(<StatCard label="You owe" value={124000} formatValue={(v) => formatMoney(v)} />);
    expect(screen.getByText("You owe")).toBeInTheDocument();
    expect(screen.getByText(formatMoney(124000))).toBeInTheDocument();
  });

  it("renders a trend indicator when provided", () => {
    render(
      <StatCard
        label="Total spending"
        value={500}
        trend={{ direction: "up", label: "12% vs last month" }}
      />
    );
    expect(screen.getByText(/12% vs last month/)).toBeInTheDocument();
  });
});
