import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getAvailableStudents,
  getGraduationProjectById,
  getGraduationProjectsMyEnvelope,
  inviteStudentToProject,
  type ProjectAvailableStudent,
} from "@/api/gradProjectApi";
import { getStudentBrowseFilterOptions } from "@/api/studentProfileApi";
import {
  BEST_MATCH_SCORE_THRESHOLD,
  filterAvailableStudents,
  splitStudentsByMatchScore,
} from "@/lib/browseAvailableStudentsUtils";
import {
  buildGradProjectInviteContext,
  filterGradProjectInviteCandidates,
} from "@/lib/gradProjectInviteUtils";
import { MobileNavHeader } from "@/components/navigation/MobileNavHeader";
import { ChipList } from "@/components/student/ChipList";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { profileInitialsFromName } from "@/lib/profileAvatar";
import { studentDirectoryProfilePath, STUDENT_ROUTES } from "@/lib/studentRoutes";

function inviteDisabledReason(
  student: ProjectAvailableStudent,
  isTeamFull: boolean,
): string | null {
  if (isTeamFull || student.isProjectFull) return "Team full";
  if (student.isMember) return "Member";
  if (student.hasPendingInvite) return "Pending";
  if (!student.canInvite) return "Unavailable";
  return null;
}

export default function BrowseProjectStudentsScreen() {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { projectId: projectIdParam } = useLocalSearchParams<{ projectId?: string }>();
  const projectId = Number(projectIdParam ?? 0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<ProjectAvailableStudent[]>([]);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [skill, setSkill] = useState("");
  const [filterOptions, setFilterOptions] = useState({
    universities: [] as string[],
    majors: [] as string[],
    skills: [] as string[],
  });
  const [invitingId, setInvitingId] = useState<number | null>(null);
  const [isTeamFull, setIsTeamFull] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!Number.isFinite(projectId) || projectId <= 0) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const [envelope, project, rows, filters] = await Promise.all([
        getGraduationProjectsMyEnvelope(),
        getGraduationProjectById(projectId),
        getAvailableStudents(projectId),
        getStudentBrowseFilterOptions().catch(() => ({
          universities: [],
          majors: [],
          skills: [],
        })),
      ]);
      const isProjectOwner =
        envelope.role === "owner" ||
        envelope.project?.isOwner === true ||
        envelope.project?.id === projectId;
      if (!isProjectOwner) {
        Alert.alert(
          "Not authorized",
          "Only the project owner can browse and invite students.",
        );
        router.replace(STUDENT_ROUTES.graduationProjectWorkspace as never);
        return;
      }
      setIsOwner(true);
      setProjectName(project.name);
      setIsTeamFull(project.isFull);
      setFilterOptions(filters);
      setStudents(
        filterGradProjectInviteCandidates(rows, buildGradProjectInviteContext(project)),
      );
    } catch (err) {
      Alert.alert("Could not load students", parseApiErrorMessage(err));
      setStudents([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      filterAvailableStudents(students, {
        search,
        university,
        major,
        skill,
      }),
    [major, search, skill, students, university],
  );

  const hasActiveFilters = Boolean(search || university || major || skill);

  const { recommended, others } = useMemo(
    () => splitStudentsByMatchScore(filtered),
    [filtered],
  );

  const renderStudentCard = (student: ProjectAvailableStudent) => {
    const disabled = inviteDisabledReason(student, isTeamFull);
    const busy = invitingId === student.studentId;
    return (
      <View
        key={student.studentId}
        style={[styles.card, { borderRadius: layout.radius.input, padding: layout.space("md") }]}
      >
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profileInitialsFromName(student.name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{student.name}</Text>
            <Text style={styles.meta}>
              {[student.major, student.university].filter(Boolean).join(" · ")}
            </Text>
          </View>
          {student.matchScore > 0 ? (
            <Text style={styles.score}>{student.matchScore}%</Text>
          ) : null}
        </View>
        {student.skills.length > 0 ? <ChipList items={student.skills.slice(0, 5)} /> : null}
        <View style={styles.cardActions}>
          <Pressable
            style={[styles.secondaryBtn, { borderRadius: layout.radius.input }]}
            onPress={() => router.push(studentDirectoryProfilePath(student.userId) as never)}
          >
            <Text style={styles.secondaryBtnText}>View profile</Text>
          </Pressable>
          {disabled ? (
            <Pressable
              style={[
                styles.inviteBtn,
                { borderRadius: layout.radius.input, flex: 1 },
                styles.inviteBtnDisabled,
              ]}
              disabled
            >
              <Text style={styles.inviteBtnText}>{disabled}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[
                styles.inviteBtn,
                { borderRadius: layout.radius.input, flex: 1 },
                busy && styles.inviteBtnDisabled,
              ]}
              disabled={busy}
              onPress={() => void handleInvite(student)}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.inviteBtnText}>Invite</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  const handleInvite = async (student: ProjectAvailableStudent) => {
    if (!isOwner || inviteDisabledReason(student, isTeamFull)) return;
    setInvitingId(student.studentId);
    try {
      await inviteStudentToProject(projectId, student.studentId);
      setStudents((prev) => prev.filter((s) => s.studentId !== student.studentId));
      Alert.alert("Invitation sent", `${student.name} has been invited.`);
    } catch (err) {
      Alert.alert("Invitation failed", parseApiErrorMessage(err));
    } finally {
      setInvitingId(null);
    }
  };

  if (!Number.isFinite(projectId) || projectId <= 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <MobileNavHeader
          title="Browse students"
          fallbackHref={STUDENT_ROUTES.graduationProjectWorkspace}
          backColor={colors.foreground}
          titleColor={colors.foreground}
          backgroundColor={colors.background}
          borderColor={colors.border}
        />
        <View style={styles.centered}>
          <Text style={styles.muted}>Invalid project link.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isOwner) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <MobileNavHeader
          title="Browse students"
          fallbackHref={STUDENT_ROUTES.graduationProjectWorkspace}
          backColor={colors.foreground}
          titleColor={colors.foreground}
          backgroundColor={colors.background}
          borderColor={colors.border}
        />
        <View style={styles.centered}>
          <Text style={styles.muted}>Only the project owner can invite students.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <MobileNavHeader
        title="Browse students"
        fallbackHref={STUDENT_ROUTES.graduationProjectWorkspace}
        backColor={colors.foreground}
        titleColor={colors.foreground}
        backgroundColor={colors.background}
        borderColor={colors.border}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.horizontalPadding,
          paddingTop: layout.space("md"),
          paddingBottom: layout.space("xl"),
          gap: layout.space("md"),
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true).finally(() => setRefreshing(false));
            }}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.subtitle}>
          Invite classmates to join{" "}
          <Text style={styles.subtitleStrong}>{projectName ?? `Project #${projectId}`}</Text>.
        </Text>
        {isTeamFull ? (
          <Text style={styles.teamFullWarning}>Team is full — no more invitations can be sent.</Text>
        ) : null}
        <View style={[styles.searchWrap, { borderRadius: layout.radius.input }]}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, major, skills…"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
        </View>

        <FilterRow
          label="University"
          value={university}
          options={filterOptions.universities}
          onSelect={setUniversity}
          colors={colors}
        />
        <FilterRow
          label="Major"
          value={major}
          options={filterOptions.majors}
          onSelect={setMajor}
          colors={colors}
        />
        <FilterRow
          label="Skill"
          value={skill}
          options={filterOptions.skills}
          onSelect={setSkill}
          colors={colors}
        />
        {hasActiveFilters ? (
          <Pressable
            onPress={() => {
              setSearch("");
              setUniversity("");
              setMajor("");
              setSkill("");
            }}
          >
            <Text style={styles.clearFilters}>Clear filters</Text>
          </Pressable>
        ) : null}

        {filtered.length === 0 ? (
          <HubSectionCard title="Students">
            <Text style={styles.muted}>
              {hasActiveFilters ? "No students match your filters." : "No students match your search."}
            </Text>
          </HubSectionCard>
        ) : (
          <>
            <HubSectionCard
              title="Best matches"
              description={`${recommended.length} students with ${BEST_MATCH_SCORE_THRESHOLD}%+ skill match`}
            >
              {recommended.length === 0 ? (
                <Text style={styles.muted}>No best-match students in this view.</Text>
              ) : (
                <View style={{ gap: layout.space("md") }}>
                  {recommended.map((student) => renderStudentCard(student))}
                </View>
              )}
            </HubSectionCard>
            <HubSectionCard title="Other students" description={`${others.length} students`}>
              {others.length === 0 ? (
                <Text style={styles.muted}>No other students in this view.</Text>
              ) : (
                <View style={{ gap: layout.space("md") }}>
                  {others.map((student) => renderStudentCard(student))}
                </View>
              )}
            </HubSectionCard>
          </>
        )}

        <Pressable
          style={[styles.backLink, { borderRadius: layout.radius.button }]}
          onPress={() => router.push(STUDENT_ROUTES.graduationProjectWorkspace as never)}
        >
          <Text style={styles.backLinkText}>Back to workspace</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterRow({
  label,
  value,
  options,
  onSelect,
  colors,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (next: string) => void;
  colors: HubColorScheme;
}) {
  if (options.length === 0) return null;
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: "700", fontSize: 13, color: colors.foreground }}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 8, paddingRight: 8 }}>
          <Pressable
            onPress={() => onSelect("")}
            style={{
              borderWidth: 1,
              borderColor: !value ? colors.primaryBorder : colors.border,
              backgroundColor: !value ? colors.primarySoft : colors.cardBg,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: !value ? colors.primary : colors.muted }}>
              All
            </Text>
          </Pressable>
          {options.map((opt) => {
            const selected = value === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => onSelect(selected ? "" : opt)}
                style={{
                  borderWidth: 1,
                  borderColor: selected ? colors.primaryBorder : colors.border,
                  backgroundColor: selected ? colors.primarySoft : colors.cardBg,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: selected ? colors.primary : colors.muted,
                  }}
                >
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
    subtitleStrong: { color: colors.foreground, fontWeight: "600" },
    teamFullWarning: { color: "#DC2626", fontSize: 14, fontWeight: "600" },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBg,
      paddingHorizontal: 12,
      minHeight: 44,
    },
    searchInput: { flex: 1, color: colors.foreground, fontSize: 15, paddingVertical: 8 },
    clearFilters: {
      alignSelf: "flex-start",
      color: colors.primary,
      fontWeight: "700",
      fontSize: 13,
    },
    card: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardBg, gap: 10 },
    cardTop: { flexDirection: "row", gap: 12, alignItems: "center" },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontWeight: "800", color: colors.primary, fontSize: 13 },
    name: { fontWeight: "700", color: colors.foreground, fontSize: 15 },
    meta: { color: colors.muted, fontSize: 13, marginTop: 2 },
    score: { fontWeight: "700", color: colors.primary, fontSize: 13 },
    cardActions: { flexDirection: "row", gap: 8, marginTop: 4 },
    secondaryBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      minHeight: 40,
      backgroundColor: colors.cardBg,
    },
    secondaryBtnText: { color: colors.foreground, fontWeight: "700", fontSize: 13 },
    inviteBtn: {
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      minHeight: 40,
    },
    inviteBtnDisabled: { opacity: 0.55 },
    inviteBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
    muted: { color: colors.muted, fontSize: 14 },
    backLink: {
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      alignItems: "center",
    },
    backLinkText: { color: colors.primary, fontWeight: "700" },
  });
