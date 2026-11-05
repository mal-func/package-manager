import { describe, expect, it, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { PropsWithChildren, ReactElement } from "react";

import { AuthContext } from "../context/AuthContext";
import type { AuthContextValue } from "../context/AuthContext";
import { ApiError } from "@/api";

import { useLogin } from "./useLogin";

function wrapperWithLogin(login: AuthContextValue["login"]) {
  const value: AuthContextValue = { user: null, isAuthenticated: false, loading: false, login, logout: async () => {} };

  return function Wrapper({ children }: PropsWithChildren): ReactElement {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  };
}

describe("useLogin", () => {
  it("starts with empty default values and no error", () => {
    const { result } = renderHook(() => useLogin(), { wrapper: wrapperWithLogin(vi.fn()) });

    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it("calls the context's login with the form values on submit", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useLogin(), { wrapper: wrapperWithLogin(login) });

    await act(async () => {
      result.current.register("email").onChange({ target: { value: "test@example.com", name: "email" } });
      result.current.register("password").onChange({ target: { value: "password123", name: "password" } });
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: () => {} } as never);
    });

    expect(login).toHaveBeenCalledWith({ email: "test@example.com", password: "password123" });
  });

  it("sets a root error with the ApiError's message when login fails with a known error", async () => {
    const login = vi.fn().mockRejectedValue(new ApiError("Invalid email or password.", "UNAUTHORIZED", 401));
    const { result } = renderHook(() => useLogin(), { wrapper: wrapperWithLogin(login) });

    await act(async () => {
      result.current.register("email").onChange({ target: { value: "test@example.com", name: "email" } });
      result.current.register("password").onChange({ target: { value: "password123", name: "password" } });
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: () => {} } as never);
    });

    await waitFor(() => {
      expect(result.current.errors.root?.message).toBe("Invalid email or password.");
    });
  });

  it("sets a generic fallback message when login fails with something other than an ApiError", async () => {
    const login = vi.fn().mockRejectedValue(new Error("network exploded"));
    const { result } = renderHook(() => useLogin(), { wrapper: wrapperWithLogin(login) });

    await act(async () => {
      result.current.register("email").onChange({ target: { value: "test@example.com", name: "email" } });
      result.current.register("password").onChange({ target: { value: "password123", name: "password" } });
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: () => {} } as never);
    });

    await waitFor(() => {
      expect(result.current.errors.root?.message).toBe("Unable to sign in. Please try again.");
    });
  });
});
