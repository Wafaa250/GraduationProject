import { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

/** Mobile-local theme tokens (replaces the web-only `doctorDashTokens` module). */
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

// ============================================================================
// Types — mirror the web source 1:1 so business logic stays portable.
// ============================================================================

type WorkspaceTab = "sections" | "projects" | "settings";

type SectionStudent = {
    id: string;
    name: string;
    email?: string;
};

type NewSectionPayload = {
    name: string;
    days: string[];
    timeFrom: string;
    timeTo: string;
    capacity: number;
};

type WorkspaceSection = NewSectionPayload & {
    id: string;
    students?: SectionStudent[];
};

type NewWorkspaceProjectPayload = {
    title: string;
    abstract: string;
    teamSize: number;
    duration: string;
    sectionLabel: string;
    aiMode: "doctor" | "student";
};

type WorkspaceProject = NewWorkspaceProjectPayload & { id: string };

type DoctorCourseProject = {
    id: number;
    title: string;
    description?: string;
    teamSize: number;
    applyToAllSections: boolean;
    aiMode: "doctor" | "student";
    sections: { sectionId: number; sectionName: string }[];
};

type CourseWorkspaceSettingsForm = {
    allowCrossSectionTeams: boolean;
    maxTeamSize: string;
    minTeamSize: string;
    enableAiTeamAssignment: boolean;
    allowStudentsChooseTeammates: boolean;
    allowMultipleProjectsPerSection: boolean;
    maxProjectsPerCourse: string;
    teamFormationDeadline: string;
    projectSubmissionDeadline: string;
};

const defaultCourseWorkspaceSettings: CourseWorkspaceSettingsForm = {
    allowCrossSectionTeams: false,
    maxTeamSize: "6",
    minTeamSize: "2",
    enableAiTeamAssignment: true,
    allowStudentsChooseTeammates: false,
    allowMultipleProjectsPerSection: false,
    maxProjectsPerCourse: "5",
    teamFormationDeadline: "",
    projectSubmissionDeadline: "",
};

// ============================================================================
// Mocks for web-only deps. Wire to mobile/api when ready.
//   - react-router-dom → expo-router (above)
//   - sessionStorage / localStorage → in-memory state
//   - navigator.clipboard → flash-feedback only (no expo-clipboard installed)
//   - doctorCoursesApi (axios) → no-op stubs gated by the flag below
//   - ToastContext → Alert.alert wrapper
// ============================================================================

const ENABLE_COURSE_WORKSPACE_BACKEND_API = false;

function parseApiErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    return String(err);
}

function showToast(
    message: string,
    variant: "error" | "success" | "default" = "default"
) {
    if (__DEV__) console.log(`[toast:${variant}]`, message);
    const title =
        variant === "error" ? "Error" : variant === "success" ? "Success" : "Notice";
    Alert.alert(title, message);
}

async function getDoctorCourseSections(_courseId: number): Promise<
    {
        id: number;
        name: string;
        days: string[];
        timeFrom: string | null;
        timeTo: string | null;
        capacity: number;
        students?: unknown;
    }[]
> {
    return [];
}

async function getDoctorCourseProjects(
    _courseId: number
): Promise<DoctorCourseProject[]> {
    return [];
}

async function getDoctorProjectTeams(
    _courseId: number,
    _projectId: number
): Promise<{ teamCount: number }> {
    return { teamCount: 0 };
}

async function createDoctorCourseSection(
    _courseId: number,
    payload: NewSectionPayload
): Promise<{
    id: number;
    name: string;
    days: string[];
    timeFrom: string | null;
    timeTo: string | null;
    capacity: number;
    students?: unknown;
}> {
    return {
        id: Date.now(),
        name: payload.name,
        days: payload.days,
        timeFrom: payload.timeFrom,
        timeTo: payload.timeTo,
        capacity: payload.capacity,
        students: [],
    };
}

function normalizeSectionStudents(raw: unknown): SectionStudent[] {
    if (!Array.isArray(raw)) return [];
    const out: SectionStudent[] = [];
    for (let index = 0; index < raw.length; index += 1) {
        const item = raw[index];
        const student = item as Record<string, unknown>;
        const nameRaw =
            student.name ??
            student.Name ??
            student.fullName ??
            student.FullName ??
            student.studentName ??
            student.StudentName;
        const emailRaw = student.email ?? student.Email;
        const idRaw =
            student.id ?? student.Id ?? student.studentId ?? student.StudentId ?? index;
        const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
        if (!name) continue;
        const id = String(idRaw);
        if (typeof emailRaw === "string" && emailRaw.trim()) {
            out.push({ id, name, email: emailRaw.trim() });
        } else {
            out.push({ id, name });
        }
    }
    return out;
}

function doctorProjectSectionDisplayLabel(p: DoctorCourseProject): string {
    if (p.applyToAllSections) return "All sections";
    const names = p.sections.map((s) => s.sectionName.trim()).filter(Boolean);
    return names.length > 0 ? names.join(", ") : "Section";
}

function parseBackendCourseId(cid: string | undefined): number | null {
    if (!cid) return null;
    if (/^\d+$/.test(cid.trim())) {
        const n = Number(cid);
        return Number.isFinite(n) && n > 0 ? n : null;
    }
    return null;
}

function pickParam(v: string | string[] | undefined): string | undefined {
    if (v == null) return undefined;
    const s = Array.isArray(v) ? v[0] : v;
    const t = s?.trim();
    return t && t.length > 0 ? t : undefined;
}

// ============================================================================
// Schedule helpers (ported from web CreateSectionForm).
// ============================================================================

const WEEKDAY_OPTIONS = [
    { id: "mon", label: "Mon" },
    { id: "tue", label: "Tue" },
    { id: "wed", label: "Wed" },
    { id: "thu", label: "Thu" },
    { id: "fri", label: "Fri" },
    { id: "sat", label: "Sat" },
    { id: "sun", label: "Sun" },
] as const;

type WeekdayId = (typeof WEEKDAY_OPTIONS)[number]["id"];

const WEEKDAY_ID_ORDER = WEEKDAY_OPTIONS.map((d) => d.id);

const WEEKDAY_ID_SET = new Set<string>(WEEKDAY_ID_ORDER);

function isWeekdayId(value: string): value is WeekdayId {
    return WEEKDAY_ID_SET.has(value);
}

const DAY_LOOKUP: Record<string, string> = Object.fromEntries(
    WEEKDAY_OPTIONS.map((d) => [d.id, d.label])
);

function byWeekdayOrder(a: string, b: string): number {
    const ia = isWeekdayId(a) ? WEEKDAY_ID_ORDER.indexOf(a) : WEEKDAY_ID_ORDER.length;
    const ib = isWeekdayId(b) ? WEEKDAY_ID_ORDER.indexOf(b) : WEEKDAY_ID_ORDER.length;
    return ia - ib;
}

