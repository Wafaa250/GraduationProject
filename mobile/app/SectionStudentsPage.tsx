import { useCallback, useEffect, useMemo, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

/** Mobile-local theme tokens (aligned with CourseWorkspacePage / CourseProjectCreatePage). */
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

/** Set `true` when the mobile axios client is configured for your API (see `mobile/api/axiosInstance.ts`). */
const ENABLE_SECTION_STUDENTS_BACKEND_API = false;

type AddStudentsTab = "manual" | "upload";

type DoctorCourseStudent = {
    studentId: number;
    userId: number;
    name: string;
    university: string;
    major: string;
    universityId: string;
    sectionId: number | null;
    sectionNumber: number | null;
};

function pickParam(v: string | string[] | undefined): string | undefined {
    if (v == null) return undefined;
    const s = Array.isArray(v) ? v[0] : v;
    const t = s?.trim();
    return t && t.length > 0 ? t : undefined;
}

function showToast(message: string, variant: "error" | "success" | "default" = "default") {
    if (__DEV__) console.log(`[toast:${variant}]`, message);
    const title =
        variant === "error" ? "Error" : variant === "success" ? "Success" : "Notice";
    Alert.alert(title, message);
}

function parseApiErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    return "An unexpected error occurred.";
}

async function fetchDoctorSectionStudents(_sectionId: number): Promise<DoctorCourseStudent[]> {
    throw new Error("Doctor courses API is not wired in the Expo app yet.");
}

async function addStudentsToDoctorSectionApi(
    _sectionId: number,
    _studentIds: string[],
): Promise<void> {
    throw new Error("Doctor courses API is not wired in the Expo app yet.");
}

function parseIds(raw: string): string[] {
    return raw
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}

function initialsOf(name: string): string {
    const p = name.trim().split(/\s+/).filter(Boolean);
    if (p.length === 0) return "?";
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return `${p[0][0] ?? ""}${p[p.length - 1][0] ?? ""}`.toUpperCase();
}

/** Local-only merge when API flag is off (same UX as web for demos). */
function mockAppendStudents(
    prev: DoctorCourseStudent[],
    ids: string[],
    sectionId: number,
): DoctorCourseStudent[] {
    const base = Date.now();
    const next = ids.map((universityId, i) => ({
        studentId: base + i,
        userId: 0,
        name: `Student (${universityId})`,
        university: "",
        major: "",
        universityId,
        sectionId,
        sectionNumber: null as number | null,
    }));
    return [...prev, ...next];
}

function getLayoutTokens(screenWidth: number) {
    const narrow = screenWidth < 360;
    const compact = screenWidth < 400;
    return {
        gutter: narrow ? 14 : compact ? 15 : 18,
        cardGap: 10,
        titleSize: compact ? 20 : 22,
        titleLine: compact ? 26 : 28,
        textareaMin: compact ? 100 : 112,
    };
}

