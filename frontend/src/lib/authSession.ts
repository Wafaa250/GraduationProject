const MUST_CHANGE_PASSWORD_KEY = "mustChangePassword";

export function setMustChangePassword(required: boolean): void {
  if (required) {
    localStorage.setItem(MUST_CHANGE_PASSWORD_KEY, "true");
  } else {
    localStorage.removeItem(MUST_CHANGE_PASSWORD_KEY);
  }
}

export function mustChangePassword(): boolean {
  return localStorage.getItem(MUST_CHANGE_PASSWORD_KEY) === "true";
}

export function persistAuthSession(result: {
  token: string;
  userId: number;
  role: string;
  name: string;
  email: string;
  companyRole?: string | null;
  mustChangePassword?: boolean;
}): void {
  localStorage.setItem("token", result.token);
  localStorage.setItem("userId", result.userId.toString());
  localStorage.setItem("role", result.role);
  localStorage.setItem("name", result.name);
  localStorage.setItem("email", result.email);
  setMustChangePassword(Boolean(result.mustChangePassword));
}