function formatTimeLabel(hhmm: string): string {
    const parts = hhmm.split(":");
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatSectionScheduleTime(timeFrom: string, timeTo: string): string {
    if (!timeFrom || !timeTo) return "";
    return `${formatTimeLabel(timeFrom)} – ${formatTimeLabel(timeTo)}`;
}

// ============================================================================
// Avatar palette (deterministic per name).
// ============================================================================

const AVATAR_PALETTE: { bg: string; fg: string }[] = [
    { bg: "#ddd6fe", fg: "#6d28d9" },
    { bg: "#dbeafe", fg: "#1d4ed8" },
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

// ============================================================================
// Tab metadata.
// ============================================================================

const TABS: {
    id: WorkspaceTab;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
}[] = [
    { id: "sections", label: "Sections", icon: "layers-outline" },
    { id: "projects", label: "Projects", icon: "folder-open-outline" },
    { id: "settings", label: "Settings", icon: "options-outline" },
];

// ============================================================================
// Layout / styles.
// ============================================================================

function getLayoutTokens(width: number) {
    const narrow = width < 360;
    const compact = width < 400;
    return {
        gutter: narrow ? 14 : compact ? 15 : 18,
        cardGap: 10,
        titleSize: compact ? 20 : 22,
        titleLine: compact ? 26 : 28,
        sectionGap: 14,
    };
}

function createStyles(width: number) {
    const t = getLayoutTokens(width);
    const hair = StyleSheet.hairlineWidth;

    // Palette
    const bg = "#f5f6fa";
    const surface = "#ffffff";
    const inputFill = "#f3f4f6";
    const subtleBg = "#f8fafc";
    const segmentTrack = "#e6e7eb";
    const hairlineColor = "rgba(15,23,42,0.08)";
    const dividerColor = "rgba(15,23,42,0.06)";

    return StyleSheet.create({
        safe: { flex: 1, backgroundColor: bg },
        flex: { flex: 1 },
        scroll: { flex: 1, backgroundColor: bg },
        scrollContent: {
            paddingHorizontal: t.gutter,
            paddingTop: 2,
            paddingBottom: 32,
        },

        // ------ Top bar / Hero ------------------------------------------------
        topBar: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 2,
            marginBottom: 2,
        },
        topBarBtn: {
            flexDirection: "row",
            alignItems: "center",
            marginLeft: -6,
            paddingHorizontal: 6,
            paddingVertical: 4,
            gap: 2,
        },
        topBarBtnText: {
            fontSize: 14,
            fontWeight: "500",
            color: dash.text,
            letterSpacing: -0.2,
        },
        topBarRight: { flexDirection: "row", gap: 6 },
        topBarIconBtn: {
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: surface,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: hair,
            borderColor: hairlineColor,
        },

        hero: {
            marginTop: 6,
            backgroundColor: surface,
            borderRadius: 18,
            paddingHorizontal: 14,
            paddingVertical: 14,
            borderWidth: hair,
            borderColor: hairlineColor,
            ...Platform.select({
                ios: {
                    shadowColor: "#0f172a",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                },
                android: { elevation: 2 },
                default: {},
            }),
        },
        heroKicker: {
            fontSize: 10,
            fontWeight: "700",
            color: dash.accent,
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 2,
        },
        heroTitleRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
        },
        heroTitleCol: {
            flex: 1,
            minWidth: 0,
        },
        heroAvatar: {
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: dash.accent,
            alignItems: "center",
            justifyContent: "center",
            ...Platform.select({
                ios: {
                    shadowColor: dash.accent,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                },
                android: { elevation: 3 },
                default: {},
            }),
        },
        heroAvatarText: {
            color: "#fff",
            fontSize: 16,
            fontWeight: "700",
        },
        heroTitle: {
            fontSize: t.titleSize,
            lineHeight: t.titleLine,
            fontWeight: "700",
            color: dash.text,
            letterSpacing: -0.5,
        },

        codeRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: 12,
        },
        codeChip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingVertical: 5,
            paddingHorizontal: 10,
            borderRadius: 999,
            backgroundColor: dash.accentMuted,
        },
        codeChipIcon: { marginRight: 2 },
        codeChipLabel: {
            fontSize: 10,
            fontWeight: "700",
            color: dash.accent,
            letterSpacing: 0.6,
            textTransform: "uppercase",
        },
        codeChipText: {
            fontSize: 13,
            fontWeight: "700",
            color: dash.accent,
            letterSpacing: 0.3,
        },
        codeAction: {
            width: 30,
            height: 30,
            borderRadius: 9,
            backgroundColor: inputFill,
            alignItems: "center",
            justifyContent: "center",
        },
        copiedBubble: {
            paddingVertical: 4,
            paddingHorizontal: 9,
            borderRadius: 999,
            backgroundColor: "#dcfce7",
        },
        copiedBubbleText: {
            fontSize: 10,
            fontWeight: "700",
            color: "#15803d",
            letterSpacing: 0.4,
        },

        statsRow: {
            flexDirection: "row",
            gap: 8,
            marginTop: 12,
        },
        statTile: {
            flex: 1,
            backgroundColor: subtleBg,
            borderRadius: 11,
            paddingVertical: 8,
            paddingHorizontal: 10,
            borderWidth: hair,
            borderColor: hairlineColor,
        },
        statTileValueRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        statTileValue: {
            fontSize: 17,
            fontWeight: "700",
            color: dash.text,
            letterSpacing: -0.3,
        },
        statTileLabel: {
            marginTop: 1,
            fontSize: 10,
            fontWeight: "600",
            color: dash.muted,
            letterSpacing: 0.4,
            textTransform: "uppercase",
        },
        statTileBadgeOn: {
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 6,
            backgroundColor: "#dcfce7",
        },
        statTileBadgeOff: {
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 6,
            backgroundColor: "#fee2e2",
        },
        statTileBadgeOnText: {
            fontSize: 10,
            fontWeight: "700",
            color: "#15803d",
            textTransform: "uppercase",
            letterSpacing: 0.4,
        },
        statTileBadgeOffText: {
            fontSize: 10,
            fontWeight: "700",
            color: "#b91c1c",
            textTransform: "uppercase",
            letterSpacing: 0.4,
        },

        // ------ Segmented tabs ------------------------------------------------
        segmentTrack: {
            flexDirection: "row",
            backgroundColor: segmentTrack,
            borderRadius: 12,
            padding: 3,
            marginTop: t.sectionGap,
            marginBottom: 12,
        },
        segmentBtn: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            minHeight: 36,
            paddingVertical: 7,
            paddingHorizontal: 6,
            borderRadius: 10,
        },
        segmentBtnActive: {
            backgroundColor: surface,
            ...Platform.select({
                ios: {
                    shadowColor: "#0f172a",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.14,
                    shadowRadius: 3,
                },
                android: { elevation: 2 },
                default: {},
            }),
        },
        segmentBtnTextActive: {
            fontSize: 13,
            fontWeight: "700",
            color: dash.text,
            letterSpacing: -0.1,
        },
        segmentBtnTextIdle: {
            fontSize: 13,
            fontWeight: "500",
            color: dash.muted,
        },
        segmentCountActive: {
            marginLeft: 2,
            fontSize: 11,
            fontWeight: "700",
            color: dash.accent,
        },
        segmentCountIdle: {
            marginLeft: 2,
            fontSize: 11,
            fontWeight: "600",
            color: dash.subtle,
        },

        // ------ Panel header --------------------------------------------------
        panelHeader: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
            gap: 10,
        },
        panelTitleCol: { flex: 1, minWidth: 0 },
        panelTitle: {
            fontSize: 17,
            fontWeight: "700",
            color: dash.text,
            letterSpacing: -0.4,
        },
        panelSubtitle: {
            marginTop: 1,
            fontSize: 12,
            color: dash.muted,
            lineHeight: 16,
        },

        // ------ Buttons -------------------------------------------------------
        primaryBtn: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: dash.accent,
            minHeight: 40,
            ...Platform.select({
                ios: {
                    shadowColor: dash.accent,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.22,
                    shadowRadius: 10,
                },
                android: { elevation: 4 },
                default: {},
            }),
        },
        primaryBtnText: {
            color: "#fff",
            fontSize: 13,
            fontWeight: "700",
            letterSpacing: -0.1,
        },
        primaryBtnBig: {
            paddingVertical: 12,
            minHeight: 46,
            paddingHorizontal: 16,
        },
        primaryBtnBigText: {
            fontSize: 14,
            fontWeight: "700",
            letterSpacing: -0.15,
            color: "#fff",
        },
        primaryBtnDisabled: { opacity: 0.55 },

        secondaryBtn: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 9,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: inputFill,
            minHeight: 38,
        },
        secondaryBtnText: {
            color: dash.text,
            fontSize: 13,
            fontWeight: "600",
        },
        ghostBtn: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: "transparent",
            borderWidth: hair,
            borderColor: "rgba(15,23,42,0.16)",
            minHeight: 48,
        },
        ghostBtnText: {
            color: dash.text,
            fontSize: 15,
            fontWeight: "600",
        },
        pressedOpacity: { opacity: 0.65 },

        // ------ Generic card --------------------------------------------------
        card: {
            backgroundColor: surface,
            borderRadius: 14,
            padding: 14,
            marginBottom: t.cardGap,
            borderWidth: hair,
            borderColor: hairlineColor,
            ...Platform.select({
                ios: {
                    shadowColor: "#0f172a",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                },
                android: { elevation: 1 },
                default: {},
            }),
        },
        cardTopRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
        },
        cardTitle: {
            fontSize: 17,
            fontWeight: "700",
            color: dash.text,
            letterSpacing: -0.3,
            flexShrink: 1,
        },

        // ------ Section card --------------------------------------------------
        sectionDayChipsRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 5,
            marginTop: 10,
        },
        sectionDayChip: {
            paddingVertical: 3,
            paddingHorizontal: 9,
            borderRadius: 7,
            backgroundColor: dash.accentMuted,
        },
        sectionDayChipText: {
            fontSize: 11,
            fontWeight: "700",
            color: dash.accent,
            letterSpacing: 0.3,
        },
        sectionTimeRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            marginTop: 8,
        },
        sectionTimeText: {
            fontSize: 12,
            color: dash.muted,
            fontWeight: "500",
        },
        capacityWrap: {
            marginTop: 12,
        },
        capacityLabelRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 6,
        },
        capacityLabel: {
            fontSize: 11,
            fontWeight: "700",
            color: dash.muted,
            letterSpacing: 0.5,
            textTransform: "uppercase",
        },
        capacityValue: {
            fontSize: 13,
            fontWeight: "700",
            color: dash.text,
        },
        capacityValueMuted: {
            fontSize: 12,
            color: dash.subtle,
            fontWeight: "500",
        },
        capacityTrack: {
            height: 6,
            borderRadius: 999,
            backgroundColor: "#eef2f7",
            overflow: "hidden",
        },
        capacityFill: {
            height: "100%",
            borderRadius: 999,
            backgroundColor: dash.accent,
        },

        avatarStackRow: {
            flexDirection: "row",
            alignItems: "center",
            marginTop: 12,
        },
        avatarStack: {
            flexDirection: "row",
            alignItems: "center",
        },
        avatarBubble: {
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: surface,
            marginLeft: -8,
        },
        avatarBubbleFirst: { marginLeft: 0 },
        avatarBubbleText: {
            fontSize: 11,
            fontWeight: "700",
        },
        avatarMoreBubble: {
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: "#e2e8f0",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: surface,
            marginLeft: -8,
        },
        avatarMoreText: {
            fontSize: 10,
            fontWeight: "700",
            color: dash.muted,
        },
        avatarStackLabel: {
            marginLeft: 10,
            fontSize: 12,
            fontWeight: "600",
            color: dash.muted,
        },

        cardActionsRow: {
            flexDirection: "row",
            gap: 8,
            marginTop: 12,
            flexWrap: "wrap",
        },
        cardActionFlex: { flex: 1, minWidth: 130 },

        // ------ Student rows --------------------------------------------------
        studentsPanel: {
            marginTop: 12,
            backgroundColor: subtleBg,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 4,
        },
        studentRow: {
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            borderBottomWidth: hair,
            borderBottomColor: dividerColor,
        },
        studentRowLast: { borderBottomWidth: 0 },
        studentAvatar: {
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: "center",
            justifyContent: "center",
        },
        studentAvatarText: {
            fontSize: 11,
            fontWeight: "700",
        },
        studentInfoCol: { flex: 1, minWidth: 0 },
        studentName: { fontSize: 14, fontWeight: "600", color: dash.text },
        studentEmail: { marginTop: 2, fontSize: 12, color: dash.subtle },

        // ------ Project card --------------------------------------------------
        projectHeaderRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
        },
        statusPill: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: dash.accentMuted,
            alignSelf: "flex-start",
        },
        statusPillText: {
            fontSize: 10,
            fontWeight: "700",
            color: dash.accent,
            letterSpacing: 0.5,
            textTransform: "uppercase",
        },
        projectMetaRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 12,
        },
        sectionMetaChip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingVertical: 5,
            paddingHorizontal: 9,
            borderRadius: 8,
            backgroundColor: subtleBg,
            borderWidth: hair,
            borderColor: hairlineColor,
        },
        sectionMetaChipText: {
            fontSize: 12,
            fontWeight: "600",
            color: dash.muted,
        },
        statBlocksRow: {
            flexDirection: "row",
            gap: 8,
            marginTop: 12,
        },
        statBlock: {
            flex: 1,
            backgroundColor: subtleBg,
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderWidth: hair,
            borderColor: hairlineColor,
        },
        statBlockLabel: {
            fontSize: 10,
            fontWeight: "700",
            color: dash.muted,
            letterSpacing: 0.5,
            textTransform: "uppercase",
        },
        statBlockValue: {
            marginTop: 4,
            fontSize: 18,
            fontWeight: "700",
            color: dash.text,
            letterSpacing: -0.3,
        },
        projectDesc: {
            marginTop: 12,
            fontSize: 13,
            color: dash.muted,
            lineHeight: 19,
        },

        // ------ Team panel (student view) -------------------------------------
        teamPanel: {
            marginTop: 14,
            backgroundColor: subtleBg,
            borderRadius: 14,
            padding: 12,
            gap: 12,
        },
        teamMembersRow: { gap: 10 },
        teamMember: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
        },
        teamMemberInfo: { flex: 1 },
        teamMemberName: {
            fontSize: 13,
            fontWeight: "700",
            color: dash.text,
        },
        teamMemberRole: {
            marginTop: 2,
            fontSize: 11,
            color: dash.subtle,
        },
        leaderBadge: {
            paddingHorizontal: 6,
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
        chatHeader: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingTop: 10,
            borderTopWidth: hair,
            borderTopColor: dividerColor,
        },
        chatHeaderText: {
            fontSize: 11,
            fontWeight: "700",
            color: dash.muted,
            letterSpacing: 0.5,
            textTransform: "uppercase",
        },
        chatList: { maxHeight: 180, gap: 6 },
        chatBubbleWrap: {
            flexDirection: "row",
        },
        chatBubble: {
            paddingHorizontal: 10,
            paddingVertical: 7,
            borderRadius: 14,
            maxWidth: "84%",
        },
        chatBubbleMine: {
            backgroundColor: dash.accent,
            alignSelf: "flex-end",
            borderBottomRightRadius: 4,
        },
        chatBubbleTheirs: {
            backgroundColor: "#e5e7eb",
            alignSelf: "flex-start",
            borderBottomLeftRadius: 4,
        },
        chatBubbleTextMine: { color: "#fff", fontSize: 13, lineHeight: 18 },
        chatBubbleTextTheirs: { color: "#1f2937", fontSize: 13, lineHeight: 18 },
        chatSenderLabel: {
            fontSize: 10,
            color: dash.subtle,
            fontWeight: "700",
            marginBottom: 2,
            marginLeft: 4,
            textTransform: "uppercase",
            letterSpacing: 0.3,
        },
        chatInputRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
        },
        chatInput: {
            flex: 1,
            backgroundColor: surface,
            borderRadius: 999,
            paddingVertical: Platform.OS === "ios" ? 10 : 8,
            paddingHorizontal: 14,
            fontSize: 13,
            color: dash.text,
            borderWidth: hair,
            borderColor: hairlineColor,
        },
        chatSendBtn: {
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: dash.accent,
            alignItems: "center",
            justifyContent: "center",
            ...Platform.select({
                ios: {
                    shadowColor: dash.accent,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.25,
                    shadowRadius: 6,
                },
                android: { elevation: 3 },
                default: {},
            }),
        },

        // ------ Settings ------------------------------------------------------
        settingsBlock: {
            backgroundColor: surface,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingTop: 12,
            paddingBottom: 4,
            marginBottom: t.cardGap,
            borderWidth: hair,
            borderColor: hairlineColor,
        },
        settingsBlockHeader: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
        },
        settingsBlockIcon: {
            width: 26,
            height: 26,
            borderRadius: 8,
            backgroundColor: dash.accentMuted,
            alignItems: "center",
            justifyContent: "center",
        },
        settingsBlockTitle: {
            fontSize: 14,
            fontWeight: "700",
            color: dash.text,
            letterSpacing: -0.2,
        },
        settingsRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 10,
            gap: 12,
            borderTopWidth: hair,
            borderTopColor: dividerColor,
        },
        settingsRowFirst: { borderTopWidth: 0 },
        settingsLabelCol: { flex: 1, minWidth: 0 },
        settingsLabel: {
            fontSize: 13,
            fontWeight: "600",
            color: dash.text,
        },
        settingsDesc: {
            marginTop: 2,
            fontSize: 11,
            color: dash.muted,
            lineHeight: 15,
        },
        switchTrack: {
            width: 48,
            height: 28,
            borderRadius: 999,
            padding: 3,
            justifyContent: "center",
        },
        switchTrackOn: { backgroundColor: dash.accent },
        switchTrackOff: { backgroundColor: "#cbd5e1" },
        switchThumb: {
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: "#fff",
            ...Platform.select({
                ios: {
                    shadowColor: "#0f172a",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                },
                android: { elevation: 2 },
                default: {},
            }),
        },
        switchThumbOn: { alignSelf: "flex-end" },
        switchThumbOff: { alignSelf: "flex-start" },

        stepperRow: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 10,
            borderTopWidth: hair,
            borderTopColor: dividerColor,
        },
        stepperRowFirst: { borderTopWidth: 0 },
        stepperLabelCol: {
            flex: 1,
            minWidth: 0,
            paddingRight: 12,
        },
        stepperWrap: {
            flexShrink: 0,
        },
        stepper: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: inputFill,
            borderRadius: 12,
            paddingHorizontal: 2,
            flexShrink: 0,
        },
        stepperBtn: {
            width: 32,
            height: 32,
            alignItems: "center",
            justifyContent: "center",
        },
        stepperInput: {
            width: 36,
            height: 32,
            textAlign: "center",
            fontSize: 15,
            fontWeight: "700",
            color: dash.text,
            padding: 0,
        },

        dateRow: {
            paddingVertical: 10,
            borderTopWidth: hair,
            borderTopColor: dividerColor,
        },
        dateRowFirst: { borderTopWidth: 0 },
        dateRowLabel: {
            fontSize: 13,
            fontWeight: "600",
            color: dash.text,
            marginBottom: 6,
        },
        dateInputWrap: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: inputFill,
            borderRadius: 11,
            paddingHorizontal: 12,
        },
        dateInputIcon: { marginRight: 8 },
        dateInput: {
            flex: 1,
            paddingVertical: Platform.OS === "ios" ? 10 : 8,
            fontSize: 14,
            color: dash.text,
        },

        // ------ Empty states --------------------------------------------------
        emptyWrap: {
            paddingVertical: 28,
            paddingHorizontal: 18,
            alignItems: "center",
            backgroundColor: surface,
            borderRadius: 14,
            borderWidth: hair,
            borderColor: hairlineColor,
            borderStyle: "dashed" as const,
        },
        emptyIconWrap: {
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: dash.accentMuted,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
        },
        emptyTitle: {
            fontSize: 15,
            fontWeight: "700",
            color: dash.text,
            letterSpacing: -0.2,
        },
        emptyBody: {
            marginTop: 4,
            fontSize: 12,
            color: dash.muted,
            textAlign: "center",
            lineHeight: 17,
            maxWidth: 280,
        },
        emptyCta: {
            marginTop: 12,
        },

        // ------ Modal (create section) ----------------------------------------
        modalRoot: { flex: 1, justifyContent: "flex-end" },
        modalBackdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(15,23,42,0.5)",
        },
        modalSheet: {
            backgroundColor: surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: t.gutter,
            paddingTop: 10,
            paddingBottom: 24,
            maxHeight: "92%",
        },
        modalGrabber: {
            alignSelf: "center",
            width: 44,
            height: 5,
            borderRadius: 3,
            backgroundColor: "#e5e7eb",
            marginBottom: 14,
        },
        modalHeaderRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 4,
        },
        modalTitle: {
            fontSize: 22,
            fontWeight: "700",
            color: dash.text,
            letterSpacing: -0.45,
        },
        modalSubtitle: {
            fontSize: 13,
            color: dash.muted,
            marginTop: 4,
            marginBottom: 14,
            lineHeight: 18,
        },
        modalCloseBtn: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: inputFill,
            alignItems: "center",
            justifyContent: "center",
        },
        modalActions: {
            flexDirection: "row",
            gap: 10,
            marginTop: 16,
        },

        fieldGroup: { marginBottom: 14 },
        fieldLabel: {
            fontSize: 11,
            fontWeight: "700",
            color: dash.muted,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            marginBottom: 8,
        },
        textInput: {
            minHeight: 48,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 12,
            fontSize: 15,
            color: dash.text,
            backgroundColor: inputFill,
        },
        timeRow: { flexDirection: "row", gap: 12 },
        timeField: { flex: 1 },
        dayChip: {
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: 10,
            backgroundColor: inputFill,
        },
        dayChipOn: { backgroundColor: dash.accent },
        dayChipText: { fontSize: 13, fontWeight: "600", color: dash.muted },
        dayChipTextOn: { color: "#fff" },
        dayChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        errorText: {
            marginTop: 8,
            fontSize: 13,
            fontWeight: "600",
            color: dash.danger,
        },
    });
}

