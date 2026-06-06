import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { MobileNavHeader } from "@/components/navigation/MobileNavHeader";
import { STUDENT_ROUTES } from "@/lib/studentRoutes";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getMe } from "@/api/meApi";
import { updateProfile } from "@/api/profileApi";
import { GradientAuthButton } from "@/components/auth/GradientAuthButton";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { RegTextField } from "@/components/registration/RegTextField";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { ProfileTagInput } from "@/components/student/ProfileTagInput";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";
import { setItem } from "@/utils/authStorage";

const BIO_MAX = 280;

const AVAILABILITY_OPTIONS = [
  { value: "weekdays", label: "Weekdays" },
  { value: "weekends", label: "Weekends" },
  { value: "evenings", label: "Evenings" },
  { value: "flexible", label: "Flexible" },
];

function resolveAvailability(value: string | null | undefined): string {
  if (!value) return "flexible";
  return AVAILABILITY_OPTIONS.some((o) => o.value === value) ? value : "flexible";
}

export default function EditProfileScreen() {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [availability, setAvailability] = useState("flexible");
  const [techSkills, setTechSkills] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [portfolio, setPortfolio] = useState("");

  const applyMe = useCallback((data: Awaited<ReturnType<typeof getMe>>) => {
    setFullName(data.name ?? "");
    setBio(data.bio ?? "");
    setLanguages(data.languages ?? []);
    setAvailability(resolveAvailability(data.availability));
    setTechSkills(data.technicalSkills ?? data.majorSkills ?? []);
    setTools(data.tools ?? []);
    setRoles(data.roles ?? data.generalSkills ?? []);
    setLinkedin(data.linkedin ?? "");
    setGithub(data.github ?? "");
    setPortfolio(data.portfolio ?? "");
    setPhoto(profilePhotoUrl(data.profilePictureBase64));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getMe();
        if (!cancelled) applyMe(data);
      } catch (err) {
        if (!cancelled) {
          Alert.alert("Could not load profile", parseApiErrorMessage(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyMe]);

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

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Full name required", "Please enter your full name.");
      return;
    }
    if (bio.length > BIO_MAX) {
      Alert.alert("Bio too long", `Bio must be ${BIO_MAX} characters or fewer.`);
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        bio: bio.trim() || undefined,
        availability,
        languages,
        roles,
        technicalSkills: techSkills,
        tools,
        github: github.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        portfolio: portfolio.trim() || undefined,
        profilePictureBase64: photo,
      });
      await setItem("name", fullName.trim());
      Alert.alert("Profile updated", "Your changes have been saved.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Save failed", parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setSaving(true);
    try {
      const data = await getMe();
      applyMe(data);
      Alert.alert("Changes discarded", "Your edits were not saved.");
    } catch (err) {
      Alert.alert("Could not reload profile", parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const availabilityLabel = useMemo(
    () => AVAILABILITY_OPTIONS.find((o) => o.value === availability)?.label ?? "Flexible",
    [availability],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your profile…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <MobileNavHeader
        title="Edit profile"
        fallbackHref={STUDENT_ROUTES.profile}
        backColor={colors.foreground}
        titleColor={colors.foreground}
        backgroundColor={colors.cardBg}
        borderColor={colors.border}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: layout.space("lg"),
            paddingBottom: layout.space("xxl") + 80,
            gap: layout.space("lg"),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text style={[styles.title, { fontSize: layout.fontSize.title }]}>
            Edit your profile
          </Text>
          <Text style={[styles.subtitle, { fontSize: layout.fontSize.body, marginTop: layout.space("sm") }]}>
            Keep your information up to date so collaborators can find the right match.
          </Text>
        </View>

        <HubSectionCard title="Profile photo">
          <Pressable onPress={() => void pickPhoto()} style={styles.photoRow}>
            <FeedAvatar name={fullName || "Student"} size={layout.scale(88)} avatarBase64={photo} roleType="student" />
            <Text style={styles.photoAction}>{photo ? "Change photo" : "Upload photo"}</Text>
          </Pressable>
          {photo ? (
            <Pressable onPress={() => setPhoto(null)}>
              <Text style={styles.removePhoto}>Remove photo</Text>
            </Pressable>
          ) : null}
        </HubSectionCard>

        <HubSectionCard title="Basic information" description="Tell the community about yourself.">
          <RegTextField label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
          <RegTextField
            label={`Bio / About me (${bio.length}/${BIO_MAX})`}
            value={bio}
            onChangeText={(value) => setBio(value.slice(0, BIO_MAX))}
            multiline
            tall
            placeholder="Share a short intro about your background and interests."
          />
          <ProfileTagInput
            label="Languages"
            placeholder="e.g. English, Spanish"
            values={languages}
            onChange={setLanguages}
          />
        </HubSectionCard>

        <HubSectionCard title="Work style preferences" description="How you collaborate best.">
          <Text style={styles.fieldLabel}>Availability</Text>
          <View style={[styles.optionWrap, { gap: layout.space("sm") }]}>
            {AVAILABILITY_OPTIONS.map((option) => {
              const active = availability === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setAvailability(option.value)}
                  style={[
                    styles.optionChip,
                    { borderRadius: layout.radius.input },
                    active && styles.optionChipActive,
                  ]}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.muted, { marginTop: layout.space("sm") }]}>
            Selected: {availabilityLabel}
          </Text>
        </HubSectionCard>

        <HubSectionCard title="Skills" description="Showcase what you bring to the table.">
          <ProfileTagInput
            label="Technical skills"
            placeholder="e.g. TypeScript, Python"
            values={techSkills}
            onChange={setTechSkills}
          />
          <ProfileTagInput
            label="Tools & technologies"
            placeholder="e.g. Figma, Docker"
            values={tools}
            onChange={setTools}
          />
          <ProfileTagInput
            label="Roles / areas of interest"
            placeholder="e.g. Frontend Engineer"
            values={roles}
            onChange={setRoles}
          />
        </HubSectionCard>

        <HubSectionCard title="Professional links">
          <RegTextField
            label="LinkedIn"
            value={linkedin}
            onChangeText={setLinkedin}
            keyboardType="url"
            autoCapitalize="none"
            placeholder="https://linkedin.com/in/username"
          />
          <RegTextField
            label="GitHub"
            value={github}
            onChangeText={setGithub}
            keyboardType="url"
            autoCapitalize="none"
            placeholder="https://github.com/username"
          />
          <RegTextField
            label="Portfolio website"
            value={portfolio}
            onChangeText={setPortfolio}
            keyboardType="url"
            autoCapitalize="none"
            placeholder="https://yourportfolio.com"
          />
        </HubSectionCard>
      </ScrollView>

      <View style={[styles.footer, { paddingHorizontal: layout.horizontalPadding, paddingBottom: layout.space("md") }]}>
        <Pressable
          style={[styles.cancelBtn, { borderRadius: layout.radius.button, minHeight: layout.touchTarget }]}
          onPress={() => void handleCancel()}
          disabled={saving}
        >
          <Text style={styles.cancelBtnText}>Cancel changes</Text>
        </Pressable>
        <View style={styles.saveWrap}>
          <GradientAuthButton label="Save changes" onPress={() => void handleSave()} loading={saving} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    width: "100%",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: 12,
  },
  loadingText: {
    color: colors.muted,
  },
  title: {
    fontWeight: "800",
    color: colors.foreground,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  backText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  subtitle: {
    color: colors.muted,
    lineHeight: 22,
  },
  photoRow: {
    alignItems: "center",
    gap: 10,
  },
  photoAction: {
    color: colors.primary,
    fontWeight: "600",
  },
  removePhoto: {
    color: "#DC2626",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },
  fieldLabel: {
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: 8,
  },
  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  optionChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  optionChipActive: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
  },
  optionText: {
    color: colors.foreground,
    fontWeight: "600",
    fontSize: 14,
  },
  optionTextActive: {
    color: colors.primary,
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.cardBg,
    paddingTop: 12,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  cancelBtnText: {
    color: colors.foreground,
    fontWeight: "700",
  },
  saveWrap: {
    flex: 1.2,
  },
});
