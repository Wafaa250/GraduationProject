import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    StyleSheet,
    Platform,
    Modal,
    KeyboardAvoidingView,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
    createDoctorCourseProject,
    getDoctorCourseSections,
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

/** Local types (mirrors `pages/courses/courseProjectTypes.ts` — keep in sync when wiring API). */
type CourseWorkspaceSectionOption = {
    id: string;
    name: string;
};

function showToast(message: string, variant: "error" | "success" | "default" = "default") {
    if (__DEV__) {
        console.log(`[toast:${variant}]`, message);
    }
    const title =
        variant === "error" ? "Error" : variant === "success" ? "Success" : "Notice";
    Alert.alert(title, message);
}

function pickParam(v: string | string[] | undefined): string | undefined {
    if (v == null) return undefined;
    const s = Array.isArray(v) ? v[0] : v;
    const t = s?.trim();
    return t && t.length > 0 ? t : undefined;
}

function parseSectionsFromSearchParam(json: string | undefined): CourseWorkspaceSectionOption[] {
    if (!json) return [];
    try {
        const parsed = JSON.parse(json) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter(
                (item): item is { id: unknown; name: unknown } =>
                    Boolean(item) && typeof item === "object" && item !== null && "id" in item && "name" in item
            )
            .map((item) => ({ id: String(item.id), name: String(item.name) }));
    } catch {
        return [];
    }
}

function getLayoutTokens(screenWidth: number) {
    const narrow = screenWidth < 360;
    const compact = screenWidth < 400;
    return {
        gutter: narrow ? 14 : compact ? 15 : 18,
        fieldGap: compact ? 10 : 12,
        titleSize: compact ? 20 : 22,
        titleLine: compact ? 26 : 28,
        textareaMin: compact ? 76 : 84,
    };
}

function compactTopPadding(screenWidth: number): number {
    return screenWidth < 360 ? 2 : 2;
}

