import { Bell, MessageSquare } from "lucide-react";
import { CourseWorkspaceEmptyState } from "@/components/doctor/course-workspace/CourseWorkspaceEmptyState";
import type { CourseWorkspacePanelProps } from "@/components/doctor/course-workspace/types";
export function CollaborationPanel({ bundle, bundleLoading }: CourseWorkspacePanelProps) {
  if (bundleLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-xl border border-border/60 bg-card shadow-card" />
        ))}
      </div>
    );
  }

  void bundle;
  const notifications: Array<{
    id: number;
    title: string;
    body: string;
    createdAt: string;
    projectId?: number | null;
  }> = [];

  if (notifications.length === 0) {
    return (
      <CourseWorkspaceEmptyState
        icon={MessageSquare}
        title="No recent collaboration activity"
        description="Course and supervision updates appear in the notification bell when students join teams or update projects."
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Recent updates from course and supervised project activity.
      </p>
      <ul className="divide-y divide-border rounded-2xl border border-border/60 bg-card shadow-card">
        {notifications.slice(0, 12).map((item) => (
          <li key={item.id} className="flex gap-3 px-4 py-3.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Bell className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">{item.title}</div>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
              <div className="mt-1 text-[11px] text-muted-foreground/80">
                {formatRelativeTime(item.createdAt)}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
