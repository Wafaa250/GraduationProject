import { useEffect, useState } from "react";
import { FORGOT_PASSWORD_RESEND_COOLDOWN_SECONDS } from "@/pages/auth/forgot-password/forgotPasswordFlow";

export function useForgotPasswordTimers(startOnMount = false) {
  const [resendSeconds, setResendSeconds] = useState(
    startOnMount ? FORGOT_PASSWORD_RESEND_COOLDOWN_SECONDS : 0,
  );

  const startTimers = () => {
    setResendSeconds(FORGOT_PASSWORD_RESEND_COOLDOWN_SECONDS);
  };

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const id = window.setInterval(() => {
      setResendSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendSeconds]);

  return { resendSeconds, startTimers };
}
