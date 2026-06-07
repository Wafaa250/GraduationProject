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
import {
  createCourseSection,
  updateCourseSection,
  type CourseSection,
  type CreateCourseSectionPayload,
} from "@/api/doctorCoursesApi";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { formatDayLabel, SECTION_DAY_OPTIONS } from "@/lib/doctorCourseUi";

type Props = {
  visible: boolean;
  courseId: number;
  section?: CourseSection | null;
  onClose: () => void;
  onSaved: () => void;
};

export function SectionFormSheet({ visible, courseId, section, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isEdit = section != null;

  const [name, setName] = useState("");
  const [days, setDays] = useState<string[]>([]);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [capacity, setCapacity] = useState("30");
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

    setName(section?.name ?? "");
    setDays(section?.days ?? []);
    setTimeFrom(section?.timeFrom ?? "");
    setTimeTo(section?.timeTo ?? "");
    setCapacity(String(section?.capacity ?? 30));
    setError(null);
    setSaving(false);

    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, damping: 24, stiffness: 260, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [visible, section, slideAnim, fadeAnim]);

  const payload = (): CreateCourseSectionPayload => ({
    name,
    days,
    timeFrom,
    timeTo,
    capacity: Math.max(1, Number(capacity) || 1),
  });

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Section name is required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (isEdit && section) {
        await updateCourseSection(section.id, payload());
      } else {
        await createCourseSection(courseId, payload());
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
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
                <Text style={[styles.title, { fontSize: layout.scale(18) }]}>
                  {isEdit ? "Edit section" : "Create section"}
                </Text>
                <Text style={[styles.subtitle, { fontSize: layout.scale(13) }]}>
                  Organize students by schedule and capacity.
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

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.form}
            >
              <Text style={styles.label}>Section name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Section A"
                placeholderTextColor={colors.muted}
                style={[styles.input, { fontSize: layout.scale(15) }]}
              />

              <Text style={styles.label}>Meeting days</Text>
              <View style={styles.daysRow}>
                {SECTION_DAY_OPTIONS.map((day) => {
                  const selected = days.includes(day);
                  return (
                    <Pressable
                      key={day}
                      onPress={() => toggleDay(day)}
                      style={[styles.dayChip, selected && styles.dayChipSelected]}
                    >
                      <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>
                        {formatDayLabel(day)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.timeRow}>
                <View style={styles.timeCol}>
                  <Text style={styles.label}>From</Text>
                  <TextInput
                    value={timeFrom}
                    onChangeText={setTimeFrom}
                    placeholder="09:00"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, { fontSize: layout.scale(15) }]}
                  />
                </View>
                <View style={styles.timeCol}>
                  <Text style={styles.label}>To</Text>
                  <TextInput
                    value={timeTo}
                    onChangeText={setTimeTo}
                    placeholder="11:00"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, { fontSize: layout.scale(15) }]}
                  />
                </View>
              </View>

              <Text style={styles.label}>Capacity</Text>
              <TextInput
                value={capacity}
                onChangeText={setCapacity}
                keyboardType="number-pad"
                placeholder="30"
                placeholderTextColor={colors.muted}
                style={[styles.input, { fontSize: layout.scale(15) }]}
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
                  <Text style={styles.saveText}>{isEdit ? "Save changes" : "Create section"}</Text>
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
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    keyboardWrap: {
      flex: 1,
      justifyContent: "flex-end",
    },
    sheet: {
      maxHeight: "92%",
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
    headerText: {
      flex: 1,
      paddingRight: DOCTOR_SPACE.md,
    },
    title: {
      fontWeight: "800",
      color: colors.foreground,
    },
    subtitle: {
      marginTop: 4,
      fontWeight: "500",
      color: colors.muted,
    },
    closeBtn: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: DOCTOR_RADIUS.pill,
      backgroundColor: colors.border,
    },
    form: {
      paddingHorizontal: DOCTOR_SPACE.lg,
      paddingBottom: DOCTOR_SPACE.md,
    },
    label: {
      marginTop: DOCTOR_SPACE.md,
      marginBottom: DOCTOR_SPACE.xs,
      fontSize: 13,
      fontWeight: "700",
      color: colors.foreground,
    },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: DOCTOR_RADIUS.sm,
      paddingHorizontal: DOCTOR_SPACE.md,
      paddingVertical: DOCTOR_SPACE.md,
      color: colors.foreground,
      backgroundColor: colors.background,
    },
    daysRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    dayChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: DOCTOR_RADIUS.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    dayChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dayChipText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.muted,
    },
    dayChipTextSelected: {
      color: "#fff",
    },
    timeRow: {
      flexDirection: "row",
      gap: DOCTOR_SPACE.md,
    },
    timeCol: {
      flex: 1,
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
    cancelText: {
      fontWeight: "700",
      color: colors.muted,
    },
    saveBtn: {
      flex: 1.4,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: DOCTOR_SPACE.md,
      borderRadius: DOCTOR_RADIUS.sm,
      backgroundColor: colors.primary,
      minHeight: 48,
    },
    saveText: {
      fontWeight: "700",
      color: "#fff",
    },
  });
}
