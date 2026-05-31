import { CompanyNotificationBell } from "@/components/company/CompanyNotificationBell";
import { CompanyProfileMenu } from "@/components/company/CompanyProfileMenu";

export function CompanyTopbar() {
  const companyName = localStorage.getItem("name") ?? "Company";

  return (
    <header className="cw-shell-header cw-topbar z-30 flex items-center gap-3 px-4 md:px-6">
      <div className="hidden sm:block min-w-0">
        <h1 className="text-sm font-semibold truncate">{companyName} · Workspace</h1>
        <p className="text-[11px] text-muted-foreground">AI talent discovery workspace</p>
      </div>

      <div className="flex-1" />

      <CompanyNotificationBell />

      <CompanyProfileMenu />
    </header>
  );
}