// ============================================================================
// Small reusable components.
// ============================================================================

function ToggleSwitch({
    value,
    onValueChange,
    styles,
}: {
    value: boolean;
    onValueChange: (next: boolean) => void;
    styles: ReturnType<typeof createStyles>;
}) {
    return (
        <Pressable
            onPress={() => onValueChange(!value)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.switchTrack, value ? styles.switchTrackOn : styles.switchTrackOff]}
            accessibilityRole="switch"
            accessibilityState={{ checked: value }}
        >
            <View
                style={[
                    styles.switchThumb,
                    value ? styles.switchThumbOn : styles.switchThumbOff,
                ]}
            />
        </Pressable>
    );
}

function Stepper({
    value,
    onChange,
    min = 1,
    max = 99,
    styles,
}: {
    value: string;
    onChange: (next: string) => void;
    min?: number;
    max?: number;
    styles: ReturnType<typeof createStyles>;
}) {
    const num = Number.parseInt(value, 10);
    const safe = Number.isFinite(num) ? num : min;
    const dec = () => onChange(String(Math.max(min, safe - 1)));
    const inc = () => onChange(String(Math.min(max, safe + 1)));

    return (
        <View style={styles.stepper}>
            <Pressable
                onPress={dec}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                style={({ pressed }) => [
                    styles.stepperBtn,
                    pressed && styles.pressedOpacity,
                ]}
            >
                <Ionicons name="remove" size={16} color={dash.text} />
            </Pressable>
            <TextInput
                style={styles.stepperInput}
                value={value}
                onChangeText={(v) => onChange(v.replace(/[^\d]/g, ""))}
                keyboardType="number-pad"
                selectTextOnFocus
            />
            <Pressable
                onPress={inc}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                style={({ pressed }) => [
                    styles.stepperBtn,
                    pressed && styles.pressedOpacity,
                ]}
            >
                <Ionicons name="add" size={16} color={dash.text} />
            </Pressable>
        </View>
    );
}

