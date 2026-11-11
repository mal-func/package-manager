import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

const { prisma } = await import("../lib/prisma.js");
const { getHealth } = await import("./health.controller.js");

import { createMockRequest, createMockResponse } from "../test-utils/expressMocks.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getHealth", () => {
  it("checks the database is reachable before responding ok", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ 1: 1 }]);
    const res = createMockResponse();

    await getHealth(createMockRequest(), res);

    expect(prisma.$queryRaw).toHaveBeenCalledOnce();
    expect(res.status).toHaveBeenCalledWith(200);

    const [payload] = vi.mocked(res.json).mock.calls[0]!;
    expect(payload).toMatchObject({
      success: true,
      data: { status: "ok" },
    });
    expect(payload.data.uptimeSeconds).toEqual(expect.any(Number));
    expect(payload.data.timestamp).toEqual(expect.any(String));
  });

  it("propagates a database failure instead of reporting healthy", async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error("connection refused"));
    const res = createMockResponse();

    await expect(getHealth(createMockRequest(), res)).rejects.toThrow("connection refused");
    expect(res.json).not.toHaveBeenCalled();
  });
});
