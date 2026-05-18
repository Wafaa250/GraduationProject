import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";

import {
  getCompanyProfile,
  parseApiErrorMessage,
  searchCompanyTalent,
} from "@/api/companyApi";
import { CompanyBackLink, CompanyScreenHeader } from "@/components/company/CompanyScreenHeader";
import { companyColors } from "@/constants/companyTheme";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  getInitialTalentSearchState,
  loadTalentSearchState,
  saveTalentSearchState,
} from "@/utils/companyTalentSearchStorage";

const ENGAGEMENT_TYPES = [
  "Internship",
  "Graduation project collaboration",
  "Part-time / freelance",
  "Hackathon or event",
  "Research assistant",
  "Full team for a product sprint",
] as const;

const MAJORS = [
  "Computer Science",
  "Software Engineering",
  "Artificial Intelligence",
  "Data Science",
  "Computer Engineering",
  "Electrical Engineering",
  "Information Technology",
];

export default function CompanyTalentSearchScreen() {
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const [companyName, setCompanyName] = useState("Company");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [preferredMajor, setPreferredMajor] = useState("");
  const [engagementType, setEngagementType] = useState("");
  const [duration, setDuration] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engagementOpen, setEngagementOpen] = useState(false);
  const [majorOpen, setMajorOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void (async () => {
      const initial = await getInitialTalentSearchState();
      setTitle(initial.title);
      setDescription(initial.description);
      setSkills(initial.skills);
      setPreferredMajor(initial.preferredMajor);
      setEngagementType(initial.engagementType);
      setDuration(initial.duration);
      setHydrated(true);
    })();
    getCompanyProfile()
      .then((p) => setCompanyName(p.companyName))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void (async () => {
      const prev = await loadTalentSearchState();
      await saveTalentSearchState({
        title,
        description,
        skills,
        preferredMajor,
        engagementType,
        duration,
        result: prev?.result ?? null,
      });
    })();
  }, [title, description, skills, preferredMajor, engagementType, duration, hydrated]);

  const addSkill = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (skills.some((s) => s.toLowerCase() === t.toLowerCase())) return;
    setSkills((prev) => [...prev, t]);
    setSkillInput("");
  };

  const submit = async () => {
    if (skills.length === 0) {
      setError("Add at least one required skill");
      return;
    }
    if (description.trim().length < 20) {
      setError("Please describe the role in more detail");
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const data = await searchCompanyTalent({
        title: title.trim(),
        description: description.trim(),
        requiredSkills: skills,
        preferredMajor: preferredMajor || undefined,
        engagementType: engagementType || undefined,
        duration: duration.trim() || undefined,
        saveRequest: true,
      });
      await saveTalentSearchState({
        title: title.trim(),
        description: description.trim(),
        skills,
        preferredMajor,
        engagementType,
        duration,
        result: data,
      });
      router.push("/company/talent-results" as Href);
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setSearching(false);
    }
  };

  const kav = Platform.OS === "ios" ? "padding" : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <CompanyScreenHeader title="AI Talent Search" subtitle={companyName} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={kav}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: layout.horizontalPadding,
            paddingBottom: Math.max(spacing.xxxl, insets.bottom + spacing.lg),
            paddingTop: spacing.md,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <CompanyBackLink label="Overview" onPress={() => router.back()} />
          <Text style={styles.lead}>
            Describe who you need. SkillSwap AI ranks students with clear explanations.
          </Text>

          <View style={styles.form}>
            <Field label="Role title *" value={title} onChangeText={setTitle} placeholder="e.g. React developer" />
            <Text style={styles.lbl}>What are you looking for? *</Text>
            <TextInput
              style={[styles.input, styles.area]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe responsibilities and project context…"
              placeholderTextColor="#94a3b8"
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.lbl}>Required skills *</Text>
            <View style={styles.chips}>
              {skills.map((s) => (
                <Pressable key={s} style={styles.chip} onPress={() => setSkills((p) => p.filter((x) => x !== s))}>
                  <Text style={styles.chipText}>{s} ×</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.input}
              value={skillInput}
              onChangeText={setSkillInput}
              onSubmitEditing={() => addSkill(skillInput)}
              onBlur={() => addSkill(skillInput)}
              placeholder="Type skill, press Enter"
              placeholderTextColor="#94a3b8"
              returnKeyType="done"
            />

            <Text style={styles.lbl}>Engagement type</Text>
            <Pressable style={styles.select} onPress={() => setEngagementOpen(true)}>
              <Text style={[styles.selectTxt, !engagementType && styles.ph]}>
                {engagementType || "Any / not specified"}
              </Text>
              <Text style={styles.chev}>▼</Text>
            </Pressable>

            <Text style={styles.lbl}>Preferred major</Text>
            <Pressable style={styles.select} onPress={() => setMajorOpen(true)}>
              <Text style={[styles.selectTxt, !preferredMajor && styles.ph]}>
                {preferredMajor || "All majors"}
              </Text>
              <Text style={styles.chev}>▼</Text>
            </Pressable>

            <Field
              label="Duration (optional)"
              value={duration}
              onChangeText={setDuration}
              placeholder="e.g. 3 months"
            />

            {error ? <Text style={styles.err}>{error}</Text> : null}

            <Pressable
              style={[styles.submit, searching && { opacity: 0.85 }]}
              onPress={() => void submit()}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitTxt}>✨ Get AI recommendations</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PickerModal
        visible={engagementOpen}
        title="Engagement type"
        options={["", ...ENGAGEMENT_TYPES]}
        labels={["Any / not specified", ...ENGAGEMENT_TYPES]}
        onPick={(v) => {
          setEngagementType(v);
          setEngagementOpen(false);
        }}
        onClose={() => setEngagementOpen(false)}
      />
      <PickerModal
        visible={majorOpen}
        title="Preferred major"
        options={["", ...MAJORS]}
        labels={["All majors", ...MAJORS]}
        onPick={(v) => {
          setPreferredMajor(v);
          setMajorOpen(false);
        }}
        onClose={() => setMajorOpen(false)}
      />
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.lbl}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
      />
    </View>
  );
}

