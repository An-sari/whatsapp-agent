import { getLoginUrl } from "@/const";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};

  const logout = useCallback(async () => {
    // Standalone logout logic (e.g., clear local storage/cookies)
    window.location.href = redirectPath;
  }, [redirectPath]);

  const state = useMemo(() => {
    const mockUser = {
      id: 1,
      name: "Demo User",
      email: "demo@example.com",
      whatsappNumber: "1234567890",
    };
    
    return {
      user: mockUser,
      loading: false,
      error: null,
      isAuthenticated: true, // Always authenticated for standalone deployment
    };
  }, []);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => {},
    logout,
  };
}
