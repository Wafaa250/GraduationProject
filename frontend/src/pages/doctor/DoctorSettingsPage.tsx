import {
  type ChangeEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Camera, Loader2 } from "lucide-react";
import { changePassword } from "@/api/authApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { updateDoctorProfile } from "@/api/doctorProfileApi";
import {
  getDoctorProfileSettings,
  updateDoctorProfileSettings,
  type DoctorNotificationPreferences,
  type DoctorSupervisionPreferences,
} from "@/api/doctorSettingsApi";
import { getDoctorMe } from "@/api/meApi";
import { PasswordField } from "@/components/auth/PasswordField";
import { DoctorHubPageHeader } from "@/components/doctor/hub/DoctorHubPageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "@/context/ThemeContext";
import type { ThemePreference } from "@/lib/theme";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";
import { cn } from "@/lib/utils";

const DEFAULT_NOTIFICATIONS: DoctorNotificationPreferences = {
  newMessages: true,
  supervisionRequests: true,
  projectRequests: true,
  courseProjectUpdates: true,
  teamFormationUpdates: true,
};

const DEFAULT_SUPERVISION: DoctorSupervisionPreferences = {
  supervisionCapacity: 5,
  availableForSupervision: true,
};

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const NOTIFICATION_ITEMS: {
  key: keyof DoctorNotificationPreferences;
  label: string;
  description: string;
}[] = [
  {
    key: "newMessages",
    label: "Messages",
    description: "Direct messages and conversation replies from students.",
  },
  {
    key: "supervisionRequests",
    label: "Supervision requests",
    description: "When students request you as a graduation project supervisor.",
  },
  {
    key: "projectRequests",
    label: "Project requests",
    description: "Updates on graduation and course project requests.",
  },
  {
    key: "courseProjectUpdates",
    label: "Course project updates",
    description: "Changes on projects in courses you teach.",
  },
  {
    key: "teamFormationUpdates",
    label: "Team formation updates",
    description: "AI matching and manual team formation activity in your courses.",
  },
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="mb-5">
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

function fieldClassName(extra?: string) {
  return cn(
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground",
    "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
    extra,
  );
}

function SaveButton({
  label,
  saving,
  onClick,
}: {
  label: string;
  saving: boolean;
  onClick: () => void;
}) {
  return (
    <div className="mt-6 flex justify-end">
      <button
        type="button"
        disabled={saving}
        onClick={onClick}
        className="inline-flex min-w-[8rem] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary/90 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-smooth hover:opacity-95 disabled:opacity-60"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Saving…
          </>
        ) : (
          label
        )}
      </button>
    </div>
  );
}

