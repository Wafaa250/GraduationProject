import { router, type Href } from "expo-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { createCourse } from "@/api/doctorCoursesApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import { DoctorStackHeader } from "@/components/doctor/ui/DoctorStackHeader";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { formatAcademicYear, getStartYearOptions } from "@/lib/academicYear";
import { doctorCoursePath } from "@/lib/doctorRoutes";

const SEMESTERS = ["Fall", "Spring", "Summer"] as const;

export default function DoctorCreateCourseScreen() {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [semester, setSemester] = useState("");
  const [startYear, setStartYear] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [allowProjects, setAllowProjects] = useState(true);
  const [allowTeams, setAllowTeams] = useState(true);
  const [allowAi, setAllowAi] = useState(true);
  const [allowCollab, setAllowCollab] = useState(true);

  const yearOptions = useMemo(() => getStartYearOptions(), []);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Course name is required");
      return;
    }
    if (!code.trim()) {
      Alert.alert("Course code is required");
      return;
    }
    if (!semester) {
      Alert.alert("Select a semester");
      return;
    }
    if (startYear == null) {
      Alert.alert("Select a start year");
      return;
    }

    setSaving(true);
    try {
      const defaultTeamFormationStrategy =
        allowAi && allowTeams ? ("doctor" as const) : ("student" as const);
      const created = await createCourse({
        name: name.trim(),
        code: code.trim(),
        semester,
        academicYear: formatAcademicYear(startYear),
        description: description.trim() || undefined,
        allowCourseProjects: allowProjects,
        allowTeamFormation: allowTeams,
        allowAiTeamSuggestions: allowAi,
        allowStudentCollaboration: allowCollab,
        defaultTeamFormationStrategy,
      });
      Alert.alert("Course created", `${created.name} is ready to manage.`);
      router.replace(doctorCoursePath(created.courseId) as Href);
    } catch (err) {
      Alert.alert("Could not create course", parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DoctorScreen edges={["top"]}>
      <DoctorStackHeader title="Create Course" subtitle="Add a new teaching course" variant="compact" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.horizontalPadding,
          paddingBottom: DOCTOR_SPACE.xxxl,
          gap: DOCTOR_SPACE.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Course name" colors={colors}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Introduction to Software Engineering"
            style={styles.input}
            placeholderTextColor={colors.muted}
          />
        </Field>

        <Field label="Course code" colors={colors}>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="CSE301"
            autoCapitalize="characters"
            style={styles.input}
            placeholderTextColor={colors.muted}
          />
        </Field>

        <Field label="Semester" colors={colors}>
          <View style={styles.chipRow}>
            {SEMESTERS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setSemester(option)}
                style={[styles.chip, semester === option && styles.chipActive]}
              >
                <Text style={[styles.chipText, semester === option && styles.chipTextActive]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        </Field>

        <Field label="Academic year" colors={colors}>
          <View style={styles.chipRow}>
            {yearOptions.map((year) => (
              <Pressable
                key={year}
                onPress={() => setStartYear(year)}
                style={[styles.chip, startYear === year && styles.chipActive]}
              >
                <Text style={[styles.chipText, startYear === year && styles.chipTextActive]}>
                  {formatAcademicYear(year)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Field>

        <Field label="Description (optional)" colors={colors}>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Course overview"
            multiline
            style={[styles.input, styles.textArea]}
            placeholderTextColor={colors.muted}
          />
        </Field>

        <ToggleRow
          label="Allow course projects"
          value={allowProjects}
          onValueChange={setAllowProjects}
          colors={colors}
        />
        <ToggleRow
          label="Allow team formation"
          value={allowTeams}
          onValueChange={setAllowTeams}
          colors={colors}
        />
        <ToggleRow
          label="Allow AI team suggestions"
          value={allowAi}
          onValueChange={setAllowAi}
          colors={colors}
        />
        <ToggleRow
          label="Allow student collaboration"
          value={allowCollab}
          onValueChange={setAllowCollab}
          colors={colors}
        />

        <Pressable
          onPress={() => void handleCreate()}
          disabled={saving}
          style={[styles.submitBtn, { opacity: saving ? 0.6 : 1 }]}
        >
          <Text style={styles.submitText}>{saving ? "Creating…" : "Create course"}</Text>
        </Pressable>
      </ScrollView>
    </DoctorScreen>
  );
}

function Field({
  label,
  children,
  colors,
}: {
  label: string;
  children: ReactNode;
  colors: HubColorScheme;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontWeight: "700", color: colors.foreground, fontSize: 14 }}>{label}</Text>
      {children}
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
  colors,
}: {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  colors: HubColorScheme;
}) {
  return (
    <View style={toggleStyles.row}>
      <Text style={{ flex: 1, color: colors.foreground, fontSize: 14, fontWeight: "600" }}>
        {label}
      </Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.foreground,
      fontSize: 15,
      backgroundColor: colors.cardBg,
    },
    textArea: {
      minHeight: 96,
      textAlignVertical: "top",
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.cardBg,
    },
    chipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    chipText: {
      color: colors.muted,
      fontWeight: "600",
      fontSize: 13,
    },
    chipTextActive: {
      color: colors.primary,
    },
    submitBtn: {
      marginTop: 8,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    submitText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 16,
    },
  });
}
