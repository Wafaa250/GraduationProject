import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
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
import { useRouter, type Href } from "expo-router";

import { createDoctorCourse } from "@/api/doctorCoursesApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";

const dash = {
    bg: "#f1f5f9",
    surface: "#ffffff",
    border: "#e2e8f0",
    text: "#0f172a",
    muted: "#64748b",
    subtle: "#94a3b8",
    accent: "#4f46e5",
} as const;

function createStyles(width: number) {
    const compact = width < 390;
    const gutter = compact ? 14 : 18;
    const hair = StyleSheet.hairlineWidth;

    return StyleSheet.create({
        safe: { flex: 1, backgroundColor: dash.bg },
        scroll: { flex: 1 },
        scrollContent: { paddingHorizontal: gutter, paddingBottom: 32 },
        pressedOpacity: { opacity: 0.68 },

        topBar: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingTop: 4,
            paddingBottom: 10,
        },
        backBtn: {
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: dash.surface,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: hair,
            borderColor: "rgba(15,23,42,0.08)",
        },
        topTitle: {
            flex: 1,
            fontSize: 17,
            fontWeight: "800",
            color: dash.text,
            letterSpacing: -0.3,
        },

        kicker: {
            marginTop: 4,
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 0.85,
            color: dash.accent,
            textTransform: "uppercase",
        },
        card: {
            marginTop: 8,
            borderRadius: 17,
            backgroundColor: dash.surface,
            borderWidth: hair,
            borderColor: "rgba(15,23,42,0.08)",
            padding: 16,
            gap: 14,
        },
        label: {
            fontSize: 11,
            fontWeight: "700",
            color: dash.muted,
            textTransform: "uppercase",
            letterSpacing: 0.55,
            marginBottom: 6,
        },
        input: {
            borderRadius: 12,
            borderWidth: hair,
            borderColor: "rgba(15,23,42,0.12)",
            backgroundColor: "#f8fafc",
            paddingHorizontal: 12,
            paddingVertical: Platform.OS === "ios" ? 12 : 10,
            fontSize: 15,
            color: dash.text,
            minHeight: 46,
        },

        errorBox: {
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#fecaca",
            backgroundColor: "#fff1f2",
            padding: 12,
        },
        errorText: { fontSize: 13, color: "#9f1239", fontWeight: "600" },

        actions: { flexDirection: "row", gap: 10, marginTop: 4, justifyContent: "flex-end" },
        secondaryBtn: {
            minHeight: 44,
            borderRadius: 12,
            paddingHorizontal: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f3f4f6",
        },
        secondaryBtnText: { fontSize: 13, fontWeight: "700", color: dash.text },
        primaryBtn: {
            minHeight: 44,
            borderRadius: 12,
            paddingHorizontal: 16,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            backgroundColor: dash.accent,
        },
        primaryBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
    });
}

export default function CreateCourseScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const styles = useMemo(() => createStyles(width), [width]);

    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [semester, setSemester] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async () => {
        if (submitting) return;
        const nameTrim = name.trim();
        const codeTrim = code.trim();
        if (!nameTrim || !codeTrim) {
            setError("Please enter course name and code.");
            return;
        }
        const semesterTrim = semester.trim();
        setSubmitting(true);
        setError(null);
        try {
            const created = await createDoctorCourse({
                name: nameTrim,
                code: codeTrim,
                semester: semesterTrim.length > 0 ? semesterTrim : null,
                useSharedProjectAcrossSections: false,
                allowCrossSectionTeams: false,
            });

            if (!Number.isFinite(created.courseId) || created.courseId <= 0) {
                throw new Error("Course was created but the server did not return a course id.");
            }

            const href =
                `/CourseWorkspacePage?courseId=${encodeURIComponent(String(created.courseId))}` +
                `&courseName=${encodeURIComponent(created.name)}` +
                `&courseCode=${encodeURIComponent(created.code)}` +
                `&role=doctor`;
            router.replace(href as Href);
        } catch (err) {
            setError(parseApiErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const kavBehavior = Platform.OS === "ios" ? "padding" : undefined;

    return (
        <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={kavBehavior} keyboardVerticalOffset={64}>
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.topBar}>
                        <Pressable
                            onPress={() => router.back()}
                            style={({ pressed }) => [styles.backBtn, pressed && styles.pressedOpacity]}
                            hitSlop={8}
                        >
                            <Ionicons name="chevron-back" size={22} color={dash.text} />
                        </Pressable>
                        <Text style={styles.topTitle} numberOfLines={1}>
                            New course
                        </Text>
                    </View>

                    <Text style={styles.kicker}>My courses</Text>

                    <View style={styles.card}>
                        <View>
                            <Text style={styles.label}>Course name</Text>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g. Software Engineering"
                                placeholderTextColor={dash.subtle}
                                style={styles.input}
                                autoCapitalize="words"
                                editable={!submitting}
                            />
                        </View>
                        <View>
                            <Text style={styles.label}>Course code</Text>
                            <TextInput
                                value={code}
                                onChangeText={setCode}
                                placeholder="e.g. CS401"
                                placeholderTextColor={dash.subtle}
                                style={styles.input}
                                autoCapitalize="characters"
                                editable={!submitting}
                            />
                        </View>
                        <View>
                            <Text style={styles.label}>Semester (optional)</Text>
                            <TextInput
                                value={semester}
                                onChangeText={setSemester}
                                placeholder="e.g. Fall 2026"
                                placeholderTextColor={dash.subtle}
                                style={styles.input}
                                editable={!submitting}
                            />
                        </View>

                        {error ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <View style={styles.actions}>
                            <Pressable
                                onPress={() => router.back()}
                                disabled={submitting}
                                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressedOpacity]}
                            >
                                <Text style={styles.secondaryBtnText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => void onSubmit()}
                                disabled={submitting}
                                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressedOpacity]}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                                )}
                                <Text style={styles.primaryBtnText}>{submitting ? "Creating…" : "Create"}</Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
