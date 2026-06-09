import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { createCourse } from "@/api/doctorCoursesApi";
import { DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import { DoctorStackHeader } from "@/components/doctor/ui/DoctorStackHeader";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { doctorCoursePath } from "@/lib/doctorRoutes";

const SEMESTERS = ["Fall", "Spring", "Summer"] as const;

export default function DoctorCreateCourseScreen() {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [semester, setSemester] = useState<(typeof SEMESTERS)[number]>("Fall");
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear()));
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !code.trim() || !academicYear.trim()) {
      Alert.alert("Missing fields", "Course name, code, and academic year are required.");
      return;
    }
    setSaving(true);
    try {
      const created = await createCourse({
        name: name.trim(),
        code: code.trim(),
        semester,
        academicYear: academicYear.trim(),
        description: description.trim() || undefined,
      });
      router.replace(doctorCoursePath(created.courseId) as never);
    } catch (err) {
      Alert.alert("Could not create course", parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DoctorScreen edges={["top"]}>
      <DoctorStackHeader title="Create course" subtitle="Add a new teaching course" variant="compact" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.label, { fontSize: layout.scale(12) }]}>Course name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Introduction to Software Engineering"
          style={[styles.input, { fontSize: layout.scale(14) }]}
          editable={!saving}
        />

        <Text style={[styles.label, { fontSize: layout.scale(12) }]}>Course code</Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="CSE301"
          autoCapitalize="characters"
          style={[styles.input, { fontSize: layout.scale(14) }]}
          editable={!saving}
        />

        <Text style={[styles.label, { fontSize: layout.scale(12) }]}>Semester</Text>
        <View style={styles.semesterRow}>
          {SEMESTERS.map((opt) => {
            const active = semester === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => setSemester(opt)}
                style={[styles.semesterChip, active && styles.semesterChipActive]}
                disabled={saving}
              >
                <Text style={[styles.semesterText, active && styles.semesterTextActive]}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { fontSize: layout.scale(12) }]}>Academic year</Text>
        <TextInput
          value={academicYear}
          onChangeText={setAcademicYear}
          placeholder="2025-2026"
          style={[styles.input, { fontSize: layout.scale(14) }]}
          editable={!saving}
        />

        <Text style={[styles.label, { fontSize: layout.scale(12) }]}>Description (optional)</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Brief course overview"
          multiline
          style={[styles.input, styles.textArea, { fontSize: layout.scale(14) }]}
          editable={!saving}
        />

        <Pressable
          onPress={() => void handleCreate()}
          disabled={saving}
          style={[styles.submit, saving && styles.submitDisabled]}
        >
          <Text style={styles.submitText}>{saving ? "Creating…" : "Create course"}</Text>
        </Pressable>
      </ScrollView>
    </DoctorScreen>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    content: {
      padding: DOCTOR_SPACE.lg,
      gap: DOCTOR_SPACE.sm,
      paddingBottom: DOCTOR_SPACE.xxl,
    },
    label: {
      color: colors.textMuted,
      fontWeight: "600",
      marginTop: DOCTOR_SPACE.sm,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    textArea: {
      minHeight: 96,
      textAlignVertical: "top",
    },
    semesterRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    semesterChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: colors.surface,
    },
    semesterChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    semesterText: {
      color: colors.textMuted,
      fontWeight: "600",
      fontSize: 13,
    },
    semesterTextActive: {
      color: colors.primary,
    },
    submit: {
      marginTop: DOCTOR_SPACE.lg,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
    },
    submitDisabled: {
      opacity: 0.7,
    },
    submitText: {
      color: colors.onPrimary,
      fontWeight: "700",
      fontSize: 15,
    },
  });
}
