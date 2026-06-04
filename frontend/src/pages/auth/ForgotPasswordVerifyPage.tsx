import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { forgotPassword, verifyResetCode } from "@/api/authApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { OtpInput, OTP_CODE_LENGTH } from "@/components/auth/OtpInput";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ForgotPasswordFlowAlert } from "@/pages/auth/forgot-password/ForgotPasswordFlowAlert";
import { ForgotPasswordFlowLayout } from "@/pages/auth/forgot-password/ForgotPasswordFlowLayout";
import {
  formatResendCountdown,
  readFlowEmail,
  type ForgotPasswordFlowState,
} from "@/pages/auth/forgot-password/forgotPasswordFlow";
import { useForgotPasswordTimers } from "@/pages/auth/forgot-password/useForgotPasswordTimers";
import { ROUTES } from "@/routes/paths";

export default function ForgotPasswordVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = readFlowEmail(location.state);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resendSeconds, startTimers } = useForgotPasswordTimers(true);

  if (!email) {
    return <Navigate to={ROUTES.forgotPassword} replace />;
  }

  const flowState: ForgotPasswordFlowState = { email };

  const handleVerify = async () => {
    if (otp.length !== OTP_CODE_LENGTH) {
      setError("Enter the full 6-digit verification code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await verifyResetCode({ email, code: otp });
      navigate(ROUTES.forgotPasswordNew, { state: { email, code: otp } });
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendSeconds > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      await forgotPassword({ email });
      toast({ title: "Verification code sent successfully" });
      startTimers();
      setOtp("");
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <ForgotPasswordFlowLayout>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Verify Your Identity</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the 6-digit verification code sent to{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </p>
      </header>

      {error ? <ForgotPasswordFlowAlert message={error} /> : null}

      <div className="space-y-6">
        <OtpInput
          value={otp}
          onChange={(v) => {
            setOtp(v);
            if (error) setError(null);
          }}
          disabled={loading || resending}
        />

        <div className="flex justify-center">
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-xs text-muted-foreground"
            disabled={resendSeconds > 0 || resending || loading}
            onClick={() => void handleResend()}
          >
            {resending ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Sending…
              </span>
            ) : resendSeconds > 0 ? (
              `Resend code in ${formatResendCountdown(resendSeconds)}`
            ) : (
              "Resend Code"
            )}
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 rounded-lg"
            disabled={loading}
            asChild
          >
            <Link to={ROUTES.forgotPassword} state={flowState}>
              Back
            </Link>
          </Button>
          <Button
            type="button"
            disabled={loading || otp.length !== OTP_CODE_LENGTH}
            className="h-11 flex-1 rounded-lg bg-gradient-brand text-primary-foreground hover:opacity-95"
            onClick={() => void handleVerify()}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying…
              </span>
            ) : (
              "Verify Code"
            )}
          </Button>
        </div>
      </div>
    </ForgotPasswordFlowLayout>
  );
}
