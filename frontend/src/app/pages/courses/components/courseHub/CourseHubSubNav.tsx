import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { BookOpen, Inbox } from "lucide-react";

import { getTeamInvitations } from "../../../../../api/studentCoursesApi";
import { Badge } from "../../../../components/ui/badge";
import { cn } from "../../../../components/ui/utils";

const items = [
  { to: "/student/courses", label: "My Courses", icon: BookOpen, end: true },
  { to: "/student/team-invitations", label: "Invitations", icon: Inbox, end: false },
] as const;

export function CourseHubSubNav({ className }: { className?: string }) {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getTeamInvitations()
      .then((list) => {
        if (!cancelled) setPending(list.length);
      })
      .catch(() => {
        if (!cancelled) setPending(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <nav
      className={cn(
        "mb-6 flex flex-wrap items-center gap-1 rounded-full border border-border/60 bg-muted/40 p-1",
        className,
      )}
    >
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          className={({ isActive }) =>
            cn(
              "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )
          }
        >
          <it.icon className="h-4 w-4" />
          {it.label}
          {it.to === "/student/team-invitations" && pending > 0 ? (
            <Badge className="ml-0.5 h-5 min-w-5 rounded-full border-0 bg-gradient-primary px-1.5 text-[10px] text-primary-foreground">
              {pending}
            </Badge>
          ) : null}
        </NavLink>
      ))}
    </nav>
  );
}
