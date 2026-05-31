import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import toast from "react-hot-toast";
import api, { parseApiErrorMessage } from "@/api/axiosInstance";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mustChangePassword, persistAuthSession } from "@/lib/authSession";
import { setStoredCompanyRole } from "@/lib/companyWorkspace";
import { navigateHome } from "@/utils/homeNavigation";
import { ROUTES } from "@/routes/paths";

type ChangePasswordResponse = {
  token: string;
  role: string;
  userId: number;
  name: string;
  email: string;
  companyRole?: string | null;
  mustChangePassword?: boolean;
};

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (!mustChangePassword()) {
    return <Navigate to={ROUTES.home} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post<ChangePasswordResponse>("/auth/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      persistAuthSession(data);
      setStoredCompanyRole(data.companyRole);
      toast.success("Password updated. Welcome to your workspace.");
      navigateHome(navigate);
    } catch (err) {
      setError(parseApiErrorMessage(err) || "Could not update password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="rounded-2xl border border-border/70 bg-card/90 backdrop-blur-xl p-7 sm:p-9 shadow-card">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Set your password</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Your account was created with a temporary password. Choose a new password to continue.
          </p>
        </header>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex gap-3">
          <LockKeyhole className="h-4 w-4 shrink-0 mt-0.5 text-primary" aria-hidden />
          <p>
            For security, you must set a personal password before accessing the company workspace.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div>
          <Label htmlFor="current-password">Temporary / current password</Label>
          <div className="relative mt-1.5">
            <Input
              id="current-password"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="rounded-xl pr-10"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowCurrent((v) => !v)}
              aria-label={showCurrent ? "Hide password" : "Show password"}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="new-password">New password</Label>
          <div className="relative mt-1.5">
            <Input
              id="new-password"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="rounded-xl pr-10"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowNew((v) => !v)}
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded-xl mt-1.5"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        <Button type="submit" className="w-full rounded-xl cw-btn-gradient border-0" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving password…
            </>
          ) : (
            "Save and continue"
          )}
        </Button>
      </form>
      </div>
    </AuthShell>
  );
}
