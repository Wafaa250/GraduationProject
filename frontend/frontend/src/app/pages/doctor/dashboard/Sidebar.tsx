import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Briefcase,
  ClipboardList,
  LayoutDashboard,
  Trash2,
  X,
} from "lucide-react";
import type { DoctorDashboardSection } from "../doctorDashboardTypes";
import { dash } from "./doctorDashTokens";

function sidebarNavItemStyle(active: boolean): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1.5px solid",
    borderColor: active ? dash.accent : "transparent",
    background: active ? dash.accentMuted : "transparent",
    color: active ? dash.accent : dash.muted,
    fontSize: 14,
    fontWeight: active ? 700 : 600,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition:
      "background 0.15s ease, border-color 0.15s ease, transform 0.12s ease",
  };
}

const ITEMS: {
  id: DoctorDashboardSection;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "requests", label: "Requests", icon: ClipboardList },
  { id: "projects", label: "My Projects", icon: Briefcase },
  { id: "deleted", label: "Deleted Projects", icon: Trash2 },
  { id: "courses", label: "My Courses", icon: BookOpen },
];

type Props = {
  activeSection: DoctorDashboardSection;
  onSelect: (id: DoctorDashboardSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function Sidebar({
  activeSection,
  onSelect,
  mobileOpen,
  onCloseMobile,
}: Props) {
  const nav = (
    <nav
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "16px 12px",
        fontFamily: dash.font,
      }}
    >
      <div
        style={{
          padding: "8px 12px 16px",
          borderBottom: `1px solid ${dash.border}`,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 800,
            fontFamily: dash.fontDisplay,
            color: dash.text,
          }}
        >
          Skill<span style={{ color: dash.accent }}>Swap</span>
        </span>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: dash.muted }}>
          Doctor dashboard
        </p>
      </div>
      {ITEMS.map(({ id, label, icon: Icon }) => {
        const active = activeSection === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              onSelect(id);
              onCloseMobile();
            }}
            style={sidebarNavItemStyle(active)}
            className="dd-sidebar-nav-btn"
          >
            <Icon size={18} strokeWidth={active ? 2.25 : 2} />
            {label}
          </button>
        );
      })}
    </nav>
  );

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
          className="dd-sidebar-backdrop"
        />
      ) : null}

      <aside
        className="dd-sidebar-aside"
        style={{
          width: 260,
          flexShrink: 0,
          background: dash.surface,
          borderRight: `1px solid ${dash.border}`,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderBottom: `1px solid ${dash.border}`,
          }}
          className="dd-sidebar-mobile-header"
        >
          <span style={{ fontWeight: 800, fontFamily: dash.fontDisplay }}>
            Menu
          </span>
          <button
            type="button"
            onClick={onCloseMobile}
            style={{
              border: "none",
              background: dash.bg,
              borderRadius: 8,
              padding: 8,
              cursor: "pointer",
              color: dash.muted,
            }}
          >
            <X size={18} />
          </button>
        </div>
        {nav}
      </aside>

      <style>{`
        @media (min-width: 901px) {
          .dd-sidebar-aside {
            position: sticky;
            top: 0;
            align-self: flex-start;
            max-height: 100vh;
            overflow-y: auto;
          }
        }
        .dd-sidebar-nav-btn:hover {
          background: ${dash.accentMuted} !important;
        }
        @media (max-width: 900px) {
          .dd-sidebar-aside {
            position: fixed !important;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 50;
            box-shadow: ${dash.shadowLg};
            transform: translateX(${mobileOpen ? "0" : "-100%"});
            transition: transform 0.22s ease;
          }
          .dd-sidebar-mobile-header { display: flex !important; }
        }
      `}</style>
    </>
  );
}
