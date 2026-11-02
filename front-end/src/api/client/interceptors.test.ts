import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MockAdapter from "axios-mock-adapter";

import { SESSION_EXPIRED_EVENT } from "../../auth/constants";
import { httpClient } from "./httpClient";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

function setCsrfCookie(value: string | null): void {
  document.cookie = value
    ? `${CSRF_COOKIE_NAME}=${value}; path=/`
    : `${CSRF_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

const unauthorizedEnvelope = { success: false, error: { code: "UNAUTHORIZED", message: "Authentication is required." } };
const forbiddenEnvelope = { success: false, error: { code: "FORBIDDEN", message: "Invalid CSRF token." } };
const okEnvelope = { success: true, data: { ok: true } };

describe("interceptors", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(httpClient);
    setCsrfCookie(null);
  });

  afterEach(() => {
    mock.restore();
    setCsrfCookie(null);
  });

  describe("request interceptor — CSRF header", () => {
    it("attaches the CSRF header on a mutating request when the cookie is present", async () => {
      setCsrfCookie("csrf-value");
      mock.onPost("/some-endpoint").reply((config) => {
        expect(config.headers?.[CSRF_HEADER_NAME]).toBe("csrf-value");
        return [200, okEnvelope];
      });

      await httpClient.post("/some-endpoint");
    });

    it("does not attach the CSRF header on a GET request, even with the cookie present", async () => {
      setCsrfCookie("csrf-value");
      mock.onGet("/some-endpoint").reply((config) => {
        expect(config.headers?.[CSRF_HEADER_NAME]).toBeUndefined();
        return [200, okEnvelope];
      });

      await httpClient.get("/some-endpoint");
    });

    it("does not attach the CSRF header on a mutating request when there is no cookie", async () => {
      mock.onPost("/some-endpoint").reply((config) => {
        expect(config.headers?.[CSRF_HEADER_NAME]).toBeUndefined();
        return [200, okEnvelope];
      });

      await httpClient.post("/some-endpoint");
    });
  });

  describe("response interceptor — success", () => {
    it("passes a successful response straight through unchanged", async () => {
      mock.onGet("/ok").reply(200, okEnvelope);

      const response = await httpClient.get("/ok");

      expect(response.data).toEqual(okEnvelope);
    });
  });

  describe("response interceptor — 401 refresh-and-retry", () => {
    it("silently refreshes once and retries the original request on a 401", async () => {
      let callCount = 0;
      mock.onGet("/protected").reply(() => {
        callCount += 1;
        return callCount === 1 ? [401, unauthorizedEnvelope] : [200, okEnvelope];
      });
      mock.onPost("/auth/refresh").reply(200, { success: true, data: {} });

      const response = await httpClient.get("/protected");

      expect(response.data).toEqual(okEnvelope);
      expect(callCount).toBe(2);
    });

    it("dispatches SESSION_EXPIRED_EVENT and surfaces the original error when the refresh itself fails", async () => {
      const listener = vi.fn();
      window.addEventListener(SESSION_EXPIRED_EVENT, listener);

      mock.onGet("/protected").reply(401, unauthorizedEnvelope);
      mock.onPost("/auth/refresh").reply(403, forbiddenEnvelope);

      await expect(httpClient.get("/protected")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
      expect(listener).toHaveBeenCalledTimes(1);

      window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
    });

    it("does not attempt a refresh for a 401 on /auth/login (bootstrap request)", async () => {
      mock.onPost("/auth/login").reply(401, { success: false, error: { code: "UNAUTHORIZED", message: "Invalid email or password." } });

      await expect(httpClient.post("/auth/login")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
      expect(mock.history.post?.filter((r) => r.url === "/auth/refresh")).toHaveLength(0);
    });

    it("does not attempt a second refresh for a 401 on /auth/refresh itself", async () => {
      mock.onPost("/auth/refresh").reply(403, forbiddenEnvelope);

      await expect(httpClient.post("/auth/refresh")).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(mock.history.post?.filter((r) => r.url === "/auth/refresh")).toHaveLength(1);
    });

    it("only issues a single refresh call for two concurrent 401s (rotation-safe)", async () => {
      let refreshCalls = 0;
      mock.onPost("/auth/refresh").reply(() => {
        refreshCalls += 1;
        return [200, { success: true, data: {} }];
      });

      let aCalls = 0;
      mock.onGet("/a").reply(() => {
        aCalls += 1;
        return aCalls === 1 ? [401, unauthorizedEnvelope] : [200, okEnvelope];
      });

      let bCalls = 0;
      mock.onGet("/b").reply(() => {
        bCalls += 1;
        return bCalls === 1 ? [401, unauthorizedEnvelope] : [200, okEnvelope];
      });

      const [a, b] = await Promise.all([httpClient.get("/a"), httpClient.get("/b")]);

      expect(a.data).toEqual(okEnvelope);
      expect(b.data).toEqual(okEnvelope);
      expect(refreshCalls).toBe(1);
    });
  });

  describe("toApiError conversion", () => {
    it("converts a response error envelope into a matching ApiError", async () => {
      mock.onGet("/bad").reply(422, { success: false, error: { code: "VALIDATION_ERROR", message: "Bad input." } });

      await expect(httpClient.get("/bad")).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        message: "Bad input.",
        statusCode: 422,
      });
    });

    it("converts a network error (no response) into a NETWORK_ERROR ApiError", async () => {
      mock.onGet("/down").networkError();

      await expect(httpClient.get("/down")).rejects.toMatchObject({ code: "NETWORK_ERROR" });
    });

    it("falls back to UNKNOWN_ERROR for a rejection that isn't even an axios error", async () => {
      mock.onGet("/weird").reply(() => {
        throw new Error("adapter blew up, not an AxiosError");
      });

      await expect(httpClient.get("/weird")).rejects.toMatchObject({
        code: "UNKNOWN_ERROR",
        message: "Something went wrong. Please try again.",
      });
    });
  });

  describe("request interceptor — its own error path", () => {
    it("converts a rejection raised earlier in the request chain via toApiError", async () => {
      // Registered after the app's interceptor, so — per axios's LIFO
      // request-interceptor order — it runs first and its rejection is
      // what the app's interceptor's own onRejected handler receives.
      const id = httpClient.interceptors.request.use(() => {
        throw new Error("upstream request interceptor failure");
      });

      await expect(httpClient.get("/anything")).rejects.toMatchObject({ code: "UNKNOWN_ERROR" });

      httpClient.interceptors.request.eject(id);
    });
  });
});
