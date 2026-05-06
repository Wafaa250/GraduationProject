import React, { useCallback, useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  fetchChatNotifications,
  fetchUnreadChatNotificationCount,
  markAllChatNotificationsRead,
  type GraduationNotificationDto,
} from "../../../api/notificationsApi";
import { getNotificationsHubUrl } from "../../../utils/notificationsHubUrl";

type Props = {
  buttonStyle: React.CSSProperties;
};

export function MessagesNotificationBell({ buttonStyle }: Props) {
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<GraduationNotificationDto[]>([]);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const openRef = useRef(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const refreshUnread = useCallback(async () => {
    try {
      const count = await fetchUnreadChatNotificationCount();
      setUnread(count);
    } catch {
      // ignore count failures for icon-only indicator
    }
  }, []);

  const loadPanel = useCallback(async () => {
    const list = await fetchChatNotifications(20);
    setItems(list);
    await markAllChatNotificationsRead();
    setUnread(0);
  }, []);

  useEffect(() => {
    void refreshUnread();
    const id = window.setInterval(() => void refreshUnread(), 5_000);
    return () => window.clearInterval(id);
  }, [refreshUnread]);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(getNotificationsHubUrl(), {
        accessTokenFactory: () => localStorage.getItem("token") || "",
      })
      .withAutomaticReconnect()
      .build();

    connection.on("NotificationCreated", (payload: GraduationNotificationDto) => {
      if (!payload || payload.category !== "chat") return;
      if (openRef.current) {
        setItems((prev) => [payload, ...prev.filter((x) => x.id !== payload.id)].slice(0, 20));
        return;
      }
      setUnread((prev) => prev + 1);
    });

    connection.start().catch(() => undefined);
    return () => {
      connection.off("NotificationCreated");
      void connection.stop();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (ev: MouseEvent) => {
      if (!wrapRef.current?.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const handleNotificationClick = useCallback(
    (n: GraduationNotificationDto) => {
      setOpen(false);
      if (n.eventType === "section_message" && n.projectId) {
        navigate(`/student/courses/${n.projectId}?tab=chat`);
        return;
      }
      if (n.eventType === "team_message" && n.projectId) {
        navigate(`/student/team/${n.projectId}`);
        return;
      }
      navigate("/messages");
    },
    [navigate],
  );

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        style={{ ...buttonStyle, position: "relative" }}
        aria-label="Messages"
        onClick={() => {
          setOpen((prev) => !prev);
          void loadPanel();
        }}
      >
        <MessageCircle size={17} />
        {unread > 0 ? (
          <span
            className="msg-notify-badge"
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
              boxShadow: "0 8px 18px rgba(239,68,68,0.32)",
            }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          className="msg-notify-panel"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 360,
            maxWidth: "min(360px, calc(100vw - 24px))",
            maxHeight: 430,
            background: "#ffffff",
            border: "1px solid rgba(99,102,241,0.18)",
            borderRadius: 16,
            boxShadow: "0 24px 56px rgba(15,23,42,0.22)",
            zIndex: 2000,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid #e2e8f0",
              background: "linear-gradient(180deg,#eef2ff 0%,#ffffff 85%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Messages</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: unread > 0 ? "#4338ca" : "#64748b",
              }}
            >
              {unread > 0 ? `${unread} new` : "Up to date"}
            </span>
          </div>
          <div style={{ maxHeight: 320, overflowY: "auto" }} className="msg-notify-scroll">
            {items.length === 0 ? (
              <div
                style={{
                  padding: "24px 16px",
                  fontSize: 12,
                  color: "#64748b",
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                No unread message notifications.
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    handleNotificationClick(n);
                  }}
                  className="msg-notify-row"
                  style={{
                    width: "100%",
                    border: "none",
                    borderBottom: "1px solid #e2e8f0",
                    background: "transparent",
                    textAlign: "left",
                    padding: "13px 14px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "background 0.16s ease",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#0f172a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", flexShrink: 0 }}>
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 6, lineHeight: 1.5 }}>{n.body}</div>
                </button>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/messages");
            }}
            style={{
              width: "100%",
              border: "none",
              borderTop: "1px solid #dbeafe",
              background: "linear-gradient(180deg,#f8fafc 0%,#eef2ff 100%)",
              padding: "11px 12px",
              fontSize: 12,
              fontWeight: 800,
              color: "#4338ca",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            className="msg-notify-footer"
          >
            Open messages inbox
          </button>
        </div>
      ) : null}
      <style>{`
        .msg-notify-panel {
          animation: msgNotifyIn 0.18s ease-out;
        }
        .msg-notify-row:hover {
          background: rgba(99,102,241,0.1) !important;
        }
        .msg-notify-footer:hover {
          background: #e0e7ff !important;
        }
        .msg-notify-scroll::-webkit-scrollbar {
          width: 10px;
        }
        .msg-notify-scroll::-webkit-scrollbar-thumb {
          background: rgba(148,163,184,0.5);
          border-radius: 999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        @keyframes msgNotifyIn {
          from { opacity: 0; transform: translateY(6px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
