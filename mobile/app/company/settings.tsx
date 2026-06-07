import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  Bell,
  Bookmark,
  Building2,
  Crown,
  FileText,
  Lock,
  Palette,
  Settings,
  Shield,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { changePassword } from "@/api/authApi";
import {
  getCompanySettings,
  parseApiErrorMessage,
  updateCompanyNotificationPreferences,
  type CompanyNotificationPreferences,
  type CompanyWorkspaceSummary,
} from "@/api/companyApi";
import { CompanyEmptyState } from "@/components/company/home/CompanyEmptyState";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { CompanyNotificationSwitchRow } from "@/components/company/settings/CompanyNotificationSwitchRow";
import { CompanySettingsPasswordField } from "@/components/company/settings/CompanySettingsPasswordField";
import {
  CompanySettingsSection,
  type CompanySettingsSectionId,
} from "@/components/company/settings/CompanySettingsSection";
import { CompanyThemeModeSelector } from "@/components/company/settings/CompanyThemeModeSelector";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { CompanyScreen } from "@/components/company/ui/CompanyScreen";
import { CompanyStackHeader } from "@/components/company/ui/CompanyStackHeader";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { persistAuthSession } from "@/lib/authSession";
import { isCompanyOwner } from "@/lib/companyWorkspace";
import { setStoredCompanyRole } from "@/lib/companyWorkspace";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";

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

