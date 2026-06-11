import { X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  moveStudentToSection,
  type CourseEnrolledStudent,
  type CourseSection,
} from "@/api/doctorCoursesApi";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  visible: boolean;
  student: CourseEnrolledStudent | null;
  sections: CourseSection[];
  onClose: () => void;
  onSaved: () => void;
};

export function MoveStudentSheet({ visible, student, sections, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [targetSectionId, setTargetSectionId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const availableSections = useMemo(
    () => sections.filter((section) => section.id !== student?.sectionId),
    [sections, student?.sectionId],
  );

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(500);
      fadeAnim.setValue(0);
      return;
    }

    const defaultTarget = availableSections[0]?.id ?? null;
    setTargetSectionId(defaultTarget);
    setError(null);
    setSaving(false);

    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, damping: 24, stiffness: 260, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [visible, availableSections, slideAnim, fadeAnim]);

  const handleSubmit = async () => {
    if (!student?.sectionId || targetSectionId == null) return;

    setSaving(true);
    setError(null);
    try {
      await moveStudentToSection(student.sectionId, student.studentId, targetSectionId);
      onSaved();
      onClose();
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  const studentName = student?.name?.trim() || "this student";

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" />
        </Animated.View>

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
              <Text style={[styles.title, { fontSize: layout.scale(18) }]}>Move section</Text>
              <Text style={[styles.subtitle, { fontSize: layout.scale(13) }]}>
                Move {studentName} to another section.
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

          <ScrollView contentContainerStyle={styles.form}>
            <Text style={styles.label}>Target section</Text>
            {availableSections.length === 0 ? (
              <Text style={styles.mutedText}>No other sections are available for this course.</Text>
            ) : (
              <View style={styles.optionList}>
                {availableSections.map((section) => {
                  const selected = targetSectionId === section.id;
                  return (
                    <Pressable
                      key={section.id}
                      onPress={() => setTargetSectionId(section.id)}
                      style={({ pressed }) => [
                        styles.option,
                        selected && styles.optionSelected,
                        { opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                        {section.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
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
              disabled={saving || targetSectionId == null || availableSections.length === 0}
              style={({ pressed }) => [styles.saveBtn, { opacity: pressed || saving ? 0.85 : 1 }]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveText}>Move student</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: "flex-end" },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
    sheet: {
      maxHeight: "70%",
      backgroundColor: colors.cardBg,
      borderTopLeftRadius: DOCTOR_RADIUS.xl,
      borderTopRightRadius: DOCTOR_RADIUS.xl,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingHorizontal: DOCTOR_SPACE.lg,
      paddingTop: DOCTOR_SPACE.lg,
      paddingBottom: DOCTOR_SPACE.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerText: { flex: 1, paddingRight: DOCTOR_SPACE.md },
    title: { fontWeight: "800", color: colors.foreground },
    subtitle: { marginTop: 4, fontWeight: "500", color: colors.muted, lineHeight: 20 },
    closeBtn: { padding: 4 },
    form: { padding: DOCTOR_SPACE.lg, gap: DOCTOR_SPACE.sm },
    label: { fontWeight: "700", color: colors.foreground, fontSize: 13 },
    mutedText: { color: colors.muted, fontSize: 14, lineHeight: 20 },
    optionList: { gap: DOCTOR_SPACE.sm },
    option: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DOCTOR_RADIUS.md,
      paddingHorizontal: DOCTOR_SPACE.md,
      paddingVertical: DOCTOR_SPACE.md,
      backgroundColor: colors.background,
    },
    optionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    optionText: { fontWeight: "600", color: colors.foreground, fontSize: 14 },
    optionTextSelected: { color: colors.primary, fontWeight: "800" },
    errorText: { color: "#DC2626", fontSize: 13, fontWeight: "600" },
    footer: {
      flexDirection: "row",
      gap: DOCTOR_SPACE.sm,
      paddingHorizontal: DOCTOR_SPACE.lg,
      paddingTop: DOCTOR_SPACE.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    cancelBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: DOCTOR_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelText: { fontWeight: "700", color: colors.foreground },
    saveBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: DOCTOR_RADIUS.md,
      backgroundColor: colors.primary,
    },
    saveText: { fontWeight: "700", color: "#fff" },
  });
}
