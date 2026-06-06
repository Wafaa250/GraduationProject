import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import { changePassword } from "@/api/authApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getMe } from "@/api/meApi";
import { updateProfile } from "@/api/profileApi";
import {
  getProfileSettings,
  updateProfileSettings,
  type NotificationPreferences,
} from "@/api/profileSettingsApi";
import { GradientAuthButton } from "@/components/auth/GradientAuthButton";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { ThemeModeSelector } from "@/components/student/ThemeModeSelector";
import { RegTextField } from "@/components/registration/RegTextField";
import { StudentWorkspaceScreen } from "@/components/student/StudentWorkspaceScreen";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";
import { setItem } from "@/utils/authStorage";

const AI_PROJECT_INTERESTS = ["AI", "Web", "Mobile", "Data Science", "Research", "UI/UX"] as const;

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  teamInvitations: true,
  newMessages: true,
  supervisorUpdates: true,
  projectUpdates: true,
  courseAnnouncements: true,
};

const NOTIFICATION_ITEMS: {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}[] = [
  { key: "teamInvitations", label: "Team invitations", description: "When someone invites you to join a project team." },
  { key: "newMessages", label: "New messages", description: "Direct messages and conversation replies." },
  { key: "supervisorUpdates", label: "Supervisor updates", description: "Supervision requests and doctor responses." },
  { key: "projectUpdates", label: "Project updates", description: "Changes on projects you own or belong to." },
  { key: "courseAnnouncements", label: "Course announcements", description: "Announcements from your enrolled courses." },
];

