import { useEffect } from "react";
import { getCompanyProfile } from "@/api/companyApi";

const COMPANY_NAME_KEY = "companyName";

/** Loads company profile once per session so workspace APIs and topbar use the real company name. */
export function useCompanyWorkspaceBootstrap() {
  useEffect(() => {
    let cancelled = false;

    getCompanyProfile()
      .then((profile) => {
        if (cancelled) return;
        if (profile.companyName?.trim()) {
          localStorage.setItem(COMPANY_NAME_KEY, profile.companyName.trim());
        }
      })
      .catch(() => {
        /* Individual pages surface API errors; bootstrap is best-effort. */
      });

    return () => {
      cancelled = true;
    };
  }, []);
}

export function getStoredCompanyDisplayName(): string {
  return localStorage.getItem(COMPANY_NAME_KEY)?.trim() || localStorage.getItem("name")?.trim() || "Company";
}
