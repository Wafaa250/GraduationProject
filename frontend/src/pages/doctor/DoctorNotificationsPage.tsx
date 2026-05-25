import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  getDoctorNotificationsForActivity,
  getDoctorNotificationsUnreadCount,
  markGraduationNotificationRead,
  type GraduationNotification,
} from "@/api/notificationsApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { DoctorHubPageHeader } from "@/components/doctor/hub/DoctorHubPageHeader";
import { formatDoctorHubRelativeTime } from "@/lib/doctorHubMappers";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function DoctorNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<GraduationNotification[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, count] = await Promise.all([
        getDoctorNotificationsForActivity(50),
        getDoctorNotificationsUnreadCount(),
      ]);
      setItems(rows);
      setUnread(count);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load notifications",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (id: number) => {
    await markGraduationNotificationRead(id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setUnread((c) => Math.max(0, c - 1));
  };

  return (
    <main className="flex-1 bg-gradient-mesh">
      <div className="px-5 lg:px-8 py-5 max-w-2xl mx-auto">
        <DoctorHubPageHeader
          title="Notifications"
          description={unread > 0 ? `${unread} unread` : "You're all caught up"}
        />
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No notifications yet.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-xl border border-border bg-white p-4 text-left shadow-card hover:border-primary/30 transition-smooth",
                    !n.readAt && "border-primary/25 bg-primary/5",
                  )}
                  onClick={() => {
                    if (!n.readAt) void markRead(n.id);
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {n.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDoctorHubRelativeTime(n.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 font-semibold text-foreground">{n.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
