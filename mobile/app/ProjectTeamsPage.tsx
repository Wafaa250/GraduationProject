import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
    type ListRenderItem,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
    generateDoctorProjectTeams,
    getDoctorProjectTeams,
    type DoctorProjectTeam,
} from "@/api/doctorCoursesApi";

// ============================================================================
// Mobile theme tokens (aligned with CourseWorkspacePage / SectionStudentsPage).
// ============================================================================

const dash = {
    bg: "#f1f5f9",
    surface: "#ffffff",
    border: "#e2e8f0",
    text: "#0f172a",
    muted: "#64748b",
    subtle: "#94a3b8",
    accent: "#4f46e5",
    accentMuted: "#eef2ff",
    danger: "#b91c1c",
} as const;

const AVATAR_PALETTE = [
    { bg: "#e0e7ff", fg: "#4338ca" },
    { bg: "#dcfce7", fg: "#15803d" },
    { bg: "#fee2e2", fg: "#b91c1c" },
    { bg: "#fef3c7", fg: "#a16207" },
    { bg: "#fce7f3", fg: "#be185d" },
    { bg: "#e0f2fe", fg: "#0369a1" },
];

function avatarColors(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) {
        hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function pickParam(v: string | string[] | undefined): string | undefined {
    if (v == null) return undefined;
    const s = Array.isArray(v) ? v[0] : v;
    const t = s?.trim();
    return t && t.length > 0 ? t : undefined;
}

function parseId(raw: string | undefined): number | null {
    if (!raw) return null;
    if (/^\d+$/.test(raw.trim())) {
        const n = Number(raw);
        return Number.isFinite(n) && n > 0 ? n : null;
    }
    return null;
}

type AiMode = "doctor" | "student";

// ============================================================================
// Screen.
// ============================================================================

export default function ProjectTeamsPage() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        courseId?: string;
        projectId?: string;
        projectTitle?: string;
        aiMode?: string;
        role?: string;
    }>();

    const courseIdStr = pickParam(params.courseId);
    const projectIdStr = pickParam(params.projectId);
    const backendCourseId = parseId(courseIdStr);
    const backendProjectId = parseId(projectIdStr);
    const projectTitle = pickParam(params.projectTitle) ?? "Project teams";
    const aiMode: AiMode =
        pickParam(params.aiMode) === "student" ? "student" : "doctor";
    const role = (pickParam(params.role) ?? "doctor").toLowerCase();
    const isDoctor = role === "doctor";

    const { width } = useWindowDimensions();
    const styles = useMemo(() => createStyles(width), [width]);

    const [teams, setTeams] = useState<DoctorProjectTeam[]>([]);
    const [teamSize, setTeamSize] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);

    const goBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace("/" as Href);
    };

    const fetchTeams = useCallback(
        async (opts?: { silent?: boolean }) => {
            if (backendCourseId == null || backendProjectId == null) {
                setLoading(false);
                setError("Missing or invalid course/project id.");
                return;
            }
            if (!opts?.silent) setLoading(true);
            setError(null);
            try {
                const res = await getDoctorProjectTeams(
                    backendCourseId,
                    backendProjectId,
                );
                setTeams(res.teams);
                setTeamSize(res.teamSize > 0 ? res.teamSize : null);
            } catch (err) {
                setError(parseApiErrorMessage(err));
            } finally {
                if (!opts?.silent) setLoading(false);
            }
        },
        [backendCourseId, backendProjectId],
    );

    // Refresh when the screen gains focus (e.g. returning after AI generation).
    useFocusEffect(
        useCallback(() => {
            void fetchTeams();
        }, [fetchTeams]),
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchTeams({ silent: true });
        setRefreshing(false);
    }, [fetchTeams]);

    const onGenerate = useCallback(async () => {
        if (generating) return;
        if (backendCourseId == null || backendProjectId == null) {
            setError("Missing or invalid course/project id.");
            return;
        }
        setGenerating(true);
        setError(null);
        try {
            const res = await generateDoctorProjectTeams(
                backendCourseId,
                backendProjectId,
            );
            setTeams(res.teams);
            setTeamSize(res.teamSize > 0 ? res.teamSize : null);
        } catch (err) {
            setError(parseApiErrorMessage(err));
        } finally {
            setGenerating(false);
        }
    }, [backendCourseId, backendProjectId, generating]);

    const teamCount = teams.length;
    const showDoctorAi = isDoctor && aiMode === "doctor";

    const renderTeam: ListRenderItem<DoctorProjectTeam> = useCallback(
        ({ item, index }) => {
            const label = `Team ${item.teamIndex > 0 ? item.teamIndex : index + 1}`;
            return (
                <View style={styles.teamCard}>
                    <View style={styles.teamCardHeader}>
                        <Text style={styles.teamCardTitle}>{label}</Text>
                        <View style={styles.memberCountChip}>
                            <Ionicons name="people-outline" size={11} color={dash.accent} />
                            <Text style={styles.memberCountChipText}>
                                {item.memberCount}{" "}
                                {item.memberCount === 1 ? "member" : "members"}
                            </Text>
                        </View>
                    </View>
                    <View style={{ gap: 8 }}>
                        {item.members.map((m, memberIdx) => {
                            const c = avatarColors(m.name || "Student");
                            const isLeader = memberIdx === 0;
                            const skillsLine =
                                m.skills && m.skills.length > 0
                                    ? m.skills.slice(0, 3).join(" · ")
                                    : null;
                            return (
                                <View key={`${item.teamId}-${m.studentId}`} style={styles.memberRow}>
                                    <View
                                        style={[styles.memberAvatar, { backgroundColor: c.bg }]}
                                    >
                                        <Text style={[styles.memberAvatarText, { color: c.fg }]}>
                                            {initialsOf(m.name || "?")}
                                        </Text>
                                    </View>
                                    <View style={styles.memberInfo}>
                                        <Text style={styles.memberName} numberOfLines={1}>
                                            {m.name?.trim() || "Student"}
                                        </Text>
                                        <Text style={styles.memberMeta} numberOfLines={1}>
                                            {isLeader ? "Leader" : "Member"}
                                            {skillsLine ? ` · ${skillsLine}` : ""}
                                        </Text>
                                    </View>
                                    {isLeader ? (
                                        <View style={styles.leaderBadge}>
                                            <Text style={styles.leaderBadgeText}>Leader</Text>
                                        </View>
                                    ) : null}
                                </View>
                            );
                        })}
                    </View>
                </View>
            );
        },
        [styles],
    );

    const listEmpty = useMemo(() => {
        if (loading) return null;
        return (
            <View style={styles.emptyWrap}>
                <View style={styles.emptyIcon}>
                    <Ionicons
                        name={aiMode === "doctor" ? "sparkles-outline" : "people-outline"}
                        size={28}
                        color={dash.accent}
                    />
                </View>
                <Text style={styles.emptyTitle}>No teams formed yet</Text>
                <Text style={styles.emptyBody}>
                    {aiMode === "doctor"
                        ? "Use the AI engine to form balanced teams from enrolled students."
                        : "Students have not formed any teams for this project yet."}
                </Text>
                {showDoctorAi ? (
                    <Pressable
                        accessibilityRole="button"
                        disabled={generating}
                        onPress={() => void onGenerate()}
                        style={({ pressed }) => [
                            styles.primaryBtn,
                            styles.primaryBtnBig,
                            pressed && styles.pressedOpacity,
                            generating && styles.btnDisabled,
                        ]}
                    >
                        {generating ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Ionicons name="sparkles" size={16} color="#fff" />
                        )}
                        <Text style={styles.primaryBtnText}>
                            {generating ? "Generating…" : "Generate AI teams"}
                        </Text>
                    </Pressable>
                ) : null}
            </View>
        );
    }, [loading, aiMode, showDoctorAi, generating, onGenerate, styles]);

    return (
        <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
            >
                <View style={styles.topBar}>
                    <Pressable
                        accessibilityRole="button"
                        onPress={goBack}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        style={({ pressed }) => [
                            styles.topBarBtn,
                            pressed && styles.pressedOpacity,
                        ]}
                    >
                        <Ionicons name="chevron-back" size={24} color={dash.text} />
                        <Text style={styles.topBarBtnText}>Course</Text>
                    </Pressable>
                    <View style={styles.topBarTitleCol}>
                        <Text style={styles.topBarKicker}>PROJECT TEAMS</Text>
                        <Text style={styles.topBarTitle} numberOfLines={1}>
                            {projectTitle}
                        </Text>
                    </View>
                    <View style={styles.topBarRightSpacer} />
                </View>

                <View style={styles.metaRow}>
                    <View style={styles.metaChip}>
                        <Ionicons
                            name={aiMode === "doctor" ? "sparkles-outline" : "person-outline"}
                            size={11}
                            color={dash.accent}
                        />
                        <Text style={styles.metaChipText}>
                            {aiMode === "doctor" ? "AI assigns" : "Students pick"}
                        </Text>
                    </View>
                    <View style={styles.metaChip}>
                        <Ionicons name="people-outline" size={11} color={dash.muted} />
                        <Text style={styles.metaChipMutedText}>
                            {loading
                                ? "Loading…"
                                : `${teamCount} ${teamCount === 1 ? "team" : "teams"}`}
                        </Text>
                    </View>
                    {teamSize != null ? (
                        <View style={styles.metaChip}>
                            <Ionicons name="cube-outline" size={11} color={dash.muted} />
                            <Text style={styles.metaChipMutedText}>
                                Team size {teamSize}
                            </Text>
                        </View>
                    ) : null}
                </View>

                {showDoctorAi && teams.length > 0 ? (
                    <View style={styles.actionsRow}>
                        <Pressable
                            accessibilityRole="button"
                            disabled={generating || loading}
                            onPress={() => void onGenerate()}
                            style={({ pressed }) => [
                                styles.regenerateBtn,
                                pressed && styles.pressedOpacity,
                                (generating || loading) && styles.btnDisabled,
                            ]}
                        >
                            {generating ? (
                                <ActivityIndicator size="small" color={dash.accent} />
                            ) : (
                                <Ionicons name="refresh" size={14} color={dash.accent} />
                            )}
                            <Text style={styles.regenerateBtnText}>
                                {generating ? "Regenerating…" : "Regenerate"}
                            </Text>
                        </Pressable>
                    </View>
                ) : null}

                {error ? (
                    <View style={styles.errorWrap}>
                        <Ionicons name="alert-circle-outline" size={16} color={dash.danger} />
                        <Text style={styles.errorText}>{error}</Text>
                        <Pressable
                            onPress={() => void fetchTeams()}
                            hitSlop={8}
                            style={({ pressed }) => [
                                styles.errorRetryBtn,
                                pressed && styles.pressedOpacity,
                            ]}
                        >
                            <Text style={styles.errorRetryText}>Retry</Text>
                        </Pressable>
                    </View>
                ) : null}

                {loading && teams.length === 0 ? (
                    <View style={styles.centerBlock}>
                        <ActivityIndicator size="large" color={dash.accent} />
                        <Text style={styles.centerBlockText}>Loading teams…</Text>
                    </View>
                ) : (
                    <FlatList<DoctorProjectTeam>
                        style={styles.flex}
                        data={teams}
                        renderItem={renderTeam}
                        keyExtractor={(t, i) =>
                            t.teamId ? `t-${t.teamId}` : `t-idx-${t.teamIndex}-${i}`
                        }
                        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={listEmpty}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={dash.accent}
                                colors={[dash.accent]}
                            />
                        }
                        initialNumToRender={6}
                        windowSize={9}
                        removeClippedSubviews={Platform.OS === "android"}
                    />
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ============================================================================
// Styles.
// ============================================================================

function getLayoutTokens(screenWidth: number) {
    const narrow = screenWidth < 360;
    const compact = screenWidth < 400;
    return {
        gutter: narrow ? 14 : compact ? 15 : 18,
        titleSize: compact ? 16 : 17,
    };
}

function createStyles(screenWidth: number) {
    const t = getLayoutTokens(screenWidth);
    const hair = StyleSheet.hairlineWidth;
    const hairlineColor = "rgba(15,23,42,0.08)";
    const subtleBg = "#f8fafc";

    return StyleSheet.create({
        safe: { flex: 1, backgroundColor: dash.bg },
        flex: { flex: 1 },
        pressedOpacity: { opacity: 0.65 },

        topBar: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: t.gutter,
            paddingTop: 6,
            paddingBottom: 8,
            gap: 8,
        },
        topBarBtn: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 4,
            paddingVertical: 4,
            gap: 2,
            flexShrink: 0,
        },
        topBarBtnText: {
            fontSize: 14,
            color: dash.text,
            fontWeight: "500",
        },
        topBarTitleCol: {
            flex: 1,
            minWidth: 0,
            alignItems: "center",
            paddingHorizontal: 6,
        },
        topBarKicker: {
            fontSize: 10,
            fontWeight: "700",
            color: dash.subtle,
            letterSpacing: 0.6,
            textTransform: "uppercase",
        },
        topBarTitle: {
            marginTop: 2,
            fontSize: t.titleSize,
            fontWeight: "700",
            color: dash.text,
            letterSpacing: -0.2,
            textAlign: "center",
        },
        topBarRightSpacer: {
            width: 56,
        },

        metaRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
            paddingHorizontal: t.gutter,
            paddingBottom: 8,
        },
        metaChip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: 9,
            paddingVertical: 5,
            borderRadius: 999,
            backgroundColor: subtleBg,
            borderWidth: hair,
            borderColor: hairlineColor,
        },
        metaChipText: {
            fontSize: 11,
            fontWeight: "700",
            color: dash.accent,
            letterSpacing: 0.3,
            textTransform: "uppercase",
        },
        metaChipMutedText: {
            fontSize: 11,
            fontWeight: "700",
            color: dash.muted,
            letterSpacing: 0.3,
            textTransform: "uppercase",
        },

        actionsRow: {
            flexDirection: "row",
            justifyContent: "flex-end",
            paddingHorizontal: t.gutter,
            paddingBottom: 8,
        },
        regenerateBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingVertical: 7,
            paddingHorizontal: 12,
            borderRadius: 999,
            backgroundColor: dash.accentMuted,
        },
        regenerateBtnText: {
            fontSize: 12,
            fontWeight: "700",
            color: dash.accent,
            letterSpacing: 0.2,
        },

        errorWrap: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginHorizontal: t.gutter,
            marginBottom: 10,
            padding: 12,
            borderRadius: 12,
            backgroundColor: "#fef2f2",
            borderWidth: hair,
            borderColor: "#fecaca",
        },
        errorText: {
            flex: 1,
            fontSize: 13,
            color: dash.danger,
            fontWeight: "600",
        },
        errorRetryBtn: {
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: dash.surface,
            borderWidth: hair,
            borderColor: "#fecaca",
        },
        errorRetryText: {
            fontSize: 12,
            fontWeight: "700",
            color: dash.danger,
        },

        listContent: {
            paddingHorizontal: t.gutter,
            paddingTop: 4,
            paddingBottom: 32,
            flexGrow: 1,
        },

        teamCard: {
            backgroundColor: dash.surface,
            borderRadius: 14,
            padding: 14,
            borderWidth: hair,
            borderColor: hairlineColor,
            ...Platform.select({
                ios: {
                    shadowColor: "#0f172a",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                },
                android: { elevation: 1 },
                default: {},
            }),
        },
        teamCardHeader: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
        },
        teamCardTitle: {
            fontSize: 15,
            fontWeight: "700",
            color: dash.text,
            letterSpacing: -0.2,
        },
        memberCountChip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: dash.accentMuted,
        },
        memberCountChipText: {
            fontSize: 11,
            fontWeight: "700",
            color: dash.accent,
            letterSpacing: 0.2,
        },

        memberRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingVertical: 6,
            paddingHorizontal: 4,
            borderRadius: 10,
        },
        memberAvatar: {
            width: 38,
            height: 38,
            borderRadius: 19,
            alignItems: "center",
            justifyContent: "center",
        },
        memberAvatarText: {
            fontSize: 13,
            fontWeight: "700",
        },
        memberInfo: { flex: 1, minWidth: 0 },
        memberName: {
            fontSize: 14,
            fontWeight: "700",
            color: dash.text,
        },
        memberMeta: {
            marginTop: 2,
            fontSize: 12,
            color: dash.muted,
        },
        leaderBadge: {
            paddingHorizontal: 7,
            paddingVertical: 2,
            borderRadius: 6,
            backgroundColor: "#fef3c7",
        },
        leaderBadgeText: {
            fontSize: 10,
            fontWeight: "700",
            color: "#a16207",
            letterSpacing: 0.3,
            textTransform: "uppercase",
        },

        emptyWrap: {
            alignItems: "center",
            paddingVertical: 36,
            paddingHorizontal: 18,
            backgroundColor: dash.surface,
            borderRadius: 16,
            borderWidth: hair,
            borderColor: hairlineColor,
            gap: 10,
        },
        emptyIcon: {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: dash.accentMuted,
            alignItems: "center",
            justifyContent: "center",
        },
        emptyTitle: {
            fontSize: 15,
            fontWeight: "700",
            color: dash.text,
        },
        emptyBody: {
            fontSize: 13,
            color: dash.muted,
            textAlign: "center",
            lineHeight: 19,
        },

        primaryBtn: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 12,
            backgroundColor: dash.accent,
            ...Platform.select({
                ios: {
                    shadowColor: dash.accent,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.22,
                    shadowRadius: 7,
                },
                android: { elevation: 3 },
                default: {},
            }),
        },
        primaryBtnBig: {
            paddingVertical: 12,
            paddingHorizontal: 22,
            marginTop: 6,
        },
        primaryBtnText: {
            color: "#fff",
            fontSize: 14,
            fontWeight: "700",
            letterSpacing: -0.1,
        },
        btnDisabled: { opacity: 0.55 },

        centerBlock: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            paddingHorizontal: 24,
        },
        centerBlockText: {
            fontSize: 13,
            fontWeight: "600",
            color: dash.muted,
        },
    });
}
