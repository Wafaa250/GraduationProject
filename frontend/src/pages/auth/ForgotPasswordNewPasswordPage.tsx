import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { resetPasswordWithCode } from "@/api/authApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ForgotPasswordFlowAlert } from "@/pages/auth/forgot-password/ForgotPasswordFlowAlert";
import { ForgotPasswordFlowLayout } from "@/pages/auth/forgot-password/ForgotPasswordFlowLayout";
import {
  readFlowEmail,
  type ForgotPasswordFlowState,
} from "@/pages/auth/forgot-password/forgotPasswordFlow";
import { isPasswordPolicyMet } from "@/lib/passwordPolicy";
import { ROUTES } from "@/routes/paths";
import { cn } from "@/components/ui/utils";

const passwordInputClass = cn(
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground",
  "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
);

export default function ForgotPasswordNewPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const flow = (location.state as ForgotPasswordFlowState | null) ?? {};
  const email = readFlowEmail(location.state);
  const code = flow.code?.trim() ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!email || code.length !== 6) {
    return <Navigate to={ROUTES.forgotPasswordVerify} state={{ email }} replace />;
  }

  const verifyState: ForgotPasswordFlowState = { email };

  const handleSubmit = async () => {
    if (!isPasswordPolicyMet(newPassword)) {
      setError("Password does not meet all requirements.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await resetPasswordWithCode({ email, code, newPassword });
      navigate(ROUTES.forgotPasswordSuccess, { replace: true });
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ForgotPasswordFlowLayout>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create New Password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a strong password for your SkillSwap account.
        </p>
      </header>

      {error ? <ForgotPasswordFlowAlert message={error} /> : null}

      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="new-password" className="text-sm font-medium">
            New password
          </Label>
          <PasswordField
            id="new-password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (error) setError(null);
            }}
            inputClassName={passwordInputClass}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password" className="text-sm font-medium">
            Confirm password
          </Label>
          <PasswordField
            id="confirm-password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError(null);
            }}
            inputClassName={passwordInputClass}
          />
        </div>

        <PasswordStrengthIndicator
          password={newPassword}
          confirmPassword={confirmPassword}
          showConfirmMatch
        />

        <div className="flex flex-col gap-3 pt-1 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 rounded-lg"
            disabled={loading}
            asChild
          >
            <Link to={ROUTES.forgotPasswordVerify} state={verifyState}>
              Back
            </Link>
          </Button>
          <Button
            type="button"
            disabled={
              loading ||
              !isPasswordPolicyMet(newPassword) ||
              newPassword !== confirmPassword
            }
            className="h-11 flex-1 rounded-lg bg-gradient-brand text-primary-foreground hover:opacity-95"
            onClick={() => void handleSubmit()}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating…
              </span>
            ) : (
              "Update Password"
            )}
          </Button>
        </div>
      </div>
    </ForgotPasswordFlowLayout>
  );
}
