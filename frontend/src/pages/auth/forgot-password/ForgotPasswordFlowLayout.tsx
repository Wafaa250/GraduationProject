import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ROUTES } from "@/routes/paths";
import { FORGOT_PASSWORD_RETURN_PATH } from "@/pages/auth/forgot-password/forgotPasswordFlow";
import "@/pages/auth/login-page.css";

type ForgotPasswordFlowLayoutProps = {
  children: ReactNode;
  /** When false, omit the top “Back to Settings” link (e.g. success step uses its own CTA). */
  showTopBack?: boolean;
};

export function ForgotPasswordFlowLayout({
  children,
  showTopBack = true,
}: ForgotPasswordFlowLayoutProps) {
  return (
    <main className="login-page relative min-h-screen overflow-hidden bg-gradient-soft">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-primary-glow/20 blur-3xl"
      />
      <div className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <BrandLogo to={ROUTES.home} size="sm" />
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/90 p-7 shadow-card backdrop-blur-xl sm:p-9">
            {showTopBack ? (
              <Link
                to={FORGOT_PASSWORD_RETURN_PATH}
                className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back to Settings
              </Link>
            ) : null}
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
