import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { CompanyProfileContent } from "@/components/company/CompanyProfileContent";
import { CompanyPublicProfileShell } from "@/components/public-profile/CompanyPublicProfileShell";
import { useCompanyProfilePage } from "@/hooks/useCompanyProfilePage";
import { ROUTES } from "@/routes/paths";

export default function CompanyVisitorProfilePage() {
  const { companyProfileId: idParam } = useParams<{ companyProfileId: string }>();
  const companyProfileId = Number(idParam);
  const validId = Number.isFinite(companyProfileId) && companyProfileId > 0;
  const hook = useCompanyProfilePage("visitor", validId ? companyProfileId : undefined);

  return (
    <CompanyPublicProfileShell>
      <Link
        to={ROUTES.communicationHub}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to Communication Hub
      </Link>

      <CompanyPageShell>
        <CompanyProfileContent mode="visitor" {...hook} />
      </CompanyPageShell>
    </CompanyPublicProfileShell>
  );
}
