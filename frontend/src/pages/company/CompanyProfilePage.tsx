import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { CompanyProfileContent } from "@/components/company/CompanyProfileContent";
import { useCompanyProfilePage } from "@/hooks/useCompanyProfilePage";

export function CompanyProfilePage() {
  const hook = useCompanyProfilePage("owner");

  return (
    <CompanyPageShell>
      <CompanyProfileContent mode="owner" {...hook} />
    </CompanyPageShell>
  );
}