function PickerModal({
  visible,
  title,
  options,
  labels,
  onPick,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  labels: string[];
  onPick: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalBg} onPress={onClose}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={{ maxHeight: 320 }}>
            {options.map((opt, i) => (
              <Pressable key={opt || "any"} style={styles.modalRow} onPress={() => onPick(opt)}>
                <Text style={styles.modalRowTxt}>{labels[i]}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseTxt}>Close</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: companyColors.bg },
  lead: { fontSize: 14, color: companyColors.muted, lineHeight: 20, marginBottom: spacing.lg },
  form: {
    backgroundColor: companyColors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: companyColors.border,
    padding: spacing.lg,
  },
  lbl: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: companyColors.text,
    backgroundColor: "#f8fafc",
    minHeight: 48,
    marginBottom: spacing.md,
  },
  area: { minHeight: 120, marginBottom: spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: {
    backgroundColor: companyColors.accentMuted,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: { fontSize: 12, fontWeight: "700", color: companyColors.accentDark },
  select: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    backgroundColor: "#f8fafc",
    marginBottom: spacing.md,
  },
  selectTxt: { flex: 1, fontSize: 15, color: companyColors.text, fontWeight: "600" },
  ph: { color: "#94a3b8", fontWeight: "500" },
  chev: { fontSize: 10, color: companyColors.muted },
  err: {
    color: "#dc2626",
    marginBottom: spacing.md,
    fontWeight: "600",
    backgroundColor: "#fef2f2",
    padding: 10,
    borderRadius: 10,
  },
  submit: {
    backgroundColor: companyColors.ai,
    minHeight: 52,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  submitTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 8,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: companyColors.text,
  },
  modalRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalRowTxt: { fontSize: 15, color: "#334155" },
  modalClose: { padding: 16, alignItems: "center" },
  modalCloseTxt: { color: companyColors.accent, fontWeight: "700" },
});
