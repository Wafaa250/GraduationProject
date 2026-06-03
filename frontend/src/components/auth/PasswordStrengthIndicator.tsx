import {
  isPasswordPolicyMet,
  PASSWORD_RULES,
  passwordStrengthLabel,
  passwordStrengthScore,
} from "@/lib/passwordPolicy";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Check, Circle } from "lucide-react";

type PasswordStrengthIndicatorProps = {
  password: string;
  confirmPassword?: string;
  showConfirmMatch?: boolean;
};

export function PasswordStrengthIndicator({
  password,
  confirmPassword = "",
  showConfirmMatch = false,
}: PasswordStrengthIndicatorProps) {
  const score = passwordStrengthScore(password);
  const strengthLabel = passwordStrengthLabel(score);
  const policyMet = isPasswordPolicyMet(password);
  const confirmMatch =
    !showConfirmMatch || (confirmPassword.length > 0 && password === confirmPassword);
  const allMet = policyMet && confirmMatch;

  const unmetRules = PASSWORD_RULES.filter((rule) => !rule.test(password));
  const showConfirmMismatch =
    showConfirmMatch && confirmPassword.length > 0 && password !== confirmPassword;

  const showChecklist =
    (password.length > 0 || confirmPassword.length > 0) &&
    !allMet &&
    (unmetRules.length > 0 || showConfirmMismatch);

  const successMessage =
    strengthLabel === "Strong" ? "Strong password" : "Password requirements met";

  if (!password && !confirmPassword) {
    return null;
  }

  return (
    <div className="space-y-3">
      {password ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Password strength</span>
            {strengthLabel ? (
              <span
                className={cn(
                  "font-medium",
                  score === 100
                    ? "text-primary"
                    : score >= 50
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground",
                )}
              >
                {strengthLabel}
              </span>
            ) : null}
          </div>
          <Progress value={score} className="h-1.5" />
        </div>
      ) : null}

      {allMet ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <span>{successMessage}</span>
        </p>
      ) : showChecklist ? (
        <ul className="space-y-1.5">
          {unmetRules.map((rule) => (
            <li key={rule.id} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
              <span>{rule.label}</span>
            </li>
          ))}
          {showConfirmMismatch ? (
            <li className="flex items-center gap-2 text-xs text-muted-foreground">
              <Circle className="h-3.5 w-3.5 shrink-0 text-destructive/60" aria-hidden />
              <span className="text-destructive/90">Passwords match</span>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