function createStyles(screenWidth: number) {
    const t = getLayoutTokens(screenWidth);
    const hair = StyleSheet.hairlineWidth;
    const inputFill = "#f3f4f6";
    const segmentTrack = "#e4e4e7";

    return StyleSheet.create({
        safe: {
            flex: 1,
            backgroundColor: dash.surface,
        },
        flex: { flex: 1 },
        scroll: { flex: 1, backgroundColor: dash.surface },
        scrollContent: {
            paddingHorizontal: t.gutter,
            paddingTop: compactTopPadding(screenWidth),
            paddingBottom: 28,
        },
        screenBody: {
            width: "100%",
        },
        pressedOpacity: { opacity: 0.65 },
        headerArea: {
            paddingBottom: 0,
        },
        backRow: {
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-start",
            marginLeft: -6,
            paddingVertical: 2,
            paddingHorizontal: 6,
            gap: 2,
        },
        backBtnText: {
            fontSize: 14,
            fontWeight: "500",
            color: dash.text,
            letterSpacing: -0.2,
        },
        divider: {
            height: 1,
            marginVertical: 10,
            backgroundColor: "rgba(15,23,42,0.06)",
        },
        kicker: {
            marginTop: 4,
            marginBottom: 2,
            fontSize: 10,
            fontWeight: "700",
            color: dash.accent,
            letterSpacing: 0.8,
            textTransform: "uppercase",
        },
        title: {
            fontSize: t.titleSize,
            fontWeight: "700",
            color: dash.text,
            lineHeight: t.titleLine,
            letterSpacing: -0.4,
        },
        subtitleMuted: {
            marginTop: 4,
            fontSize: 12,
            fontWeight: "400",
            color: dash.muted,
            lineHeight: 16,
        },
        fieldBlock: {
            marginBottom: t.fieldGap,
        },
        fieldBlockSectionTop: {
            marginTop: 10,
            marginBottom: 0,
        },
        labelBelowTight: {
            marginBottom: 4,
        },
        labelSubField: {
            fontSize: 12,
            fontWeight: "600",
            color: dash.muted,
            letterSpacing: -0.1,
        },
        label: {
            fontSize: 12,
            fontWeight: "600",
            color: dash.muted,
            marginBottom: 6,
            letterSpacing: -0.1,
        },
        labelTextStandalone: {
            marginTop: 12,
            marginBottom: 6,
            fontSize: 14,
            fontWeight: "600",
            color: dash.text,
            letterSpacing: -0.2,
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
        inputDisabled: {
            opacity: 0.55,
        },
        textarea: {
            minHeight: t.textareaMin,
            paddingTop: 10,
        },
        fileRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            marginTop: 2,
        },
        uploadBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingVertical: 9,
            paddingHorizontal: 12,
            borderRadius: 11,
            borderWidth: 0,
            backgroundColor: inputFill,
        },
        uploadBtnText: {
            fontSize: 13,
            fontWeight: "600",
            color: dash.text,
        },
        fileHint: {
            fontSize: 12,
            flex: 1,
            minWidth: 96,
        },
        row2: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
        },
        rowItem: {
            flex: 1,
            minWidth: 108,
        },
        rowItemWide: {
            flex: 1,
            minWidth: 124,
        },
        block: {
            paddingTop: 0,
        },
        checkRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 9,
            marginTop: 8,
        },
        checkRowTight: {
            marginTop: 6,
        },
        checkboxOuter: {
            width: 20,
            height: 20,
            borderRadius: 6,
            borderWidth: 0,
            backgroundColor: inputFill,
            alignItems: "center",
            justifyContent: "center",
        },
        checkboxOuterOn: {
            backgroundColor: dash.accent,
        },
        checkLabel: {
            fontSize: 13,
            fontWeight: "500",
            color: dash.text,
            letterSpacing: -0.1,
        },
        selectLike: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        selectLikeText: {
            flex: 1,
            fontSize: 14,
            marginRight: 8,
        },
        aiHelp: {
            marginTop: 4,
            marginBottom: 8,
            fontSize: 12,
            color: dash.muted,
            lineHeight: 17,
        },
        segmentTrack: {
            flexDirection: "row",
            backgroundColor: segmentTrack,
            borderRadius: 12,
            padding: 3,
        },
        segmentBtn: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            minHeight: 34,
            paddingVertical: 7,
            paddingHorizontal: 8,
            borderRadius: 9,
            borderWidth: 0,
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
        segmentBtnIdle: {
            backgroundColor: "transparent",
        },
        segmentBtnTextActive: {
            fontSize: 12,
            fontWeight: "700",
            color: dash.accent,
        },
        segmentBtnTextIdle: {
            fontSize: 12,
            fontWeight: "500",
            color: dash.muted,
        },
        doctorAiNote: {
            marginTop: 4,
            fontSize: 12,
            color: dash.muted,
            lineHeight: 17,
        },
        actionsColumn: {
            marginTop: 4,
            paddingTop: 14,
            gap: 8,
            borderTopWidth: hair,
            borderTopColor: "rgba(15,23,42,0.08)",
        },
        primaryBtn: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            minHeight: 44,
            paddingVertical: 11,
            paddingHorizontal: 18,
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
        primaryBtnDisabled: {
            opacity: 0.55,
        },
        primaryBtnText: {
            color: "#fff",
            fontSize: 14,
            fontWeight: "700",
            letterSpacing: -0.15,
        },
        secondaryBtn: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            minHeight: 40,
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 12,
            borderWidth: hair,
            borderColor: "rgba(15,23,42,0.12)",
            backgroundColor: "transparent",
        },
        secondaryBtnText: {
            color: dash.text,
            fontSize: 14,
            fontWeight: "600",
            letterSpacing: -0.1,
        },
        modalRoot: {
            flex: 1,
            justifyContent: "center",
        },
        modalBackdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(15,23,42,0.4)",
        },
        modalSheet: {
            marginHorizontal: t.gutter,
            maxHeight: "56%",
            alignSelf: "stretch",
            backgroundColor: dash.surface,
            borderRadius: 20,
            borderWidth: 0,
            paddingVertical: 14,
            paddingHorizontal: 16,
            ...Platform.select({
                ios: {
                    shadowColor: "#0f172a",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.18,
                    shadowRadius: 24,
                },
                android: { elevation: 12 },
                default: {},
            }),
        },
        modalTitle: {
            fontSize: 15,
            fontWeight: "700",
            color: dash.text,
            marginBottom: 8,
            letterSpacing: -0.25,
        },
        modalList: {
            maxHeight: 300,
        },
        modalOption: {
            paddingVertical: 11,
            borderBottomWidth: hair,
            borderBottomColor: "rgba(15,23,42,0.06)",
        },
        modalOptionText: {
            fontSize: 14,
            color: dash.text,
            fontWeight: "500",
        },
    });
}

