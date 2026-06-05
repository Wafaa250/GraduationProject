import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getDoctorNotificationTarget } from "@/lib/doctorNotificationNavigation";
import { Menu, User, Settings, LogOut, ChevronDown, MessageCircle, Plus } from "lucide-react";
import { useDoctorShareUpdate } from "@/components/doctor/hub/DoctorShareUpdateContext";
import { useDoctorHubProfile } from "./DoctorHubProfileContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/routes/paths";
import { logout } from "@/utils/authSession";
import { cn } from "@/lib/utils";
import { useNotificationsInbox } from "@/hooks/useNotificationsInbox";
import {
  NotificationBellButton,
  NotificationCenterDropdown,
} from "@/components/notifications/NotificationCenter";
import type { GraduationNotification } from "@/api/notificationsApi";

export function DoctorHubHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const profile = useDoctorHubProfile();
  const { openShareUpdate } = useDoctorShareUpdate();
  const isDashboard = pathname === ROUTES.doctorDashboard;
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const inbox = useNotificationsInbox({ role: "doctor", showToasts: true, markAllReadOnOpen: true });
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void inbox.refresh();
  }, [pathname, inbox.refresh]);

  useEffect(() => {
    if (!profileMenuOpen && !inbox.open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (inbox.open && notificationsRef.current && !notificationsRef.current.contains(target)) {
        inbox.setOpen(false);
      }
      if (profileMenuOpen && profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        inbox.setOpen(false);
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [inbox.open, inbox.setOpen, profileMenuOpen]);

  const handleLogout = () => {
    setProfileMenuOpen(false);
    inbox.setOpen(false);
    logout(navigate);
  };

  const onDoctorNotificationClick = (n: GraduationNotification) => {
    const target = getDoctorNotificationTarget(n);
    void inbox.handleNotificationClick(n, () => {
      if (target) navigate(target);
    });
  };

  return (
    <header className="sticky top-0 z-30 glass border-b border-border">
      <div className="px-5 lg:px-8 py-3 flex items-center gap-4 min-h-[60px]">
        <button type="button" className="lg:hidden text-muted-foreground shrink-0" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          {isDashboard ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg"
              aria-label="Share Update"
              title="Share Update"
              onClick={() => {
                inbox.setOpen(false);
                setProfileMenuOpen(false);
                openShareUpdate();
              }}
            >
              <Plus className="h-4 w-4" aria-hidden />
            </Button>
          ) : null}

          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg" asChild>
            <Link
              to={ROUTES.doctorMessages}
              aria-label="Messages"
              onClick={() => {
                inbox.setOpen(false);
                setProfileMenuOpen(false);
              }}
            >
              <MessageCircle className="h-4 w-4" />
            </Link>
          </Button>

          <div ref={notificationsRef} className="relative">
            <NotificationBellButton
              unreadCount={inbox.unreadCount}
              open={inbox.open}
              onToggle={() => {
                inbox.toggleOpen();
                setProfileMenuOpen(false);
              }}
              variant="doctor"
            />
            <NotificationCenterDropdown
              open={inbox.open}
              unreadCount={inbox.unreadCount}
              notifications={inbox.notifications}
              loading={inbox.loading}
              markingAllRead={inbox.markingAllRead}
              onMarkAllRead={() => void inbox.handleMarkAllRead()}
              onNotificationClick={onDoctorNotificationClick}
              getTargetLabel={(n) =>
                getDoctorNotificationTarget(n) ? "Open related page" : null
              }
              variant="doctor"
            />
          </div>

          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
              className={cn(
                "flex items-center gap-2 rounded-md py-1 pl-0.5 pr-1 text-foreground transition-smooth",
                "hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                profileMenuOpen && "text-primary",
              )}
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
              aria-label="Doctor account menu"
              onClick={() => {
                setProfileMenuOpen((open) => !open);
                inbox.setOpen(false);
              }}
            >
              <Avatar className="h-8 w-8 shrink-0">
                {profile.profilePhoto && <AvatarImage src={profile.profilePhoto} alt="" />}
                <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
                  {profile.initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block max-w-[180px] truncate text-sm font-medium leading-none">
                {profile.displayName}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  profileMenuOpen && "rotate-180 text-primary",
                )}
                aria-hidden
              />
            </button>

            {profileMenuOpen && (
              <Card
                className="absolute right-0 top-[calc(100%+6px)] z-50 w-[min(100vw-2rem,13rem)] border-border/70 shadow-elevated overflow-hidden"
                role="menu"
                aria-label="Account"
              >
                <CardContent className="p-1 bg-card">
                  <Link
                    to={ROUTES.doctorProfile}
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-smooth hover:bg-[hsl(var(--accent))]"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <User className="h-4 w-4 text-primary/80" aria-hidden />
                    My Profile
                  </Link>
                  <Link
                    to={ROUTES.doctorSettings}
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-smooth hover:bg-[hsl(var(--accent))]"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4 text-primary/80" aria-hidden />
                    Settings
                  </Link>
                  <div className="my-1 h-px w-full bg-border/60" aria-hidden />
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-smooth hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    Logout
                  </button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
