import { useEffect, useMemo, useRef, useState } from "react";
import { clearSession } from "@/utils/authStorage";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import { getDashboardSummary, type DashboardSummary } from "@/api/dashboardApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { fetchDoctorMeProfile, type DoctorMeProfile } from "@/api/meApi";
import {
    doctorDashboardApi,
    removeDoctorSupervision,
    type DoctorDashboardSummary,
    type DoctorSupervisedProject,
} from "@/api/doctorDashboardApi";
import {
    acceptSupervisorCancelRequest,
    acceptSupervisorRequest,
    getDoctorRequests,
    getDoctorSupervisorCancelRequests,
    rejectSupervisorCancelRequest,
    rejectSupervisorRequest,
    type SupervisorCancelRequestItem,
    type SupervisorRequest,
} from "@/api/supervisorApi";
import { getDoctorMyCourses, type DoctorCourse } from "@/api/doctorCoursesApi";
import {
    fetchUnreadChatNotificationCount,
    fetchUnreadCourseNotificationCount,
    fetchUnreadGraduationNotificationCount,
} from "@/api/notificationsApi";
import { apiClient } from "@/api/client";
import { subscribeInboxNotificationCreated } from "@/lib/notificationsHubInbox";

type DoctorDashboardSection =
    | "overview"
    | "requests"
    | "projects"
    | "deleted"
    | "courses";

type RequestRow = {
    kind: "supervision" | "cancellation";
    requestId: number;
    projectName: string;
    studentName: string;
    status: string;
};

type DeletedProjectRecord = {
    projectId: number;
    name: string;
    removedAt: string;
    source?: "remove";
};

type ProjectHighlight = {
    name: string;
    role: string;
    memberCount: number;
    maxTeamSize: number;
    isFull: boolean;
};

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

function formatDateTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "DR";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function isPendingRequestStatus(status: string): boolean {
    return status?.toLowerCase() === "pending";
}

function mergeDoctorRequestRows(
    supervisionRequests: SupervisorRequest[],
    cancelRequests: SupervisorCancelRequestItem[],
): RequestRow[] {
    return [
        ...supervisionRequests
            .filter((r) => isPendingRequestStatus(r.status))
            .map((r) => ({
                kind: "supervision" as const,
                requestId: r.requestId,
                projectName: r.project?.name ?? "",
                studentName: r.sender?.name ?? "",
                status: r.status,
            })),
        ...cancelRequests
            .filter((r) => isPendingRequestStatus(r.status))
            .map((r) => ({
                kind: "cancellation" as const,
                requestId: r.requestId,
                projectName: r.projectName,
                studentName: r.studentName,
                status: r.status,
            })),
    ].sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === "supervision" ? -1 : 1;
        return b.requestId - a.requestId;
    });
}

function buildOverviewHighlight(
    summary: DashboardSummary | null,
    supervisedProjects: DoctorSupervisedProject[],
): ProjectHighlight | null {
    if (summary?.myProject) {
        const p = summary.myProject;
        return {
            name: p.projectName,
            role: p.role === "owner" ? "Owner" : "Member",
            memberCount: p.memberCount,
            maxTeamSize: p.maxTeamSize,
            isFull: p.isFull,
        };
    }
    const first = supervisedProjects[0];
    if (!first) return null;
    return {
        name: first.name,
        role: "Supervisor",
        memberCount: first.memberCount,
        maxTeamSize: first.partnersCount,
        isFull: first.isFull,
    };
}

