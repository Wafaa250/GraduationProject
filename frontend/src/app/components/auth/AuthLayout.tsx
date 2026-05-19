import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { SkillSwapMark } from "../brand/SkillSwapMark";
import { cn } from "../ui/utils";
import { AuthPageBackground } from "./AuthPageBackground";

export type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  /** Compact card only — e.g. embedded login panel */
  embedded?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  footer?: ReactNode;
};

const maxWidthClass = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
} as const;

export function AuthLayout({
  children,
  title,
  subtitle,
  embedded = false,
  maxWidth = "lg",
  footer,
}: AuthLayoutProps) {
  const shell = (
    <div className={cn("mx-auto w-full", maxWidthClass[maxWidth])}>
      {!embedded ? (
        <div className="mb-9 text-center sm:mb-10">
          <Link
            to="/"
            className="inline-flex flex-col items-center transition-opacity hover:opacity-90"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
              <SkillSwapMark size={22} />
            </span>
          </Link>
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
          ) : null}
        </div>
      ) : (
        <div className="mb-6 text-center">
          <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      )}

      <div className="relative">
        {!embedded ? (
          <div
            aria-hidden
            className="absolute -inset-1 rounded-[1.65rem] bg-gradient-to-br from-primary/10 via-transparent to-ai/8 opacity-80 blur-md"
          />
        ) : null}
        <div className="relative rounded-3xl border border-border/80 bg-card/95 p-7 shadow-pop backdrop-blur-sm sm:p-9">
          {embedded ? (
            <>
              <div className="mb-6 flex justify-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                  <SkillSwapMark />
                </span>
              </div>
              {children}
            </>
          ) : (
            children
          )}
        </div>
      </div>

      {footer ? <div className="mt-7 text-center sm:mt-8">{footer}</div> : null}
    </div>
  );

  if (embedded) {
    return shell;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      <AuthPageBackground />
      <div className="relative z-10 flex w-full justify-center">{shell}</div>
    </div>
  );
}
