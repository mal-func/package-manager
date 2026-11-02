import { describe, expect, it } from "vitest";

import { queryClient } from "./queryClient";

describe("queryClient", () => {
  it("disables automatic retries (the refresh interceptor already handles transient 401s)", () => {
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(false);
  });

  it("disables refetch-on-window-focus", () => {
    expect(queryClient.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false);
  });
});
