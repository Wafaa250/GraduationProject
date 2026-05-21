import { useCallback, useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { useNavigate } from "react-router-dom";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import {
  fetchMergedNotificationsForInbox,
  markGraduationNotificationRead,
  mergeNotificationRows,
  type GraduationNotificationDto,
} from "../../../api/notificationsApi";
import { useUser } from "../../../context/UserContext";
import { PageHeader } from "../../components/design-system/PageHeader";
import { NotificationCard } from "../../components/notifications/NotificationCard";
import { getStudentNotificationPath } from "../../components/notifications/notificationNavigation";
import { StudentDashboardShell } from "../dashboard/components/StudentDashboardShell";
import { getNotificationsHubUrl } from "../../../utils/notificationsHubUrl";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { profile } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const globalSearchWrapRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<GraduationNotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchMergedNotificationsForInbox(80);
      setItems(list);
    } catch (e) {
      setError(parseApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(getNotificationsHubUrl(), {
        accessTokenFactory: () => localStorage.getItem("token") || "",
      })
      .withAutomaticReconnect()
      .build();

    connection.on("NotificationCreated", (payload: GraduationNotificationDto) => {
      if (!payload || typeof payload.id !== "number") return;
      setItems((prev) => mergeNotificationRows(prev, [payload]));
    });

    connection.start().catch(() => undefined);
    return () => {
      connection.off("NotificationCreated");
      void connection.stop();
    };
  }, []);

  const handleRowClick = async (n: GraduationNotificationDto) => {
    if (!n.readAt) {
      try {
        await markGraduationNotificationRead(n.id);
        setItems((prev) =>
          prev.map((row) =>
            row.id === n.id ? { ...row, readAt: new Date().toISOString() } : row,
          ),
        );
      } catch {
        /* navigate anyway */
      }
    }
    navigate(getStudentNotificationPath(n));
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <StudentDashboardShell
      userName={profile.fullName}
      profilePic={profile.profilePic}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchWrapRef={globalSearchWrapRef}
      globalSearchResults={null}
      globalSearchLoading={false}
      onSelectStudent={(id) => navigate(`/students/${id}`)}
      onSelectDoctor={(id) => navigate(`/doctors/${id}`)}
      onOpenSettings={() => navigate("/edit-profile")}
      onLogout={handleLogout}
    >
      <PageHeader
        eyebrow="Notifications"
        title="What's new on SkillSwap"
        description="Match updates, requests, and supervisor decisions."
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading notifications…</p>
      ) : null}
      {!loading && error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <div className="max-w-3xl rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
          <p className="font-display font-semibold text-foreground">No notifications yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Team invites, supervisor updates, course activity, and messages will show up here.
          </p>
        </div>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <div className="max-w-3xl space-y-3">
          {items.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              onClick={() => void handleRowClick(n)}
            />
          ))}
        </div>
      ) : null}
    </StudentDashboardShell>
  );
}
