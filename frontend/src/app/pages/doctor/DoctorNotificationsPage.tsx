import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Loader2 } from "lucide-react";
import {
  fetchDoctorInboxNotifications,
  markAllDoctorInboxNotificationsRead,
  markGraduationNotificationRead,
  ORGANIZATION_EVENT_CATEGORY,
  type GraduationNotificationDto,
} from "../../../api/notificationsApi";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import { useToast } from "../../../context/ToastContext";
import { getNotificationsHubUrl } from "../../../utils/notificationsHubUrl";
import { DoctorHubPageHeader } from "../../components/doctor/hub/DoctorHubPageHeader";
import { DoctorHubEmptyState } from "../../components/doctor/hub/DoctorHubEmptyState";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Alert, AlertDescription } from "../../components/ui/alert";
import {
  formatNotificationTimeSafe,
  getNotificationEventAccent,
  groupLabelForNotification,
  mergeNotificationLists,
  navigateFromDoctorNotification,
  NOTIFICATION_FILTER_GROUPS,
  notificationFilterGroup,
  type NotificationFilterGroup,
} from "../../components/notifications/notificationPresentation";

function DoctorNotificationsInbox() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [items, setItems] = useState<GraduationNotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<NotificationFilterGroup>("all");
  const [markingAll, setMarkingAll] = useState(false);
  const [markingScope, setMarkingScope] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const hubRef = useRef<signalR.HubConnection | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchDoctorInboxNotifications(100);
      setItems(list);
    } catch (e) {
      setError(parseApiErrorMessage(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

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
      if (
        payload.category &&
        payload.category !== "graduation_project" &&
        payload.category !== "course" &&
        payload.category !== ORGANIZATION_EVENT_CATEGORY
      ) {
        return;
      }
      setItems((prev) => mergeNotificationLists(prev, [payload]));
    });

    connection
      .start()
      .catch(() => undefined);

    return () => {
      connection.off("NotificationCreated");
      hubRef.current = null;
      void connection.stop();
    };
  }, []);

  const filtered = useMemo(() => {
    if (scope === "all") return items;
    return items.filter((n) => notificationFilterGroup(n) === scope);
  }, [items, scope]);

  const unreadInView = useMemo(
    () => filtered.filter((n) => !n.readAt).length,
    [filtered],
  );

  const onMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllDoctorInboxNotificationsRead();
      const nowIso = new Date().toISOString();
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? nowIso })));
      showToast("All notifications marked as read", "success");
    } catch (e) {
      showToast(parseApiErrorMessage(e), "error");
    } finally {
      setMarkingAll(false);
    }
  };

  const onMarkScope = async () => {
    if (scope === "all") return;
    const unread = items.filter((n) => !n.readAt && notificationFilterGroup(n) === scope);
    if (unread.length === 0) return;
    setMarkingScope(true);
    try {
      await Promise.all(unread.map((n) => markGraduationNotificationRead(n.id)));
      const nowIso = new Date().toISOString();
      setItems((prev) =>
        prev.map((n) =>
          unread.some((u) => u.id === n.id) ? { ...n, readAt: n.readAt ?? nowIso } : n,
        ),
      );
      showToast(`${NOTIFICATION_FILTER_GROUPS.find((g) => g.id === scope)?.label ?? "Group"} marked as read`, "success");
    } catch (e) {
      showToast(parseApiErrorMessage(e), "error");
    } finally {
      setMarkingScope(false);
    }
  };

  const onMarkOne = async (id: number) => {
    setMarkingId(id);
    try {
      await markGraduationNotificationRead(id);
      const nowIso = new Date().toISOString();
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? nowIso } : n)),
      );
    } catch (e) {
      showToast(parseApiErrorMessage(e), "error");
    } finally {
      setMarkingId(null);
    }
  };

  const onOpen = async (n: GraduationNotificationDto) => {
    if (!n.readAt) {
      try {
        await markGraduationNotificationRead(n.id);
        const nowIso = new Date().toISOString();
        setItems((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, readAt: item.readAt ?? nowIso } : item)),
        );
      } catch {
        /* navigation still proceeds */
      }
    }
    navigateFromDoctorNotification(navigate, n);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <DoctorHubPageHeader
        title="Notifications"
        description="Inbox of supervision, course, team, and graduation project activity."
        actions={
          <div className="flex flex-wrap gap-2">
            {scope !== "all" && unreadInView > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void onMarkScope()}
                disabled={markingScope}
              >
                {markingScope ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Mark group read
              </Button>
            ) : null}
            <Button size="sm" onClick={() => void onMarkAll()} disabled={markingAll}>
              {markingAll ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Mark all read
            </Button>
          </div>
        }
      />

      <Tabs value={scope} onValueChange={(v) => setScope(v as NotificationFilterGroup)}>
        <TabsList className="flex-wrap h-auto">
          {NOTIFICATION_FILTER_GROUPS.map((s) => (
            <TabsTrigger key={s.id} value={s.id}>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading notifications" />
        </div>
      ) : null}

      {!loading && !error && filtered.length === 0 ? (
        <DoctorHubEmptyState
          icon={Bell}
          title="All caught up"
          description="No notifications in this view. New supervision, course, and project updates will appear here."
        />
      ) : null}

      {!loading && !error && filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((n) => {
            const accent = getNotificationEventAccent(n.eventType);
            const Icon = accent.icon;
            const unread = !n.readAt;
            return (
              <Card
                key={n.id}
                className={unread ? "border-primary/40 shadow-sm" : ""}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => void onOpen(n)}
                    className="flex flex-1 items-start gap-3 text-left min-w-0 border-0 bg-transparent p-0 cursor-pointer"
                  >
                    <div
                      className={`h-9 w-9 rounded-lg shrink-0 grid place-items-center ${accent.bgClass}`}
                    >
                      <Icon className={`h-4 w-4 ${accent.iconClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium truncate">{n.title}</div>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {groupLabelForNotification(n)}
                        </Badge>
                        {unread ? (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" aria-hidden />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-muted shrink-0" aria-hidden />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 line-clamp-3">{n.body}</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {formatNotificationTimeSafe(n.createdAt)}
                      </div>
                    </div>
                  </button>
                  {unread ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0"
                      disabled={markingId === n.id}
                      onClick={() => void onMarkOne(n.id)}
                    >
                      {markingId === n.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Mark read"
                      )}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function DoctorNotificationsPage() {
  return <DoctorNotificationsInbox />;
}
