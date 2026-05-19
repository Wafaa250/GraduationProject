import { useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from "lucide-react";

import { resetPassword } from "../../../api/authApi";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setClientError(null);
    setApiError(null);

    if (password.length < 8) {
      setClientError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setClientError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword({
        token,
        password,
        confirmPassword,
      });
      setSuccessMessage(result.message);
      setSucceeded(true);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setApiError(
        err.response?.data?.message ||
          "Unable to reset your password. The link may be invalid or expired.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout
        title="Invalid reset link"
        subtitle="This password reset link is missing or incomplete."
        footer={
          <p className="text-center text-sm text-muted-foreground sm:text-base">
            <Link
              to="/forgot-password"
              className="inline-flex items-center justify-center gap-1.5 font-semibold text-primary transition-colors hover:text-primary/80"
            >
              Request a new reset link
            </Link>
          </p>
        }
      >
        <p className="text-center text-sm text-muted-foreground sm:text-base">
          Open the link from your email, or request a new one.
        </p>
      </AuthLayout>
    );
  }

  if (succeeded) {
    return (
      <AuthLayout
        title="Password updated"
        subtitle="Your account is ready — sign in with your new password."
        footer={
          <p className="text-center text-sm text-muted-foreground sm:text-base">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-1.5 font-semibold text-primary transition-colors hover:text-primary/80"
            >
              <ArrowRight className="size-3.5" aria-hidden />
              Continue to sign in
            </Link>
          </p>
        }
      >
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CheckCircle2 className="size-7" aria-hidden />
          </div>
          <p className="text-sm text-muted-foreground sm:text-base">{successMessage}</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a strong password you haven't used on SkillSwap before."
      footer={
        <p className="text-center text-sm text-muted-foreground sm:text-base">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-1.5 font-semibold text-primary transition-colors hover:text-primary/80"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2.5">
          <Label htmlFor="new-password" className="text-sm font-semibold text-muted-foreground">
            New password
          </Label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-12 rounded-xl border-border bg-background pl-10 pr-11 text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="confirm-password" className="text-sm font-semibold text-muted-foreground">
            Confirm password
          </Label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-12 rounded-xl border-border bg-background pl-10 pr-11 text-base"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {clientError || apiError ? (
          <p
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
            role="alert"
          >
            {clientError ?? apiError}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          disabled={isLoading}
          className="h-12 w-full rounded-xl text-base font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Updating…
            </>
          ) : (
            <>
              Reset password
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
