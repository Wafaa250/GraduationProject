import { ROUTES } from "@/routes/paths";

/** Matches backend PasswordReset:ResendCooldownSeconds (2 minutes). */
export const FORGOT_PASSWORD_RESEND_COOLDOWN_SECONDS = 120;

export function formatResendCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export type ForgotPasswordFlowState = {
  email?: string;
  code?: string;
};

export const FORGOT_PASSWORD_RETURN_PATH = ROUTES.settings;

export function readFlowEmail(state: unknown, fallback?: string | null): string {
  const fromState = (state as ForgotPasswordFlowState | null)?.email?.trim();
  if (fromState) return fromState;
  return fallback?.trim() ?? localStorage.getItem("email")?.trim() ?? "";
}
