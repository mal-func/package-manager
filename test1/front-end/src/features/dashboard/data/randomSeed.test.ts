import { describe, expect, it } from "vitest";

import { seededRandom } from "./randomSeed";

describe("seededRandom", () => {
  it("is deterministic — the same seed produces the same sequence", () => {
    const a = seededRandom("state-mizoram");
    const b = seededRandom("state-mizoram");

    expect(a()).toBe(b());
    expect(a()).toBe(b());
  });

  it("produces a different sequence for a different seed", () => {
    const a = seededRandom("state-mizoram");
    const b = seededRandom("state-kerala");

    expect(a()).not.toBe(b());
  });

  it("always produces values in [0, 1)", () => {
    const rng = seededRandom("range-check");

    for (let i = 0; i < 50; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("advances on every call rather than repeating the same value", () => {
    const rng = seededRandom("advance-check");
    const first = rng();
    const second = rng();

    expect(first).not.toBe(second);
  });
});
