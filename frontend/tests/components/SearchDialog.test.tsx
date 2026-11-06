import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SearchDialog } from "@/components/search/SearchDialog";
import { searchApi } from "@/lib/api/search";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

jest.mock("@/lib/api/search", () => ({
  searchApi: {
    search: jest.fn()
  }
}));

describe("SearchDialog Mobile & Desktop Responsiveness", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders search interface with mobile responsive sizing and centered positioning", () => {
    const onOpenChange = jest.fn();
    const { container } = render(<SearchDialog open={true} onOpenChange={onOpenChange} />);

    // Verify search input is present and has proper accessibility attributes
    const input = screen.getByPlaceholderText("Search Balancio…");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("inputMode", "search");

    // Verify dialog content has responsive width calc(100% - 24px) and horizontal centering
    const dialogContent = screen.getByRole("dialog");
    expect(dialogContent).toBeInTheDocument();
    expect(dialogContent?.className).toContain("w-[calc(100%-24px)]");
    expect(dialogContent?.className).toContain("left-1/2");
    expect(dialogContent?.className).toContain("-translate-x-1/2");
    expect(dialogContent?.className).toContain("max-w-xl");
    expect(dialogContent?.className).toContain("max-h-[calc(100dvh-24px)]");

    // Desktop classes are preserved
    expect(dialogContent?.className).toContain("sm:w-full");
    expect(dialogContent?.className).toContain("sm:top-1/2");
    expect(dialogContent?.className).toContain("sm:-translate-y-1/2");
  });

  it("provides an accessible close/cancel button that triggers onOpenChange(false)", () => {
    const onOpenChange = jest.fn();
    render(<SearchDialog open={true} onOpenChange={onOpenChange} />);

    const closeBtn = screen.getByRole("button", { name: /close search/i });
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders clear button when query text is present and clears input on click", async () => {
    const onOpenChange = jest.fn();
    render(<SearchDialog open={true} onOpenChange={onOpenChange} />);

    const input = screen.getByPlaceholderText("Search Balancio…");
    fireEvent.change(input, { target: { value: "dinner" } });

    // Clear button appears
    const clearBtn = await screen.findByRole("button", { name: /clear search/i });
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(input).toHaveValue("");
  });

  it("renders search results with touch-friendly min-h-[44px] targets", async () => {
    const onOpenChange = jest.fn();
    (searchApi.search as jest.Mock).mockResolvedValueOnce({
      groups: [{ id: "g1", name: "Trip to Goa", description: "Vacation" }],
      expenses: [{ id: "e1", title: "Flight tickets", amount: 12000 }],
      users: [],
      settlements: []
    });

    render(<SearchDialog open={true} onOpenChange={onOpenChange} />);

    const input = screen.getByPlaceholderText("Search Balancio…");
    fireEvent.change(input, { target: { value: "Goa" } });

    await waitFor(() => {
      expect(screen.getByText("Trip to Goa")).toBeInTheDocument();
    });

    const groupResultBtn = screen.getByText("Trip to Goa").closest("button");
    expect(groupResultBtn).toHaveClass("min-h-[44px]");
  });
});
