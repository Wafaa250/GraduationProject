import { router } from "expo-router";

import { clearSession } from "@/utils/authStorage";

export async function logout(): Promise<void> {
  await clearSession();
  router.replace("/login");
}
