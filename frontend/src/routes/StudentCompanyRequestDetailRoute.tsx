import { Navigate, useParams } from "react-router-dom";
import { COMPANY_ROUTES, ROUTES } from "@/routes/paths";
import { isCompanyWorkspaceAccountRole } from "@/lib/companyAccountRole";
import { CompanyRequestDetailPage } from "@/pages/company/CompanyRequestDetailPage";

/** Students viewing a published company opportunity from the Communication Hub. */
export function StudentCompanyRequestDetailRoute() {
  const { companyProfileId, requestId } = useParams<{
    companyProfileId: string;
    requestId: string;
  }>();
  const role = localStorage.getItem("role");

  if (isCompanyWorkspaceAccountRole(role)) {
    const id = requestId?.trim();
    if (id) {
      return <Navigate to={COMPANY_ROUTES.requestDetail(id)} replace />;
    }
    return <Navigate to={COMPANY_ROUTES.dashboard} replace />;
  }

  if ((role ?? "").toLowerCase() !== "student") {
    return <Navigate to={ROUTES.home} replace />;
  }

  if (!companyProfileId?.trim() || !requestId?.trim()) {
    return <Navigate to={ROUTES.communicationHub} replace />;
  }

  return <CompanyRequestDetailPage />;
}
