export type PasswordRule = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (p) => p.length >= 8,
  },
  {
    id: "upper",
    label: "At least one uppercase letter",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: "lower",
    label: "At least one lowercase letter",
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: "number",
    label: "At least one number",
    test: (p) => /\d/.test(p),
  },
];

export function isPasswordPolicyMet(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

export function passwordStrengthScore(password: string): number {
  if (!password) return 0;
  const met = PASSWORD_RULES.filter((r) => r.test(password)).length;
  return Math.round((met / PASSWORD_RULES.length) * 100);
}

export function passwordStrengthLabel(score: number): string {
  if (score === 0) return "";
  if (score < 50) return "Weak";
  if (score < 100) return "Fair";
  return "Strong";
}
