import { Link } from "react-router-dom";
import { LogOut, Menu, MessageCircle, Settings } from "lucide-react";
import { dash } from "./doctorDashTokens";
import { GradProjectNotificationBell } from "../../../components/notifications/GradProjectNotificationBell";

type Props = {
  doctorName: string;
  initials: string;
  onMenuClick: () => void;
  onLogout: () => void;
};

export function Header({ doctorName, initials, onMenuClick, onLogout }: Props) {
  return (
    <header
      style={{
        flexShrink: 0,
        height: 60,
        padding: "0 16px 0 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        borderBottom: `1px solid ${dash.border}`,
        background: dash.surface,
        fontFamily: dash.font,
        boxShadow: "0 1px 0 rgba(15,23,42,0.04)",
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
          border: "none",
          borderRadius: 10,
          background: dash.bg,
          color: dash.muted,
          cursor: "pointer",
        }}
        className="dd-header-menu-btn"
      >
        <Menu size={20} />
      </button>

      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 700,
            color: dash.subtle,
            letterSpacing: "0.06em",
          }}
        >
          DOCTOR WORKSPACE
        </p>
        <p
          style={{
            margin: "2px 0 0",
            fontSize: 16,
            fontWeight: 800,
            color: dash.text,
            fontFamily: dash.fontDisplay,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {doctorName}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <GradProjectNotificationBell
          theme="doctor"
          bellButtonStyle={{
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            borderRadius: 10,
            background: "transparent",
            color: dash.muted,
            cursor: "pointer",
          }}
        />
        <Link
          to="/messages"
          title="Messages"
          style={{
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 10,
            color: dash.muted,
            transition: "background 0.15s ease",
          }}
          className="dd-header-icon-link"
        >
          <MessageCircle size={18} />
        </Link>
        <Link
          to="/settings"
          title="Settings"
          style={{
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 10,
            color: dash.muted,
            transition: "background 0.15s ease",
          }}
          className="dd-header-icon-link"
        >
          <Settings size={18} />
        </Link>
        <button
          type="button"
          title="Sign out"
          onClick={onLogout}
          style={{
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            borderRadius: 10,
            background: "transparent",
            color: dash.muted,
            cursor: "pointer",
          }}
          className="dd-header-icon-btn"
        >
          <LogOut size={18} />
        </button>
        <Link
          to="/doctor/profile"
          title="Profile"
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg,#6366f1,#a855f7)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {initials}
        </Link>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dd-header-menu-btn { display: flex !important; }
        }
        .dd-header-icon-link:hover, .dd-header-icon-btn:hover {
          background: ${dash.bg} !important;
          color: ${dash.text} !important;
        }
      `}</style>
    </header>
  );
}
