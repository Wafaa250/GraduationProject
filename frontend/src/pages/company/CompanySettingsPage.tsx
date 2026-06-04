import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Building2,
  Bell,
  ChevronRight,
  Lock,
  Crown,
  Users,
  Sparkles,
  Bookmark,
  FileText,
  UserPlus,
  Palette,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import type { ThemePreference } from "@/lib/theme";
import toast from "react-hot-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CompanyLuxHero } from "@/components/company/CompanyPremiumUI";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { cwLayout } from "@/lib/companyLayout";
import { COMPANY_ROUTES } from "@/routes/paths";
import { isCompanyOwner } from "@/lib/companyWorkspace";
import { persistAuthSession } from "@/lib/authSession";
import { setStoredCompanyRole } from "@/lib/companyWorkspace";
import {
  changePassword,
  getCompanySettings,
  parseApiErrorMessage,
  updateCompanyNotificationPreferences,
  type CompanyNotificationPreferences,
  type CompanyWorkspaceSummary,
} from "@/api/companyApi";

type SectionId = "security" | "workspace" | "notifications" | "appearance";

const NOTIFICATION_ITEMS: {
  key: keyof CompanyNotificationPreferences;
  label: string;
  description: string;
  icon: typeof Bell;
}[] = [
  {
    key: "notifyAiRecommendations",
    label: "New AI Recommendations",
    description: "Notify workspace members when new AI recommendations become available.",
    icon: Sparkles,
  },
  {
    key: "notifySavedRecommendationsActivity",
    label: "Saved Recommendations Activity",
    description: "Notify when a workspace member saves a student or team recommendation.",
    icon: Bookmark,
  },
  {
    key: "notifyRequestStatusUpdates",
    label: "Request Status Updates",
    description: "Notify when a request is paused, reactivated, or closed.",
    icon: FileText,
  },
  {
    key: "notifyWorkspaceMemberChanges",
    label: "Workspace Member Changes",
    description: "Notify when members are added to or removed from the workspace.",
    icon: UserPlus,
  },
];

