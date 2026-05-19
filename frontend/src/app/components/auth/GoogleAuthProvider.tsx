import type { ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";

type GoogleAuthProviderProps = {
  children: ReactNode;
};

/**
 * Wraps the app with Google Identity Services when VITE_GOOGLE_CLIENT_ID is set.
 * Create a Web OAuth client in Google Cloud Console and add authorized origins
 * (e.g. http://localhost:5173).
 */
export function GoogleAuthProvider({ children }: GoogleAuthProviderProps) {
  if (!googleClientId) {
    return <>{children}</>;
  }

  return <GoogleOAuthProvider clientId={googleClientId}>{children}</GoogleOAuthProvider>;
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(googleClientId);
}
