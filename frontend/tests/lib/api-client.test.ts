import { apiRequest } from "@/lib/api/client";
import { ApiError, friendlyErrorMessage } from "@/lib/api/errors";

function mockFetchOnce(status: number, body: unknown, ok = status >= 200 && status < 300) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok,
    status,
    statusText: "Error",
    json: async () => body
  }) as unknown as typeof fetch;
}

describe("apiRequest", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the unwrapped data on success", async () => {
    mockFetchOnce(200, { success: true, data: { hello: "world" } });
    const result = await apiRequest<{ hello: string }>("/anything");
    expect(result).toEqual({ hello: "world" });
  });

  it("throws an ApiError with the backend's code/message on failure", async () => {
    mockFetchOnce(404, { success: false, error: { code: "NOT_FOUND", message: "Group not found" } }, false);
    await expect(apiRequest("/groups/x")).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
      message: "Group not found"
    });
  });

  it("throws a network ApiError when fetch itself fails", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("network down")) as unknown as typeof fetch;
    await expect(apiRequest("/anything")).rejects.toMatchObject({ status: 0, code: "NETWORK_ERROR" });
  });

  it("attaches the Authorization header when a token is present", async () => {
    window.localStorage.setItem("splitwise:token", "test-token");
    mockFetchOnce(200, { success: true, data: {} });
    await apiRequest("/anything");
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer test-token");
    window.localStorage.removeItem("splitwise:token");
  });
});

describe("friendlyErrorMessage", () => {
  it("maps status codes to short, actionable messages", () => {
    expect(friendlyErrorMessage(new ApiError(401, "UNAUTHENTICATED", ""))).toMatch(/session/i);
    expect(friendlyErrorMessage(new ApiError(403, "UNAUTHORIZED", ""))).toMatch(/permission/i);
    expect(friendlyErrorMessage(new ApiError(404, "NOT_FOUND", ""))).toMatch(/find/i);
    expect(friendlyErrorMessage(new ApiError(429, "RATE_LIMITED", ""))).toMatch(/fast|wait/i);
    expect(friendlyErrorMessage(new ApiError(0, "NETWORK_ERROR", ""))).toMatch(/reach|connection/i);
  });

  it("never returns a raw backend error code", () => {
    const message = friendlyErrorMessage(new ApiError(500, "INTERNAL_ERROR", "Stack trace leaked"));
    expect(message).not.toContain("INTERNAL_ERROR");
  });
});
