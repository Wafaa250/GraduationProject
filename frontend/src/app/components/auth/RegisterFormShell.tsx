import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { SkillSwapMark } from "../brand/SkillSwapMark";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { AuthPageBackground } from "./AuthPageBackground";
import { AuthStepProgress } from "./AuthStepProgress";

export type RegisterFormShellProps = {
  children: ReactNode;
  roleLabel: string;
  steps: string[];
  currentStep: number;
  onChangeRole?: () => void;
  title?: string;
  subtitle?: string;
};

export function RegisterFormShell({
  children,
  roleLabel,
  steps,
  currentStep,
  onChangeRole,
  title = "Create your account",
  subtitle = "Complete the steps below to join SkillSwap.",
}: RegisterFormShellProps) {
  return (
    <div className="relative flex min-h-screen items-start justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-10">
      <AuthPageBackground />
      <div className="relative z-10 mx-auto w-full max-w-2xl">
        <div className="mb-8 text-center sm:mb-9">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <SkillSwapMark size={22} />
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
        </div>

        <AuthStepProgress steps={steps} currentStep={currentStep} />

        {onChangeRole ? (
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onChangeRole} className="text-primary">
              <ArrowLeft className="size-3.5" />
              Change role
            </Button>
            <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              {roleLabel}
            </span>
          </div>
        ) : null}

        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-1 rounded-[1.65rem] bg-gradient-to-br from-primary/10 via-transparent to-ai/8 opacity-80 blur-md"
          />
          <div className="register-form-card relative rounded-3xl border border-border/80 bg-card/95 p-7 shadow-pop backdrop-blur-sm sm:p-9">
            {children}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/80 sm:text-sm">
          SkillSwap · AI-powered university collaboration
        </p>
      </div>
    </div>
  );
}

export type RegisterSuccessShellProps = {
  children: ReactNode;
};

/** Centered success state after registration */
export function RegisterSuccessShell({ children }: RegisterSuccessShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      <AuthPageBackground />
      <div className="relative z-10 mx-auto w-full max-w-md">
        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-1 rounded-[1.65rem] bg-gradient-to-br from-primary/10 via-transparent to-ai/8 opacity-80 blur-md"
          />
          <div className="relative rounded-3xl border border-border/80 bg-card/95 p-8 text-center shadow-pop backdrop-blur-sm sm:p-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
