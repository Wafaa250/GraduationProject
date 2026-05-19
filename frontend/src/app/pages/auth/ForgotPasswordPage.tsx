import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";

import { requestPasswordReset } from "../../../api/authApi";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError(null);

    try {
      const result = await requestPasswordReset(email.trim());
      setConfirmationMessage(result.message);
      setSubmitted(true);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setApiError(
        err.response?.data?.message ||
          "Something went wrong. Please try again in a moment.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="If an account exists for that address, we sent password reset instructions."
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
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CheckCircle2 className="size-7" aria-hidden />
          </div>
          <p className="text-sm text-muted-foreground sm:text-base">{confirmationMessage}</p>
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive it? Check spam or{" "}
            <button
              type="button"
              className="font-semibold text-primary hover:text-primary/80"
              onClick={() => {
                setSubmitted(false);
                setConfirmationMessage("");
              }}
            >
              try again
            </button>
            .
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you reset instructions."
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
          <Label htmlFor="reset-email" className="text-sm font-semibold text-muted-foreground">
            Email address
          </Label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              required
              autoComplete="email"
              className="h-12 rounded-xl border-border bg-background pl-10 text-base"
            />
          </div>
        </div>

        {apiError ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive" role="alert">
            {apiError}
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
              Sending…
            </>
          ) : (
            <>
              Send reset link
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
