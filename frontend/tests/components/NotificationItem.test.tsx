import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithQueryClient } from "../test-utils";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { notificationsApi } from "@/lib/api/notifications";
import type { Notification } from "@/types/notification";

jest.mock("@/lib/api/notifications", () => ({
  notificationsApi: {
    markRead: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined)
  }
}));

const unreadNotification: Notification = {
  _id: "n1",
  userId: "u1",
  type: "EXPENSE_CREATED",
  title: "New expense added",
  message: "Rahul added a ₹1,200 dinner expense",
  read: false,
  createdAt: new Date().toISOString()
};

describe("NotificationItem", () => {
  afterEach(() => jest.clearAllMocks());

  it("shows an unread indicator for an unread notification", () => {
    const { container } = renderWithQueryClient(<NotificationItem notification={unreadNotification} />);
    expect(container.querySelector(".bg-accent-violet")).toBeTruthy();
  });

  it("calls markRead when an unread notification is clicked", async () => {
    renderWithQueryClient(<NotificationItem notification={unreadNotification} />);
    fireEvent.click(screen.getByText("New expense added"));
    await waitFor(() => expect(notificationsApi.markRead).toHaveBeenCalledWith("n1"));
  });

  it("does not call markRead again for an already-read notification", async () => {
    renderWithQueryClient(<NotificationItem notification={{ ...unreadNotification, read: true }} />);
    fireEvent.click(screen.getByText("New expense added"));
    await new Promise((r) => setTimeout(r, 10));
    expect(notificationsApi.markRead).not.toHaveBeenCalled();
  });

  it("calls remove when the delete button is clicked", async () => {
    renderWithQueryClient(<NotificationItem notification={unreadNotification} />);
    fireEvent.click(screen.getByRole("button", { name: /delete notification/i }));
    await waitFor(() => expect(notificationsApi.remove).toHaveBeenCalledWith("n1"));
  });
});
