import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  getCoursesForDoctorPublic,
  getGraduationProjectsForDoctorPublic,
  getPublicDoctorProfile,
  resolveDoctorUserIdByProfileId,
  type DoctorPublicProjectRow,
  type PublicDoctorCourseRow,
  type PublicDoctorProfileDetail,
} from "@/api/doctorsApi";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getItem } from "@/utils/authStorage";

function pickNumericParam(v: string | string[] | undefined): number | null {
  if (v == null) return null;
  const s = (Array.isArray(v) ? v[0] : v)?.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function initialsOf(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0] ?? ""}${p[p.length - 1][0] ?? ""}`.toUpperCase();
}

function profileImageUri(pic: string | null): string | null {
  if (!pic) return null;
  if (pic.startsWith("data:")) return pic;
  if (/^https?:\/\//i.test(pic)) return pic;
  return resolveApiFileUrl(pic) ?? pic;
}

function linkedinHref(s: string): string {
  const t = s.trim();
  if (!t) return "";
  return t.startsWith("http") ? t : `https://linkedin.com/in/${t}`;
}

async function openExternal(url: string): Promise<void> {
  try {
    if (!url) return;
    const ok = await Linking.canOpenURL(url);
    if (!ok) {
      Alert.alert("Link", "Cannot open this link on this device.");
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert("Link", "Could not open this link.");
  }
}

function assertNonNull<T>(v: T | null | undefined): asserts v is T {
  if (v == null) throw new Error("Expected profile to be loaded.");
}

export default function DoctorPublicProfilePage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { horizontalPadding, maxDashboardWidth, isTablet } = useResponsiveLayout();
  const { doctorId: doctorIdParam, profileId: profileIdParam } = useLocalSearchParams<{
    doctorId?: string | string[];
    profileId?: string | string[];
  }>();

  const doctorUserIdArg = pickNumericParam(doctorIdParam);
  const profileIdArg = pickNumericParam(profileIdParam);

  const [resolvedUserId, setResolvedUserId] = useState<number | null>(null);
  const [resolving, setResolving] = useState(true);
  const [profile, setProfile] = useState<PublicDoctorProfileDetail | null>(null);
  const [courses, setCourses] = useState<PublicDoctorCourseRow[]>([]);
  const [projects, setProjects] = useState<DoctorPublicProjectRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pad = horizontalPadding;
  const colMax = maxDashboardWidth;

  const goHome = useCallback(async () => {
    const role = ((await getItem("role")) ?? "").toString().trim().toLowerCase();
    router.replace((role === "doctor" ? "/doctor-dashboard" : "/dashboard") as Href);
  }, [router]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else void goHome();
  }, [goHome, router]);

  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      setResolving(true);
      setError(null);
      try {
        if (doctorUserIdArg != null) {
          if (!cancelled) setResolvedUserId(doctorUserIdArg);
          return;
        }
        if (profileIdArg != null) {
          const uid = await resolveDoctorUserIdByProfileId(profileIdArg);
          if (cancelled) return;
          if (uid == null) {
            setError("Could not resolve this doctor. Sign in and try again, or open the profile on the web app.");
            setResolvedUserId(null);
            return;
          }
          setResolvedUserId(uid);
          return;
        }
        setError("Missing doctor id.");
        setResolvedUserId(null);
      } finally {
        if (!cancelled) setResolving(false);
      }
    };
    void resolve();
    return () => {
      cancelled = true;
    };
  }, [doctorUserIdArg, profileIdArg]);

  useEffect(() => {
    if (resolvedUserId == null || resolvedUserId <= 0) {
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const doc = await getPublicDoctorProfile(resolvedUserId);
        if (cancelled) return;
        setProfile(doc);
        const [cRows, pRows] = await Promise.all([
          getCoursesForDoctorPublic(doc.profileId),
          getGraduationProjectsForDoctorPublic(doc.userId),
        ]);
        if (!cancelled) {
          setCourses(cRows);
          setProjects(pRows);
        }
      } catch (e) {
        if (!cancelled) {
          setProfile(null);
          setCourses([]);
          setProjects([]);
          setError(parseApiErrorMessage(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [resolvedUserId]);

  const picUri = useMemo(() => profileImageUri(profile?.profilePictureBase64 ?? null), [profile?.profilePictureBase64]);

  const kav = Platform.OS === "ios" ? "padding" : undefined;

  if (resolving || loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.centerHint}>Loading doctor profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!resolving && !loading && (error || !profile)) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={[styles.topBar, { paddingHorizontal: pad }]}>
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={18} color="#64748b" />
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
        </View>
        <View style={[styles.center, { paddingHorizontal: pad }]}>
          <Text style={styles.errText}>{error ?? "Profile not found."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  assertNonNull(profile);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={kav} keyboardVerticalOffset={insets.top}>
        <View style={styles.blob1} pointerEvents="none" />
        <View style={styles.blob2} pointerEvents="none" />

        <View style={[styles.topBar, { paddingHorizontal: pad }]}>
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={18} color="#64748b" />
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            paddingHorizontal: pad,
            paddingBottom: Math.max(spacing.xxxl, insets.bottom + spacing.xl),
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ maxWidth: colMax, width: "100%", alignSelf: "center" }}>
            <View style={[styles.heroCard, isTablet && styles.heroRow]}>
              <View style={styles.avatarRing}>
                {picUri ? (
                  <Image source={{ uri: picUri }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>{initialsOf(profile.name)}</Text>
                  </View>
                )}
              </View>
              <View style={styles.heroText}>
                <Text style={styles.name}>{profile.name}</Text>
                <Text style={styles.email}>{profile.email || "—"}</Text>
                {profile.specialization ? (
                  <View style={styles.badge}>
                    <Ionicons name="school-outline" size={12} color="#4f46e5" />
                    <Text style={styles.badgeText}>{profile.specialization}</Text>
                  </View>
                ) : null}
              </View>
              <Pressable
                onPress={() =>
                  router.push(
                    `/ChatPage?userId=${encodeURIComponent(String(profile.userId))}` as Href,
                  )
                }
                style={[styles.messageBtn, isTablet ? styles.messageBtnInline : styles.messageBtnStretch]}
                accessibilityRole="button"
                accessibilityLabel="Send message"
              >
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" />
                <Text style={styles.messageBtnText}>Message</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person-outline" size={16} color="#6366f1" />
                <Text style={styles.sectionTitle}>About doctor</Text>
              </View>
              {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
              <InfoLine label="Department" value={profile.department || "—"} />
              <InfoLine label="Faculty" value={profile.faculty || "—"} />
              <InfoLine label="University" value={profile.university || "—"} />
              <InfoLine
                label="Experience"
                value={profile.yearsOfExperience != null ? `${profile.yearsOfExperience} years` : "—"}
              />
              {profile.officeHours ? <InfoLine label="Office hours" value={profile.officeHours} /> : null}
              {profile.linkedin ? (
                <Pressable
                  onPress={() => void openExternal(linkedinHref(profile.linkedin))}
                  style={styles.linkRow}
                >
                  <Ionicons name="logo-linkedin" size={16} color="#1d4ed8" />
                  <Text style={styles.linkText}>LinkedIn</Text>
                </Pressable>
              ) : null}
            </View>

            {(profile.technicalSkills.length > 0 || profile.researchSkills.length > 0) && (
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="flash-outline" size={16} color="#a855f7" />
                  <Text style={styles.sectionTitle}>Skills</Text>
                </View>
                {profile.technicalSkills.length > 0 ? (
                  <View style={styles.skillBlock}>
                    <Text style={styles.skillLabel}>Technical</Text>
                    <View style={styles.chipWrap}>
                      {profile.technicalSkills.map((s) => (
                        <View key={`t-${s}`} style={styles.chip}>
                          <Text style={styles.chipText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
                {profile.researchSkills.length > 0 ? (
                  <View style={styles.skillBlock}>
                    <Text style={styles.skillLabel}>Research</Text>
                    <View style={styles.chipWrap}>
                      {profile.researchSkills.map((s) => (
                        <View key={`r-${s}`} style={styles.chipRes}>
                          <Text style={styles.chipResText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            )}

            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Ionicons name="book-outline" size={16} color="#6366f1" />
                <Text style={styles.sectionTitle}>Courses</Text>
              </View>
              {courses.length === 0 ? (
                <Text style={styles.muted}>No courses listed.</Text>
              ) : (
                <View style={{ gap: spacing.sm }}>
                  {courses.map((c) => (
                    <View key={`c-${c.id}`} style={styles.itemCard}>
                      <Text style={styles.itemTitle}>{c.name}</Text>
                      <Text style={styles.itemMeta}>Code: {c.code || "—"}</Text>
                      <Text style={styles.itemMeta}>Semester: {c.semester || "—"}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Ionicons name="library-outline" size={16} color="#6366f1" />
                <Text style={styles.sectionTitle}>Supervised projects</Text>
              </View>
              {projects.length === 0 ? (
                <Text style={styles.muted}>No supervised projects found.</Text>
              ) : (
                <View style={{ gap: spacing.sm }}>
                  {projects.map((p) => (
                    <Pressable
                      key={`p-${p.id}`}
                      style={styles.itemCard}
                      onPress={() =>
                        Alert.alert(
                          "Open project",
                          "Opening a graduation project in full detail is only available on the SkillSwap web app for now.",
                          [{ text: "OK" }],
                        )
                      }
                    >
                      <Text style={styles.itemTitle}>{p.name}</Text>
                      {p.abstract ? <Text style={styles.itemAbs}>{p.abstract}</Text> : null}
                      {p.supervisorName ? (
                        <Text style={styles.itemMeta}>Supervisor: {p.supervisorName}</Text>
                      ) : null}
                      {p.requiredSkills.length > 0 ? (
                        <View style={[styles.chipWrap, { marginTop: 6 }]}>
                          {p.requiredSkills.slice(0, 8).map((s) => (
                            <View key={`${p.id}-${s}`} style={styles.chipSm}>
                              <Text style={styles.chipSmText}>{s}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}
                      <Text style={styles.itemMeta}>Team capacity: {p.partnersCount || "—"}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={4}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: "#f8f7ff" },
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl },
  centerHint: { fontSize: 13, color: "#94a3b8", fontWeight: "600" },
  blob1: {
    position: "absolute",
    top: -140,
    right: -120,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(99,102,241,0.09)",
    zIndex: 0,
  },
  blob2: {
    position: "absolute",
    bottom: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(168,85,247,0.07)",
    zIndex: 0,
  },
  topBar: {
    zIndex: 2,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(99,102,241,0.12)",
    backgroundColor: "rgba(248,247,255,0.95)",
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backBtnText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  errText: { fontSize: 14, fontWeight: "700", color: "#b91c1c", textAlign: "center" },
  heroCard: {
    backgroundColor: "#fff",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
    zIndex: 1,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  heroRow: { flexDirection: "row", alignItems: "center" },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#eef2ff",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: { fontSize: 22, fontWeight: "800", color: "#fff" },
  heroText: { flex: 1, minWidth: 0 },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: "#6366f1",
    marginTop: spacing.sm,
  },
  messageBtnStretch: { alignSelf: "stretch" },
  messageBtnInline: { marginTop: 0, marginLeft: "auto", alignSelf: "center" },
  messageBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  name: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  email: { fontSize: 13, color: "#64748b", marginBottom: spacing.sm },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#4f46e5" },
  card: {
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: spacing.lg,
    zIndex: 1,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    flex: 1,
  },
  bio: { fontSize: 13, color: "#64748b", lineHeight: 20, marginBottom: spacing.md },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f1f5f9",
  },
  infoLabel: { fontSize: 12, color: "#94a3b8", fontWeight: "700", width: 100 },
  infoValue: { flex: 1, fontSize: 13, color: "#0f172a", fontWeight: "600", textAlign: "right" },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: spacing.sm,
    paddingVertical: 8,
  },
  linkText: { fontSize: 13, fontWeight: "700", color: "#1d4ed8" },
  skillBlock: { marginBottom: spacing.md },
  skillLabel: { fontSize: 11, fontWeight: "700", color: "#94a3b8", marginBottom: 6, textTransform: "uppercase" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 999,
  },
  chipText: { fontSize: 11, fontWeight: "700", color: "#6366f1" },
  chipRes: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#faf5ff",
    borderWidth: 1,
    borderColor: "#e9d5ff",
    borderRadius: 999,
  },
  chipResText: { fontSize: 11, fontWeight: "700", color: "#a855f7" },
  chipSm: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  chipSmText: { fontSize: 10, fontWeight: "600", color: "#475569" },
  muted: { fontSize: 12, color: "#94a3b8" },
  itemCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: "#f8fafc",
  },
  itemTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  itemMeta: { fontSize: 12, color: "#64748b" },
  itemAbs: { fontSize: 12, color: "#64748b", lineHeight: 18, marginBottom: 4 },
});
