import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";

import { createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { CSRF_COOKIE, CSRF_HEADER } from "../lib/cookies.js";

const app = createApp();

const TEST_EMAIL_PREFIX = "integration-roles-";

interface Session {
  id: string;
  cookies: string[];
  csrf: string;
}

function extractCookie(res: request.Response, name: string): string {
  const raw = res.headers["set-cookie"] as unknown as string[];
  const cookie = raw.find((c) => c.startsWith(`${name}=`))?.split(";")[0];
  if (!cookie) {
    throw new Error(`No ${name} cookie on response`);
  }
  return cookie;
}

/** Registers a fresh account through the real API and returns its session. */
async function registerSession(label: string): Promise<Session> {
  const email = `${TEST_EMAIL_PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ email, name: `Roles ${label}`, password: "correct-horse-battery" });
  const csrfCookie = extractCookie(res, CSRF_COOKIE);

  return {
    id: res.body.data.user.id as string,
    cookies: [extractCookie(res, "access_token"), csrfCookie],
    csrf: csrfCookie.split("=")[1]!,
  };
}

async function grantRoleDirectly(userId: string, roleName: string): Promise<void> {
  const role = await prisma.role.findFirstOrThrow({ where: { name: roleName } });
  await prisma.userRole.create({ data: { userId, roleId: role.id } });
}

function putRoles(actor: Session, targetId: string, roles: unknown) {
  return request(app)
    .put(`/api/v1/users/${targetId}/roles`)
    .set("Cookie", actor.cookies)
    .set(CSRF_HEADER, actor.csrf)
    .send({ roles });
}

async function cleanup(): Promise<void> {
  const users = await prisma.user.findMany({ where: { email: { startsWith: TEST_EMAIL_PREFIX } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
  await prisma.userRole.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

let admin: Session;
let target: Session;

beforeAll(async () => {
  await cleanup();
  admin = await registerSession("admin");
  await grantRoleDirectly(admin.id, "admin");
  target = await registerSession("target");
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("GET /api/v1/auth/options", () => {
  it("is public and reports self-registration", async () => {
    const res = await request(app).get("/api/v1/auth/options");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ selfRegistration: true });
  });
});

describe("GET /api/v1/roles", () => {
  it("lists the seeded roles with their permissions for a roles:manage holder", async () => {
    const res = await request(app).get("/api/v1/roles").set("Cookie", admin.cookies);

    expect(res.status).toBe(200);
    const names = (res.body.data.roles as { name: string }[]).map((r) => r.name);
    expect(names).toEqual(expect.arrayContaining(["admin", "manager", "user"]));
    const manager = (res.body.data.roles as { name: string; permissions: string[] }[]).find((r) => r.name === "manager");
    expect(manager?.permissions).toEqual(["users:read"]);
  });

  it("is forbidden without roles:manage", async () => {
    const res = await request(app).get("/api/v1/roles").set("Cookie", target.cookies);

    expect(res.status).toBe(403);
  });
});

describe("PUT /api/v1/users/:id/roles", () => {
  it("grants a role that takes effect on the target's very next request", async () => {
    const before = await request(app).get("/api/v1/users").set("Cookie", target.cookies);
    expect(before.status).toBe(403);

    const res = await putRoles(admin, target.id, ["manager"]);

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ id: target.id, roles: ["manager"], permissions: ["users:read"] });

    // Same, still-valid access token — no re-login — now has users:read.
    const after = await request(app).get("/api/v1/users").set("Cookie", target.cookies);
    expect(after.status).toBe(200);
  });

  it("revokes just as immediately", async () => {
    await putRoles(admin, target.id, ["user"]);

    const res = await request(app).get("/api/v1/users").set("Cookie", target.cookies);
    expect(res.status).toBe(403);
  });

  it("rejects a request without the CSRF header", async () => {
    const res = await request(app)
      .put(`/api/v1/users/${target.id}/roles`)
      .set("Cookie", admin.cookies)
      .send({ roles: ["manager"] });

    expect(res.status).toBe(403);
    expect(res.body.error.message).toMatch(/CSRF/);
  });

  it("is forbidden for someone without roles:manage", async () => {
    const res = await putRoles(target, admin.id, ["user"]);

    expect(res.status).toBe(403);
  });

  it("refuses to let an admin change their own roles", async () => {
    const res = await putRoles(admin, admin.id, ["user"]);

    expect(res.status).toBe(403);
    expect(res.body.error.message).toMatch(/your own roles/);
    // And they really are still an admin.
    expect((await request(app).get("/api/v1/roles").set("Cookie", admin.cookies)).status).toBe(200);
  });

  it("rejects unknown roles with 400 and leaves the user unchanged", async () => {
    const res = await putRoles(admin, target.id, ["manager", "superuser"]);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("Unknown role(s): superuser.");
    const roles = await prisma.userRole.findMany({ where: { userId: target.id }, include: { role: true } });
    expect(roles.map((r) => r.role.name)).toEqual(["user"]);
  });

  it("rejects an empty role list with 400", async () => {
    const res = await putRoles(admin, target.id, []);

    expect(res.status).toBe(400);
  });

  it("404s for an unknown user id", async () => {
    const res = await putRoles(admin, "00000000-0000-0000-0000-000000000000", ["user"]);

    expect(res.status).toBe(404);
  });
});
