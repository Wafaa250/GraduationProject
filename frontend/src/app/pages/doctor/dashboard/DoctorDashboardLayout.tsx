import type { ReactNode } from "react";
import { SidebarProvider } from "../../../components/ui/sidebar";
import { DoctorHubAppSidebar } from "../../../components/doctor/hub/DoctorHubAppSidebar";
import { DoctorHubTopbar } from "../../../components/doctor/hub/DoctorHubTopbar";
import type { DoctorDashboardSection } from "../doctorDashboardTypes";
import "../hub/doctor-hub-theme.css";

type NavCounts = {
  pendingRequests?: number;
};

type Props = {
  doctorName: string;
  doctorSubtitle?: string;
  initials: string;
  activeSection: DoctorDashboardSection;
  onSectionChange: (s: DoctorDashboardSection) => void;
  onLogout: () => void;
  navCounts?: NavCounts;
  children: ReactNode;
};

/**
 * Doctor dashboard shell — Lovable layout (sidebar + topbar) with existing section routing.
 */
export function DoctorDashboardLayout({
  doctorName,
  doctorSubtitle,
  initials,
  activeSection,
  onSectionChange,
  onLogout,
  navCounts,
  children,
}: Props) {
  return (
    <SidebarProvider defaultOpen>
      <div className="doctor-hub min-h-screen flex w-full">
        <DoctorHubAppSidebar
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          navCounts={navCounts}
          doctorName={doctorName}
          doctorSubtitle={doctorSubtitle}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <DoctorHubTopbar
            initials={initials}
            doctorName={doctorName}
            doctorSubtitle={doctorSubtitle}
            onLogout={onLogout}
          />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div key={activeSection} className="max-w-7xl mx-auto animate-in fade-in duration-200">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