function AvatarBubble({
    name,
    first,
    styles,
    sizeOverride,
}: {
    name: string;
    first?: boolean;
    styles: ReturnType<typeof createStyles>;
    sizeOverride?: number;
}) {
    const c = avatarColors(name);
    const sizeStyle = sizeOverride
        ? {
              width: sizeOverride,
              height: sizeOverride,
              borderRadius: sizeOverride / 2,
          }
        : null;
    return (
        <View
            style={[
                styles.avatarBubble,
                first && styles.avatarBubbleFirst,
                { backgroundColor: c.bg },
                sizeStyle,
            ]}
        >
            <Text style={[styles.avatarBubbleText, { color: c.fg }]}>{initialsOf(name)}</Text>
        </View>
    );
}

function AvatarStack({
    students,
    styles,
}: {
    students: SectionStudent[];
    styles: ReturnType<typeof createStyles>;
}) {
    const shown = students.slice(0, 4);
    const extra = Math.max(0, students.length - shown.length);
    return (
        <View style={styles.avatarStackRow}>
            <View style={styles.avatarStack}>
                {shown.map((s, idx) => (
                    <AvatarBubble
                        key={s.id}
                        name={s.name}
                        first={idx === 0}
                        styles={styles}
                    />
                ))}
                {extra > 0 ? (
                    <View style={styles.avatarMoreBubble}>
                        <Text style={styles.avatarMoreText}>+{extra}</Text>
                    </View>
                ) : null}
            </View>
            <Text style={styles.avatarStackLabel}>
                {students.length} enrolled
            </Text>
        </View>
    );
}

function SettingsRow({
    label,
    description,
    checked,
    onChange,
    styles,
    first,
}: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (next: boolean) => void;
    styles: ReturnType<typeof createStyles>;
    first?: boolean;
}) {
    return (
        <View style={[styles.settingsRow, first && styles.settingsRowFirst]}>
            <View style={styles.settingsLabelCol}>
                <Text style={styles.settingsLabel}>{label}</Text>
                {description ? <Text style={styles.settingsDesc}>{description}</Text> : null}
            </View>
            <ToggleSwitch value={checked} onValueChange={onChange} styles={styles} />
        </View>
    );
}

function StepperRow({
    label,
    description,
    value,
    onChange,
    min,
    max,
    styles,
    first,
}: {
    label: string;
    description?: string;
    value: string;
    onChange: (next: string) => void;
    min?: number;
    max?: number;
    styles: ReturnType<typeof createStyles>;
    first?: boolean;
}) {
    return (
        <View style={[styles.stepperRow, first && styles.stepperRowFirst]}>
            <View style={styles.stepperLabelCol}>
                <Text style={styles.settingsLabel} numberOfLines={1}>
                    {label}
                </Text>
                {description ? (
                    <Text style={styles.settingsDesc} numberOfLines={2}>
                        {description}
                    </Text>
                ) : null}
            </View>
            <View style={styles.stepperWrap}>
                <Stepper
                    value={value}
                    onChange={onChange}
                    min={min}
                    max={max}
                    styles={styles}
                />
            </View>
        </View>
    );
}

function DateRow({
    label,
    value,
    onChange,
    styles,
    first,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    styles: ReturnType<typeof createStyles>;
    first?: boolean;
}) {
    return (
        <View style={[styles.dateRow, first && styles.dateRowFirst]}>
            <Text style={styles.dateRowLabel}>{label}</Text>
            <View style={styles.dateInputWrap}>
                <Ionicons
                    name="calendar-outline"
                    size={17}
                    color={dash.muted}
                    style={styles.dateInputIcon}
                />
                <TextInput
                    style={styles.dateInput}
                    value={value}
                    onChangeText={onChange}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={dash.subtle}
                    autoCorrect={false}
                    autoCapitalize="none"
                    keyboardType="numbers-and-punctuation"
                />
            </View>
        </View>
    );
}

// ============================================================================
// Create-section bottom sheet (mobile replacement for web CreateSectionForm).
// ============================================================================

