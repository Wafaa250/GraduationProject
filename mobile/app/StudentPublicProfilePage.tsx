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
import axios from "axios";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  getGraduationProjectsForStudentPublicViewer,
  getPublicStudentProfileDetail,
  type PublicStudentProfileDetail,
  type PublicStudentProjectViewerRow,
} from "@/api/profileApi";
import { resolveStudentUserIdByProfileId } from "@/api/studentsApi";
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

function githubHref(s: string): string {
  const t = s.trim();
  if (!t) return "";
  return t.startsWith("http") ? t : `https://github.com/${t}`;
}

function linkedinHref(s: string): string {
  const t = s.trim();
  if (!t) return "";
  return t.startsWith("http") ? t : `https://linkedin.com/in/${t}`;
}

function portfolioHref(s: string): string {
  const t = s.trim();
  if (!t) return "";
  return t.startsWith("http") ? t : `https://${t}`;
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

function mergedSkills(p: PublicStudentProfileDetail): string[] {
  const raw = [
    ...p.roles,
    ...p.technicalSkills,
    ...p.tools,
    ...p.languages,
  ].map((s) => s.trim()).filter(Boolean);
  return [...new Set(raw)];
}

function assertNonNull<T>(v: T | null | undefined): asserts v is T {
  if (v == null) throw new Error("Expected profile to be loaded.");
}

export default function StudentPublicProfilePage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { horizontalPadding, maxDashboardWidth, isTablet } = useResponsiveLayout();
  const { userId: userIdParam, profileId: profileIdParam } = useLocalSearchParams<{
    userId?: string | string[];
    profileId?: string | string[];
  }>();
  const userIdArg = pickNumericParam(userIdParam);
  const profileIdArg = pickNumericParam(profileIdParam);

  const [resolvedUserId, setResolvedUserId] = useState<number | null>(null);
  const [resolving, setResolving] = useState(true);

  const [profile, setProfile] = useState<PublicStudentProfileDetail | null>(null);
  const [projects, setProjects] = useState<PublicStudentProjectViewerRow[]>([]);
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
        if (userIdArg != null) {
          if (!cancelled) setResolvedUserId(userIdArg);
          return;
        }
        if (profileIdArg != null) {
          const uid = await resolveStudentUserIdByProfileId(profileIdArg);
          if (cancelled) return;
          if (uid == null) {
            setError("Could not resolve this student. Sign in and try again, or open the profile on the web app.");
            setResolvedUserId(null);
            return;
          }
          setResolvedUserId(uid);
          return;
        }
        setError("Missing student id.");
        setResolvedUserId(null);
      } finally {
        if (!cancelled) setResolving(false);
      }
    };
    void resolve();
    return () => {
      cancelled = true;
    };
  }, [userIdArg, profileIdArg]);

  useEffect(() => {
    if (resolvedUserId == null || resolvedUserId <= 0) {
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [p, proj] = await Promise.all([
          getPublicStudentProfileDetail(resolvedUserId),
          getGraduationProjectsForStudentPublicViewer(resolvedUserId).catch(() => [] as PublicStudentProjectViewerRow[]),
        ]);
        if (!cancelled) {
          setProfile(p);
          setProjects(proj);
        }
      } catch (e) {
        if (!cancelled) {
          setProfile(null);
          setProjects([]);
          if (axios.isAxiosError(e) && e.response?.status === 403) {
            setError("You do not have permission to view this profile.");
          } else {
            setError(parseApiErrorMessage(e));
          }
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
  const skills = useMemo(() => (profile ? mergedSkills(profile) : []), [profile]);
  const scoreColor =
    (profile?.matchScore ?? 0) >= 70 ? "#16a34a" : (profile?.matchScore ?? 0) >= 40 ? "#d97706" : "#64748b";

  const kav = Platform.OS === "ios" ? "padding" : undefined;

  if (resolving || loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.centerHint}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!resolving && !loading && (error || !profile || resolvedUserId == null)) {
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
              {profile.matchScore != null && profile.matchScore > 0 ? (
                <View style={[styles.matchBadge, { borderColor: scoreColor }]}>
                  <Ionicons name="sparkles-outline" size={12} color={scoreColor} />
                  <Text style={[styles.matchBadgeText, { color: scoreColor }]}>{profile.matchScore}% match</Text>
                </View>
              ) : null}
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
                <View style={styles.badges}>
                  {profile.major ? (
                    <View style={styles.badge}>
                      <Ionicons name="school-outline" size={11} color="#4f46e5" />
                      <Text style={styles.badgeText}>{profile.major}</Text>
                    </View>
                  ) : null}
                  {profile.university ? (
                    <View style={styles.badge}>
                      <Ionicons name="location-outline" size={11} color="#4f46e5" />
                      <Text style={styles.badgeText}>{profile.university}</Text>
                    </View>
                  ) : null}
                  {profile.academicYear ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{profile.academicYear}</Text>
                    </View>
                  ) : null}
                </View>
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

            {profile.bio ? (
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="document-text-outline" size={16} color="#6366f1" />
                  <Text style={styles.sectionTitle}>Bio</Text>
                </View>
                <Text style={styles.bio}>{profile.bio}</Text>
              </View>
            ) : null}

            {(profile.availability || profile.lookingFor) && (
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="calendar-outline" size={16} color="#6366f1" />
                  <Text style={styles.sectionTitle}>Availability</Text>
                </View>
                {profile.availability ? <InfoLine label="Availability" value={profile.availability} /> : null}
                {profile.lookingFor ? <InfoLine label="Looking for" value={profile.lookingFor} /> : null}
              </View>
            )}

            <View style={[isTablet && styles.twoCol]}>
              <View style={styles.col}>
                <View style={styles.card}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="book-outline" size={16} color="#6366f1" />
                    <Text style={styles.sectionTitle}>Academic info</Text>
                  </View>
                  <InfoLine label="Email" value={profile.email || "—"} />
                  <InfoLine label="Faculty" value={profile.faculty || "—"} />
                  <InfoLine label="Student ID" value={profile.studentId || "—"} />
                  <InfoLine label="Year" value={profile.academicYear || "—"} />
                  <InfoLine label="GPA" value={profile.gpa != null ? String(profile.gpa) : "—"} />
                </View>
              </View>
              <View style={styles.col}>
                <View style={styles.card}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="flash-outline" size={16} color="#a855f7" />
                    <Text style={styles.sectionTitle}>Skills</Text>
                  </View>
                  {skills.length === 0 ? (
                    <Text style={styles.muted}>No skills listed.</Text>
                  ) : (
                    <View style={styles.chipWrap}>
                      {skills.map((s, idx) => (
                        <View key={`${idx}-${s}`} style={styles.chip}>
                          <Text style={styles.chipText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>

            {(profile.github || profile.linkedin || profile.portfolio) && (
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="link-outline" size={16} color="#6366f1" />
                  <Text style={styles.sectionTitle}>Links</Text>
                </View>
                <View style={styles.linkRow}>
                  {profile.github ? (
                    <Pressable style={styles.outlineBtn} onPress={() => void openExternal(githubHref(profile.github))}>
                      <Ionicons name="logo-github" size={16} color="#475569" />
                      <Text style={styles.outlineBtnText}>GitHub</Text>
                    </Pressable>
                  ) : null}
                  {profile.linkedin ? (
                    <Pressable
                      style={styles.outlineBtn}
                      onPress={() => void openExternal(linkedinHref(profile.linkedin))}
                    >
                      <Ionicons name="logo-linkedin" size={16} color="#1d4ed8" />
                      <Text style={[styles.outlineBtnText, { color: "#1d4ed8" }]}>LinkedIn</Text>
                    </Pressable>
                  ) : null}
                  {profile.portfolio ? (
                    <Pressable
                      style={styles.outlineBtn}
                      onPress={() => void openExternal(portfolioHref(profile.portfolio))}
                    >
                      <Ionicons name="globe-outline" size={16} color="#16a34a" />
                      <Text style={[styles.outlineBtnText, { color: "#16a34a" }]}>Portfolio</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            )}

            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Ionicons name="library-outline" size={16} color="#6366f1" />
                <Text style={styles.sectionTitle}>Graduation projects</Text>
              </View>
              {projects.length === 0 ? (
                <Text style={styles.muted}>No graduation projects found.</Text>
              ) : (
                <View style={{ gap: spacing.sm }}>
                  {projects.map((project) => (
                    <Pressable
                      key={project.id}
                      style={styles.projectCard}
                      onPress={() =>
                        Alert.alert(
                          "Open project",
                          "Opening a graduation project in full detail is only available on the SkillSwap web app for now.",
                          [{ text: "OK" }],
                        )
                      }
                    >
                      <Text style={styles.projectTitle}>{project.name}</Text>
                      <Text style={styles.projectAbs}>{project.abstract || "No abstract provided."}</Text>
                      <Text style={styles.projectMeta}>Team capacity: {project.partnersCount || "—"}</Text>
                      <View style={styles.chipWrap}>
                        {project.requiredSkills.length === 0 ? (
                          <Text style={styles.muted}>No required skills</Text>
                        ) : (
                          project.requiredSkills.map((sk) => (
                            <View key={`${project.id}-${sk}`} style={styles.chipSm}>
                              <Text style={styles.chipSmText}>{sk}</Text>
                            </View>
                          ))
                        )}
                      </View>
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
    position: "relative",
    zIndex: 1,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  matchBadge: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#f0fdf4",
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 2,
  },
  matchBadgeText: { fontSize: 12, fontWeight: "800" },
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
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#4f46e5" },
  twoCol: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, alignItems: "flex-start" },
  col: { flex: 1, minWidth: 280 },
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
  bio: { fontSize: 13, color: "#64748b", lineHeight: 20 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f1f5f9",
  },
  infoLabel: { fontSize: 12, color: "#94a3b8", fontWeight: "700", width: 96 },
  infoValue: { flex: 1, fontSize: 13, color: "#0f172a", fontWeight: "600", textAlign: "right" },
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
  linkRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  outlineBtnText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  projectCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: "#f8fafc",
  },
  projectTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a", marginBottom: 6 },
  projectAbs: { fontSize: 12, color: "#64748b", lineHeight: 18, marginBottom: 6 },
  projectMeta: { fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 6 },
});
