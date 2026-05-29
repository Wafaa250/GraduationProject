import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompanyPageHeader } from "@/components/company/PageHeader";
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

const NOTIFICATION_ITEMS: {
  key: keyof CompanyNotificationPreferences;
  label: string;
  description: string;
}[] = [
  {
    key: "notifyAiRecommendations",
    label: "New AI Recommendations",
    description: "Notify workspace members when new AI recommendations become available.",
  },
  {
    key: "notifySavedRecommendationsActivity",
    label: "Saved Recommendations Activity",
    description: "Notify when a workspace member saves a student or team recommendation.",
  },
  {
    key: "notifyRequestStatusUpdates",
    label: "Request Status Updates",
    description: "Notify when a request is paused, reactivated, or closed.",
  },
  {
    key: "notifyWorkspaceMemberChanges",
    label: "Workspace Member Changes",
    description: "Notify when members are added to or removed from the workspace.",
  },
];

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="cw-card-elevated overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        ) : null}
      </div>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

function StatMetric({
  label,
  value,
  loading,
}: {
  label: string;
  value: string | number;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-lg font-semibold truncate mt-1 tabular-nums">
        {loading ? "—" : value}
      </p>
    </div>
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
    <div>
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="relative mt-1">
        <Input
          id={id}
          type={showToggle && show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 rounded-lg pr-9 text-sm"
          required
          autoComplete={autoComplete}
          minLength={minLength}
        />
        {showToggle && onToggleShow ? (
          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={onToggleShow}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function CompanySettingsPage() {
  const showMembersLink = isCompanyOwner();
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
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-4">
      <CompanyPageHeader title="Settings" subtitle="Account, team, and workspace preferences." />

      <SettingsSection title="Account Security" description="Change your account password.">
        <form onSubmit={onPasswordSubmit} className="max-w-sm space-y-3">
          {passwordError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
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

          <div className="pt-1">
            <Button
              type="submit"
              size="sm"
              className="rounded-lg cw-btn-gradient border-0 h-8 px-4 text-xs font-medium"
              disabled={passwordSaving}
            >
              {passwordSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </SettingsSection>

      {showMembersLink ? (
        <SettingsSection
          title="Workspace Members"
          description="Manage who can access your company workspace."
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="grid grid-cols-2 gap-3 flex-1 max-w-xs">
              <StatMetric
                label="Members"
                value={workspace?.membersCount ?? 0}
                loading={loading}
              />
              <StatMetric
                label="Owner"
                value={workspace?.ownerName ?? "—"}
                loading={loading}
              />
            </div>
            <Button asChild size="sm" className="rounded-lg cw-btn-gradient border-0 shrink-0 h-8">
              <Link to={COMPANY_ROUTES.members}>Manage Members</Link>
            </Button>
          </div>
        </SettingsSection>
      ) : null}

      <SettingsSection title="Notifications">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading preferences…
          </div>
        ) : notifications ? (
          <div className="divide-y divide-border/50 -my-1">
            {NOTIFICATION_ITEMS.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <Label
                    htmlFor={`notification-${item.key}`}
                    className="text-sm font-medium text-foreground cursor-pointer"
                  >
                    {item.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-md">
                    {item.description}
                  </p>
                </div>
                <Switch
                  id={`notification-${item.key}`}
                  checked={notifications[item.key]}
                  disabled={savingNotification === item.key}
                  onCheckedChange={(checked) => onNotificationChange(item.key, checked)}
                  className="shrink-0"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Could not load notification preferences.</p>
        )}
      </SettingsSection>
    </div>
  );
}