export default function DoctorSettingsPage() {
  const { themePreference, setThemePreference } = useTheme();
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);

  const [supervision, setSupervision] = useState<DoctorSupervisionPreferences>(DEFAULT_SUPERVISION);
  const [savingSupervision, setSavingSupervision] = useState(false);

  const [notifications, setNotifications] =
    useState<DoctorNotificationPreferences>(DEFAULT_NOTIFICATIONS);
  const [savingNotifications, setSavingNotifications] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const accountSnapshot = useRef("");

  const markDirty = useCallback(() => setDirty(true), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await getDoctorMe();
      const dp = me.doctorProfile;

      setDisplayName(me.user?.name ?? "");
      setEmail(me.user?.email ?? "");
      setPhoneNumber(dp?.phoneNumber ?? "");
      setPhoto(profilePhotoUrl(dp?.profilePictureBase64 ?? me.user?.profilePictureBase64));

      setSupervision(
        dp?.supervisionPreferences ?? {
          supervisionCapacity: dp?.supervisionCapacity ?? 5,
          availableForSupervision: dp?.availableForSupervision ?? true,
        },
      );

      if (dp?.notificationPreferences) {
        setNotifications(dp.notificationPreferences);
      }

      try {
        const settings = await getDoctorProfileSettings();
        setSupervision(settings.supervisionPreferences ?? DEFAULT_SUPERVISION);
        setNotifications(settings.notificationPreferences ?? DEFAULT_NOTIFICATIONS);
      } catch {
        // Settings endpoint optional if migration pending.
      }

      accountSnapshot.current = JSON.stringify({
        phoneNumber: dp?.phoneNumber ?? "",
        photo: profilePhotoUrl(dp?.profilePictureBase64 ?? me.user?.profilePictureBase64),
      });
      setDirty(false);
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

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const onPhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please choose an image file.",
        variant: "destructive",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result as string);
      markDirty();
    };
    reader.readAsDataURL(file);
  };

  const saveAccount = async () => {
    const accountChanged =
      JSON.stringify({ phoneNumber, photo }) !== accountSnapshot.current;
    const passwordFilled = currentPassword || newPassword || confirmPassword;

    if (!accountChanged && !passwordFilled) {
      toast({ title: "No changes to save", variant: "destructive" });
      return;
    }

    if (passwordFilled) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast({ title: "Fill in all password fields", variant: "destructive" });
        return;
      }
      if (newPassword !== confirmPassword) {
        toast({
          title: "Passwords do not match",
          description: "New password and confirmation must match.",
          variant: "destructive",
        });
        return;
      }
      if (newPassword.length < 8) {
        toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
        return;
      }
    }

    setSavingAccount(true);
    try {
      if (accountChanged) {
        await updateDoctorProfile({
          phoneNumber: phoneNumber.trim(),
          profilePictureBase64: photo,
        });
        const me = await getDoctorMe();
        setPhoneNumber(me.doctorProfile?.phoneNumber ?? phoneNumber);
        setPhoto(profilePhotoUrl(me.doctorProfile?.profilePictureBase64));
        accountSnapshot.current = JSON.stringify({
          phoneNumber: me.doctorProfile?.phoneNumber ?? phoneNumber,
          photo: profilePhotoUrl(me.doctorProfile?.profilePictureBase64),
        });
      }

      if (passwordFilled) {
        const message = await changePassword({
          currentPassword,
          newPassword,
          confirmNewPassword: confirmPassword,
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast({
          title: accountChanged ? "Account settings saved" : "Password updated",
          description: message,
        });
      } else {
        toast({ title: "Account settings saved" });
      }

      setDirty(false);
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

  const saveSupervision = async () => {
    if (supervision.supervisionCapacity < 0) {
      toast({
        title: "Invalid capacity",
        description: "Capacity cannot be negative.",
        variant: "destructive",
      });
      return;
    }
    setSavingSupervision(true);
    try {
      const updated = await updateDoctorProfileSettings({ supervisionPreferences: supervision });
      setSupervision(updated.supervisionPreferences);
      setDirty(false);
      toast({ title: "Supervision preferences saved" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setSavingSupervision(false);
    }
  };

  const saveNotifications = async () => {
    setSavingNotifications(true);
    try {
      const updated = await updateDoctorProfileSettings({ notificationPreferences: notifications });
      setNotifications(updated.notificationPreferences);
      setDirty(false);
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

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <span className="sr-only">Loading settings…</span>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gradient-mesh">
      <div className="px-5 lg:px-8 py-5 max-w-2xl mx-auto pb-10">
        <DoctorHubPageHeader
          title="Settings"
          description="Manage your account, notifications, and supervision preferences."
          showBack={false}
        />

        {dirty ? (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            You have unsaved changes. Save each section before leaving this page.
          </p>
        ) : null}

        <div className="space-y-6">
          <SettingsCard
            title="Account Settings"
            description="Private account details and security."
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex flex-col items-center gap-2">
                <Avatar className="h-20 w-20 border border-border">
                  {photo ? <AvatarImage src={photo} alt="" /> : null}
                  <AvatarFallback className="text-lg font-semibold">
                    {initials(displayName || email || "?")}
                  </AvatarFallback>
                </Avatar>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50">
                  <Camera className="h-3.5 w-3.5" aria-hidden />
                  Change photo
                  <input type="file" accept="image/*" className="sr-only" onChange={onPhotoUpload} />
                </label>
              </div>
              <div className="flex flex-1 flex-col gap-4">
                <FieldGroup label="Email Address">
                  <input
                    className={fieldClassName("opacity-70")}
                    value={email}
                    readOnly
                    disabled
                    title="Email cannot be changed here"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your email address.
                  </p>
                </FieldGroup>
                <FieldGroup label="Phone Number">
                  <input
                    className={fieldClassName()}
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      markDirty();
                    }}
                    autoComplete="tel"
                    placeholder="+970 59 000 0000"
                  />
                </FieldGroup>
              </div>
            </div>

            <div className="mt-6 space-y-4 border-t border-border pt-6">
              <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
              <FieldGroup label="Current Password">
                <PasswordField
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </FieldGroup>
              <FieldGroup label="New Password">
                <PasswordField
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </FieldGroup>
              <FieldGroup label="Confirm Password">
                <PasswordField
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </FieldGroup>
            </div>

            <SaveButton
              label="Save Account Settings"
              saving={savingAccount}
              onClick={() => void saveAccount()}
            />
          </SettingsCard>

          <SettingsCard title="Notification Settings">
            <ul className="space-y-4">
              {NOTIFICATION_ITEMS.map(({ key, label, description }) => (
                <li key={key} className="flex gap-3">
                  <Checkbox
                    id={`doctor-notif-${key}`}
                    checked={notifications[key]}
                    onCheckedChange={(checked) => {
                      markDirty();
                      setNotifications((prev) => ({ ...prev, [key]: checked === true }));
                    }}
                  />
                  <div className="grid gap-0.5 leading-none">
                    <label htmlFor={`doctor-notif-${key}`} className="cursor-pointer text-sm font-medium">
                      {label}
                    </label>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
            <SaveButton
              label="Save Notification Preferences"
              saving={savingNotifications}
              onClick={() => void saveNotifications()}
            />
          </SettingsCard>

          <SettingsCard
            title="Appearance"
            description="Choose how SkillSwap looks on this device."
          >
            <div className="flex flex-wrap gap-2">
              {THEME_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={cn(
                    "rounded-full border border-border px-4 py-1.5 text-sm font-medium transition-smooth",
                    themePreference === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground hover:border-primary/30 hover:text-foreground",
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
          </SettingsCard>

          <SettingsCard
            title="Supervision Settings"
            description="Control how many students you can supervise and whether you accept new requests."
          >
            <div className="space-y-5">
              <FieldGroup label="Maximum Supervision Capacity">
                <input
                  type="number"
                  min={0}
                  max={99}
                  className={fieldClassName("max-w-[8rem]")}
                  value={supervision.supervisionCapacity}
                  onChange={(e) => {
                    markDirty();
                    setSupervision((prev) => ({
                      ...prev,
                      supervisionCapacity: Number(e.target.value) || 0,
                    }));
                  }}
                />
              </FieldGroup>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Available for new supervision requests
                  </p>
                  <p className="text-xs text-muted-foreground">
                    When off, students will not be encouraged to send new requests.
                  </p>
                </div>
                <Switch
                  checked={supervision.availableForSupervision}
                  onCheckedChange={(checked) => {
                    markDirty();
                    setSupervision((prev) => ({ ...prev, availableForSupervision: checked }));
                  }}
                />
              </div>
            </div>
            <SaveButton
              label="Save Supervision Preferences"
              saving={savingSupervision}
              onClick={() => void saveSupervision()}
            />
          </SettingsCard>
        </div>
      </div>
    </main>
  );
}
