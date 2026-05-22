import { User, MessageSquare, Bell, Users, Building2, Settings, LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

type QuickItem = {
  icon: LucideIcon;
  label: string;
  hint: string;
  to?: string;
  onClick?: () => void;
};

type DashboardQuickAccessProps = {
  profileCompleteness: number;
  teamMemberCount: number;
  messageUnread?: number;
  notificationUnread?: number;
  onOpenSettings?: () => void;
  onOpenMessages?: () => void;
  onOpenNotifications?: () => void;
};

export function DashboardQuickAccess({
  profileCompleteness,
  teamMemberCount,
  messageUnread = 0,
  notificationUnread = 0,
  onOpenSettings,
  onOpenMessages,
  onOpenNotifications,
}: DashboardQuickAccessProps) {
  const items: QuickItem[] = [
    {
      icon: User,
      label: "My Profile",
      hint: `Completeness ${profileCompleteness}%`,
      to: "/profile",
    },
    {
      icon: MessageSquare,
      label: "Messages",
      hint: messageUnread > 0 ? `${messageUnread} unread` : "Up to date",
      onClick: onOpenMessages,
    },
    {
      icon: Bell,
      label: "Notifications",
      hint: notificationUnread > 0 ? `${notificationUnread} unread` : "Up to date",
      onClick: onOpenNotifications,
    },
    {
      icon: Users,
      label: "My Team",
      hint:
        teamMemberCount > 0
          ? `${teamMemberCount} active member${teamMemberCount === 1 ? "" : "s"}`
          : "No team yet",
      to: "/dashboard",
    },
    {
      icon: Building2,
      label: "Organizations",
      hint: "Browse communities",
      to: "/organizations",
    },
    {
      icon: Settings,
      label: "Settings",
      hint: "Account & privacy",
      onClick: onOpenSettings,
    },
  ];

  return (
    <section className="bg-card border border-border rounded-3xl p-6 shadow-card">
      <h2 className="font-display font-bold text-lg mb-5 text-foreground">Quick access</h2>
      <div className="grid grid-cols-2 gap-3">
        {items.map((it) => {
          const inner = (
            <>
              <div className="size-9 rounded-xl bg-primary-soft text-primary grid place-items-center mb-2.5 group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-all">
                <it.icon className="size-[18px]" />
              </div>
              <div className="text-sm font-semibold leading-tight text-foreground">{it.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{it.hint}</div>
            </>
          );

          const className =
            "group text-left rounded-2xl border border-border bg-background hover:bg-primary-soft/50 hover:border-primary/30 p-3.5 transition-all w-full";

          if (it.to) {
            return (
              <Link key={it.label} to={it.to} className={`${className} no-underline block`}>
                {inner}
              </Link>
            );
          }

          return (
            <button key={it.label} type="button" onClick={it.onClick} className={className}>
              {inner}
            </button>
          );
        })}
      </div>
    </section>
  );
}
