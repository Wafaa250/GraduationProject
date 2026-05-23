import { Link, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  MessageCircle,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { DoctorDashboardSection } from "../doctorDashboardTypes";
import { BrandLogo } from "../../../components/brand/BrandLogo";
import { dash } from "./doctorDashTokens";

type NavCounts = {
  pendingRequests?: number;
};

const PRIMARY: {
  id: DoctorDashboardSection;
  label: string;
  icon: LucideIcon;
  countKey?: keyof NavCounts;
}[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "requests", label: "Supervision Requests", icon: ClipboardList, countKey: "pendingRequests" },
  { id: "projects", label: "Active Supervisions", icon: Users },
];

const SECONDARY: { id: DoctorDashboardSection; label: string; icon: LucideIcon }[] = [
  { id: "courses", label: "Course spaces", icon: BookOpen },
  { id: "deleted", label: "Removed projects", icon: Trash2 },
];

type Props = {
  activeSection: DoctorDashboardSection;
  onSelect: (id: DoctorDashboardSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  navCounts?: NavCounts;
  /** GET /api/me — sidebar profile card */
  doctorName?: string;
  doctorSubtitle?: string;
  initials?: string;
};

function NavButton({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      data-active={active ? "true" : "false"}
      onClick={onClick}
      className={active ? "dd-sidebar-nav-btn dd-sidebar-nav-active" : "dd-sidebar-nav-btn"}
    >
      <Icon size={18} strokeWidth={active ? 2.25 : 2} />
      <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
      {badge != null && badge > 0 ? (
        <span className="dd-sidebar-nav-badge">{badge > 99 ? "99+" : badge}</span>
      ) : null}
    </button>
  );
}

export function Sidebar({
  activeSection,
  onSelect,
  mobileOpen,
  onCloseMobile,
  navCounts,
  doctorName,
  doctorSubtitle,
  initials = "DR",
}: Props) {
  const location = useLocation();
  const messagesActive = location.pathname.startsWith("/messages");

  const nav = (
    <nav
      className="dd-sidebar-nav-scroll"
      style={{ display: "flex", flexDirection: "column", fontFamily: dash.font, flex: 1, minHeight: 0 }}
    >
      <div className="dd-sidebar-brand">
        <BrandLogo to="/doctor-dashboard" size="sm" variant="full" />
        <p style={{ margin: "6px 0 0", fontSize: 10, color: dash.muted, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Doctor workspace
        </p>
      </div>

      <p className="dd-sidebar-group-label">Workspace</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 8px" }}>
        {PRIMARY.map(({ id, label, icon, countKey }) => (
          <NavButton
            key={id}
            active={activeSection === id}
            icon={icon}
            label={label}
            badge={countKey && navCounts ? navCounts[countKey] : undefined}
            onClick={() => {
              onSelect(id);
              onCloseMobile();
            }}
          />
        ))}
      </div>

      <p className="dd-sidebar-group-label" style={{ marginTop: 12 }}>
        Collaboration
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 8px" }}>
        {SECONDARY.map(({ id, label, icon }) => (
          <NavButton
            key={id}
            active={activeSection === id}
            icon={icon}
            label={label}
            onClick={() => {
              onSelect(id);
              onCloseMobile();
            }}
          />
        ))}
        <Link
          to="/messages"
          onClick={onCloseMobile}
          data-active={messagesActive ? "true" : "false"}
          className={
            messagesActive ? "dd-sidebar-nav-btn dd-sidebar-nav-active" : "dd-sidebar-nav-btn"
          }
          style={{ textDecoration: "none" }}
        >
          <MessageCircle size={18} strokeWidth={messagesActive ? 2.25 : 2} />
          <span style={{ flex: 1 }}>Messages</span>
        </Link>
      </div>
    </nav>
  );

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onCloseMobile}
          className="dd-sidebar-overlay"
        />
      ) : null}

      <aside className={`dd-sidebar-aside dd-sidebar-aside-col${mobileOpen ? " dd-sidebar-open" : ""}`}>
        <div className="dd-sidebar-mobile-header">
          <span style={{ fontWeight: 800, fontFamily: dash.fontDisplay }}>Menu</span>
          <button type="button" onClick={onCloseMobile} className="dd-sidebar-close-btn" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {nav}
        {doctorName ? (
          <div className="dd-sidebar-profile">
            <Link to="/doctor/profile" onClick={onCloseMobile} className="dd-sidebar-profile-link">
              <span className="dd-sidebar-profile-avatar">{initials}</span>
              <span className="dd-sidebar-profile-text">
                <span className="dd-sidebar-profile-name">{doctorName}</span>
                {doctorSubtitle ? (
                  <span className="dd-sidebar-profile-sub">{doctorSubtitle}</span>
                ) : null}
              </span>
            </Link>
          </div>
        ) : null}
      </aside>
    </>
  );
}
