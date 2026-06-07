import { X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { addStudentsToSection } from "@/api/doctorCoursesApi";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { parseStudentIdsText } from "@/lib/courseWorkspaceUtils";
import { addStudentsResultSummary } from "@/lib/doctorCourseUi";

type Props = {
  visible: boolean;
  sectionId: number;
  onClose: () => void;
  onSaved: (summary: string) => void;
};

export function AddStudentsSheet({ visible, sectionId, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [idsText, setIdsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(500);
      fadeAnim.setValue(0);
      return;
    }

    setIdsText("");
    setError(null);
    setSaving(false);

    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, damping: 24, stiffness: 260, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [visible, slideAnim, fadeAnim]);

  const handleSubmit = async () => {
    const studentIds = parseStudentIdsText(idsText);
    if (studentIds.length === 0) {
      setError("Enter at least one student ID.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await addStudentsToSection(sectionId, studentIds);
      onSaved(addStudentsResultSummary(result));
      onClose();
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardWrap}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(insets.bottom, DOCTOR_SPACE.lg),
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={[styles.title, { fontSize: layout.scale(18) }]}>Add students</Text>
                <Text style={[styles.subtitle, { fontSize: layout.scale(13) }]}>
                  Enter university student IDs (one per line or comma-separated).
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.6 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={22} color={colors.foreground} strokeWidth={2} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
              <Text style={styles.label}>Student IDs</Text>
              <TextInput
                value={idsText}
                onChangeText={setIdsText}
                placeholder={"2021001\n2021002"}
                placeholderTextColor={colors.muted}
                multiline
                textAlignVertical="top"
                style={[styles.textarea, { fontSize: layout.scale(15), minHeight: layout.scale(140) }]}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                onPress={onClose}
                disabled={saving}
                style={({ pressed }) => [styles.cancelBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void handleSubmit()}
                disabled={saving}
                style={({ pressed }) => [styles.saveBtn, { opacity: pressed || saving ? 0.85 : 1 }]}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveText}>Add students</Text>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: "flex-end" },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
    keyboardWrap: { flex: 1, justifyContent: "flex-end" },
    sheet: {
      maxHeight: "88%",
      backgroundColor: colors.cardBg,
      borderTopLeftRadius: DOCTOR_RADIUS.xl,
      borderTopRightRadius: DOCTOR_RADIUS.xl,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingHorizontal: DOCTOR_SPACE.lg,
      paddingTop: DOCTOR_SPACE.lg,
      paddingBottom: DOCTOR_SPACE.sm,
      zIndex: 2,
      elevation: 2,
    },
    headerText: { flex: 1, paddingRight: DOCTOR_SPACE.md },
    title: { fontWeight: "800", color: colors.foreground },
    subtitle: { marginTop: 4, fontWeight: "500", color: colors.muted },
    closeBtn: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: DOCTOR_RADIUS.pill,
      backgroundColor: colors.border,
    },
    form: { paddingHorizontal: DOCTOR_SPACE.lg, paddingBottom: DOCTOR_SPACE.md },
    label: {
      marginBottom: DOCTOR_SPACE.xs,
      fontSize: 13,
      fontWeight: "700",
      color: colors.foreground,
    },
    textarea: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: DOCTOR_RADIUS.sm,
      paddingHorizontal: DOCTOR_SPACE.md,
      paddingVertical: DOCTOR_SPACE.md,
      color: colors.foreground,
      backgroundColor: colors.background,
    },
    errorText: {
      marginTop: DOCTOR_SPACE.md,
      fontSize: 13,
      fontWeight: "600",
      color: "#DC2626",
    },
    footer: {
      flexDirection: "row",
      gap: DOCTOR_SPACE.sm,
      paddingHorizontal: DOCTOR_SPACE.lg,
      paddingTop: DOCTOR_SPACE.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    cancelBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: DOCTOR_SPACE.md,
      borderRadius: DOCTOR_RADIUS.sm,
    },
    cancelText: { fontWeight: "700", color: colors.muted },
    saveBtn: {
      flex: 1.4,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: DOCTOR_SPACE.md,
      borderRadius: DOCTOR_RADIUS.sm,
      backgroundColor: colors.primary,
      minHeight: 48,
    },
    saveText: { fontWeight: "700", color: "#fff" },
  });
}