function createStyles(width: number) {
    const compact = width < 390;
    const narrow = width < 360;
    const gutter = narrow ? 14 : compact ? 16 : 18;
    const hair = StyleSheet.hairlineWidth;

    return StyleSheet.create({
        safe: { flex: 1, backgroundColor: dash.bg },
        scroll: { flex: 1 },
        scrollContent: { paddingHorizontal: gutter, paddingBottom: 34 },
        pressedOpacity: { opacity: 0.68 },

        topBar: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 2,
            paddingBottom: 8,
            gap: 10,
        },
        iconBtn: {
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: dash.surface,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: hair,
            borderColor: "rgba(15,23,42,0.08)",
            position: "relative",
        },
        topLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
        topRight: { flexDirection: "row", alignItems: "center", gap: 8 },
        avatarPill: {
            minWidth: 36,
            height: 36,
            borderRadius: 18,
            paddingHorizontal: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: dash.accentMuted,
        },
        avatarPillText: { color: dash.accent, fontSize: 12, fontWeight: "800" },
        notifDot: {
            position: "absolute",
            top: -2,
            right: -2,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: dash.danger,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 3,
        },
        notifDotText: { color: "#fff", fontSize: 9, fontWeight: "700" },

        hero: {
            marginTop: 2,
            borderRadius: 17,
            backgroundColor: dash.surface,
            borderWidth: hair,
            borderColor: "rgba(15,23,42,0.08)",
            paddingHorizontal: 14,
            paddingVertical: 14,
        },
        heroKicker: {
            fontSize: 10,
            fontWeight: "700",
            letterSpacing: 0.9,
            color: dash.accent,
            textTransform: "uppercase",
        },
        heroTitle: {
            marginTop: 5,
            fontSize: compact ? 22 : 24,
            fontWeight: "800",
            color: dash.text,
            letterSpacing: -0.5,
        },
        heroSubtitle: {
            marginTop: 4,
            color: dash.muted,
            fontSize: 13,
        },

        sectionTabsWrap: { marginTop: 14 },
        tabRow: { gap: 8, paddingBottom: 4 },
        tabBtn: {
            height: 36,
            borderRadius: 12,
            paddingHorizontal: 12,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 6,
            borderWidth: hair,
            borderColor: "rgba(15,23,42,0.10)",
            backgroundColor: dash.surface,
        },
        tabBtnActive: {
            borderColor: "transparent",
            backgroundColor: dash.accent,
        },
        tabText: { fontSize: 12, fontWeight: "700", color: dash.muted },
        tabTextActive: { color: "#fff" },

        sectionContainer: { marginTop: 10, gap: 10 },
        panelCard: {
            backgroundColor: dash.surface,
            borderRadius: 15,
            borderWidth: hair,
            borderColor: "rgba(15,23,42,0.08)",
            padding: 14,
        },
        panelHeaderRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 8,
        },
        panelTitle: {
            fontSize: 15,
            fontWeight: "800",
            color: dash.text,
            flex: 1,
        },
        panelMeta: {
            fontSize: 12,
            color: dash.muted,
            fontWeight: "600",
        },

        statGrid: { flexDirection: "row", gap: 8, marginBottom: 8 },
        statTile: {
            flex: 1,
            borderRadius: 12,
            backgroundColor: "#f8fafc",
            borderWidth: hair,
            borderColor: "rgba(15,23,42,0.08)",
            paddingVertical: 10,
            paddingHorizontal: 10,
            minHeight: 76,
        },
        statValue: { fontSize: 21, fontWeight: "800", color: dash.text },
        statLabel: { marginTop: 2, fontSize: 11, color: dash.muted, fontWeight: "600" },

        chip: {
            paddingHorizontal: 9,
            paddingVertical: 5,
            borderRadius: 999,
            backgroundColor: dash.accentMuted,
        },
        chipText: { fontSize: 10, fontWeight: "700", color: dash.accent },

        rowCard: {
            borderRadius: 12,
            borderWidth: hair,
            borderColor: "rgba(15,23,42,0.08)",
            padding: 12,
            backgroundColor: "#fff",
            gap: 6,
        },
        rowTitle: { fontSize: 14, fontWeight: "800", color: dash.text },
        rowMeta: { fontSize: 12, color: dash.muted, lineHeight: 17 },
        rowTag: {
            alignSelf: "flex-start",
            marginTop: 2,
            fontSize: 10,
            fontWeight: "700",
            letterSpacing: 0.5,
            color: dash.subtle,
            textTransform: "uppercase",
        },

        actionRow: { flexDirection: "row", gap: 8, marginTop: 6, flexWrap: "wrap" },
        primaryBtn: {
            minHeight: 38,
            borderRadius: 11,
            paddingHorizontal: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            backgroundColor: dash.accent,
        },
        primaryBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
        secondaryBtn: {
            minHeight: 38,
            borderRadius: 11,
            paddingHorizontal: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            backgroundColor: "#f3f4f6",
        },
        secondaryBtnText: { color: dash.text, fontSize: 12, fontWeight: "700" },
        dangerBtn: {
            minHeight: 38,
            borderRadius: 11,
            paddingHorizontal: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            borderWidth: 1,
            borderColor: "#fecaca",
            backgroundColor: "#fff",
        },
        dangerBtnText: { color: dash.danger, fontSize: 12, fontWeight: "700" },

        loadingWrap: {
            marginTop: 20,
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
        },
        loadingText: { fontSize: 13, color: dash.muted, fontWeight: "600" },
        emptyText: { fontSize: 13, color: dash.subtle, lineHeight: 18 },
        errorCard: {
            marginTop: 14,
            borderRadius: 13,
            borderWidth: 1,
            borderColor: "#fecaca",
            backgroundColor: "#fff1f2",
            padding: 12,
        },
        errorText: { fontSize: 13, color: "#9f1239", fontWeight: "600" },

        menuBackdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(15,23,42,0.4)",
        },
        menuRoot: { flex: 1, justifyContent: "flex-end" },
        menuSheet: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: dash.surface,
            paddingBottom: Platform.OS === "ios" ? 30 : 18,
            borderTopWidth: hair,
            borderColor: "rgba(15,23,42,0.10)",
        },
        menuHandle: {
            alignSelf: "center",
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: "#dbe0e8",
            marginTop: 9,
            marginBottom: 8,
        },
        menuHeader: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingBottom: 8,
        },
        menuTitle: { fontSize: 16, fontWeight: "800", color: dash.text },
        menuList: { paddingHorizontal: 12, gap: 4, paddingBottom: 10 },
        menuItem: {
            minHeight: 46,
            borderRadius: 12,
            paddingHorizontal: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
        },
        menuItemActive: { backgroundColor: dash.accentMuted },
        menuItemText: { fontSize: 14, fontWeight: "600", color: dash.muted },
        menuItemTextActive: { color: dash.accent, fontWeight: "700" },
        menuDivider: {
            height: hair,
            backgroundColor: "rgba(15,23,42,0.10)",
            marginVertical: 6,
            marginHorizontal: 4,
        },
        menuSignOutText: { color: dash.danger, fontWeight: "700" },

        confirmRoot: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
        },
        confirmBackdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(15,23,42,0.45)",
        },
        confirmCard: {
            width: "100%",
            maxWidth: 360,
            backgroundColor: dash.surface,
            borderRadius: 18,
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 16,
            borderWidth: hair,
            borderColor: "rgba(15,23,42,0.10)",
            ...Platform.select({
                ios: {
                    shadowColor: "#0f172a",
                    shadowOpacity: 0.18,
                    shadowRadius: 24,
                    shadowOffset: { width: 0, height: 12 },
                },
                android: { elevation: 6 },
                default: {},
            }),
        },
        confirmIconWrap: {
            alignSelf: "flex-start",
            width: 38,
            height: 38,
            borderRadius: 11,
            backgroundColor: "#fef2f2",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
        },
        confirmTitle: {
            fontSize: 17,
            fontWeight: "800",
            color: dash.text,
            marginBottom: 4,
        },
        confirmBody: {
            fontSize: 13,
            lineHeight: 19,
            color: dash.muted,
            marginBottom: 14,
        },
        confirmActions: {
            flexDirection: "row",
            gap: 8,
            justifyContent: "flex-end",
        },
        confirmCancel: {
            minHeight: 40,
            paddingHorizontal: 14,
            borderRadius: 11,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f1f5f9",
        },
        confirmCancelText: { color: dash.text, fontSize: 13, fontWeight: "700" },
        confirmDanger: {
            minHeight: 40,
            paddingHorizontal: 14,
            borderRadius: 11,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            backgroundColor: dash.danger,
        },
        confirmDangerText: { color: "#fff", fontSize: 13, fontWeight: "700" },
        confirmDangerDisabled: { opacity: 0.75 },
    });
}

