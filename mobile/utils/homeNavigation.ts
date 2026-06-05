import { router, type Href } from "expo-router";

import { getItem } from "@/utils/authStorage";
import { isCompanyWorkspaceAccountRole } from "@/utils/companyAccountRole";
import { isAssociationRole } from "@/utils/organizationRole";

export const MOBILE_ROUTES = {
  login: "/login",
  changePassword: "/change-password",
  feed: "/feed",
  doctorDashboard: "/doctor/dashboard",
  companyDashboard: "/company",
  associationDashboard: "/association/dashboard",
} as const;

export async function getHomePath(): Promise<string> {
  const role = await getItem("role");

  if (isAssociationRole(role)) {
    return MOBILE_ROUTES.associationDashboard;
  }

  const roleLower = (role ?? "").toLowerCase();

  if (roleLower === "student") {
    return MOBILE_ROUTES.feed;
  }

  if (roleLower === "doctor") {
    return MOBILE_ROUTES.doctorDashboard;
  }

  if (isCompanyWorkspaceAccountRole(role)) {
    return MOBILE_ROUTES.companyDashboard;
  }

  return MOBILE_ROUTES.feed;
}

export async function navigateHome(): Promise<void> {
  router.replace((await getHomePath()) as Href);
}
