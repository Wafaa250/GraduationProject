import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import { getGraduationProjectById } from "@/api/gradProjectApi";
import { sendInvitation } from "@/api/invitationsApi";
import {
  getAvailableStudentsForProject,
  getStudentBrowseFilters,
  getStudentsList,
  type StudentBrowseFilters,
  type StudentBrowseRow,
  type StudentListQuery,
} from "@/api/studentsApi";
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

function avatarUri(pic: string | null): string | null {
  if (!pic) return null;
  if (pic.startsWith("data:")) return pic;
  return resolveApiFileUrl(pic) ?? pic;
}

type FilterPickerKind = "university" | "major" | "skill";

export default function StudentsPage() {
  const insets = useSafeAreaInsets();
  const routerNav = useRouter();
  const { projectId: projectIdParam } = useLocalSearchParams<{ projectId?: string | string[] }>();
  const projectId = pickNumericParam(projectIdParam);

  const { width: windowWidth } = useWindowDimensions();
  const { horizontalPadding, maxDashboardWidth, isCompact, isTablet } = useResponsiveLayout();
  const stackCardActions = isCompact || windowWidth < 420;

  const [students, setStudents] = useState<StudentBrowseRow[]>([]);
  const [filters, setFilters] = useState<StudentBrowseFilters>({ universities: [], majors: [], skills: [] });
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [skill, setSkill] = useState("");
  const [isTeamFull, setIsTeamFull] = useState(false);
  const [invitingId, setInvitingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [filterPicker, setFilterPicker] = useState<{
    kind: FilterPickerKind;
    title: string;
    placeholder: string;
    options: string[];
    value: string;
    onSelect: (v: string) => void;
  } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const goHome = useCallback(async () => {
    const role = ((await getItem("role")) ?? "").toString().trim().toLowerCase();
    if (role === "doctor") {
      routerNav.replace("/doctor-dashboard" as Href);
    } else {
      routerNav.replace("/dashboard" as Href);
    }
  }, [routerNav]);

  const handleBack = useCallback(() => {
    if (routerNav.canGoBack()) {
      routerNav.back();
    } else {
      void goHome();
    }
  }, [goHome, routerNav]);

  const openStudentProfile = useCallback(
    (uid: number) => {
      if (projectId) {
        routerNav.push(`/StudentProfilePage?userId=${uid}&projectId=${projectId}` as Href);
      } else {
        routerNav.push(`/StudentPublicProfilePage?userId=${uid}` as Href);
      }
    },
    [projectId, routerNav],
  );

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    void (async () => {
      try {
        const p = await getGraduationProjectById(projectId);
        if (cancelled) return;
        setProjectName(p.name ?? null);
        setIsTeamFull(p.isFull ?? false);
      } catch {
        /* non-critical — same as web */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const f = await getStudentBrowseFilters();
        if (!cancelled) setFilters(f);
      } catch (err) {
        if (!cancelled) {
          setFilters({ universities: [], majors: [], skills: [] });
          showToast(parseApiErrorMessage(err), "error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const listQuery: StudentListQuery = useMemo(
    () => ({
      search: search.trim() || undefined,
      university: university.trim() || undefined,
      major: major.trim() || undefined,
      skill: skill.trim() || undefined,
    }),
    [search, university, major, skill],
  );

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      if (projectId) {
        const rows = await getAvailableStudentsForProject(projectId, listQuery);
        setStudents(rows);
      } else {
        const rows = await getStudentsList(listQuery);
        setStudents(rows);
      }
    } catch (err) {
      setStudents([]);
      const msg = parseApiErrorMessage(err);
      setFetchError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [listQuery, projectId, showToast]);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchStudents();
    }, 300);
    return () => clearTimeout(t);
  }, [fetchStudents]);

  const handleInvite = async (student: StudentBrowseRow) => {
    if (!projectId) return;
    if (student.isMember || student.hasPendingInvite) return;
    if (student.canInvite === false) return;
    if (student.canInvite === undefined && isTeamFull) return;
    setInvitingId(student.profileId);
    try {
      await sendInvitation(projectId, student.profileId);
      setStudents((prev) =>
        prev.map((s) =>
          s.profileId === student.profileId ? { ...s, hasPendingInvite: true, canInvite: false } : s,
        ),
      );
      showToast("Invitation sent");
      try {
        const p = await getGraduationProjectById(projectId);
        setIsTeamFull(p.isFull ?? false);
      } catch {
        /* keep prior isTeamFull */
      }
    } catch (err: unknown) {
      showToast(parseApiErrorMessage(err), "error");
    } finally {
      setInvitingId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setUniversity("");
    setMajor("");
    setSkill("");
  };

  const hasActiveFilters = Boolean(search || university || major || skill);
  const activeCount = [university, major, skill].filter(Boolean).length;

  const sorted = useMemo(() => [...students].sort((a, b) => b.matchScore - a.matchScore), [students]);
  const recommended = useMemo(() => sorted.filter((s) => s.matchScore >= 60), [sorted]);
  const others = useMemo(() => sorted.filter((s) => s.matchScore < 60), [sorted]);

  const contentPad = horizontalPadding;
  const innerMax = maxDashboardWidth;

  const openPicker = (kind: FilterPickerKind) => {
    if (kind === "university") {
      setFilterPicker({
        kind,
        title: "University",
        placeholder: "All universities",
        options: filters.universities,
        value: university,
        onSelect: setUniversity,
      });
    } else if (kind === "major") {
      setFilterPicker({
        kind,
        title: "Major",
        placeholder: "All majors",
        options: filters.majors,
        value: major,
        onSelect: setMajor,
      });
    } else {
      setFilterPicker({
        kind,
        title: "Skill",
        placeholder: "All skills",
        options: filters.skills,
        value: skill,
        onSelect: setSkill,
      });
    }
  };

  const filterRows: { label: string; kind: FilterPickerKind; value: string; ph: string }[] = [
    { label: "University", kind: "university", value: university, ph: "All universities" },
    { label: "Major", kind: "major", value: major, ph: "All majors" },
    { label: "Skill", kind: "skill", value: skill, ph: "All skills" },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.blobTop} pointerEvents="none" />
      <View style={styles.blobBottom} pointerEvents="none" />

      {toast ? (
        <View
          style={[
            styles.toast,
            toast.type === "success" ? styles.toastOk : styles.toastErr,
            { bottom: Math.max(spacing.lg, insets.bottom + spacing.sm) },
            { marginHorizontal: contentPad },
          ]}
        >
          <Text style={styles.toastText}>
            {toast.type === "success" ? "✅ " : "❌ "}
            {toast.message}
          </Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: contentPad,
            paddingBottom: Math.max(spacing.xxxl, insets.bottom + spacing.xl),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.inner, { maxWidth: innerMax, alignSelf: "center", width: "100%" }]}>
          {/* Nav */}
          <View style={[styles.navRow, isCompact && styles.navRowStack]}>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Back to dashboard"
            >
              <Ionicons name="arrow-back" size={16} color="#64748b" />
              <Text style={styles.backBtnText}>Dashboard</Text>
            </Pressable>

            <View style={styles.logoRow}>
              <View style={styles.logoIcon}>
                <Ionicons name="school" size={16} color="#fff" />
              </View>
              <Text style={styles.logoText}>
                Skill<Text style={styles.logoAccent}>Swap</Text>
              </Text>
            </View>

            <Pressable
              onPress={() => void goHome()}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Ionicons name="people-outline" size={16} color="#64748b" />
              <Text style={styles.backBtnText}>My Dashboard</Text>
            </Pressable>
          </View>

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title}>Browse Students</Text>
              <Text style={styles.subtitle}>
                {loading ? "Loading…" : `${students.length} student${students.length !== 1 ? "s" : ""} found`}
                {hasActiveFilters ? " · Filters active" : ""}
                {projectId && !loading ? " · Showing available only" : ""}
              </Text>
              {fetchError && !loading ? (
                <Text style={styles.fetchErrorText} numberOfLines={3}>
                  {fetchError}
                </Text>
              ) : null}
              {projectId ? (
                <View style={styles.projectBanner}>
                  <Ionicons name="people" size={14} color="#6366f1" />
                  <Text style={styles.projectBannerText}>
                    Browsing for{" "}
                    <Text style={styles.projectBannerStrong}>{projectName ?? `Project #${projectId}`}</Text>
                    {" — share your project link so students can join"}
                  </Text>
                </View>
              ) : null}
              {projectId && isTeamFull ? (
                <View style={styles.teamFullBanner}>
                  <Text style={styles.teamFullText}>Team is full — no more invitations can be sent</Text>
                </View>
              ) : null}
            </View>
            <View style={[styles.headerActions, isCompact && styles.headerActionsStack]}>
              {hasActiveFilters ? (
                <Pressable
                  onPress={clearFilters}
                  style={({ pressed }) => [styles.clearBtn, pressed && styles.pressed]}
                >
                  <Ionicons name="close-circle-outline" size={15} color="#ef4444" />
                  <Text style={styles.clearBtnText}>Clear all</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => setFiltersOpen((o) => !o)}
                style={({ pressed }) => [
                  styles.filterToggle,
                  filtersOpen && styles.filterToggleActive,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="options-outline" size={16} color={filtersOpen ? "#6366f1" : "#64748b"} />
                <Text style={[styles.filterToggleText, filtersOpen && styles.filterToggleTextActive]}>Filters</Text>
                {activeCount > 0 ? (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{activeCount}</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>
          </View>

          {/* Search */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name…"
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search ? (
              <Pressable onPress={() => setSearch("")} style={styles.searchClear} hitSlop={8}>
                <Ionicons name="close" size={18} color="#94a3b8" />
              </Pressable>
            ) : null}
          </View>

          {/* Filter panel */}
          {filtersOpen ? (
            <View style={styles.filterPanel}>
              <View style={[styles.filterGrid, isTablet && styles.filterGridRow]}>
                {filterRows.map((f) => (
                  <View key={f.kind} style={[styles.filterField, isTablet && styles.filterFieldThird]}>
                    <Text style={styles.filterLabel}>{f.label}</Text>
                    <Pressable
                      onPress={() => openPicker(f.kind)}
                      style={({ pressed }) => [styles.selectLike, pressed && styles.pressed]}
                    >
                      <Text style={f.value ? styles.selectValue : styles.selectPlaceholder} numberOfLines={1}>
                        {f.value || f.ph}
                      </Text>
                      <Ionicons name="chevron-down" size={18} color="#64748b" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Chips */}
          {hasActiveFilters ? (
            <View style={styles.chipRow}>
              {university ? (
                <View style={styles.chip}>
                  <Text style={styles.chipText} numberOfLines={1}>
                    {university}
                  </Text>
                  <Pressable onPress={() => setUniversity("")} hitSlop={6}>
                    <Text style={styles.chipX}>×</Text>
                  </Pressable>
                </View>
              ) : null}
              {major ? (
                <View style={styles.chip}>
                  <Text style={styles.chipText} numberOfLines={1}>
                    {major}
                  </Text>
                  <Pressable onPress={() => setMajor("")} hitSlop={6}>
                    <Text style={styles.chipX}>×</Text>
                  </Pressable>
                </View>
              ) : null}
              {skill ? (
                <View style={styles.chip}>
                  <Text style={styles.chipText} numberOfLines={1}>
                    {skill}
                  </Text>
                  <Pressable onPress={() => setSkill("")} hitSlop={6}>
                    <Text style={styles.chipX}>×</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Body */}
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingHint}>Finding students…</Text>
            </View>
          ) : students.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>No students found</Text>
              <Text style={styles.emptySub}>Try adjusting your filters or search</Text>
            </View>
          ) : (
            <View style={styles.sections}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>⭐ Best Matches for Your Project</Text>
                <Text style={styles.sectionCount}>{recommended.length} students</Text>
              </View>
              {recommended.length === 0 ? (
                <View style={styles.sectionEmpty}>
                  <Text style={styles.sectionEmptyText}>No students with a high match score yet.</Text>
                </View>
              ) : (
                <View style={styles.cardList}>
                  {recommended.map((s) => (
                    <StudentCard
                      key={`rec-${s.userId}`}
                      student={s}
                      stackActions={stackCardActions}
                      onViewProfile={() => openStudentProfile(s.userId)}
                      onInvite={projectId ? () => void handleInvite(s) : undefined}
                      isTeamFull={isTeamFull}
                      isSending={invitingId === s.profileId}
                    />
                  ))}
                </View>
              )}

              {others.length > 0 ? (
                <>
                  <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
                    <Text style={styles.sectionTitle}>👥 Other Students</Text>
                    <Text style={styles.sectionCount}>{others.length} students</Text>
                  </View>
                  <View style={styles.cardList}>
                    {others.map((s) => (
                      <StudentCard
                        key={`oth-${s.userId}`}
                        student={s}
                        stackActions={stackCardActions}
                        onViewProfile={() => openStudentProfile(s.userId)}
                        onInvite={projectId ? () => void handleInvite(s) : undefined}
                        isTeamFull={isTeamFull}
                        isSending={invitingId === s.profileId}
                      />
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Option picker for filters */}
      <Modal visible={filterPicker != null} transparent animationType="fade" onRequestClose={() => setFilterPicker(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setFilterPicker(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{filterPicker?.title}</Text>
              <Pressable onPress={() => setFilterPicker(null)} hitSlop={8}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled">
              <Pressable
                style={styles.pickerRow}
                onPress={() => {
                  filterPicker?.onSelect("");
                  setFilterPicker(null);
                }}
              >
                <Text style={styles.pickerRowTextMuted}>{filterPicker?.placeholder}</Text>
              </Pressable>
              {(filterPicker?.options ?? []).map((opt) => (
                <Pressable
                  key={opt}
                  style={styles.pickerRow}
                  onPress={() => {
                    filterPicker?.onSelect(opt);
                    setFilterPicker(null);
                  }}
                >
                  <Text
                    style={[styles.pickerRowText, filterPicker?.value === opt && styles.pickerRowTextSelected]}
                    numberOfLines={2}
                  >
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

type InviteKind = "sending" | "member" | "pending" | "disabled" | "invite";

function getInviteKind(
  student: StudentBrowseRow,
  isTeamFull: boolean,
  isSending: boolean,
  onInvite?: () => void,
): InviteKind | null {
  if (!onInvite) return null;
  if (isSending) return "sending";
  if (student.isMember) return "member";
  if (student.hasPendingInvite) return "pending";
  if (student.canInvite === false) return "disabled";
  if (student.canInvite === undefined && isTeamFull) return "disabled";
  return "invite";
}

function disabledInviteLabel(isTeamFull: boolean): string {
  return isTeamFull ? "Team Full" : "Unavailable";
}

function InviteActions({
  student,
  isTeamFull,
  isSending,
  onInvite,
  grow,
}: {
  student: StudentBrowseRow;
  isTeamFull: boolean;
  isSending: boolean;
  onInvite?: () => void;
  grow: boolean;
}) {
  const kind = getInviteKind(student, isTeamFull, isSending, onInvite);
  if (kind == null) return null;

  const addBase = [styles.addBtn, ...(grow ? [styles.addBtnGrow] : [])];

  if (kind === "sending") {
    return (
      <View style={[...addBase, styles.addBtnDisabled]}>
        <Text style={styles.addBtnTextDisabled}>Sending…</Text>
      </View>
    );
  }
  if (kind === "member") {
    return (
      <View style={[...addBase, styles.addBtnMuted]}>
        <Text style={styles.addBtnTextDisabled}>Member</Text>
      </View>
    );
  }
  if (kind === "pending") {
    return (
      <View style={[...addBase, styles.addBtnMuted]}>
        <Text style={styles.addBtnTextDisabled}>Pending</Text>
      </View>
    );
  }
  if (kind === "disabled") {
    return (
      <View style={[...addBase, styles.addBtnMuted]}>
        <Text style={styles.addBtnTextDisabled}>{disabledInviteLabel(isTeamFull)}</Text>
      </View>
    );
  }
  return (
    <Pressable onPress={onInvite} style={({ pressed }) => [...addBase, pressed && styles.pressed]}>
      <Text style={styles.addBtnText}>+ Invite</Text>
    </Pressable>
  );
}

function StudentCard({
  student,
  stackActions,
  onViewProfile,
  onInvite,
  isTeamFull = false,
  isSending = false,
}: {
  student: StudentBrowseRow;
  stackActions: boolean;
  onViewProfile: () => void;
  onInvite?: () => void;
  isTeamFull?: boolean;
  isSending?: boolean;
}) {
  const initials = initialsOf(student.name);
  const scoreColor =
    student.matchScore >= 70 ? "#16a34a" : student.matchScore >= 40 ? "#d97706" : "#64748b";
  const scoreBg = student.matchScore >= 70 ? "#f0fdf4" : student.matchScore >= 40 ? "#fffbeb" : "#f8fafc";
  const scoreBorder = student.matchScore >= 70 ? "#bbf7d0" : student.matchScore >= 40 ? "#fde68a" : "#e2e8f0";
  const isStrong = student.matchScore >= 70;
  const uri = avatarUri(student.profilePicture);

  return (
    <View style={[styles.card, isStrong && styles.cardStrong]}>
      {student.matchScore > 0 ? (
        <View style={[styles.scoreBadge, { backgroundColor: scoreBg, borderColor: scoreBorder }]}>
          <Text style={{ fontSize: 10 }}>⭐</Text>
          <Text style={[styles.scoreBadgeText, { color: scoreColor }]}>{student.matchScore}%</Text>
        </View>
      ) : null}
      <View style={stackActions ? styles.cardTopRow : styles.cardRow}>
        <View style={styles.avatarWrap}>
          {uri ? (
            <Image source={{ uri }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{initials}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardMain}>
          <Text style={styles.cardName} numberOfLines={2}>
            {student.name}
          </Text>
          <Text style={styles.cardMajor} numberOfLines={1}>
            {student.major || "—"}
          </Text>
          {student.university ? (
            <Text style={styles.cardUni} numberOfLines={2}>
              {student.university}
              {student.academicYear ? ` · ${student.academicYear}` : ""}
            </Text>
          ) : null}
          {student.skills.length > 0 ? (
            <View style={styles.skillWrap}>
              {student.skills.slice(0, 4).map((sk) => (
                <View key={sk} style={styles.skillChip}>
                  <Text style={styles.skillChipText} numberOfLines={1}>
                    {sk}
                  </Text>
                </View>
              ))}
              {student.skills.length > 4 ? (
                <View style={[styles.skillChip, styles.skillChipMore]}>
                  <Text style={styles.skillChipMoreText}>+{student.skills.length - 4}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
        {!stackActions ? (
          <View style={styles.cardActions}>
            <Pressable onPress={onViewProfile} style={({ pressed }) => [styles.viewBtn, pressed && styles.pressed]}>
              <Text style={styles.viewBtnText}>View Profile</Text>
            </Pressable>
            {onInvite ? (
              <InviteActions
                student={student}
                isTeamFull={isTeamFull}
                isSending={isSending}
                onInvite={onInvite}
                grow={false}
              />
            ) : null}
          </View>
        ) : null}
      </View>
      {stackActions ? (
        <View style={styles.cardActionsBelow}>
          <Pressable onPress={onViewProfile} style={({ pressed }) => [styles.viewBtn, styles.viewBtnGrow, pressed && styles.pressed]}>
            <Text style={styles.viewBtnText}>View Profile</Text>
          </Pressable>
          {onInvite ? (
            <InviteActions
              student={student}
              isTeamFull={isTeamFull}
              isSending={isSending}
              onInvite={onInvite}
              grow
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8f7ff" },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  inner: { zIndex: 1, paddingTop: spacing.sm },
  blobTop: {
    position: "absolute",
    top: -120,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(99,102,241,0.07)",
    zIndex: 0,
  },
  blobBottom: {
    position: "absolute",
    bottom: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(168,85,247,0.05)",
    zIndex: 0,
  },
  pressed: { opacity: 0.72 },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  navRowStack: { flexWrap: "wrap" },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: radius.sm,
  },
  backBtnText: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  logoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logoIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  logoAccent: { color: "#a855f7" },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.lg,
    flexWrap: "wrap",
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  headerActionsStack: { width: "100%", justifyContent: "flex-end" },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: { fontSize: 13, color: "#94a3b8", fontWeight: "500", marginBottom: spacing.sm },
  fetchErrorText: {
    marginTop: spacing.xs,
    fontSize: 12,
    fontWeight: "600",
    color: "#dc2626",
    lineHeight: 17,
  },
  projectBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 20,
    marginTop: spacing.xs,
    maxWidth: "100%",
  },
  projectBannerText: { flex: 1, fontSize: 12, color: "#4338ca", fontWeight: "500", lineHeight: 17 },
  projectBannerStrong: { fontWeight: "700", color: "#312e81" },
  teamFullBanner: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 20,
  },
  teamFullText: { fontSize: 12, color: "#dc2626", fontWeight: "600" },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#fca5a5",
    borderRadius: radius.sm,
  },
  clearBtnText: { fontSize: 12, fontWeight: "600", color: "#ef4444" },
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: radius.sm,
    position: "relative",
  },
  filterToggleActive: { backgroundColor: "#eef2ff", borderColor: "#c7d2fe" },
  filterToggleText: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  filterToggleTextActive: { color: "#6366f1" },
  filterBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  searchWrap: {
    position: "relative",
    marginBottom: spacing.md,
    justifyContent: "center",
  },
  searchIcon: { position: "absolute", left: 14, zIndex: 1 },
  searchInput: {
    paddingVertical: 11,
    paddingLeft: 44,
    paddingRight: 40,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: radius.lg,
    fontSize: 14,
    color: "#0f172a",
  },
  searchClear: { position: "absolute", right: 12, padding: 4 },
  filterPanel: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  filterGrid: { gap: spacing.md },
  filterGridRow: { flexDirection: "row", flexWrap: "wrap" },
  filterField: { gap: 6 },
  filterFieldThird: { flexGrow: 1, flexBasis: "30%", minWidth: 140 },
  filterLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  selectLike: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: radius.sm,
    backgroundColor: "#fff",
    gap: spacing.sm,
  },
  selectValue: { flex: 1, fontSize: 13, color: "#334155", fontWeight: "500" },
  selectPlaceholder: { flex: 1, fontSize: 13, color: "#94a3b8" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: spacing.lg },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 20,
    maxWidth: "100%",
  },
  chipText: { fontSize: 12, color: "#6366f1", fontWeight: "600", flexShrink: 1 },
  chipX: { color: "#a5b4fc", fontSize: 16, lineHeight: 18, fontWeight: "600" },
  loadingWrap: { alignItems: "center", paddingVertical: 72 },
  loadingHint: { marginTop: spacing.md, fontSize: 13, color: "#94a3b8" },
  emptyWrap: { alignItems: "center", paddingVertical: 72 },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#475569", marginBottom: 4 },
  emptySub: { fontSize: 13, color: "#94a3b8", textAlign: "center" },
  sections: { gap: 0 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    flex: 1,
    marginRight: spacing.sm,
  },
  sectionCount: { fontSize: 12, color: "#94a3b8", fontWeight: "500" },
  sectionEmpty: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#e2e8f0",
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  sectionEmptyText: { fontSize: 13, color: "#94a3b8", textAlign: "center" },
  cardList: { gap: spacing.md },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: radius.xl,
    padding: spacing.lg,
    position: "relative",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardStrong: {
    borderWidth: 1.5,
    borderColor: "#86efac",
    shadowColor: "#16a34a",
    shadowOpacity: 0.1,
  },
  scoreBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 2,
  },
  scoreBadgeText: { fontSize: 11, fontWeight: "800" },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  cardActionsBelow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    flexShrink: 0,
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: { fontSize: 14, fontWeight: "800", color: "#fff" },
  cardMain: { flex: 1, minWidth: 0 },
  cardName: { fontSize: 15, fontWeight: "700", color: "#0f172a", marginBottom: 2 },
  cardMajor: { fontSize: 12, color: "#64748b", fontWeight: "500", marginBottom: 2 },
  cardUni: { fontSize: 11, color: "#94a3b8", marginBottom: spacing.sm },
  skillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  skillChip: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 20,
    maxWidth: "100%",
  },
  skillChipText: { fontSize: 10, color: "#6366f1", fontWeight: "600" },
  skillChipMore: { backgroundColor: "#f8fafc", borderColor: "#e2e8f0" },
  skillChipMoreText: { fontSize: 10, color: "#94a3b8", fontWeight: "600" },
  cardActions: { flexShrink: 0, gap: 6, alignItems: "stretch", minWidth: 100 },
  viewBtnGrow: { flexGrow: 1, minWidth: 120 },
  addBtnGrow: { flexGrow: 1, minWidth: 120 },
  viewBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: radius.sm,
    alignItems: "center",
  },
  viewBtnText: { fontSize: 12, fontWeight: "700", color: "#6366f1" },
  addBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: "#6366f1",
    borderRadius: radius.sm,
    alignItems: "center",
  },
  addBtnMuted: { backgroundColor: "#e2e8f0" },
  addBtnDisabled: { opacity: 0.75 },
  addBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  addBtnTextDisabled: { fontSize: 12, fontWeight: "700", color: "#94a3b8" },
  toast: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 50,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
    maxWidth: 520,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  toastOk: { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0" },
  toastErr: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca" },
  toastText: { fontSize: 13, fontWeight: "600", textAlign: "center", color: "#0f172a" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  modalClose: { fontSize: 18, color: "#94a3b8", padding: 4 },
  pickerRow: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e2e8f0",
  },
  pickerRowText: { fontSize: 15, color: "#0f172a" },
  pickerRowTextSelected: { color: "#6366f1", fontWeight: "700" },
  pickerRowTextMuted: { fontSize: 15, color: "#94a3b8" },
});