function createStyles(screenWidth: number) {
    const t = getLayoutTokens(screenWidth);
    const hair = StyleSheet.hairlineWidth;
    const hairlineColor = "rgba(15,23,42,0.08)";
    const inputFill = "#f3f4f6";

    return StyleSheet.create({
        safe: { flex: 1, backgroundColor: dash.bg },
        flex: { flex: 1 },
        scroll: { flex: 1 },
        scrollContent: {
            paddingHorizontal: t.gutter,
            paddingTop: 4,
            paddingBottom: 32,
        },
        pressedOpacity: { opacity: 0.65 },

        backRow: {
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-start",
            marginLeft: -6,
            paddingVertical: 4,
            paddingHorizontal: 6,
            gap: 2,
        },
        backBtnText: {
            fontSize: 14,
            fontWeight: "500",
            color: dash.text,
            letterSpacing: -0.2,
        },

        headerCard: {
            marginTop: 10,
            backgroundColor: dash.surface,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 16,
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
        kicker: {
            fontSize: 10,
            fontWeight: "700",
            color: dash.accent,
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 4,
        },
        title: {
            fontSize: t.titleSize,
            lineHeight: t.titleLine,
            fontWeight: "700",
            color: dash.text,
            letterSpacing: -0.4,
        },
        titleAccent: { color: dash.accent },
        courseLine: {
            marginTop: 8,
            fontSize: 12,
            color: dash.muted,
            lineHeight: 17,
        },
        courseLineStrong: { fontWeight: "700", color: dash.text },

        warnBanner: {
            marginTop: 12,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 10,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: "#fffbeb",
            borderWidth: hair,
            borderColor: "rgba(245,158,11,0.35)",
        },
        warnBannerText: {
            flex: 1,
            fontSize: 12,
            fontWeight: "500",
            color: "#92400e",
            lineHeight: 17,
        },

        toolbar: {
            marginTop: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
        },
        countText: {
            fontSize: 14,
            fontWeight: "700",
            color: dash.muted,
            flex: 1,
            minWidth: 120,
        },
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
        primaryBtnDisabled: { opacity: 0.55 },

        secondaryBtn: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: inputFill,
            minHeight: 40,
        },
        secondaryBtnText: {
            color: dash.text,
            fontSize: 13,
            fontWeight: "600",
        },

        emptyCard: {
            marginTop: 18,
            backgroundColor: dash.surface,
            borderRadius: 16,
            paddingVertical: 40,
            paddingHorizontal: 20,
            alignItems: "center",
            borderWidth: hair,
            borderColor: hairlineColor,
        },
        emptyTitle: {
            marginTop: 12,
            fontSize: 15,
            fontWeight: "700",
            color: dash.muted,
        },
        emptyBody: {
            marginTop: 8,
            fontSize: 13,
            color: dash.subtle,
            textAlign: "center",
            lineHeight: 20,
            maxWidth: 320,
        },
        emptyStrong: { fontWeight: "700", color: dash.text },

        studentCard: {
            marginTop: t.cardGap,
            backgroundColor: dash.surface,
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            borderWidth: hair,
            borderColor: hairlineColor,
            ...Platform.select({
                ios: {
                    shadowColor: "#0f172a",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.06,
                    shadowRadius: 6,
                },
                android: { elevation: 1 },
                default: {},
            }),
        },
        avatar: {
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: dash.accentMuted,
            alignItems: "center",
            justifyContent: "center",
        },
        avatarText: {
            fontSize: 14,
            fontWeight: "700",
            color: dash.accent,
        },
        studentInfo: { flex: 1, minWidth: 0 },
        studentName: {
            fontSize: 14,
            fontWeight: "700",
            color: dash.text,
        },
        studentMeta: {
            marginTop: 3,
            fontSize: 12,
            color: dash.subtle,
            lineHeight: 16,
        },

        centerLoading: {
            marginTop: 32,
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
        },
        loadingText: { fontSize: 13, color: dash.muted, fontWeight: "600" },

        modalBackdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(15,23,42,0.45)",
        },
        modalRoot: {
            flex: 1,
            justifyContent: "flex-end",
        },
        modalSheet: {
            backgroundColor: dash.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: Platform.OS === "ios" ? 28 : 20,
            maxHeight: "92%",
            borderTopWidth: hair,
            borderColor: hairlineColor,
        },
        modalHandle: {
            alignSelf: "center",
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: "#e2e8f0",
            marginTop: 10,
            marginBottom: 6,
        },
        modalHeaderRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingBottom: 8,
        },
        modalTitle: {
            fontSize: 17,
            fontWeight: "700",
            color: dash.text,
            letterSpacing: -0.3,
        },
        modalBody: {
            paddingHorizontal: 16,
            paddingTop: 4,
        },
        segmentTrack: {
            flexDirection: "row",
            backgroundColor: "#e6e7eb",
            borderRadius: 12,
            padding: 3,
            marginBottom: 14,
        },
        segmentBtn: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            minHeight: 38,
            borderRadius: 10,
        },
        segmentBtnActive: {
            backgroundColor: dash.surface,
            ...Platform.select({
                ios: {
                    shadowColor: "#0f172a",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.12,
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
        },
        segmentBtnTextIdle: {
            fontSize: 13,
            fontWeight: "500",
            color: dash.muted,
        },
        labelCaps: {
            fontSize: 11,
            fontWeight: "700",
            color: dash.subtle,
            letterSpacing: 0.6,
            marginBottom: 6,
        },
        helper: {
            fontSize: 12,
            color: dash.muted,
            lineHeight: 17,
            marginBottom: 10,
        },
        input: {
            minHeight: 42,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 11,
            borderWidth: 0,
            fontSize: 14,
            color: dash.text,
            backgroundColor: inputFill,
        },
        textarea: {
            minHeight: t.textareaMin,
            paddingTop: 10,
            textAlignVertical: "top",
        },
        errorText: {
            marginTop: 8,
            fontSize: 13,
            fontWeight: "600",
            color: dash.danger,
        },
        modalActions: {
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 16,
            paddingTop: 4,
        },
    });
}

