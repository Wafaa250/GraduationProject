import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { resetPassword } from "@/api/authApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { PasswordField } from "@/components/auth/PasswordField";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/routes/paths";
import { cn } from "@/components/ui/utils";
import "@/pages/auth/login-page.css";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("This reset link is invalid or missing a token.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await resetPassword({ token, password, confirmPassword });
      setDone(true);
      setTimeout(() => navigate(ROUTES.login, { replace: true }), 2500);
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page relative min-h-screen overflow-hidden bg-gradient-soft">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary-glow/20 blur-3xl"
      />
      <div className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <BrandLogo to={ROUTES.home} size="sm" />
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/90 p-7 shadow-card backdrop-blur-xl sm:p-9">
            <Link
              to={ROUTES.login}
              className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to sign in
            </Link>

            <header className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Choose a new password
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter a new password for your account. Reset links expire after a short time.
              </p>
            </header>

            {!token ? (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-red-50 px-4 py-3 text-sm text-destructive"
              >
                This reset link is invalid. Request a new one from the sign-in page.
              </div>
            ) : done ? (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 text-sm">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="font-medium text-foreground">Password updated</p>
                    <p className="mt-1 text-muted-foreground">
                      Redirecting you to sign in…
                    </p>
                  </div>
                </div>
                <Button asChild className="h-11 w-full rounded-lg">
                  <Link to={ROUTES.login}>Sign in now</Link>
                </Button>
              </div>
            ) : (
              <>
                {error ? (
                  <div
                    role="alert"
                    className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/30 bg-red-50 px-3.5 py-3 text-sm text-destructive"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                ) : null}

                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-password" className="text-sm font-medium">
                      New password
                    </Label>
                    <PasswordField
                      id="reset-password"
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      required
                      minLength={8}
                      inputClassName={cn(
                        "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground",
                        "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reset-confirm" className="text-sm font-medium">
                      Confirm new password
                    </Label>
                    <PasswordField
                      id="reset-confirm"
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      required
                      minLength={8}
                      inputClassName={cn(
                        "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground",
                        "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 w-full rounded-lg bg-gradient-brand text-primary-foreground hover:opacity-95"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating…
                      </span>
                    ) : (
                      "Update password"
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
