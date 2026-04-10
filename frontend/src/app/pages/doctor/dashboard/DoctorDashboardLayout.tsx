import type { ReactNode } from "react";
import { DoctorDashboardHeader } from "./DoctorDashboardHeader";
import { DoctorDashboardSidebar } from "./DoctorDashboardSidebar";
import type { DoctorDashboardSection } from "../doctorDashboardTypes";
import { dash } from "./doctorDashTokens";

type Props = {
  doctorName: string;
  initials: string;
  onLogout: () => void;
  activeSection: DoctorDashboardSection;
  onSectionChange: (id: DoctorDashboardSection) => void;
  sidebarMobileOpen: boolean;
  onSidebarToggle: () => void;
  onSidebarCloseMobile: () => void;
  children: ReactNode;
};

export function DoctorDashboardLayout({
  doctorName,
  initials,
  onLogout,
  activeSection,
  onSectionChange,
  sidebarMobileOpen,
  onSidebarToggle,
  onSidebarCloseMobile,
  children,
}: Props) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: dash.bg,
        fontFamily: dash.font,
        color: dash.text,
      }}
    >
      <DoctorDashboardHeader
        doctorName={doctorName}
        initials={initials}
        onLogout={onLogout}
        onMenuClick={onSidebarToggle}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          minHeight: 0,
          position: "relative",
        }}
      >
        <DoctorDashboardSidebar
          activeSection={activeSection}
          onSelect={onSectionChange}
          mobileOpen={sidebarMobileOpen}
          onCloseMobile={onSidebarCloseMobile}
        />

        <main
          style={{
            flex: 1,
            minWidth: 0,
            overflow: "auto",
            padding: "24px 24px 40px",
          }}
        >
          <div
            className="doctor-dash-main-inner"
            style={{
              maxWidth: 1120,
              margin: "0 auto",
            }}
          >
            {children}
          </div>
        </main>
      </div>

      <style>{`
        @media (min-width: 901px) {
          .doctor-dash-sidebar {
            position: relative !important;
            transform: none !important;
            box-shadow: none !important;
          }
        }
        .doctor-dash-section-fade {
          animation: doctorDashSectionFade 0.22s ease-out;
        }
        @keyframes doctorDashSectionFade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .doctor-dash-request-card:hover,
        .doctor-dash-project-card:hover,
        .doctor-dash-stat-card:hover {
          box-shadow: ${dash.shadowLg} !important;
        }
        button:hover:not(:disabled) { opacity: 0.94; }
      `}</style>
    </div>
  );
}
