import { Link } from "react-router-dom";
import { LogOut, Menu, MessageSquare, Settings } from "lucide-react";
import { dash } from "./doctorDashTokens";
import { formatDoctorGreeting } from "./doctorDisplayCopy";
import { GradProjectNotificationBell } from "../../../components/notifications/GradProjectNotificationBell";

type Props = {
  doctorName?: string | null;
  initials: string;
  onMenuClick: () => void;
  onLogout: () => void;
};

export function Header({ doctorName, initials, onMenuClick, onLogout }: Props) {
  const greeting = formatDoctorGreeting(doctorName);
  return (
    <header
      style={{
        flexShrink: 0,
        height: 64,
        padding: "0 20px 0 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        borderBottom: `1px solid ${dash.border}`,
        background: dash.headerBlur,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        fontFamily: dash.font,
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <button
        type="button"
        aria-label="Open menu"
        onClick={onMenuClick}
        className="dd-header-menu-btn"
        style={{
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          border: "none",
          borderRadius: 12,
          background: dash.accentMuted,
          color: dash.accent,
          cursor: "pointer",
        }}
      >
        <Menu size={20} />
      </button>

      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 800,
            color: dash.text,
            fontFamily: dash.fontDisplay,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {greeting}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <GradProjectNotificationBell
          theme="doctor"
          bellButtonStyle={{
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            borderRadius: 12,
            background: "transparent",
            color: dash.muted,
            cursor: "pointer",
          }}
        />
        <Link
          to="/messages"
          title="Collaboration messages"
          className="dd-header-icon-link"
          style={{
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            color: dash.muted,
            transition: "background 0.15s ease",
          }}
        >
          <MessageSquare size={18} />
        </Link>
        <Link
          to="/settings"
          title="Settings"
          className="dd-header-icon-link"
          style={{
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            color: dash.muted,
            transition: "background 0.15s ease",
          }}
        >
          <Settings size={18} />
        </Link>
        <button
          type="button"
          title="Sign out"
          onClick={onLogout}
          className="dd-header-icon-btn"
          style={{
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            borderRadius: 12,
            background: "transparent",
            color: dash.muted,
            cursor: "pointer",
          }}
        >
          <LogOut size={18} />
        </button>
        <Link
          to="/doctor/profile"
          title="Expertise & profile"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: dash.gradientPrimary,
            color: "#fff",
            fontSize: 12,
            fontWeight: 800,
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(124, 58, 237, 0.35)",
          }}
        >
          {initials}
        </Link>
      </div>
    </header>
  );
}