export default function CourseProjectCreatePage() {
    const { width: windowWidth } = useWindowDimensions();
    const styles = useMemo(() => createStyles(windowWidth), [windowWidth]);

    const router = useRouter();
    const searchParams = useLocalSearchParams<{
        courseId?: string | string[];
        /** Optional JSON array of `{ id, name }` sections (URL-encoded when linking). */
        sectionsJson?: string | string[];
    }>();

    const courseId = pickParam(searchParams.courseId) ?? "";

    const [sectionOptions, setSectionOptions] = useState<CourseWorkspaceSectionOption[]>(() =>
        parseSectionsFromSearchParam(pickParam(searchParams.sectionsJson))
    );

    /** Returns to the previous screen (typically CourseWorkspacePage). The workspace
     *  re-runs `loadWorkspace` via `useFocusEffect`, so the new project is fetched. */
    const leaveScreen = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }
        if (backendCourseId != null) {
            router.replace(
                `/CourseWorkspacePage?courseId=${encodeURIComponent(
                    String(backendCourseId),
                )}` as Href,
            );
            return;
        }
        router.replace("/" as Href);
    };

    const [title, setTitle] = useState("");
    const [abstract, setAbstract] = useState("");
    const [teamSize, setTeamSize] = useState(2);
    const [duration, setDuration] = useState("");
    const [allSections, setAllSections] = useState(true);
    const [allowCrossSectionTeams, setAllowCrossSectionTeams] = useState(false);
    const [sectionId, setSectionId] = useState("");
    const [aiMode, setAiMode] = useState<"doctor" | "student">("doctor");
    const [fileLabel, setFileLabel] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [sectionPickerOpen, setSectionPickerOpen] = useState(false);

    const backendCourseId = courseId && /^\d+$/.test(courseId) ? Number(courseId) : null;
    useEffect(() => {
        if (backendCourseId == null) return;
        let cancelled = false;
        getDoctorCourseSections(backendCourseId)
            .then((secs) => {
                if (cancelled) return;
                const apiOpts: CourseWorkspaceSectionOption[] = secs.map((s) => ({
                    id: String(s.id),
                    name: s.name,
                }));
                if (apiOpts.length > 0) setSectionOptions(apiOpts);
            })
            .catch(() => {
                /* non-fatal: keep sectionsJson from navigation */
            });
        return () => {
            cancelled = true;
        };
    }, [backendCourseId]);

    useEffect(() => {
        if (!allSections) {
            setAllowCrossSectionTeams(false);
        }
    }, [allSections]);

    const backToWorkspace = () => {
        leaveScreen();
    };

    const handleSubmit = async () => {
        if (submitting) return;
        const t = title.trim();
        if (!t) { showToast("Title is required.", "error"); return; }
        if (!allSections) {
            if (sectionOptions.length === 0) {
                showToast("Add sections in the workspace first, or choose All sections.", "error");
                return;
            }
            if (!sectionId) {
                showToast("Select a section, or enable All sections.", "error");
                return;
            }
        }
        const ts = Number(teamSize);
        if (!Number.isFinite(ts) || ts < 2 || ts > 50) {
            showToast("Team size must be between 2 and 50.", "error");
            return;
        }

        if (backendCourseId == null) {
            showToast("Missing or invalid course id. Open this screen from a course workspace.", "error");
            return;
        }

        setSubmitting(true);
        try {
            const selectedSectionIds = allSections
                ? []
                : [Number(sectionId)].filter((n) => Number.isFinite(n) && n > 0);

            await createDoctorCourseProject(backendCourseId, {
                title: t,
                description: abstract.trim(),
                teamSize: ts,
                applyToAllSections: allSections,
                allowCrossSectionTeams: allSections ? allowCrossSectionTeams : false,
                aiMode: aiMode,
                sectionIds: selectedSectionIds,
            });
            leaveScreen();
        } catch (err) {
            showToast(parseApiErrorMessage(err), "error");
        } finally {
            setSubmitting(false);
        }
    };

    const chooseFile = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            showToast("Media library permission is required to pick a file.", "error");
            return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images", "videos"],
            allowsMultipleSelection: false,
        });
        if (res.canceled || !res.assets?.[0]) return;
        const a = res.assets[0];
        const label = a.fileName ?? a.uri.split("/").pop() ?? "Selected file";
        setFileLabel(label);
    };

    const sectionSelectDisabled = allSections || sectionOptions.length === 0;
    const sectionPlaceholder =
        sectionOptions.length === 0 ? "No sections defined yet" : "Select section…";
    const sectionDisplay =
        sectionId === ""
            ? sectionPlaceholder
            : sectionOptions.find((s) => s.id === sectionId)?.name ?? sectionPlaceholder;

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
                    <View style={styles.screenBody}>
                        <View style={styles.headerArea}>
                            <Pressable
                                onPress={backToWorkspace}
                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                style={({ pressed }) => [styles.backRow, pressed && styles.pressedOpacity]}
                            >
                                <Ionicons name="arrow-back" size={20} color={dash.text} />
                                <Text style={styles.backBtnText}>Back to course</Text>
                            </Pressable>
                            <Text style={styles.kicker}>New project</Text>
                            <Text style={styles.title}>Create project</Text>
                            <Text style={styles.subtitleMuted}>
                                Creates a real course project on the server for this course.
                            </Text>
                        </View>

                        <View style={styles.divider} />
                            <View style={styles.fieldBlock}>
                                <Text style={styles.label}>Title</Text>
                                <TextInput
                                    style={styles.input}
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="e.g. Capstone design project"
                                    placeholderTextColor={dash.subtle}
                                    autoCorrect={false}
                                    autoCapitalize="sentences"
                                />
                            </View>

                            <View style={styles.fieldBlock}>
                                <Text style={styles.label}>Abstract</Text>
                                <TextInput
                                    style={[styles.input, styles.textarea]}
                                    value={abstract}
                                    onChangeText={setAbstract}
                                    placeholder="Short summary for students"
                                    placeholderTextColor={dash.subtle}
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>

                            <View style={styles.fieldBlock}>
                                <Text style={styles.labelTextStandalone}>Project file (UI only)</Text>
                                <View style={styles.fileRow}>
                                    <Pressable
                                        onPress={chooseFile}
                                        style={({ pressed }) => [styles.uploadBtn, pressed && styles.pressedOpacity]}
                                    >
                                        <Ionicons name="cloud-upload-outline" size={16} color={dash.muted} />
                                        <Text style={styles.uploadBtnText}>Choose file</Text>
                                    </Pressable>
                                    <Text
                                        style={[
                                            styles.fileHint,
                                            { color: fileLabel ? dash.text : dash.subtle },
                                        ]}
                                        numberOfLines={2}
                                    >
                                        {fileLabel ?? "No file selected"}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.row2}>
                                <View style={[styles.fieldBlock, styles.rowItem]}>
                                    <Text style={styles.label}>Team size</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="number-pad"
                                        value={String(teamSize)}
                                        onChangeText={(v) => {
                                            const n = Number.parseInt(v.replace(/[^\d]/g, ""), 10);
                                            setTeamSize(Number.isFinite(n) ? n : 2);
                                        }}
                                    />
                                </View>
                                <View style={[styles.fieldBlock, styles.rowItemWide]}>
                                    <Text style={styles.label}>Duration</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={duration}
                                        onChangeText={setDuration}
                                        placeholder="e.g. 8 weeks"
                                        placeholderTextColor={dash.subtle}
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>

                            <View style={styles.block}>
                                <Text style={styles.labelTextStandalone}>Sections</Text>
                                <Pressable
                                    style={[styles.checkRow, styles.checkRowTight]}
                                    onPress={() => {
                                        const on = !allSections;
                                        setAllSections(on);
                                        if (on) setSectionId("");
                                    }}
                                >
                                    <View style={[styles.checkboxOuter, allSections && styles.checkboxOuterOn]}>
                                        {allSections ? (
                                            <Ionicons name="checkmark" size={14} color="#fff" />
                                        ) : null}
                                    </View>
                                    <Text style={styles.checkLabel}>All sections</Text>
                                </Pressable>
                                {allSections ? (
                                    <Pressable
                                        style={styles.checkRow}
                                        onPress={() => setAllowCrossSectionTeams(!allowCrossSectionTeams)}
                                    >
                                        <View
                                            style={[
                                                styles.checkboxOuter,
                                                allowCrossSectionTeams && styles.checkboxOuterOn,
                                            ]}
                                        >
                                            {allowCrossSectionTeams ? (
                                                <Ionicons name="checkmark" size={14} color="#fff" />
                                            ) : null}
                                        </View>
                                        <Text style={styles.checkLabel}>Allow cross-section teams</Text>
                                    </Pressable>
                                ) : null}
                                <View style={[styles.fieldBlock, styles.fieldBlockSectionTop]}>
                                    <Text style={[styles.labelSubField, styles.labelBelowTight]}>
                                        Specific section
                                    </Text>
                                    <Pressable
                                        onPress={() => {
                                            if (!sectionSelectDisabled) setSectionPickerOpen(true);
                                        }}
                                        style={[
                                            styles.input,
                                            styles.selectLike,
                                            sectionSelectDisabled && styles.inputDisabled,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.selectLikeText,
                                                {
                                                    color:
                                                        sectionId === "" || sectionSelectDisabled
                                                            ? dash.subtle
                                                            : dash.text,
                                                },
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {sectionSelectDisabled ? sectionPlaceholder : sectionDisplay}
                                        </Text>
                                        <Ionicons name="chevron-down" size={18} color={dash.muted} />
                                    </Pressable>
                                </View>
                            </View>

                            <View style={styles.block}>
                                <Text style={styles.labelTextStandalone}>AI mode</Text>
                                <Text style={styles.aiHelp}>
                                    How teams are formed for this project.
                                </Text>
                                <View style={styles.segmentTrack}>
                                    <Pressable
                                        onPress={() => setAiMode("doctor")}
                                        style={({ pressed }) => [
                                            styles.segmentBtn,
                                            aiMode === "doctor" ? styles.segmentBtnActive : styles.segmentBtnIdle,
                                            pressed && styles.pressedOpacity,
                                        ]}
                                    >
                                        <Ionicons
                                            name="hardware-chip-outline"
                                            size={17}
                                            color={aiMode === "doctor" ? dash.accent : dash.muted}
                                        />
                                        <Text
                                            style={
                                                aiMode === "doctor"
                                                    ? styles.segmentBtnTextActive
                                                    : styles.segmentBtnTextIdle
                                            }
                                        >
                                            Doctor assigns
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => setAiMode("student")}
                                        style={({ pressed }) => [
                                            styles.segmentBtn,
                                            aiMode === "student" ? styles.segmentBtnActive : styles.segmentBtnIdle,
                                            pressed && styles.pressedOpacity,
                                        ]}
                                    >
                                        <Ionicons
                                            name="sparkles-outline"
                                            size={17}
                                            color={aiMode === "student" ? dash.accent : dash.muted}
                                        />
                                        <Text
                                            style={
                                                aiMode === "student"
                                                    ? styles.segmentBtnTextActive
                                                    : styles.segmentBtnTextIdle
                                            }
                                        >
                                            Student selects
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>

                            {aiMode === "doctor" ? (
                                <Text style={styles.doctorAiNote}>
                                    Teams will be automatically formed using AI based on student profiles and skills
                                </Text>
                            ) : null}

                            <View style={styles.actionsColumn}>
                                <Pressable
                                    onPress={backToWorkspace}
                                    style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressedOpacity]}
                                >
                                    <Text style={styles.secondaryBtnText}>Cancel</Text>
                                </Pressable>
                                <Pressable
                                    onPress={handleSubmit}
                                    disabled={submitting}
                                    style={({ pressed }) => [
                                        styles.primaryBtn,
                                        submitting && styles.primaryBtnDisabled,
                                        pressed && !submitting && styles.pressedOpacity,
                                    ]}
                                >
                                    <Ionicons name="people" size={16} color="#fff" />
                                    <Text style={styles.primaryBtnText}>
                                        {submitting ? "Creating…" : "Create project"}
                                    </Text>
                                </Pressable>
                            </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal
                visible={sectionPickerOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setSectionPickerOpen(false)}
            >
                <View style={styles.modalRoot}>
                    <Pressable
                        style={styles.modalBackdrop}
                        onPress={() => setSectionPickerOpen(false)}
                    />
                    <View style={styles.modalSheet}>
                        <Text style={styles.modalTitle}>Select section</Text>
                        <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
                            <Pressable
                                style={styles.modalOption}
                                onPress={() => {
                                    setSectionId("");
                                    setSectionPickerOpen(false);
                                }}
                            >
                                <Text style={styles.modalOptionText}>{sectionPlaceholder}</Text>
                            </Pressable>
                            {sectionOptions.map((s) => (
                                <Pressable
                                    key={s.id}
                                    style={styles.modalOption}
                                    onPress={() => {
                                        setSectionId(s.id);
                                        setSectionPickerOpen(false);
                                    }}
                                >
                                    <Text style={styles.modalOptionText}>{s.name}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
