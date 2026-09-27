import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false }
    }
  });
}

export function renderWithQueryClient(ui: React.ReactElement, options?: RenderOptions) {
  const client = createTestQueryClient();
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
