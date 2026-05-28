import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { doctorHubShowsGlobalSearch } from "@/lib/doctorHubNav";
import { getDoctorNotificationTarget } from "@/lib/doctorNotificationNavigation";
import { formatDoctorHubRelativeTime } from "@/lib/doctorHubMappers";
import { Search, Command, Menu, User, LogOut, ChevronDown, Bell, Loader2 } from "lucide-react";
import { useDoctorHubProfile } from "./DoctorHubProfileContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES, doctorStudentPath } from "@/routes/paths";
import { logout } from "@/utils/authSession";
import { cn } from "@/lib/utils";
import { searchPlatform, type SearchResponse, type SearchStudentHit, type SearchDoctorHit } from "@/api/searchApi";
import { toast } from "@/hooks/use-toast";
import {
  getDoctorNotificationsForActivity,
  getDoctorNotificationsUnreadCount,
  markDoctorNotificationsAllRead,
  markGraduationNotificationRead,
  type GraduationNotification,
} from "@/api/notificationsApi";

export function DoctorHubHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const showGlobalSearch = doctorHubShowsGlobalSearch(pathname);
  const profile = useDoctorHubProfile();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<GraduationNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [searching, setSearching] = useState(false);

  const loadNotifications = useCallback(async (options?: { list?: boolean }) => {
    const loadList = options?.list ?? false;
    if (loadList) setNotificationsLoading(true);
    try {
      const unreadPromise = getDoctorNotificationsUnreadCount();
      const rowsPromise = loadList
        ? getDoctorNotificationsForActivity(30)
        : Promise.resolve(null as GraduationNotification[] | null);
      const [unread, rows] = await Promise.all([unreadPromise, rowsPromise]);
      setNotificationCount(unread);
      if (rows != null) setNotifications(rows);
    } catch {
      setNotificationCount(0);
      if (loadList) setNotifications([]);
    } finally {
      if (loadList) setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications, pathname]);

  useEffect(() => {
    if (notificationsOpen) void loadNotifications({ list: true });
  }, [notificationsOpen, loadNotifications]);

  const handleNotificationClick = (n: GraduationNotification) => {
    const markIfUnread = async () => {
      if (!n.readAt) {
        await markGraduationNotificationRead(n.id);
        setNotifications((prev) =>
          prev.map((row) =>
            row.id === n.id ? { ...row, readAt: new Date().toISOString() } : row,
          ),
        );
        setNotificationCount((count) => Math.max(0, count - 1));
      }
    };

    void markIfUnread().finally(() => {
      const target = getDoctorNotificationTarget(n);
      setNotificationsOpen(false);
      if (target) navigate(target);
    });
  };

  const handleMarkAllRead = async () => {
    if (notificationCount === 0 || markingAllRead) return;
    setMarkingAllRead(true);
    try {
      await markDoctorNotificationsAllRead();
      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((row) => ({ ...row, readAt: row.readAt ?? now })));
      setNotificationCount(0);
    } catch {
      toast({
        variant: "destructive",
        title: "Could not mark notifications read",
      });
    } finally {
      setMarkingAllRead(false);
    }
  };

  useEffect(() => {
    if (!showGlobalSearch) {
      setSearchQuery("");
      setSearchResults(null);
      setSearchOpen(false);
      return;
    }
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults(null);
      setSearchOpen(false);
      return;
    }
    const t = window.setTimeout(() => {
      setSearching(true);
      void searchPlatform(q)
        .then((res) => {
          setSearchResults(res);
          setSearchOpen(true);
        })
        .catch(() => setSearchResults({ students: [], doctors: [] }))
        .finally(() => setSearching(false));
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchQuery, showGlobalSearch]);

  useEffect(() => {
    if (!profileMenuOpen && !notificationsOpen && !searchOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchOpen && searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpen(false);
      }
      if (
        notificationsOpen &&
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setNotificationsOpen(false);
      }
      if (profileMenuOpen && profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [notificationsOpen, profileMenuOpen, searchOpen]);

  const handleLogout = () => {
    setProfileMenuOpen(false);
    setNotificationsOpen(false);
    logout(navigate);
  };

  const handleSearchStudent = (student: SearchStudentHit) => {
    setSearchOpen(false);
    setSearchQuery("");
    navigate(doctorStudentPath(student.id));
  };

  const handleSearchDoctor = (doctor: SearchDoctorHit) => {
    setSearchOpen(false);
    setSearchQuery("");
    if (profile.userId != null && doctor.id === profile.userId) {
      navigate(ROUTES.doctorProfile);
      return;
    }
    toast({
      title: doctor.name,
      description: "Colleague directory lookup only — no public faculty profile page in the doctor hub yet.",
    });
  };

  return (
    <header className="sticky top-0 z-30 glass border-b border-border">
      <div className="px-5 lg:px-8 py-3 flex items-center gap-4 min-h-[60px]">
        <button type="button" className="lg:hidden text-muted-foreground shrink-0" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>

        {showGlobalSearch && (
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-md relative">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search students and faculty…"
                className="w-full h-10 rounded-xl border border-border bg-white/60 pl-9 pr-14 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:bg-white transition-smooth"
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults && setSearchOpen(true)}
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground pointer-events-none">
                <Command className="h-3 w-3" /> K
              </kbd>
            </div>
            {searchOpen && searchResults && (
              <Card className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 shadow-elevated border-border/70 max-h-72 overflow-y-auto">
                <CardContent className="p-2 bg-white">
                  {searching ? (
                    <p className="py-3 text-center text-sm text-muted-foreground">Searching…</p>
                  ) : searchResults.students.length === 0 && searchResults.doctors.length === 0 ? (
                    <p className="py-3 text-center text-sm text-muted-foreground">No results</p>
                  ) : (
                    <>
                      {searchResults.students.length > 0 && (
                        <p className="px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">
                          Students
                        </p>
                      )}
                      {searchResults.students.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => handleSearchStudent(s)}
                        >
                          <span className="font-medium">{s.name}</span>
                          <span className="text-xs text-muted-foreground block">{s.major}</span>
                        </button>
                      ))}
                      {searchResults.doctors.length > 0 && (
                        <p className="px-2 py-1 mt-1 text-[10px] font-semibold uppercase text-muted-foreground">
                          Doctors
                        </p>
                      )}
                      {searchResults.doctors.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => handleSearchDoctor(d)}
                        >
                          <span className="font-medium">{d.name}</span>
                          <span className="text-xs text-muted-foreground block">
                            {d.specialization}
                          </span>
                        </button>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-smooth hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-expanded={notificationsOpen}
              aria-label="Notifications"
              onClick={() => {
                setNotificationsOpen((open) => !open);
                setProfileMenuOpen(false);
              }}
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <Card className="absolute right-0 top-[calc(100%+6px)] z-50 w-[min(100vw-2rem,22rem)] border-border/70 shadow-elevated">
                <CardContent className="flex max-h-96 flex-col p-0 bg-white">
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Notifications
                      {notificationCount > 0 && (
                        <span className="ml-1.5 normal-case text-primary">
                          ({notificationCount} unread)
                        </span>
                      )}
                    </p>
                    {notificationCount > 0 && (
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-primary hover:underline disabled:opacity-50"
                        disabled={markingAllRead}
                        onClick={() => void handleMarkAllRead()}
                      >
                        {markingAllRead ? "Marking…" : "Mark all read"}
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto p-3">
                    {notificationsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No notifications yet.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {notifications.map((n) => {
                          const isUnread = !n.readAt;
                          return (
                            <li key={n.id}>
                              <button
                                type="button"
                                className={cn(
                                  "w-full rounded-lg border p-2.5 text-left text-sm transition-smooth hover:bg-[hsl(var(--accent))]",
                                  isUnread
                                    ? "border-primary/25 bg-primary/5"
                                    : "border-border/60 opacity-80",
                                )}
                                onClick={() => handleNotificationClick(n)}
                              >
                                <div className="flex items-start gap-2">
                                  {isUnread && (
                                    <span
                                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                                      aria-hidden
                                    />
                                  )}
                                  <div className={cn("min-w-0 flex-1", !isUnread && "pl-4")}>
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-medium text-foreground">{n.title}</p>
                                      <span className="shrink-0 text-[10px] text-muted-foreground">
                                        {formatDoctorHubRelativeTime(n.createdAt)}
                                      </span>
                                    </div>
                                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                      {n.body}
                                    </p>
                                    {getDoctorNotificationTarget(n) && (
                                      <p className="mt-1 text-[10px] font-medium text-primary">
                                        Open related page
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
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
                setNotificationsOpen(false);
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
                <CardContent className="p-1 bg-white">
                  <Link
                    to={ROUTES.doctorProfile}
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-smooth hover:bg-[hsl(var(--accent))]"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <User className="h-4 w-4 text-primary/80" aria-hidden />
                    My Profile
                  </Link>
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
