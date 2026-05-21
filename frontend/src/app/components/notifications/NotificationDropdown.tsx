import { useCallback, useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import {
  fetchMergedNotificationsForInbox,
  fetchTotalUnreadNotificationCount,
  markAllNotificationsReadAllCategories,
  markGraduationNotificationRead,
  mergeNotificationRows,
  type GraduationNotificationDto,
} from "../../../api/notificationsApi";
import { useToast } from "../../../context/ToastContext";
import { getNotificationsHubUrl } from "../../../utils/notificationsHubUrl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../ui/utils";
import { NotificationDropdownRow } from "./NotificationDropdownRow";
import { getStudentNotificationPath } from "./notificationNavigation";

type Props = {
  className?: string;
};

export function NotificationDropdown({ className }: Props) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const [items, setItems] = useState<GraduationNotificationDto[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const refreshUnread = useCallback(async () => {
    try {
      const count = await fetchTotalUnreadNotificationCount();
      setUnread(count);
    } catch {
      /* optional badge */
    }
  }, []);

  const loadPanel = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchMergedNotificationsForInbox(30);
      await markAllNotificationsReadAllCategories();
      const nowIso = new Date().toISOString();
      setItems(list.map((n) => ({ ...n, readAt: n.readAt ?? nowIso })));
      setUnread(0);
    } catch (e) {
      setError(parseApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUnread();
    const id = window.setInterval(() => void refreshUnread(), 4_000);
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
      if (!payload || typeof payload.id !== "number") return;

      const evtNorm = String(payload.eventType ?? "").trim().toLowerCase();
      if (
        evtNorm === "supervision_request_accepted" ||
        evtNorm === "supervisor_cancellation_accepted" ||
        evtNorm === "supervision_cancelled_by_doctor"
      ) {
        window.dispatchEvent(new CustomEvent("gradProjectSupervisorChanged"));
      }

      const isOpen = openRef.current;
      const nowIso = new Date().toISOString();
      const normalized = {
        ...payload,
        readAt: isOpen ? (payload.readAt ?? nowIso) : (payload.readAt ?? null),
      };

      setItems((prev) => mergeNotificationRows(prev, [normalized]));
      if (isOpen) {
        void markGraduationNotificationRead(payload.id).catch(() => undefined);
      } else if (!payload.readAt) {
        setUnread((prev) => prev + 1);
        showToast(payload.title, "success");
        void refreshUnread();
      }
    });

    connection
      .start()
      .then(() => refreshUnread())
      .catch(() => undefined);

    return () => {
      connection.off("NotificationCreated");
      void connection.stop();
    };
  }, [refreshUnread, showToast]);

  const onRowClick = (n: GraduationNotificationDto) => {
    setOpen(false);
    navigate(getStudentNotificationPath(n));
  };

  const previewItems = items.slice(0, 12);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void loadPanel();
      }}
    >
      <DropdownMenuTrigger
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-muted",
          className,
        )}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-ai px-1 text-[10px] font-bold text-ai-foreground">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border p-3">
          <p className="font-display font-semibold text-foreground">Notifications</p>
          <Link
            to="/notifications"
            className="text-xs font-medium text-primary"
            onClick={() => setOpen(false)}
          >
            View all
          </Link>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : null}
          {!loading && error ? (
            <p className="p-4 text-sm text-destructive">{error}</p>
          ) : null}
          {!loading && !error && previewItems.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : null}
          {!loading && !error
            ? previewItems.map((n) => (
                <NotificationDropdownRow
                  key={n.id}
                  notification={n}
                  onClick={() => onRowClick(n)}
                />
              ))
            : null}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** @deprecated Use NotificationDropdown */
export const SkillSwapNotificationBell = NotificationDropdown;
