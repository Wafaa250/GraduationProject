import {
  Briefcase,
  ClipboardList,
  LayoutDashboard,
  Trash2,
} from "lucide-react";
import type { DoctorDashboardSection } from "../doctorDashboardTypes";
import { dash } from "./doctorDashTokens";

const NAV: { id: DoctorDashboardSection; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "requests", label: "Requests", Icon: ClipboardList },
  { id: "projects", label: "My projects", Icon: Briefcase },
  { id: "deleted", label: "Deleted projects", Icon: Trash2 },
];

type Props = {
  activeSection: DoctorDashboardSection;
  onSelect: (id: DoctorDashboardSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function DoctorDashboardSidebar({
  activeSection,
  onSelect,
  mobileOpen,
  onCloseMobile,
}: Props) {
  const pick = (id: DoctorDashboardSection) => {
    onSelect(id);
    onCloseMobile();
  };

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onCloseMobile}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(15,23,42,0.35)",
            border: "none",
            cursor: "pointer",
          }}
          className="doctor-dash-sidebar-backdrop"
        />
      ) : null}

      <aside
        className="doctor-dash-sidebar"
        style={{
          width: 260,
          flexShrink: 0,
          background: dash.surface,
          borderRight: `1px solid ${dash.border}`,
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          fontFamily: dash.font,
          zIndex: 41,
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: dash.subtle,
            padding: "8px 12px 12px",
            margin: 0,
          }}
        >
          Menu
        </p>
        {NAV.map(({ id, label, Icon }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => pick(id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 14px",
                borderRadius: dash.radiusMd,
                border: active ? `1px solid ${dash.accentSoft}` : `1px solid transparent`,
                background: active ? dash.accentSoft : "transparent",
                color: active ? dash.accent : dash.muted,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "background 0.15s ease, color 0.15s ease",
              }}
            >
              <Icon size={18} strokeWidth={active ? 2.25 : 2} />
              {label}
            </button>
          );
        })}
      </aside>

      <style>{`
        @media (max-width: 900px) {
          .doctor-dash-sidebar-backdrop { display: block; }
          .doctor-dash-sidebar {
            position: fixed !important;
            top: 0;
            left: 0;
            bottom: 0;
            transform: translateX(${mobileOpen ? "0" : "-100%"});
            transition: transform 0.22s ease;
            box-shadow: ${mobileOpen ? "8px 0 32px rgba(15,23,42,0.12)" : "none"};
          }
        }
        @media (min-width: 901px) {
          .doctor-dash-sidebar-backdrop { display: none !important; }
        }
      `}</style>
    </>
  );
}