export default function SettingsScreen() {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      if (me.notificationPreferences) setNotifications(me.notificationPreferences);
      if (me.aiProjectInterests) setAiInterests(me.aiProjectInterests);

      try {
        const settings = await getProfileSettings();
        setNotifications(settings.notificationPreferences ?? DEFAULT_NOTIFICATIONS);
        setAiInterests(settings.aiProjectInterests ?? []);
      } catch {
        /* settings endpoint optional */
      }
    } catch (err) {
      Alert.alert("Could not load settings", parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      const mime = result.assets[0].mimeType ?? "image/jpeg";
      setPhoto(`data:${mime};base64,${result.assets[0].base64}`);
    }
  };

  const saveAccount = async () => {
    if (!fullName.trim()) {
      Alert.alert("Name required", "Please enter your full name.");
      return;
    }
    setSavingAccount(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        profilePictureBase64: photo,
      });
      await setItem("name", fullName.trim());
      Alert.alert("Saved", "Account settings updated.");
    } catch (err) {
      Alert.alert("Save failed", parseApiErrorMessage(err));
    } finally {
      setSavingAccount(false);
    }
  };

  const savePassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert("Password too short", "New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords do not match", "Confirm password must match the new password.");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Updated", "Your password has been updated.");
    } catch (err) {
      Alert.alert("Update failed", parseApiErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  const saveNotifications = async () => {
    setSavingNotifications(true);
    try {
      await updateProfileSettings({ notificationPreferences: notifications });
      Alert.alert("Saved", "Notification preferences updated.");
    } catch (err) {
      Alert.alert("Save failed", parseApiErrorMessage(err));
    } finally {
      setSavingNotifications(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setAiInterests((prev) =>
      prev.includes(interest) ? prev.filter((x) => x !== interest) : [...prev, interest],
    );
  };

  const saveInterests = async () => {
    setSavingInterests(true);
    try {
      await updateProfileSettings({ aiProjectInterests: aiInterests });
      Alert.alert("Saved", "AI project interests updated.");
    } catch (err) {
      Alert.alert("Save failed", parseApiErrorMessage(err));
    } finally {
      setSavingInterests(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <StudentWorkspaceScreen
      title="Settings"
      subtitle="Account, security, and preferences."
      showBack
      fallbackHref="/feed"
      navTitle="Settings"
    >
      <HubSectionCard title="Account settings" description="Update your name and profile photo.">
        <Pressable onPress={() => void pickPhoto()} style={styles.photoRow}>
          <FeedAvatar name={fullName || "Student"} size={layout.scale(64)} avatarBase64={photo} roleType="student" />
          <Text style={styles.photoLabel}>Change photo</Text>
        </Pressable>
        <RegTextField label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
        <View style={styles.readOnlyField}>
          <Text style={styles.readOnlyLabel}>Email</Text>
          <Text style={styles.readOnlyValue}>{email}</Text>
        </View>
        <GradientAuthButton label="Save account" onPress={() => void saveAccount()} loading={savingAccount} />
      </HubSectionCard>

      <HubSectionCard title="Security" description="Update your password.">
        <RegTextField label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
        <RegTextField label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
        <RegTextField label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
        <Pressable onPress={() => router.push("/forgot-password")} style={styles.forgotLink}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>
        <GradientAuthButton label="Update password" onPress={() => void savePassword()} loading={savingPassword} />
      </HubSectionCard>

      <HubSectionCard title="Appearance" description="Customize how SkillSwap looks on your device.">
        <Text style={[styles.appearanceLabel, { fontSize: layout.fontSize.label }]}>Theme Mode</Text>
        <ThemeModeSelector />
      </HubSectionCard>

      <HubSectionCard title="Notification preferences">
        {NOTIFICATION_ITEMS.map((item) => (
          <View key={item.key} style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.switchLabel}>{item.label}</Text>
              <Text style={styles.switchDescription}>{item.description}</Text>
            </View>
            <Switch
              value={notifications[item.key]}
              onValueChange={(value) => setNotifications((prev) => ({ ...prev, [item.key]: value }))}
              trackColor={{ false: colors.border, true: colors.primarySoft }}
              thumbColor={notifications[item.key] ? colors.primary : "#FFFFFF"}
            />
          </View>
        ))}
        <GradientAuthButton label="Save notifications" onPress={() => void saveNotifications()} loading={savingNotifications} />
      </HubSectionCard>

      <HubSectionCard title="AI preferences" description="Topics you want matched in project recommendations.">
        <View style={styles.interestWrap}>
          {AI_PROJECT_INTERESTS.map((interest) => {
            const selected = aiInterests.includes(interest);
            return (
              <Pressable
                key={interest}
                onPress={() => toggleInterest(interest)}
                style={[
                  styles.interestChip,
                  selected && styles.interestChipSelected,
                  { borderRadius: layout.radius.input },
                ]}
              >
                <Text style={[styles.interestText, selected && styles.interestTextSelected]}>{interest}</Text>
              </Pressable>
            );
          })}
        </View>
        <GradientAuthButton label="Save interests" onPress={() => void saveInterests()} loading={savingInterests} />
      </HubSectionCard>
    </StudentWorkspaceScreen>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    photoRow: {
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    photoLabel: {
      color: colors.primary,
      fontWeight: "600",
    },
    appearanceLabel: {
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 4,
    },
    forgotLink: {
      alignSelf: "flex-start",
      marginBottom: 8,
    },
    forgotText: {
      color: colors.primary,
      fontWeight: "600",
    },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 8,
    },
    switchText: {
      flex: 1,
      minWidth: 0,
    },
    switchLabel: {
      fontWeight: "700",
      color: colors.foreground,
    },
    switchDescription: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 2,
    },
    interestWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    interestChip: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBg,
      paddingHorizontal: 14,
      paddingVertical: 10,
      minHeight: 44,
      justifyContent: "center",
    },
    interestChipSelected: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primaryBorder,
    },
    interestText: {
      color: colors.foreground,
      fontWeight: "600",
    },
    interestTextSelected: {
      color: colors.primary,
    },
    readOnlyField: {
      gap: 6,
      marginBottom: 16,
    },
    readOnlyLabel: {
      color: colors.muted,
      fontWeight: "600",
      fontSize: 14,
    },
    readOnlyValue: {
      color: colors.foreground,
      fontSize: 16,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      backgroundColor: colors.inputBg,
    },
  });