function CreateSectionSheet({
    visible,
    onClose,
    onSubmit,
    submitting,
    styles,
}: {
    visible: boolean;
    onClose: () => void;
    onSubmit: (payload: NewSectionPayload) => void;
    submitting: boolean;
    styles: ReturnType<typeof createStyles>;
}) {
    const [name, setName] = useState("");
    const [days, setDays] = useState<WeekdayId[]>([]);
    const [timeFrom, setTimeFrom] = useState("");
    const [timeTo, setTimeTo] = useState("");
    const [capacityInput, setCapacityInput] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) {
            setName("");
            setDays([]);
            setTimeFrom("");
            setTimeTo("");
            setCapacityInput("");
            setError(null);
        }
    }, [visible]);

    const toggleDay = (id: WeekdayId) => {
        setDays((prev) =>
            prev.includes(id)
                ? prev.filter((d) => d !== id)
                : [...prev, id].sort(byWeekdayOrder)
        );
    };

    const handleSubmit = () => {
        setError(null);
        const nameTrim = name.trim();
        if (!nameTrim) return setError("Enter a section name.");
        if (days.length === 0) return setError("Select at least one day.");
        if (!timeFrom || !timeTo)
            return setError("Enter a start and end time (HH:MM).");
        const cap = Number.parseInt(capacityInput, 10);
        if (!Number.isFinite(cap) || cap < 1)
            return setError("Enter a capacity of at least 1.");
        onSubmit({
            name: nameTrim,
            days: [...days],
            timeFrom,
            timeTo,
            capacity: cap,
        });
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.modalRoot}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <Pressable style={styles.modalBackdrop} onPress={onClose} />
                <View style={styles.modalSheet}>
                    <View style={styles.modalGrabber} />
                    <View style={styles.modalHeaderRow}>
                        <Text style={styles.modalTitle}>New section</Text>
                        <Pressable
                            onPress={onClose}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={({ pressed }) => [
                                styles.modalCloseBtn,
                                pressed && styles.pressedOpacity,
                            ]}
                        >
                            <Ionicons name="close" size={18} color={dash.text} />
                        </Pressable>
                    </View>
                    <Text style={styles.modalSubtitle}>
                        Define schedule and capacity for this teaching group.
                    </Text>

                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Section name</Text>
                            <TextInput
                                style={styles.textInput}
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g. Section A — Morning"
                                placeholderTextColor={dash.subtle}
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Days</Text>
                            <View style={styles.dayChipRow}>
                                {WEEKDAY_OPTIONS.map(({ id, label }) => {
                                    const on = days.includes(id);
                                    return (
                                        <Pressable
                                            key={id}
                                            onPress={() => toggleDay(id)}
                                            style={[
                                                styles.dayChip,
                                                on && styles.dayChipOn,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.dayChipText,
                                                    on && styles.dayChipTextOn,
                                                ]}
                                            >
                                                {label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>

                        <View style={styles.fieldGroup}>
                            <View style={styles.timeRow}>
                                <View style={styles.timeField}>
                                    <Text style={styles.fieldLabel}>From</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={timeFrom}
                                        onChangeText={setTimeFrom}
                                        placeholder="09:00"
                                        placeholderTextColor={dash.subtle}
                                        keyboardType="numbers-and-punctuation"
                                        autoCorrect={false}
                                    />
                                </View>
                                <View style={styles.timeField}>
                                    <Text style={styles.fieldLabel}>To</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={timeTo}
                                        onChangeText={setTimeTo}
                                        placeholder="10:30"
                                        placeholderTextColor={dash.subtle}
                                        keyboardType="numbers-and-punctuation"
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Capacity</Text>
                            <TextInput
                                style={styles.textInput}
                                value={capacityInput}
                                onChangeText={(v) =>
                                    setCapacityInput(v.replace(/[^\d]/g, ""))
                                }
                                placeholder="e.g. 40"
                                placeholderTextColor={dash.subtle}
                                keyboardType="number-pad"
                            />
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    </ScrollView>

                    <View style={styles.modalActions}>
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [
                                styles.ghostBtn,
                                { flex: 1 },
                                pressed && styles.pressedOpacity,
                            ]}
                        >
                            <Text style={styles.ghostBtnText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            onPress={handleSubmit}
                            disabled={submitting}
                            style={({ pressed }) => [
                                styles.primaryBtn,
                                styles.primaryBtnBig,
                                { flex: 1 },
                                submitting && styles.primaryBtnDisabled,
                                pressed && !submitting && styles.pressedOpacity,
                            ]}
                        >
                            <Ionicons name="add" size={18} color="#fff" />
                            <Text style={styles.primaryBtnBigText}>
                                {submitting ? "Adding…" : "Add section"}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ============================================================================
// Main screen.
// ============================================================================

export default function CourseWorkspacePage() {
    const { width: windowWidth } = useWindowDimensions();
    const styles = useMemo(() => createStyles(windowWidth), [windowWidth]);

    const router = useRouter();
    const searchParams = useLocalSearchParams<{
        courseId?: string | string[];
        courseName?: string | string[];
        courseCode?: string | string[];
        role?: string | string[];
    }>();

    const courseId = pickParam(searchParams.courseId) ?? "mock-course";
    const initialCourseName = pickParam(searchParams.courseName) ?? "Course";
    const initialCourseCode = pickParam(searchParams.courseCode) ?? "—";

    /** localStorage equivalent is not available on mobile. Default to doctor;
     *  override by passing `?role=student` while the auth store isn't wired. */
    const role = (pickParam(searchParams.role) ?? "doctor").toLowerCase();
    const isDoctor = role === "doctor";

    const [activeTab, setActiveTab] = useState<WorkspaceTab>("sections");
    const [sections, setSections] = useState<WorkspaceSection[]>([]);
    const [openedSectionId, setOpenedSectionId] = useState<string | null>(null);
    const [projects, setProjects] = useState<WorkspaceProject[]>([]);
    const [apiProjects, setApiProjects] = useState<DoctorCourseProject[]>([]);
    const [projectTeamCounts, setProjectTeamCounts] = useState<Record<number, number>>(
        {}
    );
    const [showCreateSection, setShowCreateSection] = useState(false);
    const [openedTeamProjectId, setOpenedTeamProjectId] = useState<number | null>(null);
    const [teamMessages, setTeamMessages] = useState<
        { id: number; sender: string; text: string }[]
    >([{ id: 1, sender: "Mohammad", text: "Hello team!" }]);
    const [teamChatInput, setTeamChatInput] = useState("");
    const [courseSettings, setCourseSettings] = useState<CourseWorkspaceSettingsForm>(
        defaultCourseWorkspaceSettings
    );
    const [courseHeader, setCourseHeader] = useState<{ name: string; code: string }>({
        name: initialCourseName,
        code: initialCourseCode,
    });
    const [copiedCode, setCopiedCode] = useState(false);
    const [creatingSection, setCreatingSection] = useState(false);

    const copyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(
        () => () => {
            if (copyFeedbackTimerRef.current) clearTimeout(copyFeedbackTimerRef.current);
        },
        []
    );

    useEffect(() => {
        setCourseHeader({ name: initialCourseName, code: initialCourseCode });
    }, [initialCourseName, initialCourseCode]);

    // ---- Backend loaders (mocked; flip flag once wired) ---------------------
    useEffect(() => {
        const backendId = parseBackendCourseId(courseId);
        if (backendId == null || !ENABLE_COURSE_WORKSPACE_BACKEND_API) return;
        let cancelled = false;
        getDoctorCourseSections(backendId)
            .then((apiSections) => {
                if (cancelled) return;
                setSections(
                    apiSections.map((s) => ({
                        id: String(s.id),
                        name: s.name,
                        days: s.days,
                        timeFrom: s.timeFrom ?? "",
                        timeTo: s.timeTo ?? "",
                        capacity: s.capacity,
                        students: normalizeSectionStudents(
                            (s as { students?: unknown }).students
                        ),
                    }))
                );
            })
            .catch((err) => {
                if (cancelled) return;
                showToast(parseApiErrorMessage(err), "error");
            });
        return () => {
            cancelled = true;
        };
    }, [courseId]);

    useEffect(() => {
        const backendId = parseBackendCourseId(courseId);
        if (backendId == null || !ENABLE_COURSE_WORKSPACE_BACKEND_API) return;
        let cancelled = false;
        getDoctorCourseProjects(backendId)
            .then((data) => {
                if (!cancelled) setApiProjects(data);
            })
            .catch(() => {
                /* non-critical */
            });
        return () => {
            cancelled = true;
        };
    }, [courseId]);

    useEffect(() => {
        const backendId = parseBackendCourseId(courseId);
        if (backendId == null || apiProjects.length === 0) {
            setProjectTeamCounts({});
            return;
        }
        let cancelled = false;
        void (async () => {
            const entries = await Promise.all(
                apiProjects.map(async (project) => {
                    try {
                        const res = await getDoctorProjectTeams(backendId, project.id);
                        return [project.id, res.teamCount] as const;
                    } catch {
                        return [project.id, 0] as const;
                    }
                })
            );
            if (!cancelled) setProjectTeamCounts(Object.fromEntries(entries));
        })();
        return () => {
            cancelled = true;
        };
    }, [courseId, apiProjects]);

    // ---- Actions ------------------------------------------------------------
    const handleAddSection = async (payload: NewSectionPayload) => {
        if (creatingSection) return;
        const backendId = parseBackendCourseId(courseId);
        if (backendId == null || !ENABLE_COURSE_WORKSPACE_BACKEND_API) {
            setSections((prev) => [...prev, { ...payload, id: `temp-${Date.now()}` }]);
            setShowCreateSection(false);
            return;
        }
        setCreatingSection(true);
        try {
            const created = await createDoctorCourseSection(backendId, payload);
            setSections((prev) => [
                ...prev,
                {
                    id: String(created.id),
                    name: created.name,
                    days: created.days,
                    timeFrom: created.timeFrom ?? "",
                    timeTo: created.timeTo ?? "",
                    capacity: created.capacity,
                    students: normalizeSectionStudents(
                        (created as { students?: unknown }).students
                    ),
                },
            ]);
            setShowCreateSection(false);
        } catch (err) {
            showToast(parseApiErrorMessage(err), "error");
        } finally {
            setCreatingSection(false);
        }
    };

    const goBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace("/" as Href);
    };

    const openCreateProject = () => {
        const sectionsJson = encodeURIComponent(
            JSON.stringify(sections.map((s) => ({ id: s.id, name: s.name })))
        );
        router.push(
            `/CourseProjectCreatePage?courseId=${encodeURIComponent(
                courseId
            )}&sectionsJson=${sectionsJson}` as Href
        );
    };

    const copyCourseCode = () => {
        setCopiedCode(true);
        if (copyFeedbackTimerRef.current) clearTimeout(copyFeedbackTimerRef.current);
        copyFeedbackTimerRef.current = setTimeout(() => {
            setCopiedCode(false);
            copyFeedbackTimerRef.current = null;
        }, 1500);
    };

    const saveCourseSettings = () => {
        if (__DEV__) console.log("Course settings (local draft)", courseSettings);
        showToast("Settings saved locally.", "success");
    };

    const handleSendTeamMessage = () => {
        const text = teamChatInput.trim();
        if (!text) return;
        setTeamMessages((prev) => [...prev, { id: Date.now(), sender: "You", text }]);
        setTeamChatInput("");
    };

    const teamMembers = [
        { id: 1, name: "Mohammad", role: "Leader" },
        { id: 2, name: "Ahmad", role: "Member" },
    ];

    // ---- Derived values -----------------------------------------------------
    const isRealBackend =
        parseBackendCourseId(courseId) != null && ENABLE_COURSE_WORKSPACE_BACKEND_API;
    const displayProjectsCount = isRealBackend ? apiProjects.length : projects.length;
    const sectionsCount = sections.length;

    // ============== RENDER ==================================================
    return (
        <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
            >
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* --------- Top bar ------------------------------------- */}
                    <View style={styles.topBar}>
                        <Pressable
                            onPress={goBack}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            style={({ pressed }) => [
                                styles.topBarBtn,
                                pressed && styles.pressedOpacity,
                            ]}
                        >
                            <Ionicons name="chevron-back" size={24} color={dash.text} />
                            <Text style={styles.topBarBtnText}>Courses</Text>
                        </Pressable>
                        <View style={styles.topBarRight}>
                            <Pressable
                                onPress={() =>
                                    showToast(
                                        "Sharing the course is not wired in mobile yet.",
                                        "default"
                                    )
                                }
                                style={({ pressed }) => [
                                    styles.topBarIconBtn,
                                    pressed && styles.pressedOpacity,
                                ]}
                                accessibilityLabel="Share course"
                            >
                                <Ionicons
                                    name="share-outline"
                                    size={18}
                                    color={dash.text}
                                />
                            </Pressable>
                            <Pressable
                                onPress={() => setActiveTab("settings")}
                                style={({ pressed }) => [
                                    styles.topBarIconBtn,
                                    pressed && styles.pressedOpacity,
                                ]}
                                accessibilityLabel="Course settings"
                            >
                                <Ionicons
                                    name="ellipsis-horizontal"
                                    size={18}
                                    color={dash.text}
                                />
                            </Pressable>
                        </View>
                    </View>

                    {/* --------- Hero card ----------------------------------- */}
                    <View style={styles.hero}>
                        <View style={styles.heroTitleRow}>
                            <View style={styles.heroAvatar}>
                                <Text style={styles.heroAvatarText}>
                                    {initialsOf(courseHeader.name)}
                                </Text>
                            </View>
                            <View style={styles.heroTitleCol}>
                                <Text style={styles.heroKicker}>Course workspace</Text>
                                <Text style={styles.heroTitle} numberOfLines={1}>
                                    {courseHeader.name}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.codeRow}>
                            <View style={styles.codeChip}>
                                <Ionicons
                                    name="key-outline"
                                    size={12}
                                    color={dash.accent}
                                    style={styles.codeChipIcon}
                                />
                                <Text style={styles.codeChipLabel}>Code</Text>
                                <Text style={styles.codeChipText}>
                                    {courseHeader.code}
                                </Text>
                            </View>
                            <Pressable
                                onPress={copyCourseCode}
                                style={({ pressed }) => [
                                    styles.codeAction,
                                    pressed && styles.pressedOpacity,
                                ]}
                                accessibilityLabel={`Copy course code ${courseHeader.code}`}
                            >
                                <Ionicons
                                    name="copy-outline"
                                    size={16}
                                    color={dash.muted}
                                />
                            </Pressable>
                            {copiedCode ? (
                                <View style={styles.copiedBubble}>
                                    <Text style={styles.copiedBubbleText}>Copied</Text>
                                </View>
                            ) : null}
                        </View>

                        <View style={styles.statsRow}>
                            <View style={styles.statTile}>
                                <View style={styles.statTileValueRow}>
                                    <Text style={styles.statTileValue}>{sectionsCount}</Text>
                                    <Ionicons
                                        name="layers-outline"
                                        size={16}
                                        color={dash.muted}
                                    />
                                </View>
                                <Text style={styles.statTileLabel}>Sections</Text>
                            </View>
                            <View style={styles.statTile}>
                                <View style={styles.statTileValueRow}>
                                    <Text style={styles.statTileValue}>
                                        {displayProjectsCount}
                                    </Text>
                                    <Ionicons
                                        name="folder-open-outline"
                                        size={16}
                                        color={dash.muted}
                                    />
                                </View>
                                <Text style={styles.statTileLabel}>Projects</Text>
                            </View>
                            <View style={styles.statTile}>
                                <View style={styles.statTileValueRow}>
                                    <View
                                        style={
                                            courseSettings.enableAiTeamAssignment
                                                ? styles.statTileBadgeOn
                                                : styles.statTileBadgeOff
                                        }
                                    >
                                        <Text
                                            style={
                                                courseSettings.enableAiTeamAssignment
                                                    ? styles.statTileBadgeOnText
                                                    : styles.statTileBadgeOffText
                                            }
                                        >
                                            {courseSettings.enableAiTeamAssignment
                                                ? "ON"
                                                : "OFF"}
                                        </Text>
                                    </View>
                                    <Ionicons
                                        name="sparkles-outline"
                                        size={16}
                                        color={dash.muted}
                                    />
                                </View>
                                <Text style={styles.statTileLabel}>AI teams</Text>
                            </View>
                        </View>
                    </View>

                    {/* --------- Segmented tabs ------------------------------ */}
                    <View style={styles.segmentTrack}>
                        {TABS.map(({ id, label, icon }) => {
                            const active = activeTab === id;
                            const count =
                                id === "sections"
                                    ? sectionsCount
                                    : id === "projects"
                                      ? displayProjectsCount
                                      : null;
                            return (
                                <Pressable
                                    key={id}
                                    onPress={() => setActiveTab(id)}
                                    style={({ pressed }) => [
                                        styles.segmentBtn,
                                        active && styles.segmentBtnActive,
                                        pressed && styles.pressedOpacity,
                                    ]}
                                >
                                    <Ionicons
                                        name={icon}
                                        size={16}
                                        color={active ? dash.accent : dash.muted}
                                    />
                                    <Text
                                        style={
                                            active
                                                ? styles.segmentBtnTextActive
                                                : styles.segmentBtnTextIdle
                                        }
                                    >
                                        {label}
                                    </Text>
                                    {count != null && count > 0 ? (
                                        <Text
                                            style={
                                                active
                                                    ? styles.segmentCountActive
                                                    : styles.segmentCountIdle
                                            }
                                        >
                                            {count}
                                        </Text>
                                    ) : null}
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* ====================== SECTIONS TAB =================== */}
                    {activeTab === "sections" ? (
                        <View>
                            <View style={styles.panelHeader}>
                                <View style={styles.panelTitleCol}>
                                    <Text style={styles.panelTitle}>Sections</Text>
                                    <Text style={styles.panelSubtitle}>
                                        Organize teaching groups for this course.
                                    </Text>
                                </View>
                                <Pressable
                                    onPress={() => setShowCreateSection(true)}
                                    style={({ pressed }) => [
                                        styles.primaryBtn,
                                        pressed && styles.pressedOpacity,
                                    ]}
                                >
                                    <Ionicons name="add" size={16} color="#fff" />
                                    <Text style={styles.primaryBtnText}>New</Text>
                                </Pressable>
                            </View>

                            {sections.length > 0 ? (
                                sections.map((s) => {
                                    const students = s.students ?? [];
                                    const hasStudents = students.length > 0;
                                    const isOpen = openedSectionId === s.id;
                                    const capacityFillPct = Math.min(
                                        1,
                                        Math.max(
                                            0,
                                            s.capacity > 0
                                                ? students.length / s.capacity
                                                : 0
                                        )
                                    );
                                    const timeStr = formatSectionScheduleTime(
                                        s.timeFrom,
                                        s.timeTo
                                    );
                                    return (
                                        <View key={s.id} style={styles.card}>
                                            <View style={styles.cardTopRow}>
                                                <Text
                                                    style={styles.cardTitle}
                                                    numberOfLines={2}
                                                >
                                                    {s.name}
                                                </Text>
                                                <View style={styles.statusPill}>
                                                    <Ionicons
                                                        name="ellipse"
                                                        size={6}
                                                        color={dash.accent}
                                                    />
                                                    <Text style={styles.statusPillText}>
                                                        Active
                                                    </Text>
                                                </View>
                                            </View>

                                            {s.days.length > 0 ? (
                                                <View style={styles.sectionDayChipsRow}>
                                                    {[...s.days]
                                                        .sort(byWeekdayOrder)
                                                        .map((d) => (
                                                            <View
                                                                key={d}
                                                                style={styles.sectionDayChip}
                                                            >
                                                                <Text
                                                                    style={
                                                                        styles.sectionDayChipText
                                                                    }
                                                                >
                                                                    {DAY_LOOKUP[d] ?? d}
                                                                </Text>
                                                            </View>
                                                        ))}
                                                </View>
                                            ) : null}

                                            {timeStr ? (
                                                <View style={styles.sectionTimeRow}>
                                                    <Ionicons
                                                        name="time-outline"
                                                        size={14}
                                                        color={dash.muted}
                                                    />
                                                    <Text style={styles.sectionTimeText}>
                                                        {timeStr}
                                                    </Text>
                                                </View>
                                            ) : null}

                                            <View style={styles.capacityWrap}>
                                                <View style={styles.capacityLabelRow}>
                                                    <Text style={styles.capacityLabel}>
                                                        Capacity
                                                    </Text>
                                                    <Text>
                                                        <Text style={styles.capacityValue}>
                                                            {students.length}
                                                        </Text>
                                                        <Text
                                                            style={
                                                                styles.capacityValueMuted
                                                            }
                                                        >
                                                            {" / "}
                                                            {s.capacity} students
                                                        </Text>
                                                    </Text>
                                                </View>
                                                <View style={styles.capacityTrack}>
                                                    <View
                                                        style={[
                                                            styles.capacityFill,
                                                            {
                                                                width: `${
                                                                    capacityFillPct * 100
                                                                }%`,
                                                            },
                                                        ]}
                                                    />
                                                </View>
                                            </View>

                                            {hasStudents ? (
                                                <AvatarStack
                                                    students={students}
                                                    styles={styles}
                                                />
                                            ) : null}

                                            <View style={styles.cardActionsRow}>
                                                <Pressable
                                                    onPress={() =>
                                                        router.push(
                                                            `/SectionStudentsPage?courseId=${encodeURIComponent(
                                                                courseId
                                                            )}&sectionId=${encodeURIComponent(
                                                                String(s.id)
                                                            )}&sectionName=${encodeURIComponent(
                                                                s.name
                                                            )}` as Href
                                                        )
                                                    }
                                                    style={({ pressed }) => [
                                                        styles.secondaryBtn,
                                                        styles.cardActionFlex,
                                                        pressed && styles.pressedOpacity,
                                                    ]}
                                                >
                                                    <Ionicons
                                                        name="people-outline"
                                                        size={15}
                                                        color={dash.text}
                                                    />
                                                    <Text style={styles.secondaryBtnText}>
                                                        Manage students
                                                    </Text>
                                                </Pressable>
                                                {hasStudents ? (
                                                    <Pressable
                                                        onPress={() =>
                                                            setOpenedSectionId((prev) =>
                                                                prev === s.id ? null : s.id
                                                            )
                                                        }
                                                        style={({ pressed }) => [
                                                            styles.secondaryBtn,
                                                            styles.cardActionFlex,
                                                            pressed &&
                                                                styles.pressedOpacity,
                                                        ]}
                                                    >
                                                        <Ionicons
                                                            name={
                                                                isOpen
                                                                    ? "chevron-up"
                                                                    : "chevron-down"
                                                            }
                                                            size={15}
                                                            color={dash.text}
                                                        />
                                                        <Text
                                                            style={styles.secondaryBtnText}
                                                        >
                                                            {isOpen ? "Hide" : "View"} list
                                                        </Text>
                                                    </Pressable>
                                                ) : null}
                                            </View>

                                            {hasStudents && isOpen ? (
                                                <View style={styles.studentsPanel}>
                                                    {students.map((student, index) => {
                                                        const c = avatarColors(
                                                            student.name
                                                        );
                                                        return (
                                                            <View
                                                                key={student.id}
                                                                style={[
                                                                    styles.studentRow,
                                                                    index ===
                                                                        students.length -
                                                                            1 &&
                                                                        styles.studentRowLast,
                                                                ]}
                                                            >
                                                                <View
                                                                    style={[
                                                                        styles.studentAvatar,
                                                                        {
                                                                            backgroundColor:
                                                                                c.bg,
                                                                        },
                                                                    ]}
                                                                >
                                                                    <Text
                                                                        style={[
                                                                            styles.studentAvatarText,
                                                                            { color: c.fg },
                                                                        ]}
                                                                    >
                                                                        {initialsOf(
                                                                            student.name
                                                                        )}
                                                                    </Text>
                                                                </View>
                                                                <View
                                                                    style={
                                                                        styles.studentInfoCol
                                                                    }
                                                                >
                                                                    <Text
                                                                        style={
                                                                            styles.studentName
                                                                        }
                                                                        numberOfLines={1}
                                                                    >
                                                                        {student.name}
                                                                    </Text>
                                                                    {student.email ? (
                                                                        <Text
                                                                            style={
                                                                                styles.studentEmail
                                                                            }
                                                                            numberOfLines={1}
                                                                        >
                                                                            {student.email}
                                                                        </Text>
                                                                    ) : null}
                                                                </View>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            ) : null}
                                        </View>
                                    );
                                })
                            ) : (
                                <View style={styles.emptyWrap}>
                                    <View style={styles.emptyIconWrap}>
                                        <Ionicons
                                            name="layers-outline"
                                            size={28}
                                            color={dash.accent}
                                        />
                                    </View>
                                    <Text style={styles.emptyTitle}>No sections yet</Text>
                                    <Text style={styles.emptyBody}>
                                        Define schedules and capacity for each teaching
                                        group to start organizing this course.
                                    </Text>
                                    <Pressable
                                        onPress={() => setShowCreateSection(true)}
                                        style={({ pressed }) => [
                                            styles.primaryBtn,
                                            styles.primaryBtnBig,
                                            styles.emptyCta,
                                            pressed && styles.pressedOpacity,
                                        ]}
                                    >
                                        <Ionicons name="add" size={18} color="#fff" />
                                        <Text style={styles.primaryBtnBigText}>
                                            Create section
                                        </Text>
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    ) : null}

                    {/* ====================== PROJECTS TAB =================== */}
                    {activeTab === "projects" ? (
                        <View>
                            <View style={styles.panelHeader}>
                                <View style={styles.panelTitleCol}>
                                    <Text style={styles.panelTitle}>Projects</Text>
                                    <Text style={styles.panelSubtitle}>
                                        Course projects and team formation settings.
                                    </Text>
                                </View>
                                <Pressable
                                    onPress={openCreateProject}
                                    style={({ pressed }) => [
                                        styles.primaryBtn,
                                        pressed && styles.pressedOpacity,
                                    ]}
                                >
                                    <Ionicons name="add" size={16} color="#fff" />
                                    <Text style={styles.primaryBtnText}>New</Text>
                                </Pressable>
                            </View>

                            {displayProjectsCount > 0 ? (
                                isRealBackend ? (
                                    (apiProjects as DoctorCourseProject[]).map((project) => {
                                        const isDoctorAssignedProject =
                                            isDoctor && project.aiMode === "doctor";
                                        const sectionsLabelList = project.applyToAllSections
                                            ? ["All sections"]
                                            : project.sections.map(
                                                  (s) => s.sectionName.trim() || "Section"
                                              );
                                        return (
                                            <Pressable
                                                key={project.id}
                                                onPress={() => {
                                                    if (!isDoctorAssignedProject) return;
                                                    showToast(
                                                        "Project team management is not wired in mobile yet.",
                                                        "default"
                                                    );
                                                }}
                                                style={({ pressed }) => [
                                                    styles.card,
                                                    pressed &&
                                                        isDoctorAssignedProject &&
                                                        styles.pressedOpacity,
                                                ]}
                                            >
                                                <View style={styles.projectHeaderRow}>
                                                    <Text
                                                        style={styles.cardTitle}
                                                        numberOfLines={2}
                                                    >
                                                        {project.title}
                                                    </Text>
                                                    <View style={styles.statusPill}>
                                                        <Ionicons
                                                            name={
                                                                project.aiMode === "doctor"
                                                                    ? "sparkles-outline"
                                                                    : "person-outline"
                                                            }
                                                            size={10}
                                                            color={dash.accent}
                                                        />
                                                        <Text style={styles.statusPillText}>
                                                            {project.aiMode === "doctor"
                                                                ? "AI assigns"
                                                                : "Students pick"}
                                                        </Text>
                                                    </View>
                                                </View>

                                                <View style={styles.projectMetaRow}>
                                                    {sectionsLabelList.map((label, i) => (
                                                        <View
                                                            key={`${label}-${i}`}
                                                            style={styles.sectionMetaChip}
                                                        >
                                                            <Ionicons
                                                                name="layers-outline"
                                                                size={11}
                                                                color={dash.muted}
                                                            />
                                                            <Text
                                                                style={
                                                                    styles.sectionMetaChipText
                                                                }
                                                                numberOfLines={1}
                                                            >
                                                                {label}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                </View>

                                                <View style={styles.statBlocksRow}>
                                                    <View style={styles.statBlock}>
                                                        <Text style={styles.statBlockLabel}>
                                                            Team size
                                                        </Text>
                                                        <Text style={styles.statBlockValue}>
                                                            {project.teamSize}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.statBlock}>
                                                        <Text style={styles.statBlockLabel}>
                                                            Teams
                                                        </Text>
                                                        <Text style={styles.statBlockValue}>
                                                            {projectTeamCounts[project.id] ??
                                                                "—"}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {project.description ? (
                                                    <Text
                                                        style={styles.projectDesc}
                                                        numberOfLines={3}
                                                    >
                                                        {project.description}
                                                    </Text>
                                                ) : null}

                                                <View
                                                    style={[
                                                        styles.cardActionsRow,
                                                        { justifyContent: "flex-end" },
                                                    ]}
                                                >
                                                    {isDoctor ? (
                                                        <Pressable
                                                            onPress={() =>
                                                                showToast(
                                                                    "Project team management is not wired in mobile yet.",
                                                                    "default"
                                                                )
                                                            }
                                                            style={({ pressed }) => [
                                                                styles.primaryBtn,
                                                                pressed &&
                                                                    styles.pressedOpacity,
                                                            ]}
                                                        >
                                                            <Ionicons
                                                                name="people"
                                                                size={14}
                                                                color="#fff"
                                                            />
                                                            <Text style={styles.primaryBtnText}>
                                                                Assign teams
                                                            </Text>
                                                        </Pressable>
                                                    ) : (
                                                        <Pressable
                                                            onPress={() =>
                                                                setOpenedTeamProjectId(
                                                                    (prev) =>
                                                                        prev === project.id
                                                                            ? null
                                                                            : project.id
                                                                )
                                                            }
                                                            style={({ pressed }) => [
                                                                styles.secondaryBtn,
                                                                pressed &&
                                                                    styles.pressedOpacity,
                                                            ]}
                                                        >
                                                            <Ionicons
                                                                name={
                                                                    openedTeamProjectId ===
                                                                    project.id
                                                                        ? "chevron-up"
                                                                        : "chevron-down"
                                                                }
                                                                size={14}
                                                                color={dash.text}
                                                            />
                                                            <Text
                                                                style={
                                                                    styles.secondaryBtnText
                                                                }
                                                            >
                                                                View my team
                                                            </Text>
                                                        </Pressable>
                                                    )}
                                                </View>

                                                {!isDoctor &&
                                                openedTeamProjectId === project.id ? (
                                                    <View style={styles.teamPanel}>
                                                        <View style={styles.teamMembersRow}>
                                                            {teamMembers.map((member) => {
                                                                const c = avatarColors(
                                                                    member.name
                                                                );
                                                                return (
                                                                    <View
                                                                        key={member.id}
                                                                        style={
                                                                            styles.teamMember
                                                                        }
                                                                    >
                                                                        <View
                                                                            style={[
                                                                                styles.studentAvatar,
                                                                                {
                                                                                    backgroundColor:
                                                                                        c.bg,
                                                                                },
                                                                            ]}
                                                                        >
                                                                            <Text
                                                                                style={[
                                                                                    styles.studentAvatarText,
                                                                                    {
                                                                                        color: c.fg,
                                                                                    },
                                                                                ]}
                                                                            >
                                                                                {initialsOf(
                                                                                    member.name
                                                                                )}
                                                                            </Text>
                                                                        </View>
                                                                        <View
                                                                            style={
                                                                                styles.teamMemberInfo
                                                                            }
                                                                        >
                                                                            <Text
                                                                                style={
                                                                                    styles.teamMemberName
                                                                                }
                                                                            >
                                                                                {member.name}
                                                                            </Text>
                                                                            <Text
                                                                                style={
                                                                                    styles.teamMemberRole
                                                                                }
                                                                            >
                                                                                {member.role}
                                                                            </Text>
                                                                        </View>
                                                                        {member.role ===
                                                                        "Leader" ? (
                                                                            <View
                                                                                style={
                                                                                    styles.leaderBadge
                                                                                }
                                                                            >
                                                                                <Text
                                                                                    style={
                                                                                        styles.leaderBadgeText
                                                                                    }
                                                                                >
                                                                                    Leader
                                                                                </Text>
                                                                            </View>
                                                                        ) : null}
                                                                    </View>
                                                                );
                                                            })}
                                                        </View>

                                                        <View style={styles.chatHeader}>
                                                            <Ionicons
                                                                name="chatbubbles-outline"
                                                                size={13}
                                                                color={dash.muted}
                                                            />
                                                            <Text style={styles.chatHeaderText}>
                                                                Team chat
                                                            </Text>
                                                        </View>
                                                        <ScrollView
                                                            style={styles.chatList}
                                                            contentContainerStyle={{ gap: 6 }}
                                                            showsVerticalScrollIndicator={
                                                                false
                                                            }
                                                        >
                                                            {teamMessages.map((m) => {
                                                                const mine =
                                                                    m.sender === "You";
                                                                return (
                                                                    <View
                                                                        key={m.id}
                                                                        style={
                                                                            styles.chatBubbleWrap
                                                                        }
                                                                    >
                                                                        <View
                                                                            style={[
                                                                                styles.chatBubble,
                                                                                mine
                                                                                    ? styles.chatBubbleMine
                                                                                    : styles.chatBubbleTheirs,
                                                                            ]}
                                                                        >
                                                                            {!mine ? (
                                                                                <Text
                                                                                    style={
                                                                                        styles.chatSenderLabel
                                                                                    }
                                                                                >
                                                                                    {m.sender}
                                                                                </Text>
                                                                            ) : null}
                                                                            <Text
                                                                                style={
                                                                                    mine
                                                                                        ? styles.chatBubbleTextMine
                                                                                        : styles.chatBubbleTextTheirs
                                                                                }
                                                                            >
                                                                                {m.text}
                                                                            </Text>
                                                                        </View>
                                                                    </View>
                                                                );
                                                            })}
                                                        </ScrollView>
                                                        <View style={styles.chatInputRow}>
                                                            <TextInput
                                                                value={teamChatInput}
                                                                onChangeText={setTeamChatInput}
                                                                placeholder="Message your team…"
                                                                placeholderTextColor={
                                                                    dash.subtle
                                                                }
                                                                onSubmitEditing={
                                                                    handleSendTeamMessage
                                                                }
                                                                returnKeyType="send"
                                                                style={styles.chatInput}
                                                            />
                                                            <Pressable
                                                                onPress={
                                                                    handleSendTeamMessage
                                                                }
                                                                style={({ pressed }) => [
                                                                    styles.chatSendBtn,
                                                                    pressed &&
                                                                        styles.pressedOpacity,
                                                                ]}
                                                                accessibilityLabel="Send message"
                                                            >
                                                                <Ionicons
                                                                    name="arrow-up"
                                                                    size={17}
                                                                    color="#fff"
                                                                />
                                                            </Pressable>
                                                        </View>
                                                    </View>
                                                ) : null}
                                            </Pressable>
                                        );
                                    })
                                ) : (
                                    (projects as WorkspaceProject[]).map((p) => (
                                        <View key={p.id} style={styles.card}>
                                            <View style={styles.projectHeaderRow}>
                                                <Text
                                                    style={styles.cardTitle}
                                                    numberOfLines={2}
                                                >
                                                    {p.title}
                                                </Text>
                                                <View style={styles.statusPill}>
                                                    <Ionicons
                                                        name={
                                                            p.aiMode === "doctor"
                                                                ? "sparkles-outline"
                                                                : "person-outline"
                                                        }
                                                        size={10}
                                                        color={dash.accent}
                                                    />
                                                    <Text style={styles.statusPillText}>
                                                        {p.aiMode === "doctor"
                                                            ? "AI assigns"
                                                            : "Students pick"}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.projectMetaRow}>
                                                <View style={styles.sectionMetaChip}>
                                                    <Ionicons
                                                        name="layers-outline"
                                                        size={11}
                                                        color={dash.muted}
                                                    />
                                                    <Text
                                                        style={styles.sectionMetaChipText}
                                                        numberOfLines={1}
                                                    >
                                                        {p.sectionLabel}
                                                    </Text>
                                                </View>
                                                {p.duration ? (
                                                    <View style={styles.sectionMetaChip}>
                                                        <Ionicons
                                                            name="time-outline"
                                                            size={11}
                                                            color={dash.muted}
                                                        />
                                                        <Text
                                                            style={
                                                                styles.sectionMetaChipText
                                                            }
                                                            numberOfLines={1}
                                                        >
                                                            {p.duration}
                                                        </Text>
                                                    </View>
                                                ) : null}
                                            </View>

                                            <View style={styles.statBlocksRow}>
                                                <View style={styles.statBlock}>
                                                    <Text style={styles.statBlockLabel}>
                                                        Team size
                                                    </Text>
                                                    <Text style={styles.statBlockValue}>
                                                        {p.teamSize}
                                                    </Text>
                                                </View>
                                                <View style={styles.statBlock}>
                                                    <Text style={styles.statBlockLabel}>
                                                        Status
                                                    </Text>
                                                    <Text style={styles.statBlockValue}>
                                                        Draft
                                                    </Text>
                                                </View>
                                            </View>

                                            {p.abstract ? (
                                                <Text
                                                    style={styles.projectDesc}
                                                    numberOfLines={3}
                                                >
                                                    {p.abstract}
                                                </Text>
                                            ) : null}
                                        </View>
                                    ))
                                )
                            ) : (
                                <View style={styles.emptyWrap}>
                                    <View style={styles.emptyIconWrap}>
                                        <Ionicons
                                            name="folder-open-outline"
                                            size={28}
                                            color={dash.accent}
                                        />
                                    </View>
                                    <Text style={styles.emptyTitle}>No projects yet</Text>
                                    <Text style={styles.emptyBody}>
                                        Define a title, scope, and section targeting to
                                        launch the first project for this course.
                                    </Text>
                                    <Pressable
                                        onPress={openCreateProject}
                                        style={({ pressed }) => [
                                            styles.primaryBtn,
                                            styles.primaryBtnBig,
                                            styles.emptyCta,
                                            pressed && styles.pressedOpacity,
                                        ]}
                                    >
                                        <Ionicons name="add" size={18} color="#fff" />
                                        <Text style={styles.primaryBtnBigText}>
                                            Create project
                                        </Text>
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    ) : null}

                    {/* ====================== SETTINGS TAB =================== */}
                    {activeTab === "settings" ? (
                        <View>
                            <View style={styles.panelHeader}>
                                <View style={styles.panelTitleCol}>
                                    <Text style={styles.panelTitle}>Course settings</Text>
                                    <Text style={styles.panelSubtitle}>
                                        Team rules, AI behavior, and project deadlines.
                                        Local only until an API is connected.
                                    </Text>
                                </View>
                            </View>

                            {/* Team rules */}
                            <View style={styles.settingsBlock}>
                                <View style={styles.settingsBlockHeader}>
                                    <View style={styles.settingsBlockIcon}>
                                        <Ionicons
                                            name="people-outline"
                                            size={15}
                                            color={dash.accent}
                                        />
                                    </View>
                                    <Text style={styles.settingsBlockTitle}>Team rules</Text>
                                </View>
                                <SettingsRow
                                    styles={styles}
                                    first
                                    label="Allow cross-section teams"
                                    description="Students may form teams across different teaching sections."
                                    checked={courseSettings.allowCrossSectionTeams}
                                    onChange={(v) =>
                                        setCourseSettings((s) => ({
                                            ...s,
                                            allowCrossSectionTeams: v,
                                        }))
                                    }
                                />
                                <StepperRow
                                    styles={styles}
                                    label="Min team size"
                                    description="Smallest allowed team."
                                    value={courseSettings.minTeamSize}
                                    onChange={(v) =>
                                        setCourseSettings((s) => ({ ...s, minTeamSize: v }))
                                    }
                                    min={1}
                                    max={50}
                                />
                                <StepperRow
                                    styles={styles}
                                    label="Max team size"
                                    description="Largest allowed team."
                                    value={courseSettings.maxTeamSize}
                                    onChange={(v) =>
                                        setCourseSettings((s) => ({ ...s, maxTeamSize: v }))
                                    }
                                    min={1}
                                    max={50}
                                />
                            </View>

                            {/* AI settings */}
                            <View style={styles.settingsBlock}>
                                <View style={styles.settingsBlockHeader}>
                                    <View style={styles.settingsBlockIcon}>
                                        <Ionicons
                                            name="sparkles-outline"
                                            size={15}
                                            color={dash.accent}
                                        />
                                    </View>
                                    <Text style={styles.settingsBlockTitle}>AI settings</Text>
                                </View>
                                <SettingsRow
                                    styles={styles}
                                    first
                                    label="Enable AI team assignment"
                                    description="Use AI suggestions when forming or balancing teams."
                                    checked={courseSettings.enableAiTeamAssignment}
                                    onChange={(v) =>
                                        setCourseSettings((s) => ({
                                            ...s,
                                            enableAiTeamAssignment: v,
                                        }))
                                    }
                                />
                                <SettingsRow
                                    styles={styles}
                                    label="Students choose teammates"
                                    description="When off, team composition is guided by course rules or staff."
                                    checked={courseSettings.allowStudentsChooseTeammates}
                                    onChange={(v) =>
                                        setCourseSettings((s) => ({
                                            ...s,
                                            allowStudentsChooseTeammates: v,
                                        }))
                                    }
                                />
                            </View>

                            {/* Project rules */}
                            <View style={styles.settingsBlock}>
                                <View style={styles.settingsBlockHeader}>
                                    <View style={styles.settingsBlockIcon}>
                                        <Ionicons
                                            name="folder-open-outline"
                                            size={15}
                                            color={dash.accent}
                                        />
                                    </View>
                                    <Text style={styles.settingsBlockTitle}>
                                        Project rules
                                    </Text>
                                </View>
                                <SettingsRow
                                    styles={styles}
                                    first
                                    label="Multiple projects per section"
                                    description="Sections can run more than one active project at a time."
                                    checked={
                                        courseSettings.allowMultipleProjectsPerSection
                                    }
                                    onChange={(v) =>
                                        setCourseSettings((s) => ({
                                            ...s,
                                            allowMultipleProjectsPerSection: v,
                                        }))
                                    }
                                />
                                <StepperRow
                                    styles={styles}
                                    label="Max projects per course"
                                    description="Cap how many projects can run in this course."
                                    value={courseSettings.maxProjectsPerCourse}
                                    onChange={(v) =>
                                        setCourseSettings((s) => ({
                                            ...s,
                                            maxProjectsPerCourse: v,
                                        }))
                                    }
                                    min={1}
                                    max={99}
                                />
                            </View>

                            {/* Timeline */}
                            <View style={styles.settingsBlock}>
                                <View style={styles.settingsBlockHeader}>
                                    <View style={styles.settingsBlockIcon}>
                                        <Ionicons
                                            name="calendar-outline"
                                            size={15}
                                            color={dash.accent}
                                        />
                                    </View>
                                    <Text style={styles.settingsBlockTitle}>Timeline</Text>
                                </View>
                                <DateRow
                                    styles={styles}
                                    first
                                    label="Team formation deadline"
                                    value={courseSettings.teamFormationDeadline}
                                    onChange={(v) =>
                                        setCourseSettings((s) => ({
                                            ...s,
                                            teamFormationDeadline: v,
                                        }))
                                    }
                                />
                                <DateRow
                                    styles={styles}
                                    label="Project submission deadline"
                                    value={courseSettings.projectSubmissionDeadline}
                                    onChange={(v) =>
                                        setCourseSettings((s) => ({
                                            ...s,
                                            projectSubmissionDeadline: v,
                                        }))
                                    }
                                />
                            </View>

                            <Pressable
                                onPress={saveCourseSettings}
                                style={({ pressed }) => [
                                    styles.primaryBtn,
                                    styles.primaryBtnBig,
                                    { marginTop: 8 },
                                    pressed && styles.pressedOpacity,
                                ]}
                            >
                                <Ionicons name="save-outline" size={18} color="#fff" />
                                <Text style={styles.primaryBtnBigText}>Save settings</Text>
                            </Pressable>
                        </View>
                    ) : null}
                </ScrollView>
            </KeyboardAvoidingView>

            <CreateSectionSheet
                visible={showCreateSection}
                onClose={() => setShowCreateSection(false)}
                onSubmit={handleAddSection}
                submitting={creatingSection}
                styles={styles}
            />
        </SafeAreaView>
    );
}
