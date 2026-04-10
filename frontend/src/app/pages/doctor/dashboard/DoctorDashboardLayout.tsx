import type { ReactNode } from "react";
import { DoctorDashboardHeader } from "./DoctorDashboardHeader";
import { DoctorDashboardSidebar } from "./DoctorDashboardSidebar";
import type { DoctorDashboardSection } from "../doctorDashboardTypes";
import { dash } from "./doctorDashTokens";

type Props = {
  doctorName: string;
  initials: string;
  activeSection: DoctorDashboardSection;
  onSectionChange: (s: DoctorDashboardSection) => void;
  sidebarMobileOpen: boolean;
  onSidebarOpen: () => void;
  onSidebarClose: () => void;
  onLogout: () => void;
  children: ReactNode;
};

export function DoctorDashboardLayout({
  doctorName,
  initials,
  activeSection,
  onSectionChange,
  sidebarMobileOpen,
  onSidebarOpen,
  onSidebarClose,
  onLogout,
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
        onMenuClick={onSidebarOpen}
        onLogout={onLogout}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          minHeight: 0,
        }}
      >
        <DoctorDashboardSidebar
          activeSection={activeSection}
          onSelect={onSectionChange}
          mobileOpen={sidebarMobileOpen}
          onCloseMobile={onSidebarClose}
        />
        <main
          style={{
            flex: 1,
            minWidth: 0,
            overflow: "auto",
            padding: "24px 28px 40px",
          }}
          className="dd-main"
        >
          <div
            className="dd-section-fade"
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
        .dd-section-fade {
          animation: ddSectionIn 0.2s ease-out;
        }
        @keyframes ddSectionIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 900px) {
          .dd-main { padding: 16px 16px 32px !important; }
        }
      `}</style>
    </div>
  );
}
