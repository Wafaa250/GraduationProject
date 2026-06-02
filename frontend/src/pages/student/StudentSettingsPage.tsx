import { type ChangeEvent, type ReactNode, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Loader2 } from "lucide-react";
import { changePassword } from "@/api/authApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getMe } from "@/api/meApi";
import {
  getProfileSettings,
  updateProfileSettings,
  type NotificationPreferences,
} from "@/api/profileSettingsApi";
import { updateProfile } from "@/api/profileApi";
import { PasswordField } from "@/components/auth/PasswordField";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "@/hooks/use-toast";
import { PROFILE_AVATAR_FALLBACK_CLASS, profileInitialsFromName } from "@/lib/profileAvatar";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";
import { cn } from "@/components/ui/utils";
import { ROUTES } from "@/routes/paths";
import type { ThemePreference } from "@/lib/theme";
import "@/styles/student-hub.css";
import "@/styles/student-workspace-pages.css";

const AI_PROJECT_INTERESTS = [
  "AI",
  "Web",
  "Mobile",
  "Data Science",
  "Research",
  "UI/UX",
] as const;

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  teamInvitations: true,
  newMessages: true,
  supervisorUpdates: true,
  projectUpdates: true,
  courseAnnouncements: true,
};

const NOTIFICATION_ITEMS: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  { key: "teamInvitations", label: "Team invitations", description: "When someone invites you to join a project team." },
  { key: "newMessages", label: "New messages", description: "Direct messages and conversation replies." },
  { key: "supervisorUpdates", label: "Supervisor updates", description: "Supervision requests and doctor responses." },
  { key: "projectUpdates", label: "Project updates", description: "Changes on projects you own or belong to." },
  { key: "courseAnnouncements", label: "Course announcements", description: "Announcements from your enrolled courses." },
];

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="student-ws-card p-6 text-left">
      <div className="mb-5 text-center">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function StudentSettingsPage() {
  const { themePreference, setThemePreference } = useTheme();

  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [notifications, setNotifications] = useState<NotificationPreferences>(DEFAULT_NOTIFICATIONS);
  const [savingNotifications, setSavingNotifications] = useState(false);

  const [aiInterests, setAiInterests] = useState<string[]>([]);
  const [savingInterests, setSavingInterests] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await getMe();
      setFullName(me.name);
      setEmail(me.email);
      setPhoto(profilePhotoUrl(me.profilePictureBase64));

      if (me.notificationPreferences) {
        setNotifications(me.notificationPreferences);
      }
      if (me.aiProjectInterests) {
        setAiInterests(me.aiProjectInterests);
      }

      try {
        const settings = await getProfileSettings();
        setNotifications(settings.notificationPreferences ?? DEFAULT_NOTIFICATIONS);
        setAiInterests(settings.aiProjectInterests ?? []);
      } catch {
        // Settings endpoint optional if migration pending; /me may still include preferences.
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load settings",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onPhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please choose an image file.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveAccount = async () => {
    if (!fullName.trim()) {
      toast({ title: "Full name required", variant: "destructive" });
      return;
    }
    setSavingAccount(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        profilePictureBase64: photo,
      });
      const me = await getMe();
      setFullName(me.name);
      setEmail(me.email);
      setPhoto(profilePhotoUrl(me.profilePictureBase64));
      localStorage.setItem("name", me.name);
      toast({ title: "Account updated", description: "Your profile details were saved." });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setSavingAccount(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Fill in all password fields", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", description: "New password and confirmation must match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    try {
      const message = await changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password updated", description: message });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Password change failed",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const saveNotifications = async () => {
    setSavingNotifications(true);
    try {
      const updated = await updateProfileSettings({ notificationPreferences: notifications });
      setNotifications(updated.notificationPreferences);
      toast({ title: "Notification preferences saved" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setSavingNotifications(false);
    }
  };

  const saveAiInterests = async () => {
    setSavingInterests(true);
    try {
      const updated = await updateProfileSettings({ aiProjectInterests: aiInterests });
      setAiInterests(updated.aiProjectInterests);
      toast({ title: "Project interests saved", description: "These may improve future recommendations." });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setSavingInterests(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setAiInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  };

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];

  if (loading) {
    return (
      <main className="student-hub flex min-h-[50vh] items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
        <span className="sr-only">Loading settings…</span>
      </main>
    );
  }

  return (
    <main className="student-hub student-settings-page flex min-h-full flex-col items-center p-6 lg:p-8">
      <header className="student-ws-page-header w-full max-w-2xl text-center">
        <div className="flex flex-wrap items-baseline justify-center gap-x-2.5 gap-y-1">
          <h1 className="student-ws-title m-0">Account</h1>
          <h2 className="student-ws-title m-0">Settings</h2>
        </div>
        <p className="student-ws-description mx-auto">
          Manage your account, security, notifications, and preferences.
        </p>
      </header>

      <div className="w-full max-w-2xl space-y-6">
        <SettingsSection
          title="Account settings"
          description="Your name and profile photo are shown across SkillSwap."
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-20 w-20 border border-border">
                {photo ? <AvatarImage src={photo} alt="" /> : null}
                <AvatarFallback
                  className={cn(PROFILE_AVATAR_FALLBACK_CLASS, "text-lg")}
                >
                  {profileInitialsFromName(fullName || "?")}
                </AvatarFallback>
              </Avatar>
              <label className="student-ws-btn-outline cursor-pointer gap-2 px-3 py-1.5 text-xs">
                <Camera className="h-3.5 w-3.5" aria-hidden />
                Change photo
                <input type="file" accept="image/*" className="sr-only" onChange={onPhotoUpload} />
              </label>
            </div>
            <div className="flex flex-1 flex-col gap-4">
              <FieldGroup label="Full name">
                <input
                  className="student-ws-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </FieldGroup>
              <FieldGroup label="Email">
                <input
                  className="student-ws-input opacity-70"
                  value={email}
                  readOnly
                  disabled
                  title="Email cannot be changed here"
                />
                <p className="text-xs text-muted-foreground">Contact support to change your email address.</p>
              </FieldGroup>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="student-ws-btn-primary sm:w-auto sm:min-w-[8rem]"
              disabled={savingAccount}
              onClick={() => void saveAccount()}
            >
              {savingAccount ? "Saving…" : "Save account"}
            </button>
          </div>
        </SettingsSection>

        <SettingsSection title="Security" description="Update your password.">
          <div className="space-y-4">
            <FieldGroup label="Current password">
              <PasswordField
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </FieldGroup>
            <FieldGroup label="New password">
              <PasswordField
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </FieldGroup>
            <FieldGroup label="Confirm new password">
              <PasswordField
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </FieldGroup>
          </div>
          <p className="mt-4 text-sm">
            <Link
              to={ROUTES.forgotPassword}
              state={{ email }}
              className="font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
            <span className="text-muted-foreground">
              {" "}
              — request a reset link if you cannot remember your current password.
            </span>
          </p>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="student-ws-btn-primary sm:w-auto sm:min-w-[8rem]"
              disabled={savingPassword}
              onClick={() => void savePassword()}
            >
              {savingPassword ? "Updating…" : "Update password"}
            </button>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Notification preferences"
          description="Choose what you want to be notified about. Preferences are saved to your profile."
        >
          <ul className="space-y-4">
            {NOTIFICATION_ITEMS.map(({ key, label, description }) => (
              <li key={key} className="flex gap-3">
                <Checkbox
                  id={`notif-${key}`}
                  checked={notifications[key]}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, [key]: checked === true }))
                  }
                />
                <div className="grid gap-0.5 leading-none">
                  <label htmlFor={`notif-${key}`} className="cursor-pointer text-sm font-medium">
                    {label}
                  </label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="student-ws-btn-primary sm:w-auto sm:min-w-[8rem]"
              disabled={savingNotifications}
              onClick={() => void saveNotifications()}
            >
              {savingNotifications ? "Saving…" : "Save notifications"}
            </button>
          </div>
        </SettingsSection>

        <SettingsSection title="Appearance" description="Choose how SkillSwap looks on this device.">
          <div className="flex flex-wrap gap-2">
            {themeOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={cn(
                  "student-ws-pill",
                  themePreference === value && "student-ws-pill--active",
                )}
                onClick={() => setThemePreference(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Theme is stored on this device only and follows your system setting when set to System.
          </p>
        </SettingsSection>

        <SettingsSection
          title="AI preferences"
          description="Project areas you are interested in. These are saved to your student profile."
        >
          <div className="flex flex-wrap gap-2">
            {AI_PROJECT_INTERESTS.map((interest) => {
              const active = aiInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  className={cn("student-ws-pill", active && "student-ws-pill--active")}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="student-ws-btn-primary sm:w-auto sm:min-w-[8rem]"
              disabled={savingInterests}
              onClick={() => void saveAiInterests()}
            >
              {savingInterests ? "Saving…" : "Save interests"}
            </button>
          </div>
        </SettingsSection>
      </div>
    </main>
  );
}
