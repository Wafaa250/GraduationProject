import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { forgotPassword } from "@/api/authApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ForgotPasswordFlowAlert } from "@/pages/auth/forgot-password/ForgotPasswordFlowAlert";
import { ForgotPasswordFlowLayout } from "@/pages/auth/forgot-password/ForgotPasswordFlowLayout";
import { readFlowEmail } from "@/pages/auth/forgot-password/forgotPasswordFlow";
import { ROUTES } from "@/routes/paths";
import { cn } from "@/components/ui/utils";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = readFlowEmail(location.state);

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      await forgotPassword({ email: trimmed });
      toast({
        title: "Verification code sent successfully",
        description: `Check ${trimmed} for your 6-digit code.`,
      });
      navigate(ROUTES.forgotPasswordVerify, { state: { email: trimmed } });
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ForgotPasswordFlowLayout>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Forgot Password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll send a verification code to your account email.
        </p>
      </header>

      {error ? <ForgotPasswordFlowAlert message={error} /> : null}

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
            "Send Verification Code"
          )}
        </Button>
      </form>
    </ForgotPasswordFlowLayout>
  );
}