export default function CompanySettingsScreen() {
  const colors = useCompanyTheme();
  const insets = useSafeAreaInsets();

  const [accessChecked, setAccessChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<CompanyWorkspaceSummary | null>(null);
  const [notifications, setNotifications] = useState<CompanyNotificationPreferences | null>(null);
  const [expandedSection, setExpandedSection] = useState<CompanySettingsSectionId | null>(null);
  const [savingNotification, setSavingNotification] = useState<
    keyof CompanyNotificationPreferences | null
  >(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getCompanySettings();
      setWorkspace(data.workspace);
      setNotifications(data.notifications);
      setError(null);
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const owner = await isCompanyOwner();
        if (!owner) {
          router.replace(COMPANY_ROUTES.dashboard as Href);
          return;
        }
        if (!cancelled) setAccessChecked(true);
        await load(false);
      })();
      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  const handleSectionToggle = useCallback((id: CompanySettingsSectionId) => {
    setExpandedSection((prev) => (prev === id ? null : id));
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
    } catch (err) {
      setNotifications(previous);
      Alert.alert("Could not save", parseApiErrorMessage(err));
    } finally {
      setSavingNotification(null);
    }
  };

  const onPasswordSubmit = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

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
      await persistAuthSession(result);
      await setStoredCompanyRole(result.companyRole);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Password updated successfully.");
    } catch (err) {
      setPasswordError(parseApiErrorMessage(err) || "Could not update password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!accessChecked || loading) {
    return (
      <CompanyScreen edges={[]}>
        <CompanyStackHeader title="Settings" fallbackHref={COMPANY_ROUTES.workspace} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </CompanyScreen>
    );
  }

  if (error && !workspace && !notifications) {
    return (
      <CompanyScreen edges={[]}>
        <CompanyStackHeader title="Settings" fallbackHref={COMPANY_ROUTES.workspace} />
        <View style={{ padding: HOME_SPACE.lg }}>
          <CompanyEmptyState icon={Settings} message={error} actionLabel="Retry" onAction={() => void load()} />
        </View>
      </CompanyScreen>
    );
  }

  const workspaceSummary = workspace
    ? `${workspace.ownerName} · ${workspace.membersCount} member${workspace.membersCount === 1 ? "" : "s"}`
    : undefined;

  return (
    <CompanyScreen edges={[]}>
      <CompanyStackHeader title="Settings" fallbackHref={COMPANY_ROUTES.workspace} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 56 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: HOME_SPACE.lg,
            paddingBottom: insets.bottom + HOME_SPACE.xl,
            gap: HOME_SPACE.sm,
          }}
        >
          <CompanySettingsSection
            id="workspace"
            title="Workspace"
            summary={workspaceSummary}
            icon={Building2}
            expanded={expandedSection === "workspace"}
            onToggle={handleSectionToggle}
          >
            <View style={{ gap: HOME_SPACE.sm, paddingTop: HOME_SPACE.sm }}>
              <WorkspaceStatRow
                icon={Crown}
                label="Owner"
                value={workspace?.ownerName ?? "—"}
                accent
              />
              <WorkspaceStatRow
                icon={Users}
                label="Workspace members"
                value={String(workspace?.membersCount ?? 0)}
              />
              <Pressable
                onPress={() => router.push(COMPANY_ROUTES.members as Href)}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: HOME_SPACE.xs,
                  minHeight: 44,
                  borderRadius: COMPANY_RADIUS.md,
                  borderWidth: 1,
                  borderColor: colors.accentBorder,
                  backgroundColor: pressed ? colors.accentSoft : colors.cardBg,
                })}
              >
                <Users size={16} color={colors.accent} strokeWidth={2.2} />
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.accent }}>Manage Members</Text>
              </Pressable>
            </View>
          </CompanySettingsSection>

          <CompanySettingsSection
            id="security"
            title="Security"
            summary="Password & access"
            icon={Shield}
            expanded={expandedSection === "security"}
            onToggle={handleSectionToggle}
          >
            <View style={{ paddingTop: HOME_SPACE.sm }}>
              {passwordError ? (
                <View
                  style={{
                    borderRadius: COMPANY_RADIUS.md,
                    borderWidth: 1,
                    borderColor: "#FCA5A5",
                    backgroundColor: "#FEF2F2",
                    paddingHorizontal: HOME_SPACE.md,
                    paddingVertical: HOME_SPACE.sm,
                    marginBottom: HOME_SPACE.md,
                  }}
                >
                  <Text style={{ fontSize: 14, color: "#B91C1C", lineHeight: 20 }}>{passwordError}</Text>
                </View>
              ) : null}
              {passwordSuccess ? (
                <View
                  style={{
                    borderRadius: COMPANY_RADIUS.md,
                    borderWidth: 1,
                    borderColor: colors.successBorder,
                    backgroundColor: colors.successMuted,
                    paddingHorizontal: HOME_SPACE.md,
                    paddingVertical: HOME_SPACE.sm,
                    marginBottom: HOME_SPACE.md,
                  }}
                >
                  <Text style={{ fontSize: 14, color: colors.success, lineHeight: 20 }}>{passwordSuccess}</Text>
                </View>
              ) : null}

              <CompanySettingsPasswordField
                label="Current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoComplete="current-password"
              />
              <CompanySettingsPasswordField
                label="New password"
                value={newPassword}
                onChangeText={setNewPassword}
                autoComplete="new-password"
              />
              <CompanySettingsPasswordField
                label="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={() => void onPasswordSubmit()}
              />

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 10,
                  borderRadius: COMPANY_RADIUS.md,
                  backgroundColor: colors.accentSoft,
                  padding: HOME_SPACE.md,
                  marginBottom: HOME_SPACE.md,
                }}
              >
                <Lock size={16} color={colors.accent} strokeWidth={2.2} style={{ marginTop: 2 }} />
                <Text style={{ flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>
                  Use at least 8 characters with a mix of letters, numbers, and symbols. Your password is encrypted
                  and never shared.
                </Text>
              </View>

              <Pressable
                onPress={() => void onPasswordSubmit()}
                disabled={passwordSaving}
                accessibilityRole="button"
                accessibilityState={{ disabled: passwordSaving }}
                style={({ pressed }) => ({
                  opacity: passwordSaving ? 0.7 : pressed ? 0.92 : 1,
                  borderRadius: COMPANY_RADIUS.md,
                  overflow: "hidden",
                  minHeight: 46,
                })}
              >
                <LinearGradient
                  colors={[...colors.gradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    minHeight: 46,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 8,
                    paddingHorizontal: HOME_SPACE.lg,
                  }}
                >
                  {passwordSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : null}
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>
                    {passwordSaving ? "Saving…" : "Save Changes"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </CompanySettingsSection>

          <CompanySettingsSection
            id="notifications"
            title="Notifications"
            summary="Alerts & updates"
            icon={Bell}
            expanded={expandedSection === "notifications"}
            onToggle={handleSectionToggle}
          >
            <View style={{ paddingTop: HOME_SPACE.xs }}>
              {notifications ? (
                NOTIFICATION_ITEMS.map((item, index) => (
                  <View key={item.key}>
                    <CompanyNotificationSwitchRow
                      icon={item.icon}
                      label={item.label}
                      description={item.description}
                      value={notifications[item.key]}
                      disabled={savingNotification === item.key}
                      saving={savingNotification === item.key}
                      onValueChange={(checked) => void onNotificationChange(item.key, checked)}
                    />
                    {index < NOTIFICATION_ITEMS.length - 1 ? (
                      <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 44 }} />
                    ) : null}
                  </View>
                ))
              ) : (
                <Text style={{ fontSize: 14, color: colors.muted, paddingVertical: HOME_SPACE.sm }}>
                  Could not load notification preferences.
                </Text>
              )}
            </View>
          </CompanySettingsSection>

          <CompanySettingsSection
            id="appearance"
            title="Appearance"
            summary="Light & dark mode"
            icon={Palette}
            expanded={expandedSection === "appearance"}
            onToggle={handleSectionToggle}
          >
            <View style={{ paddingTop: HOME_SPACE.sm }}>
              <CompanyThemeModeSelector />
            </View>
          </CompanySettingsSection>
        </ScrollView>
      </KeyboardAvoidingView>
    </CompanyScreen>
  );
}

function WorkspaceStatRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Crown;
  label: string;
  value: string;
  accent?: boolean;
}) {
  const colors = useCompanyTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: HOME_SPACE.sm,
        borderRadius: COMPANY_RADIUS.md,
        borderWidth: 1,
        borderColor: accent ? colors.accentBorder : colors.border,
        backgroundColor: accent ? colors.accentSoft : colors.surfaceMuted,
        paddingHorizontal: HOME_SPACE.md,
        paddingVertical: HOME_SPACE.sm + 2,
        minHeight: 56,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: COMPANY_RADIUS.sm,
          backgroundColor: accent ? colors.accentMuted : colors.cardBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={16} color={colors.accent} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.muted, letterSpacing: 0.5 }}>
          {label.toUpperCase()}
        </Text>
        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.foreground, marginTop: 2 }} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}
