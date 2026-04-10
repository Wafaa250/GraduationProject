import { Link } from "react-router-dom";
import { LogOut, Menu, Settings } from "lucide-react";
import { dash } from "./doctorDashTokens";

type Props = {
  doctorName: string;
  initials: string;
  onLogout: () => void;
  onMenuClick: () => void;
};

export function DoctorDashboardHeader({ doctorName, initials, onLogout, onMenuClick }: Props) {
  return (
    <header
      style={{
        flexShrink: 0,
        height: 56,
        padding: "0 16px 0 20px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: dash.surface,
        borderBottom: `1px solid ${dash.border}`,
        boxShadow: "0 1px 0 rgba(15,23,42,0.04)",
        fontFamily: dash.font,
      }}
    >
      <button
        type="button"
        aria-label="Open menu"
        onClick={onMenuClick}
        style={{
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          border: `1px solid ${dash.border}`,
          borderRadius: dash.radiusMd,
          background: dash.surface,
          color: dash.muted,
          cursor: "pointer",
        }}
        className="doctor-dash-mobile-menu-btn"
      >
        <Menu size={20} />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg,#6366f1,#a855f7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            justifySelf: "center",
            boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: dash.text, fontFamily: dash.fontDisplay }}>
            Skill<span style={{ color: dash.accent }}>Swap</span>
          </div>
          <div style={{ fontSize: 11, color: dash.subtle, fontWeight: 600, marginTop: 2 }}>
            Doctor workspace
          </div>
        </div>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            marginRight: 8,
            minWidth: 0,
          }}
          className="doctor-dash-header-meta"
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: dash.text,
              maxWidth: 200,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {doctorName}
          </span>
          <span style={{ fontSize: 11, color: dash.subtle }}>Dashboard</span>
        </div>

        <Link
          to="/settings"
          style={{
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: dash.radiusMd,
            color: dash.muted,
            border: `1px solid transparent`,
          }}
        >
          <Settings size={18} />
        </Link>
        <button
          type="button"
          onClick={onLogout}
          style={{
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: dash.radiusMd,
            border: "none",
            background: "transparent",
            color: dash.muted,
            cursor: "pointer",
          }}
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
        <Link
          to="/doctor/profile"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            overflow: "hidden",
            background: "linear-gradient(135deg,#6366f1,#a855f7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 800,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {initials}
        </Link>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .doctor-dash-mobile-menu-btn { display: flex !important; }
          .doctor-dash-header-meta { display: none !important; }
        }
      `}</style>
    </header>
  );
}
