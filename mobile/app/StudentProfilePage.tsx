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
  getGraduationProjectsForStudentFilter,
  getPublicStudentProfileDetail,
  type PublicGraduationProjectRow,
  type PublicStudentProfileDetail,
} from "@/api/profileApi";
import { sendInvitation } from "@/api/invitationsApi";
import { getAvailableStudentsForProject } from "@/api/studentsApi";
import { getGraduationProjectById } from "@/api/gradProjectApi";
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

type InviteKind = "sending" | "member" | "pending" | "disabled" | "invite";

function getInviteKind(
  isTeamFull: boolean,
  isSending: boolean,
  isMember: boolean,
  hasPendingInvite: boolean,
  canInvite: boolean | undefined,
): InviteKind {
  if (isSending) return "sending";
  if (isMember) return "member";
  if (hasPendingInvite) return "pending";
  if (canInvite === false) return "disabled";
  if (canInvite === undefined && isTeamFull) return "disabled";
  return "invite";
}

export default function StudentProfilePage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { horizontalPadding, maxDashboardWidth, isTablet } = useResponsiveLayout();
  const { userId: userIdParam, projectId: projectIdParam } = useLocalSearchParams<{
    userId?: string | string[];
    projectId?: string | string[];
  }>();
  const userId = pickNumericParam(userIdParam);
  const projectId = pickNumericParam(projectIdParam);

  const [profile, setProfile] = useState<PublicStudentProfileDetail | null>(null);
  const [projects, setProjects] = useState<PublicGraduationProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTeamFull, setIsTeamFull] = useState(false);
  const [browseInvite, setBrowseInvite] = useState<{
    isMember: boolean;
    hasPendingInvite: boolean;
    canInvite?: boolean;
  } | null>(null);
  const [inviting, setInviting] = useState(false);

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

  const browseStudentsHref = useMemo(() => {
    if (projectId) return `/StudentsPage?projectId=${projectId}` as Href;
    return "/StudentsPage" as Href;
  }, [projectId]);

  useEffect(() => {
    if (userId == null) {
      setLoading(false);
      setError("Missing student id.");
      setProfile(null);
      setProjects([]);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      setBrowseInvite(null);
      try {
        const tasks: Promise<unknown>[] = [
          getPublicStudentProfileDetail(userId).then((p) => {
            if (!cancelled) setProfile(p);
          }),
          getGraduationProjectsForStudentFilter(userId).then((rows) => {
            if (!cancelled) setProjects(rows);
          }),
        ];

        if (projectId) {
          tasks.push(
            getGraduationProjectById(projectId)
              .then((p) => {
                if (!cancelled) setIsTeamFull(Boolean(p.isFull));
              })
              .catch(() => {
                if (!cancelled) setIsTeamFull(false);
              }),
          );
          tasks.push(
            getAvailableStudentsForProject(projectId, {})
              .then((rows) => {
                if (cancelled) return;
                const row = rows.find((r) => r.userId === userId);
                if (row) {
                  setBrowseInvite({
                    isMember: row.isMember,
                    hasPendingInvite: row.hasPendingInvite,
                    canInvite: row.canInvite,
                  });
                } else {
                  setBrowseInvite(null);
                }
              })
              .catch(() => {
                if (!cancelled) setBrowseInvite(null);
              }),
          );
        } else {
          if (!cancelled) {
            setIsTeamFull(false);
            setBrowseInvite(null);
          }
        }

        await Promise.all(tasks);
      } catch (e) {
        if (cancelled) return;
        setProfile(null);
        setProjects([]);
        if (axios.isAxiosError(e) && e.response?.status === 403) {
          setError("You do not have permission to view this profile.");
        } else {
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
  }, [userId, projectId]);

  const handleMessage = () => {
    if (userId == null) return;
    router.push(`/ChatPage?userId=${encodeURIComponent(String(userId))}` as Href);
  };

  const handleInvite = async () => {
    if (!projectId || !profile) return;
    const token = ((await getItem("token")) ?? "").trim();
    if (!token) {
      Alert.alert("Sign in required", "Please sign in to send invitations.");
      return;
    }
    const kind = getInviteKind(
      isTeamFull,
      inviting,
      browseInvite?.isMember ?? false,
      browseInvite?.hasPendingInvite ?? false,
      browseInvite?.canInvite,
    );
    if (kind !== "invite") return;

    setInviting(true);
    try {
      await sendInvitation(projectId, profile.profileId);
      setBrowseInvite((prev) => ({
        isMember: prev?.isMember ?? false,
        hasPendingInvite: true,
        canInvite: false,
      }));
      Alert.alert("Invitation sent", "This student has been invited to your project.");
    } catch (e) {
      Alert.alert("Invite failed", parseApiErrorMessage(e));
    } finally {
      setInviting(false);
    }
  };

  const scoreColor =
    (profile?.matchScore ?? 0) >= 70 ? "#16a34a" : (profile?.matchScore ?? 0) >= 40 ? "#d97706" : "#64748b";

  const allSkills = useMemo(
    () => [...(profile?.roles ?? []), ...(profile?.technicalSkills ?? [])],
    [profile?.roles, profile?.technicalSkills],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingHint}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile || userId == null) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={[styles.topBar, { paddingHorizontal: pad }]}>
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={18} color="#64748b" />
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
        </View>
        <View style={[styles.errorWrap, { paddingHorizontal: pad }]}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorTitle}>{error ?? "Profile not found"}</Text>
          <Pressable onPress={() => router.push(browseStudentsHref)} style={styles.secondaryBtn}>
            <Ionicons name="people-outline" size={16} color="#475569" />
            <Text style={styles.secondaryBtnText}>Browse students</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const picUri = profileImageUri(profile.profilePictureBase64);
  const inviteKind = projectId
    ? getInviteKind(
        isTeamFull,
        inviting,
        browseInvite?.isMember ?? false,
        browseInvite?.hasPendingInvite ?? false,
        browseInvite?.canInvite,
      )
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <View style={styles.blob1} pointerEvents="none" />
        <View style={styles.blob2} pointerEvents="none" />

        <View style={[styles.topBar, { paddingHorizontal: pad }]}>
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={18} color="#64748b" />
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
          <Pressable onPress={() => router.push(browseStudentsHref)} style={styles.browseLink} hitSlop={8}>
            <Text style={styles.browseLinkText}>Browse students</Text>
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
            <View style={[isTablet && styles.twoCol]}>
              <View style={styles.col}>
                <View style={styles.profileCard}>
                  {profile.matchScore != null && profile.matchScore > 0 ? (
                    <View style={[styles.matchBadge, { borderColor: scoreColor }]}>
                      <Ionicons name="star" size={12} color={scoreColor} />
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

                  <Text style={styles.name}>{profile.name}</Text>

                  <View style={styles.pillRow}>
                    {profile.major ? (
                      <View style={styles.pill}>
                        <Ionicons name="school-outline" size={11} color="#6366f1" />
                        <Text style={styles.pillText}>{profile.major}</Text>
                      </View>
                    ) : null}
                    {profile.academicYear ? (
                      <View style={styles.pill}>
                        <Ionicons name="book-outline" size={11} color="#6366f1" />
                        <Text style={styles.pillText}>{profile.academicYear}</Text>
                      </View>
                    ) : null}
                    {profile.university ? (
                      <View style={styles.pill}>
                        <Ionicons name="location-outline" size={11} color="#6366f1" />
                        <Text style={styles.pillText}>{profile.university}</Text>
                      </View>
                    ) : null}
                    {profile.gpa != null ? (
                      <View style={[styles.pill, styles.pillGpa]}>
                        <Text style={styles.pillGpaText}>GPA {profile.gpa}</Text>
                      </View>
                    ) : null}
                  </View>

                  {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

                  {(profile.availability || profile.lookingFor) && (
                    <View style={styles.infoBlock}>
                      {profile.availability ? (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>⏱ Availability</Text>
                          <Text style={styles.infoVal} numberOfLines={3}>
                            {profile.availability}
                          </Text>
                        </View>
                      ) : null}
                      {profile.lookingFor ? (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>🎯 Looking for</Text>
                          <Text style={styles.infoVal} numberOfLines={3}>
                            {profile.lookingFor}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  )}

                  <View style={styles.actionRow}>
                    <Pressable onPress={handleMessage} style={styles.primaryBtn}>
                      <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" />
                      <Text style={styles.primaryBtnText}>Message</Text>
                    </Pressable>
                    {projectId ? (
                      <InviteButton kind={inviteKind} isTeamFull={isTeamFull} onPress={() => void handleInvite()} />
                    ) : null}
                  </View>

                  <View style={styles.socialRow}>
                    {profile.github ? (
                      <Pressable
                        onPress={() => void openExternal(githubHref(profile.github))}
                        style={styles.socialBtn}
                      >
                        <Ionicons name="logo-github" size={14} color="#475569" />
                        <Text style={styles.socialBtnText}>GitHub</Text>
                      </Pressable>
                    ) : null}
                    {profile.linkedin ? (
                      <Pressable
                        onPress={() => void openExternal(linkedinHref(profile.linkedin))}
                        style={[styles.socialBtn, styles.socialBtnIn]}
                      >
                        <Ionicons name="logo-linkedin" size={14} color="#1d4ed8" />
                        <Text style={[styles.socialBtnText, styles.socialBtnTextIn]}>LinkedIn</Text>
                      </Pressable>
                    ) : null}
                    {profile.portfolio ? (
                      <Pressable
                        onPress={() => void openExternal(portfolioHref(profile.portfolio))}
                        style={[styles.socialBtn, styles.socialBtnPf]}
                      >
                        <Ionicons name="globe-outline" size={14} color="#16a34a" />
                        <Text style={[styles.socialBtnText, styles.socialBtnTextPf]}>Portfolio</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="mail-outline" size={16} color="#6366f1" />
                    <Text style={styles.sectionTitle}>Contact & academic</Text>
                  </View>
                  <InfoLine label="Email" value={profile.email || "—"} />
                  <InfoLine label="Student ID" value={profile.studentId || "—"} />
                  <InfoLine label="Faculty" value={profile.faculty || "—"} />
                </View>

                {profile.languages.length > 0 ? (
                  <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="language-outline" size={16} color="#16a34a" />
                      <Text style={styles.sectionTitle}>Languages</Text>
                    </View>
                    <View style={styles.chipWrap}>
                      {profile.languages.map((l) => (
                        <View key={l} style={styles.langChip}>
                          <Text style={styles.langChipText}>{l}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>

              <View style={styles.col}>
                {profile.roles.length > 0 ? (
                  <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="star-outline" size={16} color="#6366f1" />
                      <Text style={styles.sectionTitle}>Specializations</Text>
                    </View>
                    <View style={styles.chipWrap}>
                      {profile.roles.map((r) => (
                        <View key={r} style={styles.roleChip}>
                          <Text style={styles.roleChipText}>{r}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {profile.technicalSkills.length > 0 ? (
                  <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="flash-outline" size={16} color="#a855f7" />
                      <Text style={styles.sectionTitle}>Technical skills</Text>
                    </View>
                    <View style={styles.chipWrap}>
                      {profile.technicalSkills.map((s) => (
                        <View key={s} style={styles.techChip}>
                          <Text style={styles.techChipText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {profile.tools.length > 0 ? (
                  <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="construct-outline" size={16} color="#0891b2" />
                      <Text style={styles.sectionTitle}>Tools & technologies</Text>
                    </View>
                    <View style={styles.chipWrap}>
                      {profile.tools.map((t) => (
                        <View key={t} style={styles.toolChip}>
                          <Text style={styles.toolChipText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {profile.matchScore != null && profile.matchScore > 0 ? (
                  <View style={styles.matchCard}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="sparkles-outline" size={16} color="#6366f1" />
                      <Text style={styles.sectionTitle}>AI match score</Text>
                    </View>
                    <View style={styles.matchBarRow}>
                      <View style={styles.matchBarTrack}>
                        <View style={[styles.matchBarFill, { width: `${profile.matchScore}%` }]} />
                      </View>
                      <Text style={[styles.matchPct, { color: scoreColor }]}>{profile.matchScore}%</Text>
                    </View>
                    <Text style={styles.matchHint}>
                      Based on skill overlap and complementary strengths between your profile and this student.
                    </Text>
                  </View>
                ) : null}

                <View style={styles.card}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="library-outline" size={16} color="#6366f1" />
                    <Text style={styles.sectionTitle}>Graduation projects</Text>
                  </View>
                  {projects.length === 0 ? (
                    <Text style={styles.muted}>No projects listed.</Text>
                  ) : (
                    <View style={{ gap: spacing.sm }}>
                      {projects.map((p) => (
                        <Pressable
                          key={p.id}
                          style={styles.projectRow}
                          onPress={() =>
                            Alert.alert(
                              "Open project",
                              "Opening another member’s graduation project in full detail is only available on the SkillSwap web app for now.",
                              [{ text: "OK" }],
                            )
                          }
                        >
                          <Text style={styles.projectName}>{p.name}</Text>
                          <Text style={styles.projectAbs} numberOfLines={4}>
                            {p.abstract || "No abstract provided."}
                          </Text>
                          <Text style={styles.projectHint}>Tap for info</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {allSkills.length === 0 && !profile.bio ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyEmoji}>📋</Text>
                    <Text style={styles.emptyText}>{"This student hasn't filled in their skills yet."}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLineLabel}>{label}</Text>
      <Text style={styles.infoLineVal} numberOfLines={4}>
        {value}
      </Text>
    </View>
  );
}

function InviteButton({
  kind,
  isTeamFull,
  onPress,
}: {
  kind: InviteKind | null;
  isTeamFull: boolean;
  onPress: () => void;
}) {
  if (kind == null) return null;
  if (kind === "sending") {
    return (
      <View style={[styles.inviteBtn, styles.inviteMuted]}>
        <Text style={styles.inviteMutedText}>Sending…</Text>
      </View>
    );
  }
  if (kind === "member") {
    return (
      <View style={[styles.inviteBtn, styles.inviteMuted]}>
        <Text style={styles.inviteMutedText}>Member</Text>
      </View>
    );
  }
  if (kind === "pending") {
    return (
      <View style={[styles.inviteBtn, styles.inviteMuted]}>
        <Text style={styles.inviteMutedText}>Pending</Text>
      </View>
    );
  }
  if (kind === "disabled") {
    return (
      <View style={[styles.inviteBtn, styles.inviteMuted]}>
        <Text style={styles.inviteMutedText}>{isTeamFull ? "Team full" : "Unavailable"}</Text>
      </View>
    );
  }
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.inviteBtn, pressed && styles.pressed]}>
      <Ionicons name="person-add-outline" size={16} color="#fff" />
      <Text style={styles.inviteBtnText}>Invite</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: "#f8f7ff" },
  scroll: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  loadingHint: { fontSize: 13, color: "#94a3b8", fontWeight: "600" },
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(99,102,241,0.12)",
    backgroundColor: "rgba(248,247,255,0.95)",
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backBtnText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  browseLink: { paddingVertical: 6, paddingHorizontal: 10 },
  browseLinkText: { fontSize: 12, fontWeight: "700", color: "#4f46e5" },
  errorWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: spacing.md },
  errorEmoji: { fontSize: 40 },
  errorTitle: { fontSize: 15, fontWeight: "700", color: "#475569", textAlign: "center" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  secondaryBtnText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  twoCol: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, alignItems: "flex-start" },
  col: { flex: 1, minWidth: 280, gap: 0 },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: "center",
    position: "relative",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    zIndex: 1,
  },
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
  },
  matchBadgeText: { fontSize: 12, fontWeight: "800" },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#eef2ff",
    marginBottom: spacing.sm,
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: { fontSize: 24, fontWeight: "800", color: "#fff" },
  name: { fontSize: 20, fontWeight: "800", color: "#0f172a", textAlign: "center", marginBottom: spacing.sm },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: spacing.md },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 10,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 20,
  },
  pillText: { fontSize: 11, color: "#6366f1", fontWeight: "600" },
  pillGpa: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  pillGpaText: { fontSize: 11, color: "#16a34a", fontWeight: "600" },
  bio: { fontSize: 13, color: "#64748b", lineHeight: 20, textAlign: "center", marginBottom: spacing.md },
  infoBlock: { width: "100%", gap: 6, marginBottom: spacing.md },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: "#f8fafc",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    gap: spacing.sm,
  },
  infoLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "600" },
  infoVal: { flex: 1, fontSize: 12, color: "#334155", fontWeight: "600", textAlign: "right" },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
    marginBottom: spacing.md,
    width: "100%",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: "#6366f1",
  },
  primaryBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: "#0f172a",
  },
  inviteBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  inviteMuted: { backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0" },
  inviteMutedText: { fontSize: 13, fontWeight: "600", color: "#94a3b8" },
  socialRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: radius.sm,
  },
  socialBtnIn: { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" },
  socialBtnPf: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  socialBtnText: { fontSize: 12, fontWeight: "600", color: "#475569" },
  socialBtnTextIn: { color: "#1d4ed8" },
  socialBtnTextPf: { color: "#16a34a" },
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
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    flex: 1,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  roleChip: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 20,
  },
  roleChipText: { fontSize: 12, color: "#6366f1", fontWeight: "600" },
  techChip: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: "#faf5ff",
    borderWidth: 1,
    borderColor: "#e9d5ff",
    borderRadius: 20,
  },
  techChipText: { fontSize: 12, color: "#a855f7", fontWeight: "600" },
  toolChip: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: "#ecfeff",
    borderWidth: 1,
    borderColor: "#a5f3fc",
    borderRadius: 20,
  },
  toolChipText: { fontSize: 12, color: "#0891b2", fontWeight: "600" },
  langChip: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 20,
  },
  langChipText: { fontSize: 12, color: "#16a34a", fontWeight: "600" },
  matchCard: {
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.2)",
    marginBottom: spacing.lg,
    zIndex: 1,
  },
  matchBarRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 10 },
  matchBarTrack: { flex: 1, height: 8, backgroundColor: "#f1f5f9", borderRadius: 4, overflow: "hidden" },
  matchBarFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#6366f1",
  },
  matchPct: { fontSize: 20, fontWeight: "800", minWidth: 48, textAlign: "right" },
  matchHint: { fontSize: 12, color: "#64748b", lineHeight: 18, margin: 0 },
  muted: { fontSize: 13, color: "#94a3b8", fontWeight: "500" },
  projectRow: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fafafa",
  },
  projectName: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
  projectAbs: { fontSize: 12, color: "#64748b", lineHeight: 17 },
  projectHint: { marginTop: 6, fontSize: 11, fontWeight: "600", color: "#94a3b8" },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: spacing.lg,
  },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 14, fontWeight: "600", color: "#94a3b8", textAlign: "center" },
  infoLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f1f5f9",
  },
  infoLineLabel: { fontSize: 12, color: "#94a3b8", fontWeight: "600", width: 96 },
  infoLineVal: { flex: 1, fontSize: 13, color: "#334155", fontWeight: "600", textAlign: "right" },
  pressed: { opacity: 0.72 },
});
