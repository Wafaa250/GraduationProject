import { Redirect, type Href } from "expo-router";

import { COMPANY_ROUTES } from "@/lib/companyRoutes";

export default function CompanyMainIndex() {
  return <Redirect href={COMPANY_ROUTES.dashboard as Href} />;
}
