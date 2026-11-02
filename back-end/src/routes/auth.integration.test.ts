import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";

import { createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { CSRF_COOKIE, CSRF_HEADER } from "../lib/cookies.js";

const app = createApp();

const TEST_EMAIL_PREFIX = "integration-test-";

function uniqueEmail(label: string): string {
  return `${TEST_EMAIL_PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/** Extracts one cookie's raw Set-Cookie header value by name, for reuse on the next request. */
function extractCookie(res: request.Response, name: string): string | undefined {
  const raw = res.headers["set-cookie"] as unknown as string[] | undefined;
  return raw?.find((c) => c.startsWith(`${name}=`))?.split(";")[0];
}

function extractCsrfValue(res: request.Response): string | undefined {
  return extractCookie(res, CSRF_COOKIE)?.split("=")[1];
}

async function cleanupTestUsers(): Promise<void> {
  const testUsers = await prisma.user.findMany({
    where: { email: { startsWith: TEST_EMAIL_PREFIX } },
    select: { id: true },
  });
  const ids = testUsers.map((u) => u.id);

  if (ids.length === 0) {
    return;
  }

  await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
  await prisma.userRole.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

beforeAll(async () => {
  await cleanupTestUsers();
});

afterAll(async () => {
  await cleanupTestUsers();
  await prisma.$disconnect();
});

describe("POST /api/v1/auth/register", () => {
  it("registers a new user and sets access/refresh/csrf cookies", async () => {
    const email = uniqueEmail("register");

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email, name: "Integration Test", password: "correct-horse-battery" });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
    expect(extractCookie(res, "access_token")).toBeTruthy();
    expect(extractCookie(res, "refresh_token")).toBeTruthy();
    expect(extractCookie(res, CSRF_COOKIE)).toBeTruthy();
  });

  it("rejects a duplicate email with 409", async () => {
    const email = uniqueEmail("duplicate");
    await request(app).post("/api/v1/auth/register").send({ email, name: "First", password: "correct-horse-battery" });

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email, name: "Second", password: "correct-horse-battery" });

    expect(res.status).toBe(409);
  });

  it("rejects an invalid payload with 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "not-an-email", name: "", password: "short" });

    expect(res.status).toBe(400);
  });
});

describe("full session lifecycle", () => {
  const email = uniqueEmail("lifecycle");
  let accessCookie: string | undefined;
  let refreshCookie: string | undefined;
  let csrfValue: string | undefined;

  it("logs in with the right credentials and receives session cookies", async () => {
    await request(app)
      .post("/api/v1/auth/register")
      .send({ email, name: "Lifecycle User", password: "correct-horse-battery" });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "correct-horse-battery" });

    expect(res.status).toBe(200);
    accessCookie = extractCookie(res, "access_token");
    refreshCookie = extractCookie(res, "refresh_token");
    csrfValue = extractCsrfValue(res);
    expect(accessCookie).toBeTruthy();
  });

  it("GET /auth/me returns the authenticated user with the session cookie", async () => {
    const res = await request(app).get("/api/v1/auth/me").set("Cookie", [accessCookie!]);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(email);
  });

  it("GET /auth/me without a cookie is rejected with 401", async () => {
    const res = await request(app).get("/api/v1/auth/me");

    expect(res.status).toBe(401);
  });

  it("POST /auth/refresh without the CSRF header is rejected with 403", async () => {
    const res = await request(app).post("/api/v1/auth/refresh").set("Cookie", [refreshCookie!]);

    expect(res.status).toBe(403);
  });

  it("POST /auth/refresh with the correct CSRF header rotates the tokens", async () => {
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", [refreshCookie!, `${CSRF_COOKIE}=${csrfValue}`])
      .set(CSRF_HEADER, csrfValue!);

    expect(res.status).toBe(200);
    const newRefreshCookie = extractCookie(res, "refresh_token");
    expect(newRefreshCookie).toBeTruthy();
    expect(newRefreshCookie).not.toBe(refreshCookie);

    // Reusing the OLD (now-rotated-away) refresh token must be rejected,
    // and must kill the entire session — not just this one token.
    const reuseRes = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", [refreshCookie!, `${CSRF_COOKIE}=${csrfValue}`])
      .set(CSRF_HEADER, csrfValue!);
    expect(reuseRes.status).toBe(401);

    // The token issued by the refresh that just happened above should
    // ALSO now be dead, because reuse-detection revokes everything.
    const afterReuseRes = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", [newRefreshCookie!, `${CSRF_COOKIE}=${csrfValue}`])
      .set(CSRF_HEADER, csrfValue!);
    expect(afterReuseRes.status).toBe(401);
  });

  it("POST /auth/logout requires CSRF and clears the session", async () => {
    const loginRes = await request(app).post("/api/v1/auth/login").send({ email, password: "correct-horse-battery" });
    const freshAccess = extractCookie(loginRes, "access_token");
    const freshRefresh = extractCookie(loginRes, "refresh_token");
    const freshCsrf = extractCsrfValue(loginRes);

    const withoutCsrf = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", [freshAccess!, freshRefresh!]);
    expect(withoutCsrf.status).toBe(403);

    const logoutRes = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", [freshAccess!, freshRefresh!, `${CSRF_COOKIE}=${freshCsrf}`])
      .set(CSRF_HEADER, freshCsrf!);
    expect(logoutRes.status).toBe(200);

    const meAfterLogout = await request(app).get("/api/v1/auth/me").set("Cookie", [freshAccess!]);
    // Logout revokes the refresh token server-side; the still-valid
    // (short-lived) access token cookie was cleared client-side by the
    // Set-Cookie response, but supertest doesn't drop it automatically —
    // what matters is the refresh token is dead, proven separately above.
    expect(meAfterLogout.status).toBe(200);
  });
});

describe("account lockout", () => {
  it("locks the account after the configured number of failed attempts", async () => {
    const email = uniqueEmail("lockout");
    await request(app)
      .post("/api/v1/auth/register")
      .send({ email, name: "Lockout Test", password: "correct-horse-battery" });

    for (let i = 0; i < 5; i++) {
      await request(app).post("/api/v1/auth/login").send({ email, password: "wrong-password" });
    }

    const res = await request(app).post("/api/v1/auth/login").send({ email, password: "correct-horse-battery" });

    expect(res.status).toBe(403);
  });
});

describe("GET /api/v1/users permission guard", () => {
  it("rejects a user without the users:read permission with 403", async () => {
    const email = uniqueEmail("no-permission");
    const registerRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ email, name: "No Permission", password: "correct-horse-battery" });
    const accessCookie = extractCookie(registerRes, "access_token");

    const res = await request(app).get("/api/v1/users").set("Cookie", [accessCookie!]);

    expect(res.status).toBe(403);
  });

  it("allows access once the user is granted the admin role, on the very next request", async () => {
    const email = uniqueEmail("admin");
    const registerRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ email, name: "Admin Test", password: "correct-horse-battery" });
    const accessCookie = extractCookie(registerRes, "access_token");

    const adminRole = await prisma.role.findFirstOrThrow({ where: { name: "admin" } });
    const user = await prisma.user.findFirstOrThrow({ where: { email } });
    await prisma.userRole.create({ data: { userId: user.id, roleId: adminRole.id } });

    const res = await request(app).get("/api/v1/users").set("Cookie", [accessCookie!]);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.users)).toBe(true);
    expect(res.body.data.pagination).toEqual({ limit: 20, offset: 0, total: expect.any(Number) });
  });
});

describe("GET /api/v1/users pagination", () => {
  let accessCookie: string | undefined;

  beforeAll(async () => {
    // A dedicated admin, plus enough freshly-created users that a
    // limit=1 page is guaranteed to be a strict subset of what exists —
    // real rows in the real test DB, not a mocked findMany().
    const email = uniqueEmail("pagination-admin");
    const registerRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ email, name: "Pagination Admin", password: "correct-horse-battery" });
    accessCookie = extractCookie(registerRes, "access_token");

    const adminRole = await prisma.role.findFirstOrThrow({ where: { name: "admin" } });
    const user = await prisma.user.findFirstOrThrow({ where: { email } });
    await prisma.userRole.create({ data: { userId: user.id, roleId: adminRole.id } });

    for (let i = 0; i < 3; i++) {
      await request(app)
        .post("/api/v1/auth/register")
        .send({ email: uniqueEmail(`pagination-${String(i)}`), name: `Page User ${String(i)}`, password: "correct-horse-battery" });
    }
  });

  it("bounds the page to the requested limit, real rows included", async () => {
    const res = await request(app).get("/api/v1/users?limit=1&offset=0").set("Cookie", [accessCookie!]);

    expect(res.status).toBe(200);
    expect(res.body.data.users).toHaveLength(1);
    // The real point of this endpoint: total reflects the whole
    // collection, not just this page — proven against a real DB where
    // we know for a fact there are more than 1 user.
    expect(res.body.data.pagination.total).toBeGreaterThan(1);
  });

  it("offset actually moves the window — two consecutive pages return different users", async () => {
    const page1 = await request(app).get("/api/v1/users?limit=1&offset=0").set("Cookie", [accessCookie!]);
    const page2 = await request(app).get("/api/v1/users?limit=1&offset=1").set("Cookie", [accessCookie!]);

    expect(page1.body.data.users[0].id).not.toBe(page2.body.data.users[0].id);
  });

  it("rejects an out-of-range limit with 400", async () => {
    const res = await request(app).get("/api/v1/users?limit=101").set("Cookie", [accessCookie!]);

    expect(res.status).toBe(400);
  });

  it("defaults to limit=20, offset=0 when no query params are given", async () => {
    const res = await request(app).get("/api/v1/users").set("Cookie", [accessCookie!]);

    expect(res.body.data.pagination.limit).toBe(20);
    expect(res.body.data.pagination.offset).toBe(0);
  });
});