function PasswordField({
  id,
  label,
  value,
  onChange,
  showToggle,
  show,
  onToggleShow,
  autoComplete,
  minLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  showToggle?: boolean;
  show?: boolean;
  onToggleShow?: () => void;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={showToggle && show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 rounded-xl border-border/70 bg-background pr-10 text-sm focus-visible:ring-primary/30"
          required
          autoComplete={autoComplete}
          minLength={minLength}
        />
        {showToggle && onToggleShow ? (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={onToggleShow}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SettingsNav({
  items,
  active,
  onSelect,
}: {
  items: { id: SectionId; label: string; icon: typeof Shield; desc: string }[];
  active: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  return (
    <nav className="cw-card-elevated p-2.5 md:p-3">
      <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  "group w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-all border",
                  isActive
                    ? "cw-btn-gradient text-white border-primary/30 shadow-sm"
                    : "text-foreground/80 border-border/70 bg-card hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg transition-colors shrink-0",
                    isActive
                      ? "bg-white/15 text-white"
                      : "bg-muted text-primary group-hover:bg-primary/10",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span
                    className={cn(
                      "block text-xs",
                      isActive ? "text-white/70" : "text-muted-foreground",
                    )}
                  >
                    {item.desc}
                  </span>
                </span>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 transition-all",
                    isActive ? "opacity-100 translate-x-0" : "opacity-40 -translate-x-0.5 group-hover:opacity-70",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SectionCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  icon: typeof Shield;
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="cw-card-elevated overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-6 md:p-8 cw-section-card-header">
        <div className="flex items-start gap-4 min-w-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg cw-kpi-icon shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="cw-page-eyebrow">{eyebrow}</p>
            <h2 className="mt-1 text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-xl leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cwLayout.cardPaddingLg}>{children}</div>
    </section>
  );
}

function WorkspaceStatCard({
  icon: Icon,
  label,
  value,
  loading,
  accent,
}: {
  icon: typeof Crown;
  label: string;
  value: string | number;
  loading?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "group rounded-xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm",
        accent ? "cw-stat-accent-card" : "border-border/70 bg-card",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors shrink-0",
            accent ? "cw-stat-icon" : "bg-muted text-primary group-hover:bg-primary/10",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground tabular-nums truncate">
        {loading ? "—" : value}
      </p>
    </div>
  );
}

function NotificationToggleRow({
  icon: Icon,
  id,
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  icon: typeof Bell;
  id: string;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="cw-toggle-row flex items-start gap-4 px-1 py-5 rounded-lg transition-colors hover:bg-muted/40">
      <span className="cw-toggle-icon flex h-10 w-10 items-center justify-center rounded-lg shrink-0">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="flex-1 min-w-0 pt-0.5">
        <Label htmlFor={id} className="text-sm font-medium text-foreground cursor-pointer">
          {title}
        </Label>
        <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        className="mt-1 shrink-0"
      />
    </div>
  );
}

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function CompanySettingsPage() {
  if (!isCompanyOwner()) {
    return <Navigate to={COMPANY_ROUTES.dashboard} replace />;
  }

  const { themePreference, setThemePreference } = useTheme();
  const showMembersLink = isCompanyOwner();
  const [active, setActive] = useState<SectionId>("security");
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<CompanyNotificationPreferences | null>(null);
  const [workspace, setWorkspace] = useState<CompanyWorkspaceSummary | null>(null);
  const [savingNotification, setSavingNotification] = useState<
    keyof CompanyNotificationPreferences | null
  >(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const navItems = useMemo(() => {
    const items: { id: SectionId; label: string; icon: typeof Shield; desc: string }[] = [];
    if (showMembersLink) {
      items.push({
        id: "workspace",
        label: "Workspace",
        icon: Building2,
        desc: "Team & members",
      });
    }
    items.push({
      id: "security",
      label: "Security",
      icon: Shield,
      desc: "Password & access",
    });
    items.push({
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      desc: "Alerts & updates",
    });
    items.push({
      id: "appearance",
      label: "Appearance",
      icon: Palette,
      desc: "Light & dark mode",
    });
    return items;
  }, [showMembersLink]);

  useEffect(() => {
    if (!navItems.some((item) => item.id === active)) {
      setActive("security");
    }
  }, [active, navItems]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getCompanySettings();
        if (cancelled) return;
        setNotifications(data.notifications);
        setWorkspace(data.workspace);
      } catch (err) {
        if (!cancelled) {
          toast.error(parseApiErrorMessage(err) || "Could not load settings.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const onNotificationChange = async (
    key: keyof CompanyNotificationPreferences,
    checked: boolean,
  ) => {
    if (!notifications) return;

    const previous = notifications;
    const next = { ...notifications, [key]: checked };
    setNotifications(next);
    setSavingNotification(key);

    try {
      const updated = await updateCompanyNotificationPreferences(next);
      setNotifications(updated);
      toast.success("Notification preference saved.");
    } catch (err) {
      setNotifications(previous);
      toast.error(parseApiErrorMessage(err) || "Could not save notification preference.");
    } finally {
      setSavingNotification(null);
    }
  };

  const onPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      persistAuthSession(result);
      setStoredCompanyRole(result.companyRole);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully.");
    } catch (err) {
      setPasswordError(parseApiErrorMessage(err) || "Could not update password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <CompanyPageShell>
      <CompanyLuxHero
        eyebrow="Control center"
        title="Settings"
        description="Security, notifications, appearance, and workspace governance — enterprise-grade control without complexity."
      />

      {/* Layout */}
      <div className="space-y-4 md:space-y-5">
        <SettingsNav items={navItems} active={active} onSelect={setActive} />

        <div className="min-w-0 max-w-5xl">
          {active === "security" && (
            <SectionCard
              icon={Shield}
              eyebrow="Account"
              title="Security"
              description="Protect your workspace with a strong password. We recommend updating it regularly."
            >
              <form onSubmit={onPasswordSubmit} className="space-y-6">
                {passwordError ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {passwordError}
                  </div>
                ) : null}

                <PasswordField
                  id="settings-current-password"
                  label="Current Password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  showToggle
                  show={showCurrent}
                  onToggleShow={() => setShowCurrent((v) => !v)}
                  autoComplete="current-password"
                />

                <div className="grid sm:grid-cols-2 gap-6">
                  <PasswordField
                    id="settings-new-password"
                    label="New Password"
                    value={newPassword}
                    onChange={setNewPassword}
                    showToggle
                    show={showNew}
                    onToggleShow={() => setShowNew((v) => !v)}
                    autoComplete="new-password"
                    minLength={8}
                  />
                  <PasswordField
                    id="settings-confirm-password"
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                    minLength={8}
                  />
                </div>

                <div className="cw-insight-panel p-4 flex items-start gap-3">
                  <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Use at least 8 characters with a mix of letters, numbers, and symbols. Your
                    password is encrypted and never shared.
                  </p>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    className="rounded-xl cw-btn-gradient border-0 h-10 px-5 text-sm font-medium"
                    disabled={passwordSaving}
                  >
                    {passwordSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            </SectionCard>
          )}

          {active === "workspace" && showMembersLink && (
            <SectionCard
              icon={Building2}
              eyebrow="Team"
              title="Workspace"
              description="Overview of workspace ownership and members."
              action={
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl cw-btn-outline-primary transition-colors h-10"
                >
                  <Link to={COMPANY_ROUTES.members}>
                    <Users className="h-4 w-4 mr-2" />
                    Manage Members
                  </Link>
                </Button>
              }
            >
              <div className={cn("grid sm:grid-cols-2", cwLayout.gridDense, "max-w-none")}>
                <WorkspaceStatCard
                  icon={Crown}
                  label="Owner"
                  value={workspace?.ownerName ?? "—"}
                  loading={loading}
                  accent
                />
                <WorkspaceStatCard
                  icon={Users}
                  label="Workspace Members"
                  value={workspace?.membersCount ?? 0}
                  loading={loading}
                />
              </div>
            </SectionCard>
          )}

          {active === "appearance" && (
            <SectionCard
              icon={Palette}
              eyebrow="Display"
              title="Appearance"
              description="Choose how SkillSwap looks on this device."
            >
              <div className="flex flex-wrap gap-2">
                {THEME_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={cn(
                      "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                      themePreference === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                    onClick={() => setThemePreference(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Stored on this device only. &quot;System&quot; follows your OS light/dark setting.
              </p>
              <div className="mt-6 pt-6 border-t border-border/70">
                <p className="text-sm font-medium">Company workspace palette</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Five hiring themes — copper, forest, champagne, terracotta, sage — with live
                  previews.
                </p>
                <Button asChild className="mt-4 rounded-xl cw-btn-gradient gap-2">
                  <Link to={COMPANY_ROUTES.themeShowcase}>
                    <Palette className="h-4 w-4" />
                    Open theme gallery
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </SectionCard>
          )}

          {active === "notifications" && (
            <SectionCard
              icon={Bell}
              eyebrow="Alerts"
              title="Notifications"
              description="Choose which workspace events should trigger notifications."
            >
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading preferences…
                </div>
              ) : notifications ? (
                <div className="divide-y divide-border/70 -mx-1">
                  {NOTIFICATION_ITEMS.map((item) => (
                    <NotificationToggleRow
                      key={item.key}
                      id={`notification-${item.key}`}
                      icon={item.icon}
                      title={item.label}
                      description={item.description}
                      checked={notifications[item.key]}
                      disabled={savingNotification === item.key}
                      onChange={(checked) => onNotificationChange(item.key, checked)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Could not load notification preferences.
                </p>
              )}
            </SectionCard>
          )}
        </div>
      </div>
    </CompanyPageShell>
  );
}
