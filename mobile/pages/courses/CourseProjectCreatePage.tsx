import { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    StyleSheet,
    Platform,
    Modal,
    KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useToast } from "../../../context/ToastContext";
import { dash } from "../doctor/dashboard/doctorDashTokens";
import type {
    CourseProjectCreateLocationState,
    CourseWorkspaceSectionOption,
    NewWorkspaceProjectPayload,
} from "./courseProjectTypes";
import {
    createDoctorCourseProject,
    getDoctorCourseSections,
} from "../../../api/doctorCoursesApi";
import { parseApiErrorMessage } from "../../../api/axiosInstance";

/** Mobile: set `true` when wiring doctor courses API over the network. */
const ENABLE_COURSE_PROJECT_BACKEND_API = false;

export default function CourseProjectCreatePage() {
    const navigate = useNavigate();
    const { courseId } = useParams<{ courseId: string }>();
    const location = useLocation();
    const { showToast } = useToast();

    const [sectionOptions, setSectionOptions] = useState<CourseWorkspaceSectionOption[]>(
        (location.state as CourseProjectCreateLocationState | null)?.sections ?? []
    );

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
        if (!ENABLE_COURSE_PROJECT_BACKEND_API) return;
        let cancelled = false;
        getDoctorCourseSections(backendCourseId).then((secs) => {
            if (cancelled) return;
            const apiOpts: CourseWorkspaceSectionOption[] = secs.map((s) => ({
                id: String(s.id),
                name: s.name,
            }));
            if (apiOpts.length > 0) setSectionOptions(apiOpts);
        }).catch(() => {/* ignore */ });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [backendCourseId]);

    useEffect(() => {
        if (!allSections) {
            setAllowCrossSectionTeams(false);
        }
    }, [allSections]);

    const backToWorkspace = () => {
        if (!courseId) {
            navigate("/doctor-dashboard");
            return;
        }
        navigate(`/courses/${courseId}`);
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
        if (!courseId) { showToast("Missing course in route.", "error"); return; }

        let sectionLabel = "All sections";
        if (!allSections) {
            const pick = sectionOptions.find((s) => s.id === sectionId);
            sectionLabel = pick?.name?.trim() || "Section";
        }

        const payload: NewWorkspaceProjectPayload = {
            title: t,
            abstract: abstract.trim(),
            teamSize: ts,
            duration: duration.trim(),
            sectionLabel,
            aiMode,
        };

        if (backendCourseId != null && ENABLE_COURSE_PROJECT_BACKEND_API) {
            setSubmitting(true);
            try {
                const selectedSectionIds = allSections
                    ? []
                    : [Number(sectionId)].filter((n) => Number.isFinite(n) && n > 0);

                const newProject = await createDoctorCourseProject(backendCourseId, {
                    title: t,
                    description: abstract.trim(),
                    teamSize: ts,
                    applyToAllSections: allSections,
                    allowCrossSectionTeams: allSections ? allowCrossSectionTeams : false,
                    aiMode: aiMode,
                    sectionIds: selectedSectionIds,
                });
                if (newProject.aiMode === "doctor") {
                    navigate(`/courses/${courseId}/projects/${newProject.id}/teams`, {
                        state: { projectName: t, sectionName: sectionLabel },
                    });
                } else {
                    navigate(`/courses/${courseId}`);
                }
                return;
            } catch (err) {
                showToast(parseApiErrorMessage(err), "error");
                setSubmitting(false);
                return;
            } finally {
                setSubmitting(false);
            }
        }

        if (aiMode === "doctor") {
            const tempProjectId = `temp-${Date.now()}`;
            navigate(`/courses/${courseId}/projects/${tempProjectId}/teams`, {
                state: { projectName: t },
            });
            return;
        }
        navigate(`/courses/${courseId}`, {
            state: { newProject: payload, importNonce: Date.now() },
        });
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
        <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
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
                    <View style={styles.inner}>
                        <Pressable
                            onPress={backToWorkspace}
                            style={({ pressed }) => [styles.backBtn, pressed && styles.pressedOpacity]}
                        >
                            <Ionicons name="arrow-back" size={18} color={dash.muted} />
                            <Text style={styles.backBtnText}>Back to course</Text>
                        </Pressable>

                        <View style={styles.cardHeader}>
                            <Text style={styles.kicker}>New project</Text>
                            <Text style={styles.title}>Create project</Text>
                            <Text style={styles.subtitleMuted}>
                                Local draft only — nothing is sent to the server yet.
                            </Text>
                        </View>

                        <View style={styles.formCard}>
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
                                    style={styles.checkRow}
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
                                <View style={[styles.fieldBlock, { marginTop: 12, marginBottom: 0 }]}>
                                    <Text style={[styles.labelTextStandalone, { marginBottom: 6 }]}>
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
                                <View style={styles.segment}>
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

                            <View style={styles.actions}>
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
                                    <Ionicons name="people" size={17} color="#fff" />
                                    <Text style={styles.primaryBtnText}>
                                        {submitting ? "Creating…" : "Create project"}
                                    </Text>
                                </Pressable>
                            </View>
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

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: dash.bg,
    },
    flex: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
    },
    inner: {
        width: "100%",
        maxWidth: 640,
        alignSelf: "center",
    },
    pressedOpacity: { opacity: 0.85 },
    backBtn: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: dash.border,
        backgroundColor: dash.surface,
    },
    backBtnText: {
        fontSize: 13,
        fontWeight: "700",
        color: dash.muted,
    },
    cardHeader: {
        backgroundColor: dash.surface,
        borderRadius: dash.radiusLg,
        borderWidth: 1,
        borderColor: dash.border,
        paddingHorizontal: 22,
        paddingVertical: 22,
        marginTop: 20,
        ...Platform.select({
            ios: {
                shadowColor: "#0f172a",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 16,
            },
            android: { elevation: 3 },
            default: {},
        }),
    },
    kicker: {
        marginBottom: 6,
        fontSize: 11,
        fontWeight: "700",
        color: dash.subtle,
        letterSpacing: 1.2,
        textTransform: "uppercase",
    },
    title: {
        fontSize: 22,
        fontWeight: "800",
        color: dash.text,
        lineHeight: 28,
    },
    subtitleMuted: {
        marginTop: 10,
        fontSize: 12,
        color: dash.muted,
        lineHeight: 18,
    },
    formCard: {
        backgroundColor: dash.surface,
        borderRadius: dash.radiusLg,
        borderWidth: 1,
        borderColor: dash.border,
        padding: 24,
        marginTop: 20,
        gap: 18,
        ...Platform.select({
            ios: {
                shadowColor: "#0f172a",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 16,
            },
            android: { elevation: 3 },
            default: {},
        }),
    },
    fieldBlock: {
        marginBottom: 0,
    },
    label: {
        fontSize: 11,
        fontWeight: "700",
        color: dash.muted,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 0,
    },
    labelTextStandalone: {
        fontSize: 11,
        fontWeight: "700",
        color: dash.muted,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    input: {
        marginTop: 6,
        paddingVertical: 11,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: dash.border,
        fontSize: 14,
        color: dash.text,
        backgroundColor: "#f8fafc",
    },
    inputDisabled: {
        opacity: 0.55,
    },
    textarea: {
        minHeight: 100,
        paddingTop: 11,
    },
    fileRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 10,
        marginTop: 8,
    },
    uploadBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: dash.border,
        backgroundColor: dash.surface,
    },
    uploadBtnText: {
        fontSize: 13,
        fontWeight: "700",
        color: dash.muted,
    },
    fileHint: {
        fontSize: 13,
        flex: 1,
        minWidth: 120,
    },
    row2: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
    },
    rowItem: {
        flex: 1,
        minWidth: 120,
    },
    rowItemWide: {
        flex: 1,
        minWidth: 140,
    },
    block: {
        paddingTop: 4,
    },
    checkRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 10,
    },
    checkboxOuter: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: dash.border,
        backgroundColor: dash.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxOuterOn: {
        backgroundColor: dash.accent,
        borderColor: dash.accent,
    },
    checkLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: dash.text,
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
        marginTop: 6,
        marginBottom: 10,
        fontSize: 12,
        color: dash.muted,
        lineHeight: 18,
    },
    segment: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    segmentBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        flex: 1,
        minWidth: 140,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    segmentBtnActive: {
        borderColor: dash.accent,
        backgroundColor: dash.accentMuted,
    },
    segmentBtnIdle: {
        borderColor: dash.border,
        backgroundColor: dash.surface,
    },
    segmentBtnTextActive: {
        fontSize: 13,
        fontWeight: "700",
        color: dash.accent,
    },
    segmentBtnTextIdle: {
        fontSize: 13,
        fontWeight: "700",
        color: dash.muted,
    },
    doctorAiNote: {
        fontSize: 12,
        color: dash.muted,
        lineHeight: 18,
    },
    actions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: dash.border,
    },
    primaryBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 11,
        paddingHorizontal: 18,
        borderRadius: 10,
        backgroundColor: dash.accent,
        ...Platform.select({
            ios: {
                shadowColor: "#4f46e5",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
            },
            android: { elevation: 4 },
            default: {},
        }),
    },
    primaryBtnDisabled: {
        opacity: 0.55,
    },
    primaryBtnText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "700",
    },
    secondaryBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: dash.border,
        backgroundColor: dash.surface,
    },
    secondaryBtnText: {
        color: dash.muted,
        fontSize: 12,
        fontWeight: "700",
    },
    modalRoot: {
        flex: 1,
        justifyContent: "center",
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(15,23,42,0.45)",
    },
    modalSheet: {
        marginHorizontal: 20,
        maxHeight: "55%",
        alignSelf: "stretch",
        backgroundColor: dash.surface,
        borderRadius: dash.radiusLg,
        borderWidth: 1,
        borderColor: dash.border,
        padding: 16,
        ...Platform.select({
            ios: {
                shadowColor: "#0f172a",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
            },
            android: { elevation: 8 },
            default: {},
        }),
    },
    modalTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: dash.text,
        marginBottom: 12,
    },
    modalList: {
        maxHeight: 320,
    },
    modalOption: {
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: dash.border,
    },
    modalOptionText: {
        fontSize: 15,
        color: dash.text,
    },
});
