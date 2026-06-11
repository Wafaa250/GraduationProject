import { router, type Href } from "expo-router";
import { FolderKanban, MessagesSquare, Sparkles, Users } from "lucide-react-native";
import { useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { createCourse } from "@/api/doctorCoursesApi";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import { DoctorStackHeader } from "@/components/doctor/ui/DoctorStackHeader";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { formatAcademicYear, getStartYearOptions } from "@/lib/academicYear";
import { doctorCoursePath, DOCTOR_ROUTES } from "@/lib/doctorRoutes";

const SEMESTERS = ["Fall", "Spring", "Summer"] as const;

const TOGGLE_OPTIONS = [
  {
    key: "projects" as const,
    icon: FolderKanban,
    title: "Allow Course Projects",
    description:
      "Enable structured project workspaces so students can build, submit, and iterate together.",
  },
  {
    key: "teams" as const,
    icon: Users,
    title: "Allow Team Formation",
    description:
      "Let students form teams with shared goals, roles, and collaborative milestones.",
  },
  {
    key: "ai" as const,
    icon: Sparkles,
    title: "Allow AI Team Suggestions",
    description:
      "Use AI to match students by skills, interests, and availability for stronger teams.",
  },
  {
    key: "collab" as const,
    icon: MessagesSquare,
    title: "Allow Student Collaboration",
    description:
      "Open discussions, shared notes, and peer feedback inside the course workspace.",
  },
];

type ToggleKey = (typeof TOGGLE_OPTIONS)[number]["key"];

export default function DoctorCreateCourseScreen() {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const yearOptions = useMemo(() => getStartYearOptions(), []);

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [semester, setSemester] = useState("");
  const [startYear, setStartYear] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [config, setConfig] = useState<Record<ToggleKey, boolean>>({
    projects: true,
    teams: true,
    ai: true,
    collab: true,
  });

  const academicYear = startYear != null ? formatAcademicYear(startYear) : "";
  const enabledCount = Object.values(config).filter(Boolean).length;

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
        config.ai && config.teams ? ("doctor" as const) : ("student" as const);
      const created = await createCourse({
        name: name.trim(),
        code: code.trim(),
        semester,
        academicYear,
        description: description.trim() || undefined,
        allowCourseProjects: config.projects,
        allowTeamFormation: config.teams,
        allowAiTeamSuggestions: config.ai,
        allowStudentCollaboration: config.collab,
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
      <DoctorStackHeader
        title="Create Course"
        subtitle="Set up a new teaching workspace"
        fallbackHref={DOCTOR_ROUTES.courses}
        variant="compact"
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.horizontalPadding,
          paddingBottom: DOCTOR_SPACE.xxxl + 80,
          gap: DOCTOR_SPACE.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.lead, { fontSize: layout.scale(14) }]}>
          Create a new course workspace where students, projects, teams, and course activities will
          be managed.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Course Information</Text>
          <Field label="Course Name" hint="Use the full official name of the course.">
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Advanced Software Engineering"
              placeholderTextColor={colors.muted}
            />
          </Field>
          <Field label="Course Code" hint="Official faculty identifier.">
            <TextInput
              style={[styles.input, styles.mono]}
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase())}
              placeholder="CSE-401"
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
            />
          </Field>
          <Field label="Semester">
            <View style={styles.segmentRow}>
              {SEMESTERS.map((s) => (
                <Pressable
                  key={s}
                  style={[styles.segment, semester === s && styles.segmentActive]}
                  onPress={() => setSemester(s)}
                >
                  <Text style={[styles.segmentText, semester === s && styles.segmentTextActive]}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Field>
          <Field
            label="Academic Year"
            hint="Choose the starting year — the full academic year is generated automatically."
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearScroll}>
              <View style={styles.yearRow}>
                {yearOptions.map((year) => {
                  const selected = startYear === year;
                  return (
                    <Pressable
                      key={year}
                      style={[styles.yearChip, selected && styles.yearChipActive]}
                      onPress={() => setStartYear(year)}
                    >
                      <Text style={[styles.yearChipText, selected && styles.yearChipTextActive]}>
                        {formatAcademicYear(year)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </Field>
          <Field label="Description" hint={`${description.length}/600`}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={(v) => setDescription(v.slice(0, 600))}
              placeholder="Briefly describe the course goals and collaborative spirit…"
              placeholderTextColor={colors.muted}
              multiline
              maxLength={600}
            />
          </Field>
        </View>

        <View style={styles.card}>
          <View style={styles.configHeader}>
            <Text style={styles.cardTitle}>Course Configuration</Text>
            <Text style={styles.configBadge}>{enabledCount}/4 enabled</Text>
          </View>
          {TOGGLE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = config[opt.key];
            return (
              <Pressable
                key={opt.key}
                style={[styles.toggleCard, active && styles.toggleCardActive]}
                onPress={() => setConfig((c) => ({ ...c, [opt.key]: !c[opt.key] }))}
              >
                <View style={[styles.toggleIcon, active && styles.toggleIconActive]}>
                  <Icon size={18} color={active ? "#FFFFFF" : colors.muted} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.toggleTitleRow}>
                    <Text style={styles.toggleTitle}>{opt.title}</Text>
                    <Switch
                      value={active}
                      onValueChange={(v) => setConfig((c) => ({ ...c, [opt.key]: v }))}
                      trackColor={{ true: colors.primary, false: colors.border }}
                    />
                  </View>
                  <Text style={styles.toggleDesc}>{opt.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Course Summary</Text>
          <SummaryRow label="Course Name" value={name || "Untitled course"} />
          <SummaryRow label="Course Code" value={code || "COURSE-CODE"} mono />
          <SummaryRow label="Semester" value={semester || "Not selected"} />
          <SummaryRow label="Academic Year" value={academicYear || "Not selected"} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingHorizontal: layout.horizontalPadding }]}>
        <Pressable
          style={styles.cancelBtn}
          disabled={saving}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.createBtn, saving && styles.createBtnDisabled]}
          disabled={saving}
          onPress={() => void handleCreate()}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Sparkles size={16} color="#FFFFFF" />
              <Text style={styles.createBtnText}>Create Course</Text>
            </>
          )}
        </Pressable>
      </View>
    </DoctorScreen>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function SummaryRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, mono && styles.mono]}>{value}</Text>
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    lead: {
      color: colors.muted,
      lineHeight: 21,
      fontWeight: "500",
      paddingTop: DOCTOR_SPACE.sm,
    },
    card: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DOCTOR_RADIUS.lg,
      backgroundColor: colors.cardBg,
      padding: DOCTOR_SPACE.lg,
      gap: DOCTOR_SPACE.md,
    },
    cardTitle: {
      fontWeight: "800",
      fontSize: 16,
      color: colors.foreground,
    },
    field: {
      gap: DOCTOR_SPACE.xs,
    },
    label: {
      fontWeight: "700",
      fontSize: 13,
      color: colors.foreground,
    },
    hint: {
      fontSize: 12,
      color: colors.muted,
      lineHeight: 17,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DOCTOR_RADIUS.md,
      backgroundColor: colors.background,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.foreground,
    },
    textArea: {
      minHeight: 110,
      textAlignVertical: "top",
    },
    mono: {
      fontFamily: "monospace",
      letterSpacing: 0.5,
    },
    segmentRow: {
      flexDirection: "row",
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DOCTOR_RADIUS.md,
      padding: 4,
      backgroundColor: colors.background,
    },
    segment: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: DOCTOR_RADIUS.sm,
    },
    segmentActive: {
      backgroundColor: colors.cardBg,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    segmentText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
    },
    segmentTextActive: {
      color: colors.foreground,
    },
    yearScroll: {
      marginHorizontal: -4,
    },
    yearRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 4,
    },
    yearChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DOCTOR_RADIUS.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.background,
    },
    yearChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    yearChipText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
    },
    yearChipTextActive: {
      color: colors.primary,
    },
    configHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    configBadge: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.muted,
    },
    toggleCard: {
      flexDirection: "row",
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DOCTOR_RADIUS.md,
      padding: DOCTOR_SPACE.md,
      backgroundColor: colors.background,
    },
    toggleCardActive: {
      borderColor: "rgba(99, 102, 241, 0.3)",
      backgroundColor: colors.primarySoft,
    },
    toggleIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.border,
    },
    toggleIconActive: {
      backgroundColor: colors.primary,
    },
    toggleTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    toggleTitle: {
      flex: 1,
      fontWeight: "700",
      fontSize: 14,
      color: colors.foreground,
    },
    toggleDesc: {
      marginTop: 4,
      fontSize: 12,
      lineHeight: 17,
      color: colors.muted,
    },
    summaryCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DOCTOR_RADIUS.lg,
      backgroundColor: colors.background,
      padding: DOCTOR_SPACE.lg,
      gap: DOCTOR_SPACE.sm,
    },
    summaryRow: {
      gap: 2,
      paddingVertical: 4,
    },
    summaryLabel: {
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      color: colors.muted,
      letterSpacing: 0.4,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.foreground,
    },
    footer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
      paddingVertical: DOCTOR_SPACE.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.cardBg,
    },
    cancelBtn: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: DOCTOR_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    cancelBtnText: {
      fontWeight: "700",
      fontSize: 14,
      color: colors.foreground,
    },
    createBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: DOCTOR_RADIUS.md,
      backgroundColor: colors.primary,
      minWidth: 150,
      justifyContent: "center",
    },
    createBtnDisabled: {
      opacity: 0.65,
    },
    createBtnText: {
      color: "#FFFFFF",
      fontWeight: "800",
      fontSize: 14,
    },
  });
}
