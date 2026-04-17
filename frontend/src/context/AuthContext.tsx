import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Keys written by LoginPage on successful sign-in — cleared on logout. */
const AUTH_STORAGE_KEYS = ["token", "userId", "role", "name", "email"] as const;

export type AuthContextValue = {
  /** True when a non-empty `token` is present in localStorage (synced via state). */
  isAuthenticated: boolean;
  /** Clears auth storage and sets session to signed-out without reloading the page. */
  logout: () => void;
  /** Re-read `token` from localStorage after login (e.g. embedded Login form). */
  syncAuthFromStorage: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readToken(): string | null {
  const t = localStorage.getItem("token");
  return t && t.trim() !== "" ? t : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readToken);

  const syncAuthFromStorage = useCallback(() => {
    setToken(readToken());
  }, []);

  const logout = useCallback(() => {
    AUTH_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    setToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !!token,
      logout,
      syncAuthFromStorage,
    }),
    [token, logout, syncAuthFromStorage],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