export default function SectionStudentsPage() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        courseId?: string;
        sectionId?: string;
        sectionName?: string;
    }>();

    const courseId = pickParam(params.courseId) ?? "";
    const sectionIdRaw = pickParam(params.sectionId) ?? "";
    const sectionName = pickParam(params.sectionName);

    const { width } = useWindowDimensions();
    const styles = useMemo(() => createStyles(width), [width]);

    const backendSectionId =
        sectionIdRaw && /^\d+$/.test(sectionIdRaw) ? Number(sectionIdRaw) : null;

    const [students, setStudents] = useState<DoctorCourseStudent[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(true);

    const [showAddStudents, setShowAddStudents] = useState(false);
    const [addStudentsTab, setAddStudentsTab] = useState<AddStudentsTab>("manual");

    const [manualInput, setManualInput] = useState("");
    const [pasteInput, setPasteInput] = useState("");
    const [inputError, setInputError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const courseLabel = courseId.trim() || "—";
    const sectionHeading = sectionName?.trim() || sectionIdRaw || "—";

    const reloadStudents = useCallback(async () => {
        if (backendSectionId == null) {
            setStudents([]);
            return;
        }
        if (!ENABLE_SECTION_STUDENTS_BACKEND_API) return;
        try {
            const data = await fetchDoctorSectionStudents(backendSectionId);
            setStudents(data);
        } catch (err) {
            showToast(parseApiErrorMessage(err), "error");
        }
    }, [backendSectionId]);

    useEffect(() => {
        if (backendSectionId == null) {
            setLoadingStudents(false);
            setStudents([]);
            return;
        }
        let cancelled = false;
        setLoadingStudents(true);
        void (async () => {
            try {
                const data = ENABLE_SECTION_STUDENTS_BACKEND_API
                    ? await fetchDoctorSectionStudents(backendSectionId)
                    : [];
                if (!cancelled) setStudents(data);
            } catch (err) {
                if (!cancelled) showToast(parseApiErrorMessage(err), "error");
            } finally {
                if (!cancelled) setLoadingStudents(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [backendSectionId]);

    const goBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace(
            (courseId ? `/CourseWorkspacePage?courseId=${encodeURIComponent(courseId)}` : "/") as Href
        );
    };

    const closeModal = () => {
        setShowAddStudents(false);
        setInputError(null);
        setUploadError(null);
        setManualInput("");
        setPasteInput("");
    };

    const handleAddManual = async () => {
        setInputError(null);
        const ids = parseIds(manualInput);
        if (ids.length === 0) {
            setInputError("Enter at least one student ID or email.");
            return;
        }
        if (backendSectionId == null) {
            setInputError("Cannot save — section ID is not a valid server section.");
            return;
        }
        setSubmitting(true);
        try {
            if (!ENABLE_SECTION_STUDENTS_BACKEND_API) {
                setStudents((prev) => mockAppendStudents(prev, ids, backendSectionId));
                closeModal();
                showToast(`${ids.length} student(s) added locally (demo mode).`, "success");
                return;
            }
            await addStudentsToDoctorSectionApi(backendSectionId, ids);
            await reloadStudents();
            closeModal();
            showToast(`${ids.length} student(s) added successfully.`, "success");
        } catch (err) {
            setInputError(parseApiErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const handlePasteImport = async () => {
        setUploadError(null);
        const ids = parseIds(pasteInput);
        if (ids.length === 0) {
            setUploadError("No entries found. Paste file contents or type IDs.");
            return;
        }
        if (backendSectionId == null) {
            setUploadError("Cannot save — section ID is not a valid server section.");
            return;
        }
        setUploading(true);
        try {
            if (!ENABLE_SECTION_STUDENTS_BACKEND_API) {
                setStudents((prev) => mockAppendStudents(prev, ids, backendSectionId));
                closeModal();
                showToast(`${ids.length} student(s) added locally (demo mode).`, "success");
                return;
            }
            await addStudentsToDoctorSectionApi(backendSectionId, ids);
            await reloadStudents();
            closeModal();
            showToast(`${ids.length} student(s) added successfully.`, "success");
        } catch (err) {
            setUploadError(parseApiErrorMessage(err));
        } finally {
            setUploading(false);
        }
    };

    const openAddModal = (tab: AddStudentsTab) => {
        setAddStudentsTab(tab);
        setInputError(null);
        setUploadError(null);
        setShowAddStudents(true);
    };

    const countLabel = loadingStudents
        ? "Loading…"
        : students.length === 0
          ? "No students in this section"
          : `${students.length} ${students.length === 1 ? "student" : "students"}`;

    const showInvalidSectionBanner = backendSectionId == null && sectionIdRaw.length > 0;

    return (
        <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Pressable
                        onPress={goBack}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        style={({ pressed }) => [styles.backRow, pressed && styles.pressedOpacity]}
                    >
                        <Ionicons name="chevron-back" size={24} color={dash.text} />
                        <Text style={styles.backBtnText}>Back to course</Text>
                    </Pressable>

                    <View style={styles.headerCard}>
                        <Text style={styles.kicker}>Section students</Text>
                        <Text style={styles.title}>
                            Section <Text style={styles.titleAccent}>{sectionHeading}</Text>
                        </Text>
                        <Text style={styles.courseLine}>
                            Course <Text style={styles.courseLineStrong}>{courseLabel}</Text>
                        </Text>
                    </View>

                    {showInvalidSectionBanner ? (
                        <View style={styles.warnBanner}>
                            <Ionicons name="warning-outline" size={20} color="#d97706" />
                            <Text style={styles.warnBannerText}>
                                This section does not have a numeric server ID yet. Add students
                                after the course is saved, or open a synced section from your
                                dashboard.
                            </Text>
                        </View>
                    ) : null}

                    <View style={styles.toolbar}>
                        <Text style={styles.countText}>{countLabel}</Text>
                        <Pressable
                            onPress={() => openAddModal("manual")}
                            style={({ pressed }) => [
                                styles.primaryBtn,
                                pressed && styles.pressedOpacity,
                                backendSectionId == null && styles.primaryBtnDisabled,
                            ]}
                            disabled={backendSectionId == null}
                        >
                            <Ionicons name="person-add-outline" size={18} color="#fff" />
                            <Text style={styles.primaryBtnText}>Add students</Text>
                        </Pressable>
                    </View>

                    {!loadingStudents && students.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="people-outline" size={40} color="#cbd5e1" />
                            <Text style={styles.emptyTitle}>No students yet</Text>
                            <Text style={styles.emptyBody}>
                                Use <Text style={styles.emptyStrong}>Add students</Text> to enroll
                                students by their university ID (comma or newline separated), or
                                paste the contents of a .txt / .csv file in the import tab.
                            </Text>
                        </View>
                    ) : null}

                    {loadingStudents ? (
                        <View style={styles.centerLoading}>
                            <ActivityIndicator size="small" color={dash.accent} />
                            <Text style={styles.loadingText}>Loading roster…</Text>
                        </View>
                    ) : null}

                    {!loadingStudents &&
                        students.map((s) => (
                            <View key={`${s.studentId}-${s.universityId}`} style={styles.studentCard}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{initialsOf(s.name)}</Text>
                                </View>
                                <View style={styles.studentInfo}>
                                    <Text style={styles.studentName} numberOfLines={2}>
                                        {s.name}
                                    </Text>
                                    <Text style={styles.studentMeta} numberOfLines={2}>
                                        {s.universityId ? `ID: ${s.universityId}` : ""}
                                        {s.universityId && (s.university || s.major) ? " · " : ""}
                                        {s.university ? s.university : ""}
                                        {s.university && s.major ? " · " : ""}
                                        {s.major ? s.major : ""}
                                    </Text>
                                </View>
                            </View>
                        ))}
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal
                visible={showAddStudents}
                animationType="slide"
                transparent
                onRequestClose={closeModal}
            >
                <View style={styles.modalRoot}>
                    <Pressable style={styles.modalBackdrop} onPress={closeModal} accessibilityRole="button" />
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : undefined}
                        style={{ width: "100%" }}
                    >
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitle}>Add students</Text>
                            <Pressable
                                onPress={closeModal}
                                hitSlop={12}
                                style={({ pressed }) => pressed && styles.pressedOpacity}
                            >
                                <Ionicons name="close" size={26} color={dash.muted} />
                            </Pressable>
                        </View>
                        <ScrollView
                            style={styles.flex}
                            contentContainerStyle={styles.modalBody}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.segmentTrack}>
                                <Pressable
                                    onPress={() => {
                                        setAddStudentsTab("manual");
                                        setInputError(null);
                                        setUploadError(null);
                                    }}
                                    style={[
                                        styles.segmentBtn,
                                        addStudentsTab === "manual" && styles.segmentBtnActive,
                                    ]}
                                >
                                    <Text
                                        style={
                                            addStudentsTab === "manual"
                                                ? styles.segmentBtnTextActive
                                                : styles.segmentBtnTextIdle
                                        }
                                    >
                                        Manual entry
                                    </Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => {
                                        setAddStudentsTab("upload");
                                        setInputError(null);
                                        setUploadError(null);
                                    }}
                                    style={[
                                        styles.segmentBtn,
                                        addStudentsTab === "upload" && styles.segmentBtnActive,
                                    ]}
                                >
                                    <Text
                                        style={
                                            addStudentsTab === "upload"
                                                ? styles.segmentBtnTextActive
                                                : styles.segmentBtnTextIdle
                                        }
                                    >
                                        Import text
                                    </Text>
                                </Pressable>
                            </View>

                            {addStudentsTab === "manual" ? (
                                <>
                                    <Text style={styles.labelCaps}>ADD BY UNIVERSITY STUDENT ID</Text>
                                    <Text style={styles.helper}>
                                        Enter one or more student IDs separated by commas or new
                                        lines.
                                    </Text>
                                    <TextInput
                                        style={[styles.input, styles.textarea]}
                                        value={manualInput}
                                        onChangeText={(t) => {
                                            setManualInput(t);
                                            setInputError(null);
                                        }}
                                        placeholder={"2021001\n2021002, 2021003"}
                                        placeholderTextColor={dash.subtle}
                                        multiline
                                        autoCorrect={false}
                                        autoCapitalize="none"
                                    />
                                    {inputError ? (
                                        <Text style={styles.errorText}>{inputError}</Text>
                                    ) : null}
                                    <View style={styles.modalActions}>
                                        <Pressable
                                            onPress={closeModal}
                                            style={({ pressed }) => [
                                                styles.secondaryBtn,
                                                pressed && styles.pressedOpacity,
                                            ]}
                                        >
                                            <Text style={styles.secondaryBtnText}>Cancel</Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => void handleAddManual()}
                                            disabled={submitting}
                                            style={({ pressed }) => [
                                                styles.primaryBtn,
                                                pressed && styles.pressedOpacity,
                                                submitting && styles.primaryBtnDisabled,
                                            ]}
                                        >
                                            <Ionicons name="add" size={18} color="#fff" />
                                            <Text style={styles.primaryBtnText}>
                                                {submitting ? "Adding…" : "Add"}
                                            </Text>
                                        </Pressable>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.labelCaps}>PASTE FILE CONTENTS</Text>
                                    <Text style={styles.helper}>
                                        On mobile, paste the contents of a .txt or .csv file. Each
                                        line (or comma-separated value) should contain one university
                                        student ID — same rules as on the web upload flow.
                                    </Text>
                                    <TextInput
                                        style={[styles.input, styles.textarea]}
                                        value={pasteInput}
                                        onChangeText={(t) => {
                                            setPasteInput(t);
                                            setUploadError(null);
                                        }}
                                        placeholder="Paste IDs here…"
                                        placeholderTextColor={dash.subtle}
                                        multiline
                                        autoCorrect={false}
                                        autoCapitalize="none"
                                    />
                                    {uploadError ? (
                                        <Text style={styles.errorText}>{uploadError}</Text>
                                    ) : null}
                                    <View style={styles.modalActions}>
                                        <Pressable
                                            onPress={closeModal}
                                            style={({ pressed }) => [
                                                styles.secondaryBtn,
                                                pressed && styles.pressedOpacity,
                                            ]}
                                        >
                                            <Text style={styles.secondaryBtnText}>Cancel</Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => void handlePasteImport()}
                                            disabled={uploading}
                                            style={({ pressed }) => [
                                                styles.primaryBtn,
                                                pressed && styles.pressedOpacity,
                                                uploading && styles.primaryBtnDisabled,
                                            ]}
                                        >
                                            <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                                            <Text style={styles.primaryBtnText}>
                                                {uploading ? "Adding…" : "Import & add"}
                                            </Text>
                                        </Pressable>
                                    </View>
                                </>
                            )}
                        </ScrollView>
                    </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
