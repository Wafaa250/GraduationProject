import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getGraduationProjectsMyEnvelope,
  joinGraduationProject,
  listGraduationProjects,
  type GradProject,
} from "@/api/gradProjectApi";
import { getMe } from "@/api/meApi";
import { PublicProfileShell } from "@/components/student/PublicProfileShell";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import {
  collectBrowseSkillOptions,
  computeSkillMatchScore,
  getBrowseTeamStatus,
  isBrowseableProject,
  mergeMySkills,
  projectTypeLabel,
  type BrowseTeamStatus,
} from "@/lib/browseProjectsUtils";
import {
  getBrowseProjectTypeFilters,
  type GraduationProjectType,
} from "@/lib/graduationProjectTypes";
import { STUDENT_ROUTES } from "@/lib/studentRoutes";

type ProjectTypeFilter = "All" | GraduationProjectType;
type SortKey = "match" | "newest" | "open";
type BrowseRow = GradProject & { matchScore: number; teamStatus: BrowseTeamStatus };

const TEAM_STATUSES: BrowseTeamStatus[] = ["Open", "Forming team", "Almost full"];

function FilterPill({
  active,
  label,
  onPress,
}: {
  active?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function BrowseProjectsScreen() {
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();
  const deepLinkProjectId = Number(projectId ?? 0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasTeam, setHasTeam] = useState(false);
  const [myProfileId, setMyProfileId] = useState(0);
  const [myFaculty, setMyFaculty] = useState<string | null>(null);
  const [myMajor, setMyMajor] = useState<string | null>(null);
  const [mySkills, setMySkills] = useState<string[]>([]);
  const [projects, setProjects] = useState<GradProject[]>([]);
  const [search, setSearch] = useState("");
  const [projectType, setProjectType] = useState<ProjectTypeFilter>("All");
  const [skillFilter, setSkillFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BrowseTeamStatus | null>(null);
  const [sort, setSort] = useState<SortKey>("match");
  const [detail, setDetail] = useState<BrowseRow | null>(null);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);
    try {
      const [me, envelope, rows] = await Promise.all([
        getMe(),
        getGraduationProjectsMyEnvelope(),
        listGraduationProjects(),
      ]);
      setMyProfileId(me.profileId);
      setMyFaculty(me.faculty ?? null);
      setMyMajor(me.major ?? null);
      setMySkills(mergeMySkills(me));
      setHasTeam(envelope.role === "owner" || envelope.role === "member");
      setProjects(rows);
    } catch (err) {
      setLoadError(parseApiErrorMessage(err));
      setProjects([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const projectTypeFilters = useMemo(
    () => getBrowseProjectTypeFilters(myFaculty, myMajor),
    [myFaculty, myMajor],
  );

  const skillOptions = useMemo(() => collectBrowseSkillOptions(projects), [projects]);

  const rows = useMemo((): BrowseRow[] => {
    if (hasTeam || !myProfileId) return [];
    return projects
      .filter((p) => isBrowseableProject(p, myProfileId, myFaculty, myMajor))
      .map((p) => ({
        ...p,
        matchScore: computeSkillMatchScore(mySkills, p.requiredSkills),
        teamStatus: getBrowseTeamStatus(p),
      }));
  }, [hasTeam, myProfileId, myFaculty, myMajor, projects, mySkills]);

  useEffect(() => {
    if (!deepLinkProjectId || loading || hasTeam || rows.length === 0) return;
    const match = rows.find((p) => p.id === deepLinkProjectId);
    if (match) setDetail(match);
  }, [deepLinkProjectId, loading, hasTeam, rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows;
    if (projectType !== "All") {
      list = list.filter((p) => (p.projectType ?? "GP") === projectType);
    }
    if (skillFilter) {
      list = list.filter((p) => {
        const skills = [...(p.requiredSkills ?? []), ...(p.technologies ?? [])];
        return skills.some((s) => s.toLowerCase() === skillFilter.toLowerCase());
      });
    }
    if (statusFilter) {
      list = list.filter((p) => p.teamStatus === statusFilter);
    }
    if (q) {
      list = list.filter((p) => {
        const hay = [
          p.name,
          p.abstract ?? "",
          p.ownerName ?? "",
          ...(p.requiredSkills ?? []),
          ...(p.technologies ?? []),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    const sorted = [...list];
    if (sort === "match") {
      sorted.sort((a, b) => b.matchScore - a.matchScore);
    } else if (sort === "newest") {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
      );
    } else {
      sorted.sort((a, b) => {
        const ar =
          a.remainingSeats ??
          Math.max(0, a.partnersCount - (a.currentMembers ?? a.members.length));
        const br =
          b.remainingSeats ??
          Math.max(0, b.partnersCount - (b.currentMembers ?? b.members.length));
        return br - ar;
      });
    }
    return sorted;
  }, [rows, search, projectType, skillFilter, statusFilter, sort]);

  const handleJoin = async (projectIdToJoin: number) => {
    setJoiningId(projectIdToJoin);
    try {
      await joinGraduationProject(projectIdToJoin);
      setDetail(null);
      Alert.alert("Joined project", "You are now on the graduation project team.", [
        {
          text: "Go to workspace",
          onPress: () => router.push(STUDENT_ROUTES.graduationProjectWorkspace as never),
        },
        { text: "OK" },
      ]);
    } catch (err) {
      Alert.alert("Could not join project", parseApiErrorMessage(err));
    } finally {
      setJoiningId(null);
    }
  };

  if (loading) {
    return (
      <PublicProfileShell title="Browse Projects" fallbackHref="/feed">
        <View style={styles.centered}>
          <ActivityIndicator color={HUB_COLORS.primary} />
          <Text style={styles.muted}>Loading projects…</Text>
        </View>
      </PublicProfileShell>
    );
  }

  if (loadError) {
    return (
      <PublicProfileShell title="Browse Projects" fallbackHref="/feed">
        <View style={styles.centered}>
          <Text style={styles.error}>{loadError}</Text>
          <Pressable style={styles.primaryBtn} onPress={() => void load()}>
            <Text style={styles.primaryBtnText}>Retry</Text>
          </Pressable>
        </View>
      </PublicProfileShell>
    );
  }

  if (hasTeam) {
    return (
      <PublicProfileShell title="Browse Projects" fallbackHref="/feed">
        <View style={styles.centered}>
          <Ionicons name="school-outline" size={48} color={HUB_COLORS.primary} />
          <Text style={styles.emptyTitle}>You already belong to a graduation project</Text>
          <Text style={styles.muted}>
            Browse Projects is available only for students who have not joined a graduation project.
          </Text>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => router.push(STUDENT_ROUTES.graduationProjectWorkspace as never)}
          >
            <Text style={styles.primaryBtnText}>Go to My Graduation Project</Text>
          </Pressable>
        </View>
      </PublicProfileShell>
    );
  }

  return (
    <PublicProfileShell title="Browse Projects" fallbackHref="/feed">
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={HUB_COLORS.primary}
          />
        }
      >
        <Text style={styles.eyebrow}>Discover</Text>
        <Text style={styles.title}>Browse graduation projects</Text>
        <Text style={styles.subtitle}>
          Find projects that match your skills, interests, and ambitions for this term.
        </Text>

        <View style={styles.surface}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={HUB_COLORS.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by title, keyword, or skill…"
              placeholderTextColor={HUB_COLORS.muted}
              style={styles.searchInput}
            />
          </View>

          <Text style={styles.filterLabel}>Project type</Text>
          <View style={styles.pillRow}>
            {projectTypeFilters.map(({ value, label }) => (
              <FilterPill
                key={value}
                label={label}
                active={projectType === value}
                onPress={() => setProjectType(value)}
              />
            ))}
          </View>

          {skillOptions.length > 0 ? (
            <>
              <Text style={styles.filterLabel}>Skills</Text>
              <View style={styles.pillRow}>
                {skillOptions.map((skill) => (
                  <FilterPill
                    key={skill}
                    label={skill}
                    active={skillFilter === skill}
                    onPress={() => setSkillFilter(skillFilter === skill ? null : skill)}
                  />
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.filterLabel}>Team status</Text>
          <View style={styles.pillRow}>
            {TEAM_STATUSES.map((status) => (
              <FilterPill
                key={status}
                label={status}
                active={statusFilter === status}
                onPress={() => setStatusFilter(statusFilter === status ? null : status)}
              />
            ))}
          </View>
        </View>

        <View style={styles.resultsRow}>
          <Text style={styles.muted}>
            <Text style={styles.count}>{filtered.length}</Text> projects match your filters
          </Text>
          <View style={styles.sortRow}>
            {(
              [
                ["match", "AI match"],
                ["newest", "Newest"],
                ["open", "Open seats"],
              ] as const
            ).map(([key, label]) => (
              <Pressable
                key={key}
                style={[styles.sortPill, sort === key && styles.sortPillActive]}
                onPress={() => setSort(key)}
              >
                <Text style={[styles.sortText, sort === key && styles.sortTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No projects found</Text>
            <Text style={styles.muted}>
              Try adjusting your search or filters, or check back when new teams are recruiting.
            </Text>
          </View>
        ) : (
          filtered.map((project) => {
            const open =
              project.remainingSeats ??
              Math.max(
                0,
                project.partnersCount - (project.currentMembers ?? project.members.length),
              );
            const skills = [...(project.requiredSkills ?? []), ...(project.technologies ?? [])].slice(
              0,
              4,
            );
            return (
              <View key={project.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.chip}>
                    {projectTypeLabel(project, myFaculty, myMajor)}
                  </Text>
                  <Text style={styles.matchChip}>{project.matchScore}% match</Text>
                </View>
                <Text style={styles.cardTitle}>{project.name}</Text>
                <Text style={styles.cardAbstract} numberOfLines={3}>
                  {project.abstract?.trim() || "No abstract provided yet."}
                </Text>
                {skills.length > 0 ? (
                  <View style={styles.pillRow}>
                    {skills.map((skill) => (
                      <Text key={skill} style={styles.chip}>
                        {skill}
                      </Text>
                    ))}
                  </View>
                ) : null}
                <View style={styles.cardFooter}>
                  <Text style={styles.muted}>{project.partnersCount} max · {open} open</Text>
                  <Text style={styles.statusChip}>{project.teamStatus}</Text>
                </View>
                <Pressable style={styles.outlineBtn} onPress={() => setDetail(project)}>
                  <Text style={styles.outlineBtnText}>View project</Text>
                  <Ionicons name="arrow-up-outline" size={16} color={HUB_COLORS.primary} />
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={!!detail} transparent animationType="fade" onRequestClose={() => setDetail(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {detail ? (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eyebrow}>
                      {projectTypeLabel(detail, myFaculty, myMajor)}
                    </Text>
                    <Text style={styles.modalTitle}>{detail.name}</Text>
                  </View>
                  <Pressable onPress={() => setDetail(null)} hitSlop={8}>
                    <Ionicons name="close" size={24} color={HUB_COLORS.muted} />
                  </Pressable>
                </View>
                <Text style={styles.muted}>
                  {detail.abstract?.trim() || "No abstract provided."}
                </Text>
                {detail.ownerName ? (
                  <Text style={styles.ownerLine}>
                    Led by <Text style={styles.ownerName}>{detail.ownerName}</Text>
                  </Text>
                ) : null}
                <Text style={styles.muted}>
                  {detail.matchScore}% skill match · {detail.teamStatus}
                </Text>
                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.primaryBtn, joiningId === detail.id && styles.btnDisabled]}
                    onPress={() => void handleJoin(detail.id)}
                    disabled={joiningId === detail.id}
                  >
                    <Text style={styles.primaryBtnText}>
                      {joiningId === detail.id ? "Joining…" : "Join project team"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.outlineBtn}
                    onPress={() => {
                      setDetail(null);
                      router.push(`/projects/${detail.id}` as never);
                    }}
                  >
                    <Text style={styles.outlineBtnText}>View details</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </PublicProfileShell>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32, gap: 14 },
  centered: { alignItems: "center", gap: 12, paddingVertical: 40 },
  eyebrow: { fontSize: 12, fontWeight: "700", color: HUB_COLORS.primary, textTransform: "uppercase" },
  title: { fontSize: 24, fontWeight: "800", color: HUB_COLORS.foreground },
  subtitle: { color: HUB_COLORS.muted, lineHeight: 20, marginBottom: 4 },
  surface: {
    backgroundColor: HUB_COLORS.cardBg,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: HUB_COLORS.inputBg,
  },
  searchInput: { flex: 1, paddingVertical: 10, color: HUB_COLORS.foreground },
  filterLabel: { fontSize: 12, fontWeight: "700", color: HUB_COLORS.muted, marginTop: 4 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: HUB_COLORS.inputBg,
  },
  pillActive: { borderColor: HUB_COLORS.primary, backgroundColor: HUB_COLORS.primarySoft },
  pillText: { fontSize: 13, color: HUB_COLORS.foreground },
  pillTextActive: { color: HUB_COLORS.primary, fontWeight: "700" },
  resultsRow: { gap: 8 },
  count: { fontWeight: "700", color: HUB_COLORS.foreground },
  sortRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sortPill: {
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sortPillActive: { borderColor: HUB_COLORS.primary, backgroundColor: HUB_COLORS.primarySoft },
  sortText: { fontSize: 12, color: HUB_COLORS.muted },
  sortTextActive: { color: HUB_COLORS.primary, fontWeight: "700" },
  muted: { color: HUB_COLORS.muted, fontSize: 14, lineHeight: 20 },
  error: { color: "#DC2626", textAlign: "center" },
  emptyCard: {
    backgroundColor: HUB_COLORS.cardBg,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: HUB_COLORS.foreground, textAlign: "center" },
  card: {
    backgroundColor: HUB_COLORS.cardBg,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  chip: {
    fontSize: 11,
    color: HUB_COLORS.foreground,
    backgroundColor: HUB_COLORS.inputBg,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: "hidden",
  },
  matchChip: {
    fontSize: 11,
    fontWeight: "700",
    color: HUB_COLORS.primary,
    backgroundColor: HUB_COLORS.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", color: HUB_COLORS.foreground },
  cardAbstract: { color: HUB_COLORS.muted, lineHeight: 20 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusChip: { fontSize: 12, fontWeight: "700", color: HUB_COLORS.foreground },
  primaryBtn: {
    backgroundColor: HUB_COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
  },
  outlineBtnText: { color: HUB_COLORS.primary, fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: HUB_COLORS.cardBg,
    borderRadius: 14,
    padding: 18,
    gap: 10,
    maxHeight: "85%",
  },
  modalHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: HUB_COLORS.foreground },
  ownerLine: { fontSize: 14, color: HUB_COLORS.muted },
  ownerName: { fontWeight: "700", color: HUB_COLORS.foreground },
  modalActions: { gap: 8, marginTop: 8 },
});
