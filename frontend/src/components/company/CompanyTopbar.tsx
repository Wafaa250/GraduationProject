import { CompanyNotificationBell } from '@/components/company/CompanyNotificationBell'
import { CompanyProfileMenu } from '@/components/company/CompanyProfileMenu'
import { getStoredCompanyDisplayName } from '@/layouts/useCompanyWorkspaceBootstrap'

export function CompanyTopbar() {
  const companyName = getStoredCompanyDisplayName()

  return (
    <header className="cw-shell-header cw-topbar z-30 flex min-h-[var(--cw-header-height)] items-center gap-3 px-4 md:px-6">
      <div className="hidden min-w-0 sm:block">
        <h1 className="truncate text-sm font-semibold">{companyName} · Workspace</h1>
      </div>

      <div className="flex-1" />

      <div className="cw-workspace-header-actions flex items-center gap-2">
        <CompanyNotificationBell />
        <CompanyProfileMenu />
      </div>
    </header>
  )
}
