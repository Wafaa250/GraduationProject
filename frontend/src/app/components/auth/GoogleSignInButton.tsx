import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { loginWithGoogle, type GoogleAuthRole } from "../../../api/authApi";
import { navigateAfterAuth, persistAuthSession } from "../../../lib/authSession";
import { isGoogleAuthConfigured } from "./GoogleAuthProvider";
import { Button } from "../ui/button";

export type GoogleSignInButtonProps = {
  /** Required when creating a new account via sign-up. Omit on the login page. */
  role?: GoogleAuthRole;
  embedded?: boolean;
  onLoginSuccess?: () => void;
  className?: string;
  disabled?: boolean;
};

/**
 * Sends the Google ID token to POST /api/auth/google (validated server-side).
 * Uses a transparent GIS button overlay so the visible control matches auth UI.
 */
export function GoogleSignInButton({
  role,
  embedded = false,
  onLoginSuccess,
  className,
  disabled = false,
}: GoogleSignInButtonProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeSignIn = useCallback(
    async (idToken: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await loginWithGoogle(idToken, role);
        persistAuthSession(result);
        onLoginSuccess?.();

        if (embedded) {
          return;
        }

        navigateAfterAuth(navigate, result.role);
      } catch (err: unknown) {
        const axiosErr = err as {
          response?: { status?: number; data?: { message?: string; code?: string } };
        };
        const code = axiosErr.response?.data?.code;
        const message = axiosErr.response?.data?.message;

        if (code === "REGISTRATION_REQUIRED") {
          setError(message ?? "Please sign up and choose your role first.");
          return;
        }

        setError(message ?? "Google sign-in failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [embedded, navigate, onLoginSuccess, role],
  );

  const handleGoogleSuccess = (response: CredentialResponse) => {
    const idToken = response.credential;
    if (!idToken) {
      setError("Google did not return a sign-in token.");
      return;
    }
    void completeSignIn(idToken);
  };

  const configured = isGoogleAuthConfigured();

  const handleUnavailableClick = () => {
    setError("Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID to frontend/.env.");
  };

  return (
    <div className="w-full">
      <div
        className={
          className
            ? `relative ${className}`
            : "relative mt-4 h-12 w-full"
        }
      >
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={disabled || isLoading}
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 h-12 w-full rounded-xl text-base font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Signing in with Google…
            </>
          ) : (
            "Continue with Google"
          )}
        </Button>

        {configured && !disabled ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden opacity-[0.011]"
            aria-label="Continue with Google"
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setError("Google sign-in was cancelled or blocked.");
                setIsLoading(false);
              }}
              useOneTap={false}
              theme="outline"
              size="large"
              text="continue_with"
              shape="rectangular"
              width="400"
            />
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={disabled || isLoading}
            onClick={handleUnavailableClick}
            className="absolute inset-0 z-10 h-12 w-full rounded-xl text-base font-medium"
          >
            Continue with Google
          </Button>
        )}
      </div>

      {error ? (
        <p
          className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
          role="alert"
        >
          {error}
          {error.toLowerCase().includes("sign up") ? (
            <>
              {" "}
              <Link to="/register" className="font-semibold underline underline-offset-2">
                Go to sign up
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
