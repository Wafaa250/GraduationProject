import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { syncRoleThemeFromStorage } from "@/lib/roleTheme";

type RoleThemeContextValue = Record<string, never>;

const RoleThemeContext = createContext<RoleThemeContextValue | null>(null);

/** Applies `role-*` accent class on `<html>` from localStorage (re-syncs on navigation). */
export function RoleThemeProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  useEffect(() => {
    syncRoleThemeFromStorage();
  }, [pathname]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "role" || event.key === null) {
        syncRoleThemeFromStorage();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <RoleThemeContext.Provider value={{}}>{children}</RoleThemeContext.Provider>
  );
}

export function useRoleThemeContext() {
  const ctx = useContext(RoleThemeContext);
  if (!ctx) {
    throw new Error("useRoleThemeContext must be used within RoleThemeProvider");
  }
  return ctx;
}
