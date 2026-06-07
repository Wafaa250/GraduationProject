import { router } from "expo-router";

import { setStoredCompanyRole } from "@/lib/companyWorkspace";
import { clearSession } from "@/utils/authStorage";

export async function logout(): Promise<void> {
  await clearSession();
  await setStoredCompanyRole(null);
  router.replace("/login");
}
