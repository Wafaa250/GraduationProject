import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  Bookmark,
  Building2,
  ChevronRight,
  Crown,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { CompanyPageHeader } from "@/components/company/PageHeader";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { CompanyCardHeader } from "@/components/company/CompanyCardHeader";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

type SettingsSectionId = "security" | "workspace" | "notifications";

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
    icon: AlertTriangle,
  },
  {
    key: "notifyWorkspaceMemberChanges",
    label: "Workspace Member Changes",
    description: "Notify when members are added to or removed from the workspace.",
    icon: Users,
  },
];

const NAV_ITEMS: {
  id: SettingsSectionId;
  label: string;
  desc: string;
  icon: typeof Shield;
}[] = [
  { id: "security", label: "Security", icon: Shield, desc: "Password & access" },
  { id: "workspace", label: "Workspace", icon: Building2, desc: "Team & members" },
  { id: "notifications", label: "Notifications", icon: Bell, desc: "Alerts & emails" },
];

function SettingsSectionCard({
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
    <section className="cw-card-elevated overflow-hidden">
      <CompanyCardHeader
        icon={Icon}
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={action}
      />
      <div className="cw-card-body">{children}</div>
    </section>
  );
}

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
          className="h-11 rounded-lg border-border/70 bg-background pr-10 focus-visible:ring-accent/40 focus-visible:border-accent transition-all"
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

function WorkspaceStatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  loading,
}: {
  icon: typeof Crown;
  label: string;
  value: string | number;
  sub: string;
  accent?: boolean;
  loading?: boolean;
}) {
  return (
    <div className={cn("cw-settings-stat-card bg-card", accent && "is-accent")}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            accent
              ? "bg-secondary/10 text-secondary"
              : "bg-muted text-primary group-hover:bg-accent/10 group-hover:text-secondary",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3">
        <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
          {loading ? "—" : value}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function NotificationToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  icon: typeof Bell;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="cw-settings-toggle-row">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary shrink-0">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="flex-1 min-w-0">
        <Label className="text-sm font-medium text-foreground cursor-pointer">{title}</Label>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        className="shrink-0 data-[state=checked]:bg-primary"
      />
    </div>
  );
}

export function CompanySettingsPage() {
  const showMembersLink = isCompanyOwner();
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("security");
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

  const visibleNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => item.id !== "workspace" || showMembersLink),
    [showMembersLink],
  );

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

  useEffect(() => {
    if (!showMembersLink && activeSection === "workspace") {
      setActiveSection("security");
    }
  }, [showMembersLink, activeSection]);

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
      <CompanyPageHeader
        title="Company Settings"
        subtitle="Manage workspace security, notifications, and team preferences."
      />

      <div className="grid lg:grid-cols-[260px_1fr] cw-grid-gap">
          <nav className="lg:sticky lg:top-8 h-fit">
            <ul className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <li key={item.id} className="flex-shrink-0 lg:w-full">
                    <button
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      className={cn("cw-settings-nav-btn group", isActive && "is-active")}
                    >
                      <span className="cw-settings-nav-icon">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium">{item.label}</span>
                        <span
                          className={cn(
                            "block text-xs",
                            isActive ? "text-primary/70" : "text-muted-foreground",
                          )}
                        >
                          {item.desc}
                        </span>
                      </span>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 hidden lg:block transition-opacity shrink-0",
                          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60",
                        )}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="cw-settings-panel">
            {activeSection === "security" && (
              <SettingsSectionCard
                icon={Shield}
                eyebrow="Account"
                title="Security"
                description="Protect your workspace with a strong password. We recommend updating it regularly."
              >
                <form onSubmit={onPasswordSubmit} className="space-y-6 max-w-xl">
                  {passwordError ? (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                      {passwordError}
                    </div>
                  ) : null}

                  <PasswordField
                    id="settings-current-password"
                    label="Current password"
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
                      label="New password"
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
                      label="Confirm password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      autoComplete="new-password"
                      minLength={8}
                    />
                  </div>

                  <div className="rounded-xl border border-border/70 bg-muted/40 p-4 flex items-start gap-3">
                    <Lock className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Use at least 8 characters with a mix of letters, numbers, and symbols. Your
                      password is encrypted and never shared.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="h-11 px-6 rounded-lg cw-btn-gradient border-0 shadow-[var(--cw-shadow-card)] hover:shadow-[var(--cw-shadow-elevated)]"
                      disabled={passwordSaving}
                    >
                      {passwordSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        "Save password"
                      )}
                    </Button>
                  </div>
                </form>
              </SettingsSectionCard>
            )}

            {activeSection === "workspace" && showMembersLink && (
              <SettingsSectionCard
                icon={Building2}
                eyebrow="Team"
                title="Workspace"
                description="Manage who can access your company workspace."
                action={
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-xl cw-btn-outline"
                  >
                    <Link to={COMPANY_ROUTES.members}>
                      <Users className="h-4 w-4 mr-2" />
                      Manage members
                    </Link>
                  </Button>
                }
              >
                <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
                  <WorkspaceStatCard
                    icon={Crown}
                    label="Owner"
                    value={workspace?.ownerName ?? "—"}
                    sub="Workspace administrator"
                    accent
                    loading={loading}
                  />
                  <WorkspaceStatCard
                    icon={Users}
                    label="Members"
                    value={workspace?.membersCount ?? 0}
                    sub="Active workspace collaborators"
                    loading={loading}
                  />
                </div>
              </SettingsSectionCard>
            )}

            {activeSection === "notifications" && (
              <SettingsSectionCard
                icon={Bell}
                eyebrow="Alerts"
                title="Notifications"
                description="Choose how and when you'd like to hear from us."
              >
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading preferences…
                  </div>
                ) : notifications ? (
                  <div className="-mx-2">
                    {NOTIFICATION_ITEMS.map((item) => (
                      <NotificationToggleRow
                        key={item.key}
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
              </SettingsSectionCard>
            )}
          </div>
        </div>
    </CompanyPageShell>
  );
}
