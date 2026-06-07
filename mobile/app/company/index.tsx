import { Redirect, type Href } from "expo-router";

import { COMPANY_ROUTES } from "@/lib/companyRoutes";

/** Legacy entry — redirect to tabbed dashboard. */
export default function CompanyLegacyIndex() {
  return <Redirect href={COMPANY_ROUTES.dashboard as Href} />;
}
