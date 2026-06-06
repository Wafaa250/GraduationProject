import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { updateDoctorProfile } from "@/api/doctorProfileApi";
import { getDoctorMe } from "@/api/meApi";
import { GradientAuthButton } from "@/components/auth/GradientAuthButton";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import { DoctorStackHeader } from "@/components/doctor/ui/DoctorStackHeader";
import { RegTextField } from "@/components/registration/RegTextField";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { ProfileTagInput } from "@/components/student/ProfileTagInput";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { mapDoctorMeToHeaderProfile } from "@/lib/doctorHubMappers";
import { DOCTOR_ROUTES } from "@/lib/doctorRoutes";
import { setItem } from "@/utils/authStorage";

import {
  DOCTOR_ACADEMIC_RANKS,
  DOCTOR_PROJECT_AREAS,
  joinDoctorSkillList,
  splitDoctorSkillList,
} from "@/lib/doctorProfileConstants";

const BIO_MAX = 500;

export default function DoctorEditProfileScreen() {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [faculty, setFaculty] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [university, setUniversity] = useState("");
  const [academicRank, setAcademicRank] = useState("");
  const [bio, setBio] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [officeHours, setOfficeHours] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [technicalSkills, setTechnicalSkills] = useState("");
  const [researchSkills, setResearchSkills] = useState("");
  const [researchInterests, setResearchInterests] = useState<string[]>([]);
  const [preferredProjectAreas, setPreferredProjectAreas] = useState<string[]>([]);

  const applyMe = useCallback((me: Awaited<ReturnType<typeof getDoctorMe>>) => {
    const header = mapDoctorMeToHeaderProfile(me);
    const dp = me.doctorProfile;
    setPhoto(header.profilePhoto);
    setFullName(me.user?.name ?? "");
    setDepartment(dp?.department ?? "");
    setFaculty(dp?.faculty ?? "");
    setSpecialization(dp?.specialization ?? "");
    setUniversity(dp?.university ?? "");
    setAcademicRank(dp?.academicRank ?? "");
    setBio(dp?.bio ?? "");
    setLinkedin(dp?.linkedin ?? "");
    setOfficeHours(dp?.officeHours ?? "");
    setYearsOfExperience(dp?.yearsOfExperience != null ? String(dp.yearsOfExperience) : "");
    setTechnicalSkills(joinDoctorSkillList(dp?.technicalSkills ?? []));
    setResearchSkills(joinDoctorSkillList(dp?.researchSkills ?? []));
    setResearchInterests(dp?.researchInterests ?? []);
    setPreferredProjectAreas(dp?.preferredProjectAreas ?? []);
  }, []);

  useEffect(() => {
    void getDoctorMe()
      .then(applyMe)
      .catch((err) => {
        Alert.alert("Could not load profile", parseApiErrorMessage(err));
        router.back();
      })
      .finally(() => setLoading(false));
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

  const toggleProjectArea = (area: string) => {
    setPreferredProjectAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Full name required", "Please enter your full name.");
      return;
    }
    if (!department.trim()) {
      Alert.alert("Department required", "Please enter your department.");
      return;
    }

    setSaving(true);
    try {
      await updateDoctorProfile({
        fullName: fullName.trim(),
        department: department.trim(),
        faculty: faculty.trim(),
        specialization: specialization.trim(),
        university: university.trim(),
        academicRank: academicRank || undefined,
        bio: bio.trim(),
        linkedin: linkedin.trim() || undefined,
        officeHours: officeHours.trim() || undefined,
        yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : null,
        technicalSkills: splitDoctorSkillList(technicalSkills),
        researchSkills: splitDoctorSkillList(researchSkills),
        researchInterests,
        preferredProjectAreas,
        profilePictureBase64: photo,
      });
      await setItem("name", fullName.trim());
      Alert.alert("Profile saved", "Your changes have been saved.", [
        { text: "OK", onPress: () => router.replace(DOCTOR_ROUTES.profile as Href) },
      ]);
    } catch (err) {
      Alert.alert("Save failed", parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const avatarSize = layout.scale(112);
  const avatarBorder = 4;
  const ringSize = avatarSize + avatarBorder * 2;

  if (loading) {
    return (
      <DoctorScreen edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { fontSize: layout.fontSize.body }]}>Loading profile…</Text>
        </View>
      </DoctorScreen>
    );
  }

  return (
    <DoctorScreen edges={["top"]}>
      <DoctorStackHeader
        title="Edit profile"
        variant="compact"
        fallbackHref={DOCTOR_ROUTES.profile}
        rightSlot={
          <Pressable
            onPress={() => void handleSave()}
            disabled={saving}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Save profile"
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.headerSave, { fontSize: layout.fontSize.button, color: colors.primary }]}>
                Save
              </Text>
            )}
          </Pressable>
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
            paddingBottom: layout.space("xxl") + 88,
            gap: layout.space("lg"),
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Photo hero — Instagram / LinkedIn style */}
          <View style={styles.photoHero}>
            <LinearGradient
              colors={[colors.gradient[0], colors.gradient[1], colors.primarySoft]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.photoBanner, { borderRadius: layout.radius.input }]}
            />

            <View style={styles.avatarSlot}>
              <Pressable
                onPress={() => void pickPhoto()}
                style={({ pressed }) => [styles.photoTap, { opacity: pressed ? 0.92 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
              >
                <View style={[styles.avatarRingWrap, { width: ringSize, height: ringSize }]}>
                  <View
                    style={[
                      styles.avatarRing,
                      {
                        width: ringSize,
                        height: ringSize,
                        borderRadius: ringSize / 2,
                        borderWidth: avatarBorder,
                        borderColor: colors.cardBg,
                        backgroundColor: colors.cardBg,
                      },
                    ]}
                  >
                    <FeedAvatar
                      name={fullName || "Doctor"}
                      size={avatarSize}
                      avatarBase64={photo}
                      roleType="doctor"
                    />
                  </View>
                  <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.cardBg }]}>
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                  </View>
                </View>

                <Text style={[styles.photoLabel, { fontSize: layout.fontSize.button, color: colors.primary }]}>
                  {photo ? "Change photo" : "Add photo"}
                </Text>
                {photo ? (
                  <Pressable
                    onPress={() => setPhoto(null)}
                    hitSlop={8}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.removePhoto, { fontSize: layout.fontSize.footer }]}>Remove photo</Text>
                  </Pressable>
                ) : null}
              </Pressable>
            </View>
          </View>

          <View>
            <Text style={[styles.pageTitle, { fontSize: layout.fontSize.title - 4 }]}>
              Update your profile
            </Text>
            <Text style={[styles.pageSubtitle, { fontSize: layout.fontSize.body, marginTop: layout.space("xs") }]}>
              Help students discover your expertise and supervision focus.
            </Text>
          </View>

          <HubSectionCard
            title="Personal Information"
            description="How students will identify you on SkillSwap."
          >
            <RegTextField
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
            <RegTextField
              label={`Bio (${bio.length}/${BIO_MAX})`}
              value={bio}
              onChangeText={(v) => setBio(v.slice(0, BIO_MAX))}
              multiline
              tall
              placeholder="Share your supervision style, research focus, and what you look for in projects."
            />
          </HubSectionCard>

          <HubSectionCard
            title="Academic Information"
            description="Your faculty affiliation and academic credentials."
          >
            <RegTextField label="Faculty" value={faculty} onChangeText={setFaculty} autoCapitalize="words" />
            <RegTextField
              label="Department"
              value={department}
              onChangeText={setDepartment}
              autoCapitalize="words"
            />
            <RegTextField
              label="Specialization"
              value={specialization}
              onChangeText={setSpecialization}
              autoCapitalize="words"
            />
            <RegTextField label="University" value={university} onChangeText={setUniversity} autoCapitalize="words" />
            <RegTextField
              label="Years of experience"
              value={yearsOfExperience}
              onChangeText={setYearsOfExperience}
              keyboardType="numeric"
            />

            <Text style={[styles.fieldLabel, { fontSize: layout.fontSize.label }]}>Academic rank</Text>
            <View style={[styles.pillWrap, { gap: layout.space("sm") }]}>
              {DOCTOR_ACADEMIC_RANKS.map((rank) => {
                const active = academicRank === rank;
                return (
                  <Pressable
                    key={rank}
                    onPress={() => setAcademicRank(active ? "" : rank)}
                    style={[
                      styles.pill,
                      {
                        borderRadius: layout.radius.input,
                        paddingHorizontal: layout.space("md"),
                        backgroundColor: active ? colors.primary : colors.background,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        {
                          fontSize: layout.fontSize.footer,
                          color: active ? "#FFFFFF" : colors.foreground,
                        },
                      ]}
                    >
                      {rank}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </HubSectionCard>

          <HubSectionCard
            title="Contact & Availability"
            description="How students can reach you outside of SkillSwap messages."
          >
            <RegTextField
              label="Office hours"
              value={officeHours}
              onChangeText={setOfficeHours}
              placeholder="e.g. Sun–Thu 10:00–12:00"
            />
            <RegTextField
              label="LinkedIn"
              value={linkedin}
              onChangeText={setLinkedin}
              placeholder="https://linkedin.com/in/..."
              autoCapitalize="none"
              keyboardType="url"
            />
          </HubSectionCard>

          <HubSectionCard
            title="Expertise & Research"
            description="Skills and interests used for student matching and your public profile."
          >
            <RegTextField
              label="Technical skills"
              value={technicalSkills}
              onChangeText={setTechnicalSkills}
              placeholder="Comma-separated, e.g. Python, Cloud, Databases"
            />
            <RegTextField
              label="Research skills"
              value={researchSkills}
              onChangeText={setResearchSkills}
              placeholder="Comma-separated, e.g. Data Mining, NLP"
            />
            <ProfileTagInput
              label="Research interests"
              placeholder="Add a research interest"
              values={researchInterests}
              onChange={setResearchInterests}
            />

            <Text style={[styles.fieldLabel, { fontSize: layout.fontSize.label, marginTop: layout.space("sm") }]}>
              Preferred project areas
            </Text>
            <View style={[styles.pillWrap, { gap: layout.space("sm"), marginTop: layout.space("sm") }]}>
              {DOCTOR_PROJECT_AREAS.map((area) => {
                const active = preferredProjectAreas.includes(area);
                return (
                  <Pressable
                    key={area}
                    onPress={() => toggleProjectArea(area)}
                    style={[
                      styles.pill,
                      {
                        borderRadius: 999,
                        paddingHorizontal: layout.space("md"),
                        backgroundColor: active ? colors.primary : colors.primarySoft,
                        borderColor: active ? colors.primary : colors.primaryBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        {
                          fontSize: layout.fontSize.footer,
                          color: active ? "#FFFFFF" : colors.foreground,
                        },
                      ]}
                    >
                      {area}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </HubSectionCard>

          <GradientAuthButton label="Save Profile" onPress={() => void handleSave()} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </DoctorScreen>
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
      gap: 12,
    },
    loadingText: {
      color: colors.muted,
      fontWeight: "500",
    },
    headerSave: {
      fontWeight: "800",
    },
    photoHero: {
      alignItems: "center",
      marginBottom: 8,
      width: "100%",
    },
    photoBanner: {
      width: "100%",
      height: 96,
    },
    avatarSlot: {
      alignItems: "center",
      marginTop: -56,
      zIndex: 2,
      width: "100%",
    },
    photoTap: {
      alignItems: "center",
    },
    avatarRingWrap: {
      position: "relative",
    },
    avatarRing: {
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
        },
        android: { elevation: 4 },
        default: {},
      }),
    },
    cameraBadge: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
    },
    photoLabel: {
      marginTop: 12,
      fontWeight: "700",
    },
    removePhoto: {
      marginTop: 6,
      color: colors.muted,
      fontWeight: "600",
    },
    pageTitle: {
      fontWeight: "800",
      color: colors.foreground,
      letterSpacing: -0.5,
    },
    pageSubtitle: {
      color: colors.muted,
      lineHeight: 22,
      fontWeight: "500",
    },
    fieldLabel: {
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 4,
    },
    pillWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    pill: {
      minHeight: 40,
      justifyContent: "center",
      borderWidth: 1,
      paddingVertical: 8,
    },
    pillText: {
      fontWeight: "600",
    },
  });
}
