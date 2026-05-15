import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect, type Href } from "expo-router";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  fetchTotalUnreadNotificationCount,
  fetchUnreadChatNotificationCount,
} from "@/api/notificationsApi";
import {
  getGraduationProjectsForStudentFilter,
  getMyStudentProfileFromMe,
  getStudentProfileByUserId,
  type PublicGraduationProjectRow,
  type StudentProfileView,
} from "@/api/profileApi";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { subscribeInboxNotificationCreated } from "@/lib/notificationsHubInbox";
import { getItem } from "@/utils/authStorage";

type ProfileMode = "me" | "public";
type StudentTab = "about" | "skills" | "projects";
type SkillKind = "general" | "major";

function pickParamId(
  userId: string | string[] | undefined,
  studentId: string | string[] | undefined,
): number | null {
  const raw = userId ?? studentId;
  if (raw == null) return null;
  const s = (Array.isArray(raw) ? raw[0] : raw)?.trim();
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
  return resolveApiFileUrl(pic) ?? pic;
}

interface ProfileTask {
  id: string;
  label: string;
  done: boolean;
  hint: string;
}

export default function ProfilePage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId: userIdParam, studentId: studentIdParam } = useLocalSearchParams<{
    userId?: string | string[];
    studentId?: string | string[];
  }>();
  const publicUserId = pickParamId(userIdParam, studentIdParam);
  const mode: ProfileMode = publicUserId == null ? "me" : "public";
  const isPublic = mode === "public";

  const { horizontalPadding, maxDashboardWidth, isTablet } = useResponsiveLayout();

  const [user, setUser] = useState<StudentProfileView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StudentTab>("about");
  const [publicProjects, setPublicProjects] = useState<PublicGraduationProjectRow[]>([]);

  const [addedGeneralSkills, setAddedGeneralSkills] = useState<string[]>([]);
  const [addedMajorSkills, setAddedMajorSkills] = useState<string[]>([]);

  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [skillNameInput, setSkillNameInput] = useState("");
  const [skillKind, setSkillKind] = useState<SkillKind>("general");

  const [headerNotifUnread, setHeaderNotifUnread] = useState(0);
  const [headerChatUnread, setHeaderChatUnread] = useState(0);

  const goHome = useCallback(async () => {
    const role = ((await getItem("role")) ?? "").toString().trim().toLowerCase();
    router.replace((role === "doctor" ? "/doctor-dashboard" : "/dashboard") as Href);
  }, [router]);

  const handleBack = useCallback(() => {
    if (isPublic && router.canGoBack()) {
      router.back();
    } else {
      void goHome();
    }
  }, [goHome, isPublic, router]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        if (mode === "me") {
          const token = ((await getItem("token")) ?? "").trim();
          if (!token) {
            router.replace("/login" as Href);
            return;
          }
          const u = await getMyStudentProfileFromMe();
          if (!cancelled) {
            setUser(u);
            setPublicProjects([]);
          }
        } else {
          const id = publicUserId!;
          const u = await getStudentProfileByUserId(id);
          if (!cancelled) setUser(u);
          try {
            const rows = await getGraduationProjectsForStudentFilter(id);
            if (!cancelled) setPublicProjects(rows);
          } catch {
            if (!cancelled) setPublicProjects([]);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setUser(null);
          setPublicProjects([]);
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
  }, [mode, publicUserId, router]);

  useFocusEffect(
    useCallback(() => {
      if (isPublic) return;
      let cancelled = false;
      const tick = async () => {
        try {
          const [t, c] = await Promise.all([
            fetchTotalUnreadNotificationCount(),
            fetchUnreadChatNotificationCount(),
          ]);
          if (!cancelled) {
            setHeaderNotifUnread(t);
            setHeaderChatUnread(c);
          }
        } catch {
          if (!cancelled) {
            setHeaderNotifUnread(0);
            setHeaderChatUnread(0);
          }
        }
      };
      void tick();
      return () => {
        cancelled = true;
      };
    }, [isPublic]),
  );

  useEffect(() => {
    if (isPublic) return;
    return subscribeInboxNotificationCreated(() => {
      void (async () => {
        try {
          const [t, c] = await Promise.all([
            fetchTotalUnreadNotificationCount(),
            fetchUnreadChatNotificationCount(),
          ]);
          setHeaderNotifUnread(t);
          setHeaderChatUnread(c);
        } catch {
          setHeaderNotifUnread(0);
          setHeaderChatUnread(0);
        }
      })();
    });
  }, [isPublic]);

  const generalSkills = useMemo(
    () => [...(user?.generalSkills ?? []), ...addedGeneralSkills],
    [user?.generalSkills, addedGeneralSkills],
  );
  const majorSkills = useMemo(
    () => [...(user?.majorSkills ?? []), ...addedMajorSkills],
    [user?.majorSkills, addedMajorSkills],
  );
  const allSkills = useMemo(() => [...generalSkills, ...majorSkills], [generalSkills, majorSkills]);

  const openSkillModal = () => {
    setSkillNameInput("");
    setSkillKind("general");
    setSkillModalOpen(true);
  };

  const closeSkillModal = () => {
    setSkillModalOpen(false);
    setSkillNameInput("");
  };

  const submitAddSkill = () => {
    const raw = skillNameInput.trim();
    if (!raw) return;
    const norm = (s: string) => s.trim().toLowerCase();
    const exists =
      generalSkills.some((s) => norm(s) === norm(raw)) || majorSkills.some((s) => norm(s) === norm(raw));
    if (exists) {
      closeSkillModal();
      return;
    }
    if (skillKind === "general") {
      setAddedGeneralSkills((prev) => [...prev, raw]);
    } else {
      setAddedMajorSkills((prev) => [...prev, raw]);
    }
    closeSkillModal();
  };

  const completeness = Math.min(
    20 +
      (user?.university ? 15 : 0) +
      (user?.major ? 15 : 0) +
      (allSkills.length > 0 ? 20 : 0) +
      (user?.gpa ? 10 : 0) +
      (user?.profilePic ? 20 : 0),
    100,
  );

  const PROFILE_TASKS: ProfileTask[] = useMemo(
    () => [
      { id: "1", label: "Add a profile picture", done: !!user?.profilePic, hint: "basic" },
      { id: "2", label: "Add general skills", done: generalSkills.length > 0, hint: "skills" },
      { id: "3", label: "Add major skills", done: majorSkills.length > 0, hint: "skills" },
      { id: "4", label: "Complete academic info", done: !!user?.major && !!user?.university, hint: "basic" },
      { id: "5", label: "Add preferred project topics", done: false, hint: "work" },
    ],
    [user?.profilePic, user?.major, user?.university, generalSkills.length, majorSkills.length],
  );

  const nextActions = PROFILE_TASKS.filter((t) => !t.done).slice(0, 3);

  const onEditProfile = () => {
    router.push("/EditProfilePage" as Href);
  };

  const onTaskDoIt = (task: ProfileTask) => {
    router.push(`/EditProfilePage?section=${encodeURIComponent(task.hint)}` as Href);
  };

  const handleMessage = () => {
    if (!user?.userId || user.userId <= 0) return;
    router.push(`/ChatPage?userId=${encodeURIComponent(String(user.userId))}` as Href);
  };

  const pad = horizontalPadding;
  const colMax = maxDashboardWidth;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.loadingWrap}>
          <View style={styles.loadingOrb}>
            <Ionicons name="school" size={22} color="#fff" />
          </View>
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !user) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={[styles.topBar, { paddingHorizontal: pad }]}>
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={18} color="#64748b" />
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
        </View>
        <View style={[styles.errorBox, { paddingHorizontal: pad }]}>
          <Text style={styles.errorText}>{error ?? "Profile not found."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const picUri = profileImageUri(user.profilePic);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.blob1} pointerEvents="none" />
      <View style={styles.blob2} pointerEvents="none" />

      <View
        style={[
          styles.topBar,
          {
            paddingHorizontal: pad,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.sm,
          },
        ]}
      >
        <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={18} color="#64748b" />
          <Text style={styles.backBtnText}>{isPublic ? "Back" : "Back to Dashboard"}</Text>
        </Pressable>
        {!isPublic ? (
          <View style={styles.topBarActions}>
            <Pressable
              onPress={() => router.push("/NotificationsPage" as Href)}
              style={styles.profileNavIcon}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={22} color="#475569" />
              {headerNotifUnread > 0 ? (
                <View style={styles.profileNavBadge}>
                  <Text style={styles.profileNavBadgeText}>
                    {headerNotifUnread > 99 ? "99+" : String(headerNotifUnread)}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => router.push("/ChatPage" as Href)}
              style={styles.profileNavIcon}
              accessibilityRole="button"
              accessibilityLabel="Messages"
            >
              <Ionicons name="chatbubbles-outline" size={22} color="#475569" />
              {headerChatUnread > 0 ? (
                <View style={styles.profileNavBadge}>
                  <Text style={styles.profileNavBadgeText}>
                    {headerChatUnread > 99 ? "99+" : String(headerChatUnread)}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => router.push("/EditProfilePage" as Href)}
              style={styles.profileNavIcon}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <Ionicons name="settings-outline" size={22} color="#475569" />
            </Pressable>
          </View>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: pad,
          paddingBottom: Math.max(spacing.xxxl, insets.bottom + spacing.xl),
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ maxWidth: colMax, width: "100%", alignSelf: "center" }}>
          <ProfileHeader
            user={user}
            isPublic={isPublic}
            picUri={picUri}
            onEdit={onEditProfile}
            onMessage={handleMessage}
          />

          {isPublic ? (
            <View>
              <View style={[styles.tabsRow, styles.tabsRowCard]}>
                {(["about", "skills", "projects"] as const).map((tab) => (
                  <Pressable
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                  >
                    <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                      {tab === "about" ? "About" : tab === "skills" ? "Skills" : "Projects"}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {activeTab === "about" ? <AcademicInfoSection user={user} /> : null}
              {activeTab === "skills" ? (
                <SkillsSection
                  isPublic
                  generalSkills={generalSkills}
                  majorSkills={majorSkills}
                  onAddSkill={openSkillModal}
                />
              ) : null}
              {activeTab === "projects" ? (
                <View style={styles.card}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="book-outline" size={16} color="#6366f1" />
                    <Text style={styles.sectionTitle}>Projects</Text>
                  </View>
                  {publicProjects.length === 0 ? (
                    <Text style={styles.muted}>No projects found.</Text>
                  ) : (
                    <View style={{ gap: spacing.sm }}>
                      {publicProjects.map((project) => (
                        <View key={`pp-${project.id}`} style={styles.projectRow}>
                          <Text style={styles.projectName}>{project.name}</Text>
                          <Text style={styles.projectAbs}>{project.abstract || "No abstract provided."}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ) : null}
            </View>
          ) : (
            <View style={[isTablet && styles.twoCol]}>
              <View style={styles.col}>
                <AcademicInfoSection user={user} />
                <SkillsSection
                  isPublic={false}
                  generalSkills={generalSkills}
                  majorSkills={majorSkills}
                  onAddSkill={openSkillModal}
                />
              </View>

              <View style={styles.col}>
                <View style={styles.card}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#6366f1" />
                    <Text style={styles.sectionTitle}>Profile Completeness</Text>
                  </View>
                  <View style={styles.progressRow}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${completeness}%` }]} />
                    </View>
                    <Text style={styles.progressPct}>{completeness}%</Text>
                  </View>
                  <Text style={styles.progressHint}>
                    {completeness >= 80
                      ? "Strong profile — you're ready to match."
                      : "Complete your profile for better AI matches."}
                  </Text>
                  {nextActions.length > 0 ? (
                    <View style={{ gap: spacing.sm }}>
                      {nextActions.map((task) => (
                        <View key={task.id} style={styles.taskRow}>
                          <Ionicons name="ellipse-outline" size={16} color="#cbd5e1" />
                          <Text style={styles.taskLabel}>{task.label}</Text>
                          <Pressable onPress={() => onTaskDoIt(task)} hitSlop={6}>
                            <Text style={styles.doItLink}>Do it →</Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.allDoneHint}>{"You're on track — no urgent tasks."}</Text>
                  )}
                </View>

                <View style={styles.card}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="sparkles-outline" size={16} color="#6366f1" />
                    <Text style={styles.sectionTitle}>Next Steps</Text>
                  </View>
                  <Text style={styles.quickIntro}>Suggestions to get the most from the platform.</Text>
                  <Pressable
                    style={styles.quickRow}
                    onPress={() => router.push("/StudentsPage" as Href)}
                  >
                    <Ionicons name="people-outline" size={18} color="#6366f1" />
                    <Text style={styles.quickRowText}>Browse students & find teammates</Text>
                  </Pressable>
                  <Pressable style={styles.quickRow} onPress={onEditProfile}>
                    <Ionicons name="create-outline" size={18} color="#6366f1" />
                    <Text style={styles.quickRowText}>Update your profile details</Text>
                  </Pressable>
                  <Pressable style={styles.quickRow} onPress={() => void goHome()}>
                    <Ionicons name="grid-outline" size={18} color="#6366f1" />
                    <Text style={styles.quickRowText}>Return to dashboard</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {!isPublic && (
        <Modal visible={skillModalOpen} transparent animationType="fade" onRequestClose={closeSkillModal}>
          <Pressable style={styles.modalOverlay} onPress={closeSkillModal}>
            <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHead}>
                <Text style={styles.modalTitle}>Add skill</Text>
                <Pressable onPress={closeSkillModal} hitSlop={8} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={20} color="#64748b" />
                </Pressable>
              </View>
              <Text style={styles.modalLabel}>Skill name</Text>
              <TextInput
                style={styles.modalInput}
                value={skillNameInput}
                onChangeText={setSkillNameInput}
                placeholder="e.g. React, Teamwork"
                placeholderTextColor="#94a3b8"
                autoCorrect={false}
              />
              <Text style={styles.modalSub}>Type</Text>
              <View style={styles.kindToggle}>
                <Pressable
                  onPress={() => setSkillKind("general")}
                  style={[styles.kindBtn, skillKind === "general" && styles.kindBtnActiveGen]}
                >
                  <Text style={[styles.kindBtnText, skillKind === "general" && styles.kindBtnTextActive]}>General</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSkillKind("major")}
                  style={[styles.kindBtn, skillKind === "major" && styles.kindBtnActiveMaj]}
                >
                  <Text style={[styles.kindBtnText, skillKind === "major" && styles.kindBtnTextActiveMaj]}>Major</Text>
                </Pressable>
              </View>
              <View style={styles.modalActions}>
                <Pressable onPress={closeSkillModal} style={styles.modalBtnSecondary}>
                  <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={submitAddSkill}
                  disabled={!skillNameInput.trim()}
                  style={[styles.modalBtnPrimary, !skillNameInput.trim() && styles.modalBtnPrimaryDisabled]}
                >
                  <Text style={styles.modalBtnPrimaryText}>Add</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}

function ProfileHeader({
  user,
  isPublic,
  picUri,
  onEdit,
  onMessage,
}: {
  user: StudentProfileView;
  isPublic: boolean;
  picUri: string | null;
  onEdit: () => void;
  onMessage: () => void;
}) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.avatarWrap}>
        {picUri ? (
          <Image source={{ uri: picUri }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>{initialsOf(user.name)}</Text>
          </View>
        )}
      </View>
      <View style={styles.heroTextBlock}>
        <Text style={styles.heroName}>{user.name || "Student"}</Text>
        <Text style={styles.heroEmail}>{user.email}</Text>
        <View style={styles.heroBadges}>
          {user.major ? (
            <View style={styles.badge}>
              <Ionicons name="school-outline" size={12} color="#6366f1" />
              <Text style={styles.badgeText}>{user.major}</Text>
            </View>
          ) : null}
          {user.university ? (
            <View style={[styles.badge, styles.badgePurple]}>
              <Ionicons name="location-outline" size={12} color="#7c3aed" />
              <Text style={[styles.badgeText, styles.badgeTextPurple]}>{user.university}</Text>
            </View>
          ) : null}
          {user.academicYear ? (
            <View style={[styles.badge, styles.badgeGreen]}>
              <Ionicons name="star-outline" size={12} color="#16a34a" />
              <Text style={[styles.badgeText, styles.badgeTextGreen]}>{user.academicYear}</Text>
            </View>
          ) : null}
        </View>
      </View>
      {isPublic ? (
        <Pressable onPress={onMessage} style={styles.heroCta}>
          <Text style={styles.heroCtaText}>Message</Text>
        </Pressable>
      ) : (
        <Pressable onPress={onEdit} style={styles.heroCta}>
          <Ionicons name="pencil" size={16} color="#fff" />
          <Text style={styles.heroCtaText}>Edit</Text>
        </Pressable>
      )}
    </View>
  );
}

function AcademicInfoSection({ user }: { user: StudentProfileView }) {
  const rows = [
    { label: "Email", value: user.email },
    { label: "Faculty", value: user.faculty },
    { label: "Year", value: user.academicYear },
    { label: "GPA", value: user.gpa },
  ];
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Ionicons name="book-outline" size={16} color="#6366f1" />
        <Text style={styles.sectionTitle}>Academic Info</Text>
      </View>
      <View>
        {rows.map((item, idx) => (
          <View
            key={item.label}
            style={[styles.infoRow, idx < rows.length - 1 && styles.infoRowBorder]}
          >
            <Text style={styles.infoLabel}>{item.label}</Text>
            <Text style={[styles.infoValue, !item.value && styles.infoValueMuted]} numberOfLines={4}>
              {item.value || "—"}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SkillsSection({
  isPublic,
  generalSkills,
  majorSkills,
  onAddSkill,
}: {
  isPublic: boolean;
  generalSkills: string[];
  majorSkills: string[];
  onAddSkill: () => void;
}) {
  const all = [...generalSkills, ...majorSkills];
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Ionicons name="flash-outline" size={16} color="#a855f7" />
        <Text style={styles.sectionTitle}>Skills</Text>
        {!isPublic ? (
          <Pressable onPress={onAddSkill} style={styles.inlineAdd} hitSlop={6}>
            <Text style={styles.inlineAddText}>+ Add skills</Text>
          </Pressable>
        ) : null}
      </View>
      {all.length === 0 ? (
        <View style={styles.emptySkills}>
          <Text style={styles.emptyEmoji}>🧩</Text>
          <Text style={styles.muted}>No skills yet</Text>
          {!isPublic ? (
            <Pressable onPress={onAddSkill} style={styles.addSkillsBtn}>
              <Text style={styles.addSkillsBtnText}>Add skills →</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.skillsWrap}>
          {generalSkills.map((s, i) => (
            <View key={`g-${s}-${i}`} style={styles.skillChip}>
              <Text style={styles.skillChipText}>{s}</Text>
            </View>
          ))}
          {majorSkills.map((s, i) => (
            <View key={`m-${s}-${i}`} style={styles.skillChipMajor}>
              <Text style={styles.skillChipMajorText}>{s}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8f7ff" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  loadingOrb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingText: { fontSize: 14, color: "#94a3b8", fontWeight: "600" },
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
  topBarActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  profileNavIcon: {
    minWidth: 44,
    minHeight: 44,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  profileNavBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  profileNavBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1, minWidth: 0 },
  backBtnText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  errorBox: { flex: 1, justifyContent: "center", paddingVertical: 48 },
  errorText: { fontSize: 14, fontWeight: "700", color: "#b91c1c", textAlign: "center" },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: "#fff",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.12)",
    marginBottom: spacing.lg,
    flexWrap: "wrap",
    zIndex: 1,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
  heroTextBlock: { flex: 1, minWidth: 160 },
  heroName: { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 2 },
  heroEmail: { fontSize: 12, color: "#94a3b8", fontWeight: "500", marginBottom: spacing.sm },
  heroBadges: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 16,
  },
  badgePurple: { backgroundColor: "#faf5ff", borderColor: "#e9d5ff" },
  badgeGreen: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  badgeText: { fontSize: 11, fontWeight: "600", color: "#6366f1" },
  badgeTextPurple: { color: "#7c3aed" },
  badgeTextGreen: { color: "#16a34a" },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: "#6366f1",
    marginLeft: "auto",
  },
  heroCtaText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  twoCol: { flexDirection: "row", gap: spacing.lg, alignItems: "flex-start", flexWrap: "wrap" },
  col: { flex: 1, minWidth: 280, gap: spacing.lg },
  card: {
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: spacing.lg,
    zIndex: 1,
  },
  cardInner: { paddingTop: spacing.sm },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    flex: 1,
  },
  tabsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: spacing.sm,
  },
  tabsRowCard: {
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.sm },
  tabBtnActive: { backgroundColor: "#eef2ff" },
  tabBtnText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  tabBtnTextActive: { color: "#4f46e5" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f1f5f9" },
  infoLabel: { fontSize: 11, fontWeight: "600", color: "#64748b", flexShrink: 0 },
  infoValue: { flex: 1, fontSize: 13, fontWeight: "600", color: "#0f172a", textAlign: "right" },
  infoValueMuted: { color: "#cbd5e1" },
  muted: { fontSize: 12, color: "#94a3b8", fontWeight: "500" },
  inlineAdd: { marginLeft: "auto" },
  inlineAddText: { fontSize: 11, color: "#6366f1", fontWeight: "700" },
  emptySkills: { alignItems: "center", gap: 6, paddingVertical: spacing.md },
  emptyEmoji: { fontSize: 22 },
  addSkillsBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 16,
    marginTop: spacing.xs,
  },
  addSkillsBtnText: { fontSize: 11, fontWeight: "700", color: "#6366f1" },
  skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  skillChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 16,
  },
  skillChipText: { fontSize: 11, fontWeight: "600", color: "#6366f1" },
  skillChipMajor: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#faf5ff",
    borderWidth: 1,
    borderColor: "#e9d5ff",
    borderRadius: 16,
  },
  skillChipMajorText: { fontSize: 11, fontWeight: "600", color: "#7c3aed" },
  projectRow: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  projectName: { fontSize: 13, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
  projectAbs: { fontSize: 12, color: "#64748b" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  progressTrack: { flex: 1, height: 6, backgroundColor: "#f1f5f9", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#6366f1", borderRadius: 4 },
  progressPct: { fontSize: 14, fontWeight: "800", color: "#6366f1", minWidth: 40 },
  progressHint: { fontSize: 11, color: "#94a3b8", lineHeight: 16, marginBottom: spacing.sm },
  taskRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  taskLabel: { flex: 1, fontSize: 12, color: "#475569", fontWeight: "500" },
  doItLink: { fontSize: 11, fontWeight: "700", color: "#6366f1" },
  allDoneHint: { fontSize: 12, color: "#94a3b8", fontStyle: "italic" },
  quickIntro: { fontSize: 11, color: "#94a3b8", lineHeight: 16, marginBottom: spacing.md },
  quickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    marginBottom: spacing.sm,
  },
  quickRowText: { fontSize: 12, fontWeight: "600", color: "#334155", flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  modalHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  modalCloseBtn: { padding: 4 },
  modalLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: radius.sm,
    padding: 10,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#fafafa",
    marginBottom: spacing.md,
  },
  modalSub: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  kindToggle: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  kindBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    alignItems: "center",
  },
  kindBtnActiveGen: { backgroundColor: "#eef2ff", borderColor: "#c7d2fe" },
  kindBtnActiveMaj: { backgroundColor: "#faf5ff", borderColor: "#e9d5ff" },
  kindBtnText: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  kindBtnTextActive: { color: "#4f46e5" },
  kindBtnTextActiveMaj: { color: "#7c3aed" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
  modalBtnSecondary: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  modalBtnSecondaryText: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  modalBtnPrimary: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    backgroundColor: "#6366f1",
  },
  modalBtnPrimaryDisabled: { opacity: 0.45 },
  modalBtnPrimaryText: { fontSize: 12, fontWeight: "700", color: "#fff" },
});
