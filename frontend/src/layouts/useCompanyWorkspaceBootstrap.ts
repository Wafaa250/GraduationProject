import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getCompanyProfile } from "@/api/companyApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { ROUTES } from "@/routes/paths";
import { setStoredCompanyRole } from "@/lib/companyWorkspace";

const COMPANY_NAME_KEY = "companyName";

export type CompanyWorkspaceBootstrapStatus = "loading" | "ready" | "error";

function clearCompanySession(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
  localStorage.removeItem("email");
  localStorage.removeItem("companyRole");
  localStorage.removeItem(COMPANY_NAME_KEY);
}

/** Validates workspace access and loads display name before rendering company pages. */
export function useCompanyWorkspaceBootstrap() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<CompanyWorkspaceBootstrapStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setStatus("loading");
    setErrorMessage(null);
    setErrorCode(null);

    getCompanyProfile()
      .then((profile) => {
        if (cancelled) return;
        if (profile.companyName?.trim()) {
          localStorage.setItem(COMPANY_NAME_KEY, profile.companyName.trim());
        }
        if (profile.workspaceRole) {
          setStoredCompanyRole(profile.workspaceRole);
        }
        const accountRole = (localStorage.getItem("role") ?? "").toLowerCase();
        if (accountRole === "company" && profile.workspaceRole === "member") {
          localStorage.setItem("role", "companymember");
        }
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;

        const httpStatus = axios.isAxiosError(err) ? err.response?.status : undefined;
        const data = axios.isAxiosError(err)
          ? (err.response?.data as { message?: string; code?: string } | undefined)
          : undefined;

        if (httpStatus === 401) {
          clearCompanySession();
          navigate(ROUTES.login, { replace: true });
          return;
        }

        setErrorCode(data?.code ?? (httpStatus != null ? String(httpStatus) : null));
        setErrorMessage(
          data?.message?.trim() ||
            parseApiErrorMessage(err) ||
            "Your company workspace could not be loaded.",
        );
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const signOut = () => {
    clearCompanySession();
    navigate(ROUTES.login, { replace: true });
  };

  return { status, errorMessage, errorCode, signOut };
}

export function getStoredCompanyDisplayName(): string {
  return localStorage.getItem(COMPANY_NAME_KEY)?.trim() || localStorage.getItem("name")?.trim() || "Company";
}
