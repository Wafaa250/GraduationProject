import {
    createElement as createDomElement,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
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
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import DateTimePicker, {
    DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
    createDoctorCourseSection,
    getDoctorCourseDetail,
    getDoctorCourseProjects,
    getDoctorCourseSections,
    getDoctorProjectTeams,
    getDoctorSectionStudents,
    type DoctorCourseProject,
    type DoctorCourseStudent,
} from "@/api/doctorCoursesApi";

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

/** Mirrors the fields rendered in the web Course → Settings tab. */
type CourseWorkspaceSettingsForm = {
    allowCrossSectionTeams: boolean;
    enableAiTeamAssignment: boolean;
    allowStudentsChooseTeammates: boolean;
    teamFormationDeadline: string;
    projectSubmissionDeadline: string;
};

const defaultCourseWorkspaceSettings: CourseWorkspaceSettingsForm = {
    allowCrossSectionTeams: false,
    enableAiTeamAssignment: true,
    allowStudentsChooseTeammates: false,
    teamFormationDeadline: "",
    projectSubmissionDeadline: "",
};

// ============================================================================
// Course workspace uses `mobile/api/doctorCoursesApi` (Bearer token via axios).
// ============================================================================

function showToast(
    message: string,
    variant: "error" | "success" | "default" = "default"
) {
    if (__DEV__) console.log(`[toast:${variant}]`, message);
    const title =
        variant === "error" ? "Error" : variant === "success" ? "Success" : "Notice";
    Alert.alert(title, message);
}

function doctorCourseStudentToSectionStudent(row: DoctorCourseStudent): SectionStudent {
    return {
        id: String(row.studentId),
        name: row.name?.trim() || "Student",
        email: row.email?.trim() || undefined,
    };
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

const DAY_LOOKUP: Record<string, string> = Object.fromEntries(
    WEEKDAY_OPTIONS.map((d) => [d.id, d.label])
);

function byWeekdayOrder(a: string, b: string): number {
    const order = WEEKDAY_OPTIONS.map((d) => d.id) as readonly string[];
    return order.indexOf(a) - order.indexOf(b);
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

// ----- Time picker helpers --------------------------------------------------
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
const MINUTES_STEP_5 = Array.from({ length: 12 }, (_, i) => i * 5);
const WHEEL_ITEM_HEIGHT = 44;
const WHEEL_VISIBLE_COUNT = 5;
const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_COUNT;
const WHEEL_PAD = ((WHEEL_VISIBLE_COUNT - 1) / 2) * WHEEL_ITEM_HEIGHT;

function clampNumber(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(n, max));
}

function pad2(n: number): string {
    return n < 10 ? `0${n}` : String(n);
}

function toHHMM(h: number, m: number): string {
    return `${pad2(h)}:${pad2(m)}`;
}

function parseTimeOfDay(
    raw: string,
    fallback: { h: number; m: number },
): { h: number; m: number } {
    const parts = (raw ?? "").split(":");
    const h = Number.parseInt(parts[0] ?? "", 10);
    const m = Number.parseInt(parts[1] ?? "", 10);
    const minuteSnapped = Number.isFinite(m)
        ? clampNumber(Math.round(m / 5) * 5, 0, 55)
        : fallback.m;
    return {
        h: Number.isFinite(h) ? clampNumber(h, 0, 23) : fallback.h,
        m: minuteSnapped,
    };
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
        statusPillReady: {
            backgroundColor: "#dcfce7",
        },
        statusPillReadyText: {
            color: "#15803d",
        },
        statusPillPending: {
            backgroundColor: "#fef3c7",
        },
        statusPillPendingText: {
            color: "#a16207",
        },
        statusPillNeutral: {
            backgroundColor: subtleBg,
        },
        statusPillNeutralText: {
            color: dash.muted,
        },
        projectPillsRow: {
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 6,
            flexShrink: 1,
            justifyContent: "flex-end",
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

        // ------ Team panel styles moved out: see ProjectTeamsPage.tsx --------

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
        dateInputPlaceholder: {
            color: dash.subtle,
        },
        datePickerOverlay: {
            flex: 1,
            justifyContent: "flex-end",
        },
        datePickerBackdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(15,23,42,0.18)",
        },
        datePickerSheet: {
            backgroundColor: surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: Platform.OS === "ios" ? 26 : 16,
            ...Platform.select({
                ios: {
                    shadowColor: "#0f172a",
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 16,
                },
                android: { elevation: 8 },
                default: {},
            }),
        },
        datePickerHeader: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 6,
        },
        datePickerTitle: {
            fontSize: 14,
            fontWeight: "700",
            color: dash.text,
            flex: 1,
            textAlign: "center",
            marginHorizontal: 12,
        },
        datePickerCancel: {
            fontSize: 14,
            fontWeight: "600",
            color: dash.muted,
        },
        datePickerDone: {
            fontSize: 14,
            fontWeight: "700",
            color: dash.accent,
        },
        datePickerInline: {
            alignSelf: "center",
            width: "100%",
            maxWidth: 380,
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
        timeInputRow: {
            minHeight: 48,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: inputFill,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
        },
        timeInputText: {
            fontSize: 15,
            fontWeight: "600",
            color: dash.text,
            flex: 1,
        },
        timeInputPlaceholder: {
            color: dash.subtle,
            fontWeight: "500",
        },

        // ------ Time picker overlay -------------------------------------------
        pickerOverlay: {
            ...StyleSheet.absoluteFillObject,
            justifyContent: "flex-end",
        },
        pickerBackdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(15,23,42,0.5)",
        },
        pickerSheet: {
            backgroundColor: surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: t.gutter,
            paddingTop: 18,
            paddingBottom: 24,
        },
        pickerHeader: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
        },
        pickerHeaderTitle: {
            fontSize: 18,
            fontWeight: "700",
            color: dash.text,
            letterSpacing: -0.3,
        },
        pickerHeaderPreview: {
            marginTop: 4,
            fontSize: 13,
            color: dash.muted,
            fontWeight: "600",
        },
        pickerHeaderIcon: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: dash.accentMuted,
            alignItems: "center",
            justifyContent: "center",
        },
        pickerWheelRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            height: WHEEL_HEIGHT,
            position: "relative",
        },
        pickerWheelBand: {
            position: "absolute",
            left: 0,
            right: 0,
            top: WHEEL_PAD,
            height: WHEEL_ITEM_HEIGHT,
            borderRadius: 12,
            backgroundColor: dash.accentMuted,
        },
        pickerWheelCol: {
            width: 88,
            height: WHEEL_HEIGHT,
        },
        pickerWheelItem: {
            height: WHEEL_ITEM_HEIGHT,
            alignItems: "center",
            justifyContent: "center",
        },
        pickerWheelItemText: {
            fontSize: 18,
            fontWeight: "600",
            color: dash.muted,
        },
        pickerWheelItemTextActive: {
            fontSize: 22,
            fontWeight: "800",
            color: dash.accent,
        },
        pickerColon: {
            fontSize: 24,
            fontWeight: "800",
            color: dash.text,
            paddingHorizontal: 6,
        },

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

