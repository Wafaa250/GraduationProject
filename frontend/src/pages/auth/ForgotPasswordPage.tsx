import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertCircle, ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { forgotPassword } from "@/api/authApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/routes/paths";
import { cn } from "@/components/ui/utils";
import "@/pages/auth/login-page.css";

export default function ForgotPasswordPage() {
  const location = useLocation();
  const initialEmail =
    (location.state as { email?: string } | null)?.email?.trim() ??
    localStorage.getItem("email") ??
    "";

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      const message = await forgotPassword({ email: trimmed });
      setSuccessMessage(message);
      setSent(true);
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
        className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-primary/20 blur-3xl"
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
                Reset your password
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the email linked to your SkillSwap account. We will send reset instructions if
                an account exists.
              </p>
            </header>

            {sent ? (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 text-sm">
                  <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="font-medium text-foreground">Check your email</p>
                    <p className="mt-1 text-muted-foreground">{successMessage}</p>
                  </div>
                </div>
                <Button asChild variant="outline" className="h-11 w-full rounded-lg">
                  <Link to={ROUTES.login}>Return to sign in</Link>
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
                    <Label htmlFor="forgot-email" className="text-sm font-medium">
                      Email address
                    </Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@university.edu"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      required
                      className={cn(
                        "h-11 rounded-lg bg-background",
                        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
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
                        Sending…
                      </span>
                    ) : (
                      "Send reset link"
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
