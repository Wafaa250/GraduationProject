import { removeItem, setItem } from "@/utils/authStorage";
import type { AuthLoginResponse } from "@/types/auth";

export async function setMustChangePassword(required: boolean): Promise<void> {
  if (required) {
    await setItem("mustChangePassword", "true");
  } else {
    await removeItem("mustChangePassword");
  }
}

export async function persistAuthSession(result: AuthLoginResponse): Promise<void> {
  await setItem("token", String(result.token ?? ""));
  await setItem("userId", String(result.userId ?? ""));
  await setItem("role", String(result.role ?? ""));
  await setItem("name", String(result.name ?? ""));
  await setItem("email", String(result.email ?? ""));
  await setMustChangePassword(Boolean(result.mustChangePassword));
}
