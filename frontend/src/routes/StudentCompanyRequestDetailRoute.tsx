import { Navigate, useParams } from "react-router-dom";
import { COMPANY_ROUTES, ROUTES } from "@/routes/paths";
import { isCompanyWorkspaceAccountRole } from "@/lib/companyAccountRole";
import { CompanyRequestDetailPage } from "@/pages/company/CompanyRequestDetailPage";

/** Students viewing a company opportunity from the feed (requires ?companyId=). */
export function StudentCompanyRequestDetailRoute() {
  const { id } = useParams<{ id: string }>();
  const role = localStorage.getItem("role");

  if (isCompanyWorkspaceAccountRole(role)) {
    const requestId = id?.trim();
    if (requestId) {
      return <Navigate to={COMPANY_ROUTES.requestDetail(requestId)} replace />;
    }
    return <Navigate to={COMPANY_ROUTES.dashboard} replace />;
  }

  if ((role ?? "").toLowerCase() !== "student") {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <CompanyRequestDetailPage />;
}