const SECTION_ITEMS: { id: DoctorDashboardSection; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: "overview", label: "Overview", icon: "grid-outline" },
    { id: "requests", label: "Requests", icon: "mail-outline" },
    { id: "projects", label: "Projects", icon: "briefcase-outline" },
    { id: "deleted", label: "Deleted", icon: "trash-outline" },
    { id: "courses", label: "Courses", icon: "book-outline" },
];

export default function DoctorDashboardPage() {
    const router = useRouter();
    const params = useLocalSearchParams<{ courses?: string }>();
    const { width } = useWindowDimensions();
    const styles = useMemo(() => createStyles(width), [width]);

    const [activeSection, setActiveSection] = useState<DoctorDashboardSection>("overview");
    const [menuOpen, setMenuOpen] = useState(false);

    const [me, setMe] = useState<DoctorMeProfile | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);

    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [doctorStats, setDoctorStats] = useState<DoctorDashboardSummary | null>(null);
    const [overviewLoading, setOverviewLoading] = useState(false);
    const [overviewError, setOverviewError] = useState<string | null>(null);

    const [supervisedProjects, setSupervisedProjects] = useState<DoctorSupervisedProject[]>([]);
    const [supervisedLoading, setSupervisedLoading] = useState(false);
    const [supervisedError, setSupervisedError] = useState<string | null>(null);

    const [supervisionRequests, setSupervisionRequests] = useState<SupervisorRequest[]>([]);
    const [cancelRequests, setCancelRequests] = useState<SupervisorCancelRequestItem[]>([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [requestsError, setRequestsError] = useState<string | null>(null);
    const [actionKey, setActionKey] = useState<string | null>(null);

    const [deletedItems, setDeletedItems] = useState<DeletedProjectRecord[]>([]);
    const [removingProjectId, setRemovingProjectId] = useState<number | null>(null);

    const [courses, setCourses] = useState<DoctorCourse[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [coursesError, setCoursesError] = useState<string | null>(null);

    const [notificationsCount, setNotificationsCount] = useState(0);

    const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
    const [signingOut, setSigningOut] = useState(false);

    const loadOverview = async () => {
        setOverviewLoading(true);
        setOverviewError(null);
        try {
            const settled = await Promise.allSettled([
                getDashboardSummary(),
                doctorDashboardApi.getSummary(),
            ]);

            const sumRes = settled[0];
            const statsRes = settled[1];

            if (sumRes.status === "fulfilled") {
                setSummary(sumRes.value);
            } else {
                setSummary(null);
                setOverviewError(parseApiErrorMessage(sumRes.reason));
            }

            if (statsRes.status === "fulfilled") {
                setDoctorStats(statsRes.value.data);
            } else {
                setDoctorStats(null);
            }
        } catch (err) {
            setOverviewError(parseApiErrorMessage(err));
            setSummary(null);
            setDoctorStats(null);
        } finally {
            setOverviewLoading(false);
        }
    };

    const loadProjects = async () => {
        setSupervisedLoading(true);
        setSupervisedError(null);
        try {
            const { data } = await doctorDashboardApi.getProjects();
            setSupervisedProjects(Array.isArray(data) ? data : []);
        } catch (err) {
            setSupervisedProjects([]);
            setSupervisedError(parseApiErrorMessage(err));
        } finally {
            setSupervisedLoading(false);
        }
    };

    const loadRequests = async () => {
        setRequestsLoading(true);
        setRequestsError(null);
        try {
            const settled = await Promise.allSettled([
                getDoctorRequests(),
                getDoctorSupervisorCancelRequests(),
            ]);

            const supResult = settled[0];
            const canResult = settled[1];

            setSupervisionRequests(supResult.status === "fulfilled" ? supResult.value : []);
            setCancelRequests(canResult.status === "fulfilled" ? canResult.value : []);

            const failures = settled.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
            if (failures.length === 2) {
                setRequestsError(parseApiErrorMessage(failures[0].reason));
            } else if (failures.length === 1) {
                setRequestsError(`Could not load all requests (${parseApiErrorMessage(failures[0].reason)}).`);
            }
        } catch (err) {
            setSupervisionRequests([]);
            setCancelRequests([]);
            setRequestsError(parseApiErrorMessage(err));
        } finally {
            setRequestsLoading(false);
        }
    };

    const loadCourses = async () => {
        setCoursesLoading(true);
        setCoursesError(null);
        try {
            const data = await getDoctorMyCourses();
            setCourses(data);
        } catch (err) {
            setCourses([]);
            setCoursesError(parseApiErrorMessage(err));
        } finally {
            setCoursesLoading(false);
        }
    };

    const loadNotificationsCount = async () => {
        try {
            const [courseCount, gradCount, chatCount] = await Promise.all([
                fetchUnreadCourseNotificationCount(),
                fetchUnreadGraduationNotificationCount(),
                fetchUnreadChatNotificationCount(),
            ]);
            setNotificationsCount((courseCount || 0) + (gradCount || 0) + (chatCount || 0));
        } catch {
            setNotificationsCount(0);
        }
    };

    const loadNotificationsCountRef = useRef(loadNotificationsCount);
    loadNotificationsCountRef.current = loadNotificationsCount;

    useEffect(() => {
        return subscribeInboxNotificationCreated(() => {
            void loadNotificationsCountRef.current();
        });
    }, []);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            setPageLoading(true);
            setPageError(null);
            try {
                const profile = await fetchDoctorMeProfile();
                if (!cancelled) setMe(profile);

                await Promise.all([
                    loadOverview(),
                    loadProjects(),
                    loadRequests(),
                    loadCourses(),
                    loadNotificationsCount(),
                ]);
            } catch (err) {
                if (!cancelled) {
                    setMe(null);
                    setPageError(parseApiErrorMessage(err));
                }
            } finally {
                if (!cancelled) setPageLoading(false);
            }
        };

        void run();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (params.courses !== "1") return;
        setActiveSection("courses");
        void loadCourses();
        router.setParams({ courses: undefined });
    }, [params.courses, router]);

    const mergedRequests = useMemo(
        () => mergeDoctorRequestRows(supervisionRequests, cancelRequests),
        [supervisionRequests, cancelRequests],
    );

    const highlight = useMemo(
        () => buildOverviewHighlight(summary, supervisedProjects),
        [summary, supervisedProjects],
    );

    const initials = useMemo(() => initialsOf(me?.name ?? "DR"), [me?.name]);

    const openWorkspace = (course: DoctorCourse) => {
        router.push(
            `/CourseWorkspacePage?courseId=${encodeURIComponent(
                String(course.courseId),
            )}&courseName=${encodeURIComponent(course.name)}&courseCode=${encodeURIComponent(
                course.code,
            )}` as Href,
        );
    };

    const onRequestAction = async (row: RequestRow, action: "accept" | "reject") => {
        const key = `${row.kind}-${row.requestId}-${action}`;
        setActionKey(key);
        try {
            if (row.kind === "supervision") {
                if (action === "accept") await acceptSupervisorRequest(row.requestId);
                else await rejectSupervisorRequest(row.requestId);
                setSupervisionRequests((prev) => prev.filter((r) => r.requestId !== row.requestId));
            } else {
                if (action === "accept") await acceptSupervisorCancelRequest(row.requestId);
                else await rejectSupervisorCancelRequest(row.requestId);
                setCancelRequests((prev) => prev.filter((r) => r.requestId !== row.requestId));
            }
            Alert.alert("Success", action === "accept" ? "Request accepted." : "Request rejected.");
            await Promise.all([loadOverview(), loadProjects(), loadNotificationsCount()]);
        } catch (err) {
            Alert.alert("Error", parseApiErrorMessage(err));
        } finally {
            setActionKey(null);
        }
    };

    const onRemoveSupervision = (project: DoctorSupervisedProject) => {
        Alert.alert(
            "Cancel supervision",
            `Stop supervising ${project.name}?`,
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes",
                    style: "destructive",
                    onPress: async () => {
                        setRemovingProjectId(project.projectId);
                        try {
                            await removeDoctorSupervision(project.projectId);
                            setSupervisedProjects((prev) =>
                                prev.filter((p) => p.projectId !== project.projectId),
                            );
                            setDeletedItems((prev) => [
                                {
                                    projectId: project.projectId,
                                    name: project.name,
                                    removedAt: new Date().toISOString(),
                                    source: "remove",
                                },
                                ...prev,
                            ]);
                            await Promise.all([loadOverview(), loadNotificationsCount()]);
                            Alert.alert("Success", "Supervision removed.");
                        } catch (err) {
                            Alert.alert("Error", parseApiErrorMessage(err));
                        } finally {
                            setRemovingProjectId(null);
                        }
                    },
                },
            ],
        );
    };

    const requestLogout = () => {
        if (signingOut) return;
        setMenuOpen(false);
        setConfirmLogoutOpen(true);
    };

    const cancelLogout = () => {
        if (signingOut) return;
        setConfirmLogoutOpen(false);
    };

    const performLogout = async () => {
        if (signingOut) return;
        setSigningOut(true);
        try {
            await clearSession();
        } catch {
            // We still want to send the user to /login even if SecureStore
            // failed to delete a key ù the next API call will 401 anyway.
        }
        router.replace("/login" as Href);
    };

    if (pageLoading) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.loadingWrap}>
                    <ActivityIndicator color={dash.accent} />
                    <Text style={styles.loadingText}>Loading dashboard...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (pageError || !me) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={{ paddingHorizontal: 16, paddingTop: 26 }}>
                    <View style={styles.errorCard}>
                        <Text style={styles.errorText}>{pageError ?? "Unable to load dashboard."}</Text>
                    </View>
                    <View style={{ marginTop: 12 }}>
                        <Pressable
                            onPress={() => router.replace("/" as Href)}
                            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressedOpacity]}
                        >
                            <Ionicons name="log-in-outline" size={16} color="#fff" />
                            <Text style={styles.primaryBtnText}>Go to sign in</Text>
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                <View style={styles.topBar}>
                    <View style={styles.topLeft}>
                        <Pressable
                            onPress={() => setMenuOpen(true)}
                            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressedOpacity]}
                        >
                            <Ionicons name="menu" size={20} color={dash.text} />
                        </Pressable>
                        <Pressable
                            onPress={() => setActiveSection("overview")}
                            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressedOpacity]}
                        >
                            <Ionicons name="home-outline" size={19} color={dash.text} />
                        </Pressable>
                    </View>
                    <View style={styles.topRight}>
                        <Pressable
                            onPress={() => router.push("/ChatPage" as Href)}
                            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressedOpacity]}
                            accessibilityLabel="Messages"
                        >
                            <Ionicons name="chatbubbles-outline" size={18} color={dash.text} />
                        </Pressable>
                        <Pressable
                            onPress={() => router.push("/NotificationsPage" as Href)}
                            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressedOpacity]}
                            accessibilityLabel="Notifications"
                        >
                            <Ionicons name="notifications-outline" size={18} color={dash.text} />
                            {notificationsCount > 0 ? (
                                <View style={styles.notifDot}>
                                    <Text style={styles.notifDotText}>
                                        {notificationsCount > 99 ? "99+" : String(notificationsCount)}
                                    </Text>
                                </View>
                            ) : null}
                        </Pressable>
                        <Pressable
                            onPress={requestLogout}
                            disabled={signingOut}
                            style={({ pressed }) => [
                                styles.iconBtn,
                                pressed && styles.pressedOpacity,
                                signingOut && styles.pressedOpacity,
                            ]}
                            accessibilityLabel="Sign out"
                            accessibilityRole="button"
                        >
                            <Ionicons name="log-out-outline" size={18} color={dash.danger} />
                        </Pressable>
                        <Pressable
                            onPress={requestLogout}
                            disabled={signingOut}
                            style={({ pressed }) => [
                                styles.avatarPill,
                                pressed && styles.pressedOpacity,
                                signingOut && styles.pressedOpacity,
                            ]}
                            accessibilityLabel="Sign out"
                            accessibilityRole="button"
                        >
                            <Text style={styles.avatarPillText}>{initials}</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.hero}>
                    <Text style={styles.heroKicker}>Doctor Workspace</Text>
                    <Text style={styles.heroTitle}>{me.name}</Text>
                    <Text style={styles.heroSubtitle}>
                        {me.specialization ? `${me.specialization} ù ` : ""}
                        {summary?.university ?? me.email}
                        {me.specialization ? `${me.specialization} ù ` : ""}
                        {me.university ?? summary?.university ?? me.email}
                    </Text>
                </View>

                <View style={styles.sectionTabsWrap}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
                        {SECTION_ITEMS.map((item) => {
                            const active = activeSection === item.id;
                            return (
                                <Pressable
                                    key={item.id}
                                    onPress={() => setActiveSection(item.id)}
                                    style={({ pressed }) => [
                                        styles.tabBtn,
                                        active && styles.tabBtnActive,
                                        pressed && styles.pressedOpacity,
                                    ]}
                                >
                                    <Ionicons name={item.icon} size={14} color={active ? "#fff" : dash.muted} />
                                    <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>

                <View style={styles.sectionContainer}>
                    {activeSection === "overview" ? (
                        <>
                            {overviewError ? (
                                <View style={styles.errorCard}>
                                    <Text style={styles.errorText}>{overviewError}</Text>
                                </View>
                            ) : null}
                            <View style={styles.statGrid}>
                                <View style={styles.statTile}>
                                    <Text style={styles.statValue}>
                                        {overviewLoading ? "..." : String(doctorStats?.pendingRequestsCount ?? 0)}
                                    </Text>
                                    <Text style={styles.statLabel}>Pending requests</Text>
                                </View>
                                <View style={styles.statTile}>
                                    <Text style={styles.statValue}>
                                        {overviewLoading ? "..." : String(doctorStats?.supervisedCount ?? 0)}
                                    </Text>
                                    <Text style={styles.statLabel}>Supervised projects</Text>
                                </View>
                            </View>

                            <View style={styles.panelCard}>
                                <View style={styles.panelHeaderRow}>
                                    <Text style={styles.panelTitle}>Project summary</Text>
                                    {highlight ? (
                                        <View style={styles.chip}>
                                            <Text style={styles.chipText}>{highlight.isFull ? "Full" : "Open"}</Text>
                                        </View>
                                    ) : null}
                                </View>
                                {!highlight ? (
                                    <Text style={styles.emptyText}>No active project summary yet.</Text>
                                ) : (
                                    <>
                                        <Text style={styles.rowTitle}>{highlight.name}</Text>
                                        <Text style={styles.rowMeta}>Role: {highlight.role}</Text>
                                        <Text style={styles.rowMeta}>
                                            Members: {highlight.memberCount} / {highlight.maxTeamSize}
                                        </Text>
                                    </>
                                )}
                            </View>

                            <View style={styles.panelCard}>
                                <View style={styles.panelHeaderRow}>
                                    <Text style={styles.panelTitle}>Suggested teammates</Text>
                                    <Text style={styles.panelMeta}>
                                        {summary?.suggestedTeammates?.length ?? 0} results
                                    </Text>
                                </View>
                                {(summary?.suggestedTeammates?.length ?? 0) === 0 ? (
                                    <Text style={styles.emptyText}>No teammate suggestions available.</Text>
                                ) : (
                                    <View style={{ gap: 8 }}>
                                        {summary!.suggestedTeammates!.slice(0, 8).map((s) => (
                                            <View key={s.userId} style={styles.rowCard}>
                                                <View style={styles.panelHeaderRow}>
                                                    <Text style={styles.rowTitle}>{s.name}</Text>
                                                    <View style={styles.chip}>
                                                        <Text style={styles.chipText}>{s.matchScore}% match</Text>
                                                    </View>
                                                </View>
                                                <Text style={styles.rowMeta}>
                                                    {s.major}
                                                    {s.university ? ` ù ${s.university}` : ""}
                                                </Text>
                                                <Text style={styles.rowMeta} numberOfLines={2}>
                                                    Skills: {s.skills.join(", ") || "-"}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </>
                    ) : null}

                    {activeSection === "requests" ? (
                        <View style={styles.panelCard}>
                            <View style={styles.panelHeaderRow}>
                                <Text style={styles.panelTitle}>Inbox</Text>
                                <Text style={styles.panelMeta}>{mergedRequests.length} total</Text>
                            </View>

                            {requestsError ? <Text style={styles.errorText}>{requestsError}</Text> : null}
                            {requestsLoading ? (
                                <View style={styles.loadingWrap}>
                                    <ActivityIndicator color={dash.accent} />
                                    <Text style={styles.loadingText}>Loading requests...</Text>
                                </View>
                            ) : mergedRequests.length === 0 ? (
                                <Text style={styles.emptyText}>
                                    Supervision and cancellation requests will appear here.
                                </Text>
                            ) : (
                                <View style={{ gap: 8 }}>
                                    {mergedRequests.map((row) => {
                                        const acceptKey = `${row.kind}-${row.requestId}-accept`;
                                        const rejectKey = `${row.kind}-${row.requestId}-reject`;
                                        return (
                                            <View key={`${row.kind}-${row.requestId}`} style={styles.rowCard}>
                                                <Text style={styles.rowTag}>
                                                    {row.kind === "supervision"
                                                        ? "Supervision request"
                                                        : "Cancellation request"}
                                                </Text>
                                                <Text style={styles.rowTitle}>{row.projectName || "-"}</Text>
                                                <Text style={styles.rowMeta}>Student: {row.studentName || "-"}</Text>
                                                <Text style={styles.rowMeta}>Status: Pending</Text>
                                                <View style={styles.actionRow}>
                                                    <Pressable
                                                        onPress={() => void onRequestAction(row, "accept")}
                                                        disabled={actionKey != null}
                                                        style={({ pressed }) => [
                                                            styles.primaryBtn,
                                                            pressed && styles.pressedOpacity,
                                                        ]}
                                                    >
                                                        {actionKey === acceptKey ? (
                                                            <ActivityIndicator color="#fff" size="small" />
                                                        ) : (
                                                            <Ionicons name="checkmark" size={14} color="#fff" />
                                                        )}
                                                        <Text style={styles.primaryBtnText}>Accept</Text>
                                                    </Pressable>
                                                    <Pressable
                                                        onPress={() => void onRequestAction(row, "reject")}
                                                        disabled={actionKey != null}
                                                        style={({ pressed }) => [
                                                            styles.secondaryBtn,
                                                            pressed && styles.pressedOpacity,
                                                        ]}
                                                    >
                                                        {actionKey === rejectKey ? (
                                                            <ActivityIndicator color={dash.text} size="small" />
                                                        ) : (
                                                            <Ionicons name="close" size={14} color={dash.text} />
                                                        )}
                                                        <Text style={styles.secondaryBtnText}>Reject</Text>
                                                    </Pressable>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    ) : null}

                    {activeSection === "projects" ? (
                        <View style={styles.panelCard}>
                            <View style={styles.panelHeaderRow}>
                                <Text style={styles.panelTitle}>Supervised projects</Text>
                                <Text style={styles.panelMeta}>{supervisedProjects.length} active</Text>
                            </View>

                            {supervisedError ? <Text style={styles.errorText}>{supervisedError}</Text> : null}
                            {supervisedLoading ? (
                                <View style={styles.loadingWrap}>
                                    <ActivityIndicator color={dash.accent} />
                                    <Text style={styles.loadingText}>Loading projects...</Text>
                                </View>
                            ) : supervisedProjects.length === 0 ? (
                                <Text style={styles.emptyText}>No supervised projects yet.</Text>
                            ) : (
                                <View style={{ gap: 8 }}>
                                    {supervisedProjects.map((p) => {
                                        const removing = removingProjectId === p.projectId;
                                        const desc = (p.abstract ?? p.description ?? "").trim();
                                        return (
                                            <View key={p.projectId} style={styles.rowCard}>
                                                <View style={styles.panelHeaderRow}>
                                                    <Text style={styles.rowTitle}>{p.name}</Text>
                                                    <View style={styles.chip}>
                                                        <Text style={styles.chipText}>
                                                            {p.isFull ? "Team full" : "Recruiting"}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Text style={styles.rowMeta}>
                                                    Description: {desc || "-"}
                                                </Text>
                                                <Text style={styles.rowMeta}>
                                                    Members: {p.memberCount} ù Capacity: {p.partnersCount}
                                                </Text>
                                                <Text style={styles.rowMeta}>
                                                    Owner: {p.owner?.name ?? "-"}
                                                </Text>
                                                <Text style={styles.rowMeta}>Created: {formatDateTime(p.createdAt)}</Text>
                                                <Text style={styles.rowMeta} numberOfLines={2}>
                                                    Skills: {p.requiredSkills.join(", ") || "-"}
                                                </Text>

                                                <View style={styles.actionRow}>
                                                    <Pressable
                                                        onPress={() => onRemoveSupervision(p)}
                                                        disabled={removingProjectId != null}
                                                        style={({ pressed }) => [
                                                            styles.dangerBtn,
                                                            pressed && styles.pressedOpacity,
                                                        ]}
                                                    >
                                                        {removing ? (
                                                            <ActivityIndicator color={dash.danger} size="small" />
                                                        ) : (
                                                            <Ionicons
                                                                name="trash-outline"
                                                                size={14}
                                                                color={dash.danger}
                                                            />
                                                        )}
                                                        <Text style={styles.dangerBtnText}>
                                                            {removing ? "Removing..." : "Cancel supervision"}
                                                        </Text>
                                                    </Pressable>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    ) : null}

                    {activeSection === "deleted" ? (
                        <View style={styles.panelCard}>
                            <View style={styles.panelHeaderRow}>
                                <Text style={styles.panelTitle}>Removed supervision</Text>
                                <Text style={styles.panelMeta}>{deletedItems.length} saved</Text>
                            </View>

                            {deletedItems.length === 0 ? (
                                <Text style={styles.emptyText}>
                                    Removed projects are listed here after you cancel supervision.
                                </Text>
                            ) : (
                                <View style={{ gap: 8 }}>
                                    {deletedItems.map((item) => (
                                        <View key={`${item.projectId}-${item.removedAt}`} style={styles.rowCard}>
                                            <Text style={styles.rowTitle}>{item.name}</Text>
                                            <Text style={styles.rowMeta}>
                                                Removed by you on {formatDateTime(item.removedAt)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    ) : null}

                    {activeSection === "courses" ? (
                        <View style={styles.panelCard}>
                            <View style={styles.panelHeaderRow}>
                                <Text style={styles.panelTitle}>Your courses</Text>
                                <Text style={styles.panelMeta}>{courses.length} courses</Text>
                            </View>
                            <Text style={[styles.rowMeta, { marginBottom: 8 }]}> 
                                Manage enrollments, project settings, and teams from one place.
                            </Text>
                            <View style={[styles.actionRow, { marginBottom: 8 }]}>
                                <Pressable
                                    onPress={() => router.push("/create-course" as Href)}
                                    style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressedOpacity]}
                                >
                                    <Ionicons name="add" size={15} color="#fff" />
                                    <Text style={styles.primaryBtnText}>Create Course</Text>
                                </Pressable>
                            </View>

                            {coursesError ? <Text style={styles.errorText}>{coursesError}</Text> : null}
                            {coursesLoading ? (
                                <View style={styles.loadingWrap}>
                                    <ActivityIndicator color={dash.accent} />
                                    <Text style={styles.loadingText}>Loading courses...</Text>
                                </View>
                            ) : courses.length === 0 ? (
                                <Text style={styles.emptyText}>No courses yet.</Text>
                            ) : (
                                <View style={{ gap: 8 }}>
                                    {courses.map((c) => (
                                        <Pressable
                                            key={c.courseId}
                                            onPress={() => openWorkspace(c)}
                                            style={({ pressed }) => [
                                                styles.rowCard,
                                                pressed && styles.pressedOpacity,
                                            ]}
                                        >
                                            <View style={styles.panelHeaderRow}>
                                                <Text style={styles.rowTitle}>{c.name}</Text>
                                                <View style={styles.chip}>
                                                    <Text style={styles.chipText}>{c.code}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.rowMeta}>Created {formatDateTime(c.createdAt)}</Text>
                                            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: "700",
                                                        color: dash.accent,
                                                    }}
                                                >
                                                    {"Open workspace ->"}
                                                </Text>
                                            </View>
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                        </View>
                    ) : null}
                </View>
            </ScrollView>

            <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
                <View style={styles.menuRoot}>
                    <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)} />
                    <View style={styles.menuSheet}>
                        <View style={styles.menuHandle} />
                        <View style={styles.menuHeader}>
                            <Text style={styles.menuTitle}>Doctor dashboard</Text>
                            <Pressable
                                onPress={() => setMenuOpen(false)}
                                style={({ pressed }) => pressed && styles.pressedOpacity}
                                hitSlop={12}
                            >
                                <Ionicons name="close" size={24} color={dash.muted} />
                            </Pressable>
                        </View>
                        <View style={styles.menuList}>
                            {SECTION_ITEMS.map((item) => {
                                const active = activeSection === item.id;
                                return (
                                    <Pressable
                                        key={item.id}
                                        onPress={() => {
                                            setActiveSection(item.id);
                                            setMenuOpen(false);
                                        }}
                                        style={({ pressed }) => [
                                            styles.menuItem,
                                            active && styles.menuItemActive,
                                            pressed && styles.pressedOpacity,
                                        ]}
                                    >
                                        <Ionicons
                                            name={item.icon}
                                            size={18}
                                            color={active ? dash.accent : dash.muted}
                                        />
                                        <Text
                                            style={[
                                                styles.menuItemText,
                                                active && styles.menuItemTextActive,
                                            ]}
                                        >
                                            {item.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}

                            <View style={styles.menuDivider} />

                            <Pressable
                                onPress={requestLogout}
                                disabled={signingOut}
                                style={({ pressed }) => [
                                    styles.menuItem,
                                    pressed && styles.pressedOpacity,
                                    signingOut && styles.pressedOpacity,
                                ]}
                                accessibilityRole="button"
                            >
                                <Ionicons name="log-out-outline" size={18} color={dash.danger} />
                                <Text style={[styles.menuItemText, styles.menuSignOutText]}>
                                    Sign out
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={confirmLogoutOpen}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={cancelLogout}
            >
                <View style={styles.confirmRoot}>
                    <Pressable
                        style={styles.confirmBackdrop}
                        onPress={cancelLogout}
                        disabled={signingOut}
                    />
                    <View style={styles.confirmCard}>
                        <View style={styles.confirmIconWrap}>
                            <Ionicons name="log-out-outline" size={22} color={dash.danger} />
                        </View>
                        <Text style={styles.confirmTitle}>Sign out</Text>
                        <Text style={styles.confirmBody}>
                            You will need to sign in again to access your workspace.
                        </Text>
                        <View style={styles.confirmActions}>
                            <Pressable
                                onPress={cancelLogout}
                                disabled={signingOut}
                                style={({ pressed }) => [
                                    styles.confirmCancel,
                                    pressed && styles.pressedOpacity,
                                    signingOut && styles.pressedOpacity,
                                ]}
                            >
                                <Text style={styles.confirmCancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => void performLogout()}
                                disabled={signingOut}
                                style={({ pressed }) => [
                                    styles.confirmDanger,
                                    pressed && styles.pressedOpacity,
                                    signingOut && styles.confirmDangerDisabled,
                                ]}
                            >
                                {signingOut ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Ionicons name="log-out-outline" size={15} color="#fff" />
                                )}
                                <Text style={styles.confirmDangerText}>
                                    {signingOut ? "Signing out..." : "Sign out"}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
