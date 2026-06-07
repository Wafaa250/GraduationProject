import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

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
import { DoctorSettingsProfileHeader } from "@/components/doctor/settings/DoctorSettingsProfileHeader";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import { DoctorStackHeader } from "@/components/doctor/ui/DoctorStackHeader";
import {
  SettingsDivider,
  SettingsGroup,
  SettingsSegmentedControl,
  SettingsSwitchRow,
} from "@/components/settings/SettingsUIKit";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import type { ThemeMode } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { mapDoctorMeToHeaderProfile } from "@/lib/doctorHubMappers";
import { DOCTOR_ROUTES } from "@/lib/doctorRoutes";

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

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export default function DoctorSettingsScreen() {
  const layout = useResponsiveLayout();
  const { colors, themeMode, setThemeMode } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [notifications, setNotifications] =
    useState<DoctorNotificationPreferences>(DEFAULT_NOTIFICATIONS);
  const [supervision, setSupervision] = useState<DoctorSupervisionPreferences>(DEFAULT_SUPERVISION);

  const [savingNotifKey, setSavingNotifKey] = useState<keyof DoctorNotificationPreferences | null>(null);
  const [savingSupervisionToggle, setSavingSupervisionToggle] = useState(false);
  const [savingCapacity, setSavingCapacity] = useState(false);

  const accountSnapshot = useRef("");
  const capacitySnapshot = useRef(DEFAULT_SUPERVISION.supervisionCapacity);

  const accountDirty = useMemo(
    () => JSON.stringify({ phoneNumber, photo }) !== accountSnapshot.current,
    [phoneNumber, photo],
  );
  const passwordFilled = Boolean(currentPassword || newPassword || confirmPassword);
  const headerSaveVisible = accountDirty || passwordFilled;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await getDoctorMe();
      const header = mapDoctorMeToHeaderProfile(me);
      const dp = me.doctorProfile;

      setDisplayName(me.user?.name ?? "");
      setEmail(header.email);
      setPhoneNumber(dp?.phoneNumber ?? "");
      setPhoto(header.profilePhoto);

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
        capacitySnapshot.current =
          settings.supervisionPreferences?.supervisionCapacity ?? DEFAULT_SUPERVISION.supervisionCapacity;
      } catch {
        capacitySnapshot.current = dp?.supervisionCapacity ?? DEFAULT_SUPERVISION.supervisionCapacity;
      }

      accountSnapshot.current = JSON.stringify({
        phoneNumber: dp?.phoneNumber ?? "",
        photo: header.profilePhoto,
      });
    } catch (err) {
      Alert.alert("Could not load settings", parseApiErrorMessage(err), [
        { text: "Go back", onPress: () => router.back() },
      ]);
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
    if (!accountDirty && !passwordFilled) {
      Alert.alert("No changes to save");
      return;
    }

    if (passwordFilled) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        Alert.alert("Fill in all password fields");
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert("Passwords do not match", "New password and confirmation must match.");
        return;
      }
      if (newPassword.length < 8) {
        Alert.alert("Password too short", "Use at least 8 characters.");
        return;
      }
    }

    setSavingAccount(true);
    try {
      if (accountDirty) {
        await updateDoctorProfile({
          phoneNumber: phoneNumber.trim(),
          profilePictureBase64: photo,
        });
        const me = await getDoctorMe();
        const header = mapDoctorMeToHeaderProfile(me);
        setPhoneNumber(me.doctorProfile?.phoneNumber ?? phoneNumber);
        setPhoto(header.profilePhoto);
        accountSnapshot.current = JSON.stringify({
          phoneNumber: me.doctorProfile?.phoneNumber ?? phoneNumber,
          photo: header.profilePhoto,
        });
      }

      if (passwordFilled) {
        await changePassword({
          currentPassword,
          newPassword,
          confirmPassword,
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }

      Alert.alert(
        "Saved",
        passwordFilled && accountDirty
          ? "Account settings and password updated."
          : passwordFilled
            ? "Your password has been updated."
            : "Account settings saved.",
      );
    } catch (err) {
      Alert.alert("Save failed", parseApiErrorMessage(err));
    } finally {
      setSavingAccount(false);
    }
  };

  const onNotificationToggle = async (key: keyof DoctorNotificationPreferences, value: boolean) => {
    const previous = notifications;
    const next = { ...notifications, [key]: value };
    setNotifications(next);
    setSavingNotifKey(key);
    try {
      const updated = await updateDoctorProfileSettings({ notificationPreferences: next });
      setNotifications(updated.notificationPreferences);
    } catch (err) {
      setNotifications(previous);
      Alert.alert("Could not update", parseApiErrorMessage(err));
    } finally {
      setSavingNotifKey(null);
    }
  };

  const onSupervisionAvailabilityChange = async (available: boolean) => {
    const previous = supervision;
    const next = { ...supervision, availableForSupervision: available };
    setSupervision(next);
    setSavingSupervisionToggle(true);
    try {
      const updated = await updateDoctorProfileSettings({ supervisionPreferences: next });
      setSupervision(updated.supervisionPreferences);
    } catch (err) {
      setSupervision(previous);
      Alert.alert("Could not update", parseApiErrorMessage(err));
    } finally {
      setSavingSupervisionToggle(false);
    }
  };

  const saveSupervisionCapacity = async () => {
    if (supervision.supervisionCapacity < 0) {
      Alert.alert("Invalid capacity", "Capacity cannot be negative.");
      return;
    }
    if (supervision.supervisionCapacity === capacitySnapshot.current) return;

    setSavingCapacity(true);
    try {
      const updated = await updateDoctorProfileSettings({ supervisionPreferences: supervision });
      setSupervision(updated.supervisionPreferences);
      capacitySnapshot.current = updated.supervisionPreferences.supervisionCapacity;
    } catch (err) {
      Alert.alert("Could not update", parseApiErrorMessage(err));
    } finally {
      setSavingCapacity(false);
    }
  };

  if (loading) {
    return (
      <DoctorScreen edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </DoctorScreen>
    );
  }

  return (
    <DoctorScreen edges={["top"]}>
      <DoctorStackHeader
        title="Settings"
        variant="compact"
        fallbackHref={DOCTOR_ROUTES.profile}
        rightSlot={
          headerSaveVisible ? (
            <Pressable
              onPress={() => void saveAccount()}
              disabled={savingAccount}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Save account settings"
            >
              {savingAccount ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.headerSave, { fontSize: layout.fontSize.button, color: colors.primary }]}>
                  Save
                </Text>
              )}
            </Pressable>
          ) : undefined
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: layout.space("md"),
            paddingBottom: layout.space("xxl") + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <DoctorSettingsProfileHeader
            name={displayName}
            email={email}
            photo={photo}
            onChangePhoto={() => void pickPhoto()}
          />

          <SettingsGroup title="Account">
            <View style={{ paddingHorizontal: layout.space("md"), paddingVertical: layout.space("md") }}>
              <Text style={[styles.fieldLabel, { fontSize: layout.fontSize.body }]}>Phone number</Text>
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="+970 59 000 0000"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                autoComplete="tel"
                style={[
                  styles.fieldInput,
                  {
                    fontSize: layout.fontSize.body,
                    marginTop: layout.space("xs"),
                    borderRadius: layout.radius.input,
                  },
                ]}
              />
            </View>
          </SettingsGroup>

          <SettingsGroup title="Change password">
            <PasswordInputRow
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              autoComplete="current-password"
            />
            <SettingsDivider />
            <PasswordInputRow
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              autoComplete="new-password"
            />
            <SettingsDivider />
            <PasswordInputRow
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoComplete="new-password"
            />
          </SettingsGroup>

          <SettingsGroup title="Notifications">
            {NOTIFICATION_ITEMS.map((item, index) => (
              <View key={item.key}>
                {index > 0 ? <SettingsDivider /> : null}
                <SettingsSwitchRow
                  label={item.label}
                  description={item.description}
                  value={notifications[item.key]}
                  onValueChange={(value) => void onNotificationToggle(item.key, value)}
                  disabled={savingNotifKey === item.key}
                />
              </View>
            ))}
          </SettingsGroup>

          <SettingsGroup
            title="Appearance"
            footer="Theme is stored on this device only and follows your system setting when set to System."
          >
            <SettingsSegmentedControl
              options={THEME_OPTIONS}
              value={themeMode}
              onChange={(mode) => void setThemeMode(mode)}
            />
          </SettingsGroup>

          <SettingsGroup
            title="Supervision"
            footer="Control how many students you can supervise and whether you accept new requests."
          >
            <View style={{ paddingHorizontal: layout.space("md"), paddingVertical: layout.space("md") }}>
              <Text style={[styles.fieldLabel, { fontSize: layout.fontSize.body }]}>
                Maximum supervision capacity
              </Text>
              <View style={styles.capacityRow}>
                <TextInput
                  value={String(supervision.supervisionCapacity)}
                  onChangeText={(text) => {
                    const parsed = text.replace(/\D/g, "");
                    setSupervision((prev) => ({
                      ...prev,
                      supervisionCapacity: parsed === "" ? 0 : Number(parsed),
                    }));
                  }}
                  onBlur={() => void saveSupervisionCapacity()}
                  keyboardType="number-pad"
                  maxLength={2}
                  style={[
                    styles.capacityInput,
                    {
                      fontSize: layout.fontSize.body,
                      borderRadius: layout.radius.input,
                    },
                  ]}
                />
                {savingCapacity ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
                ) : null}
              </View>
            </View>
            <SettingsDivider />
            <SettingsSwitchRow
              label="Available for new supervision requests"
              description="When off, students will not be encouraged to send new requests."
              value={supervision.availableForSupervision}
              onValueChange={(value) => void onSupervisionAvailabilityChange(value)}
              disabled={savingSupervisionToggle}
            />
          </SettingsGroup>
        </ScrollView>
      </KeyboardAvoidingView>
    </DoctorScreen>
  );
}

type PasswordInputRowProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  autoComplete: "current-password" | "new-password";
};

function PasswordInputRow({ label, value, onChangeText, autoComplete }: PasswordInputRowProps) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = createStyles(colors);
  const [visible, setVisible] = useState(false);

  return (
    <View style={{ paddingHorizontal: layout.space("md"), paddingVertical: layout.space("md") }}>
      <Text style={[styles.fieldLabel, { fontSize: layout.fontSize.body }]}>{label}</Text>
      <View style={{ position: "relative", marginTop: layout.space("xs") }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={colors.muted}
          style={[
            styles.fieldInput,
            styles.passwordInput,
            { fontSize: layout.fontSize.body, borderRadius: layout.radius.input },
          ]}
        />
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={8}
          style={styles.eyeButton}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
        >
          <Text style={{ color: colors.muted, fontWeight: "600", fontSize: layout.fontSize.footer }}>
            {visible ? "Hide" : "Show"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    headerSave: {
      fontWeight: "800",
    },
    fieldLabel: {
      color: colors.foreground,
      fontWeight: "600",
    },
    fieldInput: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBg,
      color: colors.foreground,
      paddingHorizontal: 14,
      paddingVertical: 12,
      minHeight: 48,
    },
    passwordInput: {
      paddingRight: 64,
    },
    eyeButton: {
      position: "absolute",
      right: 12,
      top: 0,
      bottom: 0,
      justifyContent: "center",
    },
    capacityRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },
    capacityInput: {
      width: 72,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBg,
      color: colors.foreground,
      paddingHorizontal: 14,
      paddingVertical: 12,
      minHeight: 48,
      textAlign: "center",
      fontWeight: "700",
    },
  });
}