/** "YYYY-MM-DD" ↔ Date helpers used by the Timeline date pickers. */
function toYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}

function fromYmd(s: string | undefined | null): Date | null {
    if (!s) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
    if (!m) return null;
    const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isFinite(date.getTime()) ? date : null;
}

/** Human-friendly label (e.g. "May 12, 2026"); falls back to placeholder copy. */
function formatDateLabel(value: string): string | null {
    const d = fromYmd(value);
    if (!d) return null;
    try {
        return d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
        });
    } catch {
        return value;
    }
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
    // iOS uses a controlled modal with an inline picker + Done/Cancel. Android
    // uses the native imperative dialog. Web renders an <input type="date"> so
    // Expo Web previews behave like a real date input too.
    const [iosOpen, setIosOpen] = useState(false);
    const [iosDraft, setIosDraft] = useState<Date>(() => fromYmd(value) ?? new Date());

    const openPicker = useCallback(() => {
        const current = fromYmd(value) ?? new Date();
        if (Platform.OS === "android") {
            DateTimePickerAndroid.open({
                mode: "date",
                value: current,
                onChange: (event, picked) => {
                    if (event.type === "set" && picked) {
                        onChange(toYmd(picked));
                    }
                },
            });
            return;
        }
        if (Platform.OS === "ios") {
            setIosDraft(current);
            setIosOpen(true);
        }
    }, [value, onChange]);

    const displayLabel = formatDateLabel(value);

    // ── Web: use the platform-native HTML date input for the best UX. ───────
    if (Platform.OS === "web") {
        const webInput = createDomElement("input", {
            type: "date",
            value,
            onChange: (e: { target: { value?: string } }) =>
                onChange(String(e.target?.value ?? "")),
            "aria-label": label,
            style: {
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 14,
                color: dash.text,
                padding: 0,
                margin: 0,
                fontFamily: "inherit",
                cursor: "pointer",
            },
        });
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
                    {webInput}
                    {value ? (
                        <Pressable
                            accessibilityLabel="Clear date"
                            onPress={() => onChange("")}
                            hitSlop={8}
                            style={({ pressed }) => pressed && styles.pressedOpacity}
                        >
                            <Ionicons name="close" size={16} color={dash.muted} />
                        </Pressable>
                    ) : null}
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.dateRow, first && styles.dateRowFirst]}>
            <Text style={styles.dateRowLabel}>{label}</Text>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${label}: ${displayLabel ?? "no date selected"}. Tap to pick a date.`}
                onPress={openPicker}
                style={({ pressed }) => [
                    styles.dateInputWrap,
                    pressed && styles.pressedOpacity,
                ]}
            >
                <Ionicons
                    name="calendar-outline"
                    size={17}
                    color={dash.muted}
                    style={styles.dateInputIcon}
                />
                <Text style={[styles.dateInput, !displayLabel && styles.dateInputPlaceholder]}>
                    {displayLabel ?? "Select date"}
                </Text>
                {value ? (
                    <Pressable
                        accessibilityLabel="Clear date"
                        onPress={() => onChange("")}
                        hitSlop={8}
                        style={({ pressed }) => pressed && styles.pressedOpacity}
                    >
                        <Ionicons name="close" size={16} color={dash.muted} />
                    </Pressable>
                ) : null}
            </Pressable>

            {Platform.OS === "ios" && iosOpen ? (
                <Modal
                    transparent
                    visible
                    animationType="fade"
                    onRequestClose={() => setIosOpen(false)}
                >
                    <View style={styles.datePickerOverlay}>
                        <Pressable
                            style={styles.datePickerBackdrop}
                            onPress={() => setIosOpen(false)}
                        />
                        <View style={styles.datePickerSheet}>
                            <View style={styles.datePickerHeader}>
                                <Pressable
                                    onPress={() => setIosOpen(false)}
                                    hitSlop={8}
                                    style={({ pressed }) => pressed && styles.pressedOpacity}
                                >
                                    <Text style={styles.datePickerCancel}>Cancel</Text>
                                </Pressable>
                                <Text style={styles.datePickerTitle}>{label}</Text>
                                <Pressable
                                    onPress={() => {
                                        onChange(toYmd(iosDraft));
                                        setIosOpen(false);
                                    }}
                                    hitSlop={8}
                                    style={({ pressed }) => pressed && styles.pressedOpacity}
                                >
                                    <Text style={styles.datePickerDone}>Done</Text>
                                </Pressable>
                            </View>
                            <DateTimePicker
                                mode="date"
                                display="inline"
                                value={iosDraft}
                                onChange={(_event, picked) => {
                                    if (picked) setIosDraft(picked);
                                }}
                                themeVariant="light"
                                style={styles.datePickerInline}
                            />
                        </View>
                    </View>
                </Modal>
            ) : null}
        </View>
    );
}

// ============================================================================
// Create-section bottom sheet (mobile replacement for web CreateSectionForm).
// ============================================================================

function TimeWheelColumn({
    values,
    selected,
    onChange,
    styles,
    accessibilityLabel,
}: {
    values: number[];
    selected: number;
    onChange: (v: number) => void;
    styles: ReturnType<typeof createStyles>;
    accessibilityLabel?: string;
}) {
    const ref = useRef<ScrollView | null>(null);
    const idx = useMemo(() => {
        const i = values.indexOf(selected);
        return i < 0 ? 0 : i;
    }, [values, selected]);

    useEffect(() => {
        const handle = requestAnimationFrame(() => {
            ref.current?.scrollTo({ y: idx * WHEEL_ITEM_HEIGHT, animated: false });
        });
        return () => cancelAnimationFrame(handle);
    }, [idx]);

    return (
        <View
            style={styles.pickerWheelCol}
            accessibilityRole="adjustable"
            accessibilityLabel={accessibilityLabel}
        >
            <ScrollView
                ref={ref}
                showsVerticalScrollIndicator={false}
                snapToInterval={WHEEL_ITEM_HEIGHT}
                snapToAlignment="start"
                decelerationRate="fast"
                contentContainerStyle={{ paddingVertical: WHEEL_PAD }}
                onMomentumScrollEnd={(e) => {
                    const next = clampNumber(
                        Math.round(e.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT),
                        0,
                        values.length - 1,
                    );
                    const v = values[next];
                    if (v !== undefined && v !== selected) onChange(v);
                }}
            >
                {values.map((v, i) => {
                    const active = i === idx;
                    return (
                        <Pressable
                            key={v}
                            onPress={() => {
                                onChange(v);
                                ref.current?.scrollTo({
                                    y: i * WHEEL_ITEM_HEIGHT,
                                    animated: true,
                                });
                            }}
                            style={styles.pickerWheelItem}
                        >
                            <Text
                                style={[
                                    styles.pickerWheelItemText,
                                    active && styles.pickerWheelItemTextActive,
                                ]}
                            >
                                {pad2(v)}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}

function TimePickerOverlay({
    title,
    initial,
    fallback,
    onCancel,
    onConfirm,
    styles,
}: {
    title: string;
    initial: string;
    fallback: { h: number; m: number };
    onCancel: () => void;
    onConfirm: (hhmm: string) => void;
    styles: ReturnType<typeof createStyles>;
}) {
    const initialParsed = useMemo(
        () => parseTimeOfDay(initial, fallback),
        [initial, fallback],
    );
    const [hour, setHour] = useState(initialParsed.h);
    const [minute, setMinute] = useState(initialParsed.m);

    const preview = useMemo(
        () => formatTimeLabel(toHHMM(hour, minute)),
        [hour, minute],
    );

    return (
        <View style={styles.pickerOverlay}>
            <Pressable style={styles.pickerBackdrop} onPress={onCancel} />
            <View style={styles.pickerSheet}>
                <View style={styles.pickerHeader}>
                    <View>
                        <Text style={styles.pickerHeaderTitle}>{title}</Text>
                        <Text style={styles.pickerHeaderPreview}>{preview}</Text>
                    </View>
                    <View style={styles.pickerHeaderIcon}>
                        <Ionicons name="time-outline" size={20} color={dash.accent} />
                    </View>
                </View>

                <View style={styles.pickerWheelRow}>
                    <View pointerEvents="none" style={styles.pickerWheelBand} />
                    <TimeWheelColumn
                        values={HOURS_24}
                        selected={hour}
                        onChange={setHour}
                        styles={styles}
                        accessibilityLabel="Hour"
                    />
                    <Text style={styles.pickerColon}>:</Text>
                    <TimeWheelColumn
                        values={MINUTES_STEP_5}
                        selected={minute}
                        onChange={setMinute}
                        styles={styles}
                        accessibilityLabel="Minute"
                    />
                </View>

                <View style={styles.modalActions}>
                    <Pressable
                        onPress={onCancel}
                        style={({ pressed }) => [
                            styles.ghostBtn,
                            { flex: 1 },
                            pressed && styles.pressedOpacity,
                        ]}
                    >
                        <Text style={styles.ghostBtnText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => onConfirm(toHHMM(hour, minute))}
                        style={({ pressed }) => [
                            styles.primaryBtn,
                            styles.primaryBtnBig,
                            { flex: 1 },
                            pressed && styles.pressedOpacity,
                        ]}
                    >
                        <Ionicons name="checkmark" size={18} color="#fff" />
                        <Text style={styles.primaryBtnBigText}>Set time</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

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
    const [days, setDays] = useState<string[]>([]);
    const [timeFrom, setTimeFrom] = useState("");
    const [timeTo, setTimeTo] = useState("");
    const [capacityInput, setCapacityInput] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pickerMode, setPickerMode] = useState<"from" | "to" | null>(null);

    useEffect(() => {
        if (!visible) {
            setName("");
            setDays([]);
            setTimeFrom("");
            setTimeTo("");
            setCapacityInput("");
            setError(null);
            setPickerMode(null);
        }
    }, [visible]);

    const toggleDay = (id: string) => {
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
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel="Pick start time"
                                        onPress={() => setPickerMode("from")}
                                        style={({ pressed }) => [
                                            styles.timeInputRow,
                                            pressed && styles.pressedOpacity,
                                        ]}
                                    >
                                        <Ionicons
                                            name="time-outline"
                                            size={18}
                                            color={timeFrom ? dash.accent : dash.muted}
                                        />
                                        <Text
                                            style={[
                                                styles.timeInputText,
                                                !timeFrom && styles.timeInputPlaceholder,
                                            ]}
                                        >
                                            {timeFrom ? formatTimeLabel(timeFrom) : "09:00"}
                                        </Text>
                                        <Ionicons
                                            name="chevron-down"
                                            size={16}
                                            color={dash.subtle}
                                        />
                                    </Pressable>
                                </View>
                                <View style={styles.timeField}>
                                    <Text style={styles.fieldLabel}>To</Text>
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel="Pick end time"
                                        onPress={() => setPickerMode("to")}
                                        style={({ pressed }) => [
                                            styles.timeInputRow,
                                            pressed && styles.pressedOpacity,
                                        ]}
                                    >
                                        <Ionicons
                                            name="time-outline"
                                            size={18}
                                            color={timeTo ? dash.accent : dash.muted}
                                        />
                                        <Text
                                            style={[
                                                styles.timeInputText,
                                                !timeTo && styles.timeInputPlaceholder,
                                            ]}
                                        >
                                            {timeTo ? formatTimeLabel(timeTo) : "10:30"}
                                        </Text>
                                        <Ionicons
                                            name="chevron-down"
                                            size={16}
                                            color={dash.subtle}
                                        />
                                    </Pressable>
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

                {pickerMode ? (
                    <TimePickerOverlay
                        title={pickerMode === "from" ? "Start time" : "End time"}
                        initial={pickerMode === "from" ? timeFrom : timeTo}
                        fallback={
                            pickerMode === "from" ? { h: 9, m: 0 } : { h: 10, m: 30 }
                        }
                        onCancel={() => setPickerMode(null)}
                        onConfirm={(v) => {
                            if (pickerMode === "from") setTimeFrom(v);
                            else setTimeTo(v);
                            setPickerMode(null);
                        }}
                        styles={styles}
                    />
                ) : null}
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

    const courseIdParam = pickParam(searchParams.courseId);
    const backendCourseId = parseBackendCourseId(courseIdParam);
    const initialCourseName = pickParam(searchParams.courseName) ?? "Course";
    const initialCourseCode = pickParam(searchParams.courseCode) ?? "—";

    /** On native, default role is doctor; pass `?role=student` for student UI. */
    const role = (pickParam(searchParams.role) ?? "doctor").toLowerCase();
    const isDoctor = role === "doctor";

    const [activeTab, setActiveTab] = useState<WorkspaceTab>("sections");
    const [sections, setSections] = useState<WorkspaceSection[]>([]);
    const [openedSectionId, setOpenedSectionId] = useState<string | null>(null);
    const [apiProjects, setApiProjects] = useState<DoctorCourseProject[]>([]);
    const [projectTeamCounts, setProjectTeamCounts] = useState<Record<number, number>>({});
    const [showCreateSection, setShowCreateSection] = useState(false);
    const [courseSettings, setCourseSettings] = useState<CourseWorkspaceSettingsForm>(
        defaultCourseWorkspaceSettings,
    );
    const [courseHeader, setCourseHeader] = useState<{ name: string; code: string }>({
        name: initialCourseName,
        code: initialCourseCode,
    });
    const [copiedCode, setCopiedCode] = useState(false);
    const [creatingSection, setCreatingSection] = useState(false);
    const [workspaceLoading, setWorkspaceLoading] = useState(true);
    const [workspaceError, setWorkspaceError] = useState<string | null>(null);

    const copyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(
        () => () => {
            if (copyFeedbackTimerRef.current) clearTimeout(copyFeedbackTimerRef.current);
        },
        [],
    );

    useEffect(() => {
        setCourseHeader({ name: initialCourseName, code: initialCourseCode });
    }, [initialCourseName, initialCourseCode]);

    const loadWorkspace = useCallback(async () => {
        const id = parseBackendCourseId(courseIdParam);
        if (id == null) {
            setWorkspaceLoading(false);
            setWorkspaceError(null);
            setSections([]);
            setApiProjects([]);
            setProjectTeamCounts({});
            return;
        }
        setWorkspaceLoading(true);
        setWorkspaceError(null);
        try {
            const detail = await getDoctorCourseDetail(id);
            setCourseHeader({
                name: detail.name?.trim() || initialCourseName,
                code: detail.code?.trim() || initialCourseCode,
            });

            const [apiSecs, projs] = await Promise.all([
                getDoctorCourseSections(id),
                getDoctorCourseProjects(id),
            ]);

            const studentRows = await Promise.all(
                apiSecs.map(async (s) => {
                    try {
                        const rows = await getDoctorSectionStudents(s.id);
                        return {
                            sectionId: s.id,
                            students: rows.map(doctorCourseStudentToSectionStudent),
                        };
                    } catch {
                        return { sectionId: s.id, students: [] as SectionStudent[] };
                    }
                }),
            );
            const bySectionId = new Map(
                studentRows.map((x) => [x.sectionId, x.students] as const),
            );

            setSections(
                apiSecs.map((s) => ({
                    id: String(s.id),
                    name: s.name,
                    days: s.days,
                    timeFrom: s.timeFrom ?? "",
                    timeTo: s.timeTo ?? "",
                    capacity: s.capacity,
                    students: bySectionId.get(s.id) ?? [],
                })),
            );
            setApiProjects(projs);
        } catch (e) {
            setWorkspaceError(parseApiErrorMessage(e));
            setSections([]);
            setApiProjects([]);
        } finally {
            setWorkspaceLoading(false);
        }
    }, [courseIdParam, initialCourseName, initialCourseCode]);

    useFocusEffect(
        useCallback(() => {
            void loadWorkspace();
        }, [loadWorkspace]),
    );

    useEffect(() => {
        if (backendCourseId == null || apiProjects.length === 0) {
            setProjectTeamCounts({});
            return;
        }
        let cancelled = false;
        void (async () => {
            const entries = await Promise.all(
                apiProjects.map(async (project) => {
                    try {
                        const res = await getDoctorProjectTeams(backendCourseId, project.id);
                        return [project.id, res.teamCount] as const;
                    } catch {
                        return [project.id, 0] as const;
                    }
                }),
            );
            if (!cancelled) setProjectTeamCounts(Object.fromEntries(entries));
        })();
        return () => {
            cancelled = true;
        };
    }, [backendCourseId, apiProjects]);

    /** Visible status for a project card: drives the small pill in the header. */
    const projectStatus = useCallback(
        (project: DoctorCourseProject) => {
            const count = projectTeamCounts[project.id];
            if (count == null) return { label: "Loading", tone: "neutral" as const };
            if (count > 0) return { label: "Active", tone: "ready" as const };
            return {
                label: project.aiMode === "doctor" ? "Pending AI" : "Awaiting students",
                tone: "pending" as const,
            };
        },
        [projectTeamCounts],
    );

    const handleAddSection = async (payload: NewSectionPayload) => {
        if (creatingSection) return;
        const id = parseBackendCourseId(courseIdParam);
        if (id == null) {
            showToast("Invalid course — cannot add a section.", "error");
            return;
        }
        setCreatingSection(true);
        try {
            await createDoctorCourseSection(id, {
                name: payload.name,
                days: payload.days,
                timeFrom: payload.timeFrom.trim(),
                timeTo: payload.timeTo.trim(),
                capacity: payload.capacity,
            });
            setShowCreateSection(false);
            await loadWorkspace();
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

    /** Navigate to the dedicated mobile teams screen for this project. */
    const openProjectTeams = useCallback(
        (project: DoctorCourseProject) => {
            if (backendCourseId == null) {
                showToast(
                    "Invalid course id — cannot open project teams.",
                    "error",
                );
                return;
            }
            const q = new URLSearchParams();
            q.set("courseId", String(backendCourseId));
            q.set("projectId", String(project.id));
            q.set("projectTitle", project.title || "Project teams");
            q.set("aiMode", project.aiMode);
            q.set("role", isDoctor ? "doctor" : "student");
            router.push(`/ProjectTeamsPage?${q.toString()}` as Href);
        },
        [backendCourseId, isDoctor, router],
    );

    const openCreateProject = () => {
        if (backendCourseId == null) {
            showToast("Invalid course — open this workspace from your course list.", "error");
            return;
        }
        const sectionsJson = encodeURIComponent(
            JSON.stringify(sections.map((s) => ({ id: s.id, name: s.name }))),
        );
        router.push(
            `/CourseProjectCreatePage?courseId=${encodeURIComponent(
                String(backendCourseId),
            )}&sectionsJson=${sectionsJson}` as Href,
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
        void loadWorkspace();
        showToast(
            "Preferences updated on this device. Course-wide team rules are not synced to the server from this screen yet; reloading refreshed sections and projects from the API.",
            "success",
        );
    };

    const isRealBackend = backendCourseId != null;
    const displayProjectsCount = backendCourseId != null ? apiProjects.length : 0;
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
                    {!backendCourseId ? (
                        <View
                            style={{
                                marginBottom: 12,
                                padding: 12,
                                borderRadius: 12,
                                backgroundColor: "#fff1f2",
                                borderWidth: 1,
                                borderColor: "#fecaca",
                            }}
                        >
                            <Text style={{ color: "#9f1239", fontWeight: "600", fontSize: 13 }}>
                                Invalid course id. Open this workspace from your dashboard course
                                list.
                            </Text>
                        </View>
                    ) : null}
                    {workspaceError ? (
                        <View style={{ marginBottom: 12 }}>
                            <Text style={styles.errorText}>{workspaceError}</Text>
                            <Pressable
                                onPress={() => void loadWorkspace()}
                                style={({ pressed }) => [
                                    { marginTop: 10, alignSelf: "flex-start" },
                                    pressed && styles.pressedOpacity,
                                ]}
                            >
                                <Text style={{ color: dash.accent, fontWeight: "700", fontSize: 14 }}>
                                    Retry
                                </Text>
                            </Pressable>
                        </View>
                    ) : null}
                    {workspaceLoading && backendCourseId != null && !workspaceError ? (
                        <View
                            style={{
                                paddingVertical: 16,
                                alignItems: "center",
                                marginBottom: 8,
                            }}
                        >
                            <ActivityIndicator size="large" color={dash.accent} />
                            <Text
                                style={{
                                    marginTop: 10,
                                    color: dash.muted,
                                    fontWeight: "600",
                                    fontSize: 13,
                                }}
                            >
                                Loading course…
                            </Text>
                        </View>
                    ) : null}
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
                                    disabled={backendCourseId == null}
                                    onPress={() => setShowCreateSection(true)}
                                    style={({ pressed }) => [
                                        styles.primaryBtn,
                                        pressed && styles.pressedOpacity,
                                        backendCourseId == null && { opacity: 0.45 },
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
                                                                backendCourseId != null
                                                                    ? String(backendCourseId)
                                                                    : (courseIdParam ?? "")
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
                                        disabled={backendCourseId == null}
                                        onPress={() => setShowCreateSection(true)}
                                        style={({ pressed }) => [
                                            styles.primaryBtn,
                                            styles.primaryBtnBig,
                                            styles.emptyCta,
                                            pressed && styles.pressedOpacity,
                                            backendCourseId == null && { opacity: 0.45 },
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
                                    disabled={backendCourseId == null}
                                    onPress={openCreateProject}
                                    style={({ pressed }) => [
                                        styles.primaryBtn,
                                        pressed && styles.pressedOpacity,
                                        backendCourseId == null && { opacity: 0.45 },
                                    ]}
                                >
                                    <Ionicons name="add" size={16} color="#fff" />
                                    <Text style={styles.primaryBtnText}>New</Text>
                                </Pressable>
                            </View>

                            {displayProjectsCount > 0 && isRealBackend ? (
                                    apiProjects.map((project) => {
                                        const sectionsLabelList = project.applyToAllSections
                                            ? ["All sections"]
                                            : project.sections.map(
                                                  (s) => s.sectionName.trim() || "Section"
                                              );
                                        const status = projectStatus(project);
                                        const statusPillStyles = [
                                            styles.statusPill,
                                            status.tone === "ready" && styles.statusPillReady,
                                            status.tone === "pending" && styles.statusPillPending,
                                            status.tone === "neutral" && styles.statusPillNeutral,
                                        ];
                                        const statusPillTextStyles = [
                                            styles.statusPillText,
                                            status.tone === "ready" && styles.statusPillReadyText,
                                            status.tone === "pending" && styles.statusPillPendingText,
                                            status.tone === "neutral" && styles.statusPillNeutralText,
                                        ];
                                        const statusIconColor =
                                            status.tone === "ready"
                                                ? "#15803d"
                                                : status.tone === "pending"
                                                  ? "#a16207"
                                                  : dash.muted;
                                        const statusIcon =
                                            status.tone === "ready"
                                                ? "checkmark-circle-outline"
                                                : status.tone === "pending"
                                                  ? "time-outline"
                                                  : "ellipsis-horizontal";
                                        return (
                                            <View key={project.id} style={styles.card}>
                                                <View style={styles.projectHeaderRow}>
                                                    <Text
                                                        style={styles.cardTitle}
                                                        numberOfLines={2}
                                                    >
                                                        {project.title}
                                                    </Text>
                                                    <View style={styles.projectPillsRow}>
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
                                                        <View style={statusPillStyles}>
                                                            <Ionicons
                                                                name={statusIcon}
                                                                size={10}
                                                                color={statusIconColor}
                                                            />
                                                            <Text style={statusPillTextStyles}>
                                                                {status.label}
                                                            </Text>
                                                        </View>
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
                                                    <Pressable
                                                        accessibilityRole="button"
                                                        onPress={() => openProjectTeams(project)}
                                                        style={({ pressed }) => [
                                                            isDoctor
                                                                ? styles.primaryBtn
                                                                : styles.secondaryBtn,
                                                            pressed && styles.pressedOpacity,
                                                        ]}
                                                    >
                                                        <Ionicons
                                                            name="people-outline"
                                                            size={14}
                                                            color={isDoctor ? "#fff" : dash.text}
                                                        />
                                                        <Text
                                                            style={
                                                                isDoctor
                                                                    ? styles.primaryBtnText
                                                                    : styles.secondaryBtnText
                                                            }
                                                        >
                                                            {isDoctor
                                                                ? "View teams"
                                                                : "View my team"}
                                                        </Text>
                                                        <Ionicons
                                                            name="chevron-forward"
                                                            size={14}
                                                            color={isDoctor ? "#fff" : dash.text}
                                                        />
                                                    </Pressable>
                                                </View>
                                            </View>
                                        );
                                    })
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
                                        disabled={backendCourseId == null}
                                        onPress={openCreateProject}
                                        style={({ pressed }) => [
                                            styles.primaryBtn,
                                            styles.primaryBtnBig,
                                            styles.emptyCta,
                                            pressed && styles.pressedOpacity,
                                            backendCourseId == null && { opacity: 0.45 },
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
                                        Team rules, AI behavior, and project deadlines. Values
                                        below are stored on this device; use Save to reload course
                                        data from the server.
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
                                    label="Allow students to choose teammates"
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
