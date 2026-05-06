import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import {
  Bell,
  BellRing,
  CheckCircle2,
  Crown,
  FolderPlus,
  GraduationCap,
  PencilLine,
  Trash2,
  UserMinus,
  UserPlus,
  XCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  fetchGraduationNotifications,
  fetchUnreadGraduationNotificationCount,
  markGraduationNotificationRead,
  markAllGraduationNotificationsRead,
  type GraduationNotificationDto,
} from "../../../api/notificationsApi";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import { useToast } from "../../../context/ToastContext";
import { getNotificationsHubUrl } from "../../../utils/notificationsHubUrl";

type Props = {
  /** Outer wrapper (typically `position: relative`); defaults to relatively positioned block. */
  containerStyle?: React.CSSProperties;
  /** Style for the icon button (matches existing nav icon buttons). */
  bellButtonStyle: React.CSSProperties;
  /** Student dashboard: show link to team invitations at the bottom of the panel. */
  showInvitationsLink?: boolean;
  /** Doctor UI uses different surface colors. */
  theme?: "student" | "doctor";
};

function formatTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

function mergeNotifications(
  current: GraduationNotificationDto[],
  incoming: GraduationNotificationDto[],
): GraduationNotificationDto[] {
  const map = new Map<number, GraduationNotificationDto>();
  for (const item of current) map.set(item.id, item);
  for (const item of incoming) {
    const prev = map.get(item.id);
    map.set(item.id, prev ? { ...prev, ...item } : item);
  }

  return [...map.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function getEventAccent(eventType: string): {
  icon: typeof BellRing;
  tint: string;
  bg: string;
} {
  switch (eventType) {
    case "project_created":
      return { icon: FolderPlus, tint: "#0f766e", bg: "rgba(20,184,166,0.14)" };
    case "project_updated":
      return { icon: PencilLine, tint: "#4338ca", bg: "rgba(99,102,241,0.12)" };
    case "project_deleted":
      return { icon: Trash2, tint: "#b91c1c", bg: "rgba(239,68,68,0.12)" };
    case "member_joined":
      return { icon: UserPlus, tint: "#0369a1", bg: "rgba(14,165,233,0.12)" };
    case "member_left":
    case "member_removed_self":
    case "member_removed_team":
      return { icon: UserMinus, tint: "#c2410c", bg: "rgba(249,115,22,0.12)" };
    case "leader_changed_new":
    case "leader_changed_old":
    case "leader_changed_members":
      return { icon: Crown, tint: "#a16207", bg: "rgba(234,179,8,0.14)" };
    case "invitation_received":
      return { icon: UserPlus, tint: "#7c3aed", bg: "rgba(139,92,246,0.14)" };
    case "supervision_request_received":
      return { icon: GraduationCap, tint: "#5b21b6", bg: "rgba(109,40,217,0.14)" };
    case "supervision_request_accepted":
      return { icon: CheckCircle2, tint: "#15803d", bg: "rgba(34,197,94,0.14)" };
    case "supervision_request_rejected":
      return { icon: XCircle, tint: "#b91c1c", bg: "rgba(239,68,68,0.12)" };
    default:
      return { icon: BellRing, tint: "#475569", bg: "rgba(148,163,184,0.16)" };
  }
}

export function GradProjectNotificationBell({
  containerStyle,
  bellButtonStyle,
  showInvitationsLink = false,
  theme = "student",
}: Props) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const hubRef = useRef<signalR.HubConnection | null>(null);
  const openRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<GraduationNotificationDto[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const [badgePulse, setBadgePulse] = useState(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const palette = useMemo(
    () => ({
      panelBg: "#ffffff",
      panelBorder: theme === "doctor" ? "rgba(148,163,184,0.28)" : "rgba(148,163,184,0.24)",
      muted: "#64748b",
      title: "#0f172a",
      body: "#334155",
      headerBg: theme === "doctor" ? "#f8fafc" : "linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)",
      unreadBg: "rgba(99,102,241,0.08)",
      hoverBg: "rgba(15,23,42,0.035)",
      footerBg: "#f8fafc",
    }),
    [theme],
  );

  const refreshUnread = useCallback(async () => {
    try {
      const n = await fetchUnreadGraduationNotificationCount();
      setUnread(n);
      return;
    } catch {
      // fallback: derive unread from latest list when count endpoint is stale/failing
      try {
        const list = await fetchGraduationNotifications(40);
        setItems((prev) => mergeNotifications(prev, list));
        setUnread(list.filter((n) => !n.readAt).length);
      } catch {
        /* ignore fallback errors */
      }
    }
  }, []);

  const loadPanel = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchGraduationNotifications(40);
      await markAllGraduationNotificationsRead();
      const nowIso = new Date().toISOString();
      setItems((prev) => mergeNotifications(prev, list.map((n) => ({ ...n, readAt: n.readAt ?? nowIso }))));
      setUnread(0);
    } catch (e) {
      setError(parseApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUnread();
    const id = window.setInterval(() => {
      void refreshUnread();
    }, 4_000);
    return () => window.clearInterval(id);
  }, [refreshUnread]);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(getNotificationsHubUrl(), {
        accessTokenFactory: () => localStorage.getItem("token") || "",
      })
      .withAutomaticReconnect()
      .build();

    hubRef.current = connection;

    connection.on("NotificationCreated", (payload: GraduationNotificationDto) => {
      if (!payload || typeof payload.id !== "number") return;

      const isOpen = openRef.current;
      const nowIso = new Date().toISOString();
      const normalized = {
        ...payload,
        readAt: isOpen ? payload.readAt ?? nowIso : payload.readAt ?? null,
      };

      setItems((prev) => mergeNotifications(prev, [normalized]));
      if (isOpen) {
        void markGraduationNotificationRead(payload.id).catch(() => undefined);
      } else if (!payload.readAt) {
        setUnread((prev) => prev + 1);
        setBadgePulse(true);
        showToast(payload.title, "success");
        void refreshUnread();
      }
    });

    connection.onreconnecting(() => setLiveConnected(false));
    connection.onreconnected(() => {
      setLiveConnected(true);
      void refreshUnread();
    });
    connection.onclose(() => setLiveConnected(false));

    connection
      .start()
      .then(() => {
        setLiveConnected(true);
        return refreshUnread();
      })
      .catch(() => {
        setLiveConnected(false);
      });

    return () => {
      connection.off("NotificationCreated");
      hubRef.current = null;
      void connection.stop();
    };
  }, [refreshUnread, showToast]);

  useEffect(() => {
    if (!badgePulse) return;
    const id = window.setTimeout(() => setBadgePulse(false), 900);
    return () => window.clearTimeout(id);
  }, [badgePulse]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (ev: MouseEvent) => {
      if (!wrapRef.current?.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) void loadPanel();
      return next;
    });
  };

  const onRowClick = (_n: GraduationNotificationDto) => {
    setOpen(false);
    if (theme === "doctor") {
      navigate("/doctor-dashboard");
      return;
    }
    navigate("/dashboard");
  };

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        ...containerStyle,
      }}
      className="gp-notify-wrap"
    >
      <button
        type="button"
        style={{ ...bellButtonStyle, position: "relative" }}
        onClick={toggle}
        aria-label="Notifications"
        aria-expanded={open}
        className="gp-notify-trigger"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span
            className={badgePulse ? "gp-notify-badge gp-notify-badge-pulse" : "gp-notify-badge"}
            style={{
              position: "absolute",
              top: 3,
              right: 2,
              minWidth: 18,
              height: 18,
              padding: "0 5px",
              borderRadius: 999,
              background: "#ef4444",
              color: "#fff",
              fontSize: 10,
              fontWeight: 800,
              lineHeight: "18px",
              textAlign: "center",
              boxSizing: "border-box",
              boxShadow: "0 8px 18px rgba(239,68,68,0.35)",
            }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Graduation project notifications"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 380,
            maxWidth: "min(380px, calc(100vw - 24px))",
            maxHeight: 460,
            display: "flex",
            flexDirection: "column",
            background: palette.panelBg,
            border: `1px solid ${palette.panelBorder}`,
            borderRadius: 18,
            boxShadow: "0 24px 56px rgba(15,23,42,0.18)",
            zIndex: 2000,
            overflow: "hidden",
          }}
          className="gp-notify-panel"
        >
          <div
            style={{
              padding: "14px 16px 12px",
              borderBottom: `1px solid ${palette.panelBorder}`,
              background: palette.headerBg,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: palette.title }}>Notifications</div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", minHeight: 140 }} className="gp-notify-scroll">
            {loading && (
              <div style={{ padding: 16 }}>
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "36px 1fr",
                      gap: 12,
                      padding: "12px 0",
                      alignItems: "start",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        background: "#e2e8f0",
                        opacity: 0.7,
                      }}
                    />
                    <div>
                      <div style={{ height: 11, borderRadius: 999, background: "#e2e8f0", width: "54%" }} />
                      <div
                        style={{
                          height: 10,
                          borderRadius: 999,
                          background: "#f1f5f9",
                          width: "86%",
                          marginTop: 10,
                        }}
                      />
                      <div
                        style={{
                          height: 10,
                          borderRadius: 999,
                          background: "#f1f5f9",
                          width: "42%",
                          marginTop: 8,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && error && (
              <div style={{ padding: 18, color: "#b91c1c", fontSize: 13, lineHeight: 1.5 }}>
                {error}
              </div>
            )}
            {!loading && !error && items.length === 0 && (
              <div
                style={{
                  padding: "28px 20px 30px",
                  color: palette.muted,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(99,102,241,0.08)",
                    color: "#4f46e5",
                    marginBottom: 12,
                  }}
                >
                  <BellRing size={20} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: palette.title }}>
                  No notifications yet
                </div>
                <div style={{ fontSize: 12, marginTop: 6, maxWidth: 250, lineHeight: 1.5 }}>
                  Project updates, member changes, and leadership events will appear here.
                </div>
              </div>
            )}
            {!loading &&
              !error &&
              items.map((n) => (
                (() => {
                  const accent = getEventAccent(n.eventType);
                  const Icon = accent.icon;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => onRowClick(n)}
                      className="gp-notify-row"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "36px 1fr",
                        gap: 12,
                        width: "100%",
                        textAlign: "left",
                        padding: "14px 16px",
                        border: "none",
                        borderBottom: `1px solid ${palette.panelBorder}`,
                        background: n.readAt ? "transparent" : palette.unreadBg,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "background 0.16s ease, transform 0.16s ease",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          display: "grid",
                          placeItems: "center",
                          background: accent.bg,
                          color: accent.tint,
                          boxShadow: n.readAt ? "none" : "inset 0 0 0 1px rgba(255,255,255,0.36)",
                        }}
                      >
                        <Icon size={17} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 800,
                              color: palette.title,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {n.title}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: palette.muted,
                              flexShrink: 0,
                            }}
                          >
                            {formatTime(n.createdAt)}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: palette.body,
                            lineHeight: 1.55,
                            marginTop: 5,
                            paddingRight: 6,
                          }}
                        >
                          {n.body}
                        </div>
                        {!n.readAt && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#4f46e5",
                              }}
                            />
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5" }}>
                              New
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })()
              ))}
          </div>
          {showInvitationsLink && (
            <div
              style={{
                padding: "10px 14px",
                borderTop: `1px solid ${palette.panelBorder}`,
                background: palette.footerBg,
              }}
            >
              <Link
                to="/invitations"
                onClick={() => setOpen(false)}
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#4f46e5",
                  textDecoration: "none",
                }}
              >
                Team invitations →
              </Link>
            </div>
          )}
        </div>
      )}
      <style>{`
        .gp-notify-panel {
          animation: gpNotifyIn 0.18s ease-out;
        }
        .gp-notify-row:hover {
          background: ${palette.hoverBg} !important;
        }
        .gp-notify-row:active {
          transform: translateY(1px);
        }
        .gp-notify-scroll::-webkit-scrollbar {
          width: 10px;
        }
        .gp-notify-scroll::-webkit-scrollbar-thumb {
          background: rgba(148,163,184,0.5);
          border-radius: 999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .gp-notify-badge-pulse {
          animation: gpNotifyPulse 0.72s ease-out;
        }
        @keyframes gpNotifyIn {
          from { opacity: 0; transform: translateY(6px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes gpNotifyPulse {
          0% { transform: scale(1); }
          35% { transform: scale(1.16); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
