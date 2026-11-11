import { describe, expect, it, vi } from "vitest";

// The limiter itself (the sliding-window bucket, the 429 response) is
// express-rate-limit's own tested behavior — what's actually this
// project's logic is the `keyGenerator`, so we capture the config
// passed to the factory and exercise that function directly, rather
// than re-testing express-rate-limit's internals.
vi.mock("express-rate-limit", () => ({
  default: vi.fn((config: unknown) => config),
}));

const { default: rateLimit } = await import("express-rate-limit");
const { loginRateLimiter } = await import("./rateLimiters.js");

describe("loginRateLimiter config", () => {
  it("is configured with a 15 minute window and a 10 attempt limit", () => {
    expect(vi.mocked(rateLimit)).toHaveBeenCalledWith(
      expect.objectContaining({ windowMs: 15 * 60 * 1000, limit: 10 }),
    );
  });

  it("keys by ip + lowercased email so case doesn't dodge the limiter", () => {
    const config = loginRateLimiter as unknown as { keyGenerator: (req: unknown) => string };

    const key = config.keyGenerator({ ip: "1.2.3.4", body: { email: "User@Example.com" } });

    expect(key).toBe("1.2.3.4:user@example.com");
  });

  it("falls back to 'unknown' when the request body has no email", () => {
    const config = loginRateLimiter as unknown as { keyGenerator: (req: unknown) => string };

    expect(config.keyGenerator({ ip: "1.2.3.4", body: {} })).toBe("1.2.3.4:unknown");
    expect(config.keyGenerator({ ip: "1.2.3.4", body: undefined })).toBe("1.2.3.4:unknown");
  });

  it("ignores a non-string email value rather than throwing", () => {
    const config = loginRateLimiter as unknown as { keyGenerator: (req: unknown) => string };

    expect(config.keyGenerator({ ip: "1.2.3.4", body: { email: 12345 } })).toBe("1.2.3.4:unknown");
  });
});
