import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  fetchStudentEditProfileSnapshot,
  normalizeSkillStringList,
  putStudentProfile,
} from "@/api/profileApi";
import {
  ALL_LANGUAGES,
  AVAILABILITY_OPTIONS,
  CUSTOM_SKILL_MAX_LENGTH,
  LOOKING_FOR_OPTIONS,
  customSelections,
  normalizeCustomSkill,
  poolsForFaculty,
} from "@/constants/editProfilePools";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getItem } from "@/utils/authStorage";

type SectionId = "basic" | "work" | "skills" | "links";

interface EditFormState {
  fullName: string;
  bio: string;
  availability: string;
  lookingFor: string;
  github: string;
  linkedin: string;
  portfolio: string;
  languages: string[];
  roles: string[];
  technicalSkills: string[];
  tools: string[];
  profilePicPreview: string | null;
}

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "basic", label: "👤 Basic" },
  { id: "work", label: "💼 Work" },
  { id: "skills", label: "⚡ Skills" },
  { id: "links", label: "🔗 Links" },
];

function previewUri(pic: string | null): string | null {
  if (!pic) return null;
  if (pic.startsWith("data:")) return pic;
  return resolveApiFileUrl(pic) ?? pic;
}

function initialsOf(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0] ?? ""}${p[p.length - 1][0] ?? ""}`.toUpperCase();
}

function parseSectionParam(v: string | string[] | undefined): SectionId {
  const raw = (Array.isArray(v) ? v[0] : v)?.trim().toLowerCase();
  if (raw === "work" || raw === "skills" || raw === "links" || raw === "basic") return raw;
  return "basic";
}

export default function EditProfilePage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { section: sectionParam } = useLocalSearchParams<{ section?: string | string[] }>();
  const { horizontalPadding, maxDashboardWidth, isTablet } = useResponsiveLayout();

  const [activeSection, setActiveSection] = useState<SectionId>(() => parseSectionParam(sectionParam));

  const [readOnlyAcademic, setReadOnlyAcademic] = useState({
    university: "",
    major: "",
    faculty: "",
    academicYear: "",
    gpa: "",
  });

  const [form, setForm] = useState<EditFormState>({
    fullName: "",
    bio: "",
    availability: "",
    lookingFor: "",
    github: "",
    linkedin: "",
    portfolio: "",
    languages: [],
    roles: [],
    technicalSkills: [],
    tools: [],
    profilePicPreview: null,
  });

  const [faculty, setFaculty] = useState<string>("");
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [customDraft, setCustomDraft] = useState({ roles: "", technicalSkills: "", tools: "" });

  const { rolesPool, techPool, toolsPool } = useMemo(
    () => poolsForFaculty(faculty, readOnlyAcademic.major),
    [faculty, readOnlyAcademic.major]
  );

  useEffect(() => {
    setActiveSection(parseSectionParam(sectionParam));
  }, [sectionParam]);

  const load = useCallback(async () => {
    setPageLoading(true);
    setLoadError(null);
    setSaveError(null);
    try {
      const token = ((await getItem("token")) ?? "").trim();
      if (!token) {
        router.replace("/login" as Href);
        return;
      }
      const snap = await fetchStudentEditProfileSnapshot();
      setFaculty(snap.faculty);
      setReadOnlyAcademic({
        university: snap.university,
        major: snap.major,
        faculty: snap.faculty,
        academicYear: snap.academicYear,
        gpa: snap.gpa,
      });
      setForm({
        fullName: snap.fullName,
        bio: snap.bio,
        availability: snap.availability,
        lookingFor: snap.lookingFor,
        github: snap.github,
        linkedin: snap.linkedin,
        portfolio: snap.portfolio,
        languages: snap.languages,
        roles: snap.roles,
        technicalSkills: snap.technicalSkills,
        tools: snap.tools,
        profilePicPreview: snap.profilePictureBase64,
      });
    } catch (e) {
      setLoadError(parseApiErrorMessage(e));
    } finally {
      setPageLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const setField = <K extends keyof EditFormState>(key: K, value: EditFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const toggleArr = (field: "roles" | "technicalSkills" | "tools" | "languages", val: string) => {
    setForm((f) => {
      const arr = f[field] as string[];
      const next = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
      return { ...f, [field]: next };
    });
    setSaved(false);
  };

  const addCustomSkill = (field: "roles" | "technicalSkills" | "tools") => {
    const v = normalizeCustomSkill(customDraft[field]);
    if (!v) return;
    setForm((f) => {
      const arr = f[field] as string[];
      if (arr.some((x) => x.toLowerCase() === v.toLowerCase())) return f;
      return { ...f, [field]: [...arr, v] };
    });
    setCustomDraft((d) => ({ ...d, [field]: "" }));
    setSaved(false);
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
      base64: true,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    if (a.base64) {
      const mime = a.mimeType ?? "image/jpeg";
      setField("profilePicPreview", `data:${mime};base64,${a.base64}`);
    } else if (a.uri) {
      setField("profilePicPreview", a.uri);
    }
    setSaved(false);
  };

  const handleSave = async () => {
    const name = form.fullName.trim();
    if (!name) {
      setSaveError("Full name is required.");
      return;
    }
    if (form.bio.length > 500) {
      setSaveError("Bio must be 500 characters or less.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const roles = normalizeSkillStringList(form.roles);
      const technicalSkills = normalizeSkillStringList(form.technicalSkills);
      const tools = normalizeSkillStringList(form.tools);
      const skills = [...new Set([...roles, ...technicalSkills, ...tools])];

      await putStudentProfile({
        fullName: name,
        bio: form.bio.trim(),
        availability: form.availability.trim(),
        lookingFor: form.lookingFor.trim(),
        github: form.github.trim(),
        linkedin: form.linkedin.trim(),
        portfolio: form.portfolio.trim(),
        languages: form.languages,
        roles,
        technicalSkills,
        tools,
        skills,
        profilePictureBase64: form.profilePicPreview,
      });
      setSaved(true);
      setTimeout(() => {
        router.replace("/ProfilePage" as Href);
      }, 900);
    } catch (err) {
      setSaveError(parseApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const pad = horizontalPadding;
  const maxW = maxDashboardWidth;
  const kav = Platform.OS === "ios" ? "padding" : undefined;

  if (pageLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.loadingWrap}>
          <View style={styles.loadingOrb}>
            <Ionicons name="save-outline" size={22} color="#fff" />
          </View>
          <Text style={styles.loadingText}>Loading your profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={[styles.navRow, { paddingHorizontal: pad }]}>
          <Pressable onPress={() => router.replace("/ProfilePage" as Href)} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={18} color="#64748b" />
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
        </View>
        <View style={[styles.loadingWrap, { paddingHorizontal: pad }]}>
          <Text style={styles.errText}>{loadError}</Text>
          <Pressable style={[styles.saveBtn, { marginTop: spacing.lg }]} onPress={() => void load()}>
            <Text style={styles.saveBtnText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const picUri = previewUri(form.profilePicPreview);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.blob1} pointerEvents="none" />
      <View style={styles.blob2} pointerEvents="none" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={kav}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + spacing.sm : 0}
      >
        <View style={[styles.navRow, { paddingHorizontal: pad }]}>
          <Pressable onPress={() => router.replace("/ProfilePage" as Href)} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={18} color="#64748b" />
            <Text style={styles.backBtnText}>Back to Profile</Text>
          </Pressable>
          <Text style={styles.navTitle}>Edit Profile</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={{
            paddingHorizontal: pad,
            paddingBottom: Math.max(spacing.xxxl, insets.bottom + 100),
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ maxWidth: maxW, width: "100%", alignSelf: "center" }}>
            <View style={[styles.avatarCard, isTablet && styles.avatarCardRow]}>
              <Pressable onPress={() => void pickImage()} style={styles.avatarWrap}>
                {picUri ? (
                  <Image source={{ uri: picUri }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>{initialsOf(form.fullName)}</Text>
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </Pressable>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.avatarHint}>Tap photo to change</Text>
                <Pressable onPress={() => void pickImage()} style={styles.changePicBtn}>
                  <Text style={styles.changePicBtnText}>Change photo</Text>
                </Pressable>
              </View>
            </View>

            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sectionTabs}
            >
              {SECTIONS.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => setActiveSection(s.id)}
                  style={[styles.sectionTab, activeSection === s.id && styles.sectionTabActive]}
                >
                  <Text style={[styles.sectionTabText, activeSection === s.id && styles.sectionTabTextActive]}>
                    {s.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {activeSection === "basic" ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Basic information</Text>
                <Text style={styles.cardSub}>Your name and personal summary</Text>

                <Text style={styles.label}>
                  Full name <Text style={styles.req}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={form.fullName}
                  onChangeText={(t) => setField("fullName", t)}
                  placeholder="Your full name"
                  placeholderTextColor="#94a3b8"
                />

                <Text style={styles.label}>Bio / About me</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={form.bio}
                  onChangeText={(t) => setField("bio", t)}
                  placeholder="Tell teammates about yourself…"
                  placeholderTextColor="#94a3b8"
                  multiline
                  textAlignVertical="top"
                  maxLength={500}
                />
                <Text style={styles.charCount}>{form.bio.length} / 500</Text>

                <View style={styles.readOnlyBox}>
                  <Text style={styles.readOnlyTitle}>Academic (from your account)</Text>
                  <Text style={styles.readOnlyNote}>
                    University, major, and related fields are returned by the API but are not updated through PUT
                    /api/profile on this server version. They stay as shown until changed via supported channels.
                  </Text>
                  <Text style={styles.readOnlyLine}>
                    <Text style={styles.readOnlyLabel}>University: </Text>
                    {readOnlyAcademic.university || "—"}
                  </Text>
                  <Text style={styles.readOnlyLine}>
                    <Text style={styles.readOnlyLabel}>Major: </Text>
                    {readOnlyAcademic.major || "—"}
                  </Text>
                  <Text style={styles.readOnlyLine}>
                    <Text style={styles.readOnlyLabel}>Faculty: </Text>
                    {readOnlyAcademic.faculty || "—"}
                  </Text>
                  <Text style={styles.readOnlyLine}>
                    <Text style={styles.readOnlyLabel}>Year: </Text>
                    {readOnlyAcademic.academicYear || "—"}
                  </Text>
                  <Text style={styles.readOnlyLine}>
                    <Text style={styles.readOnlyLabel}>GPA: </Text>
                    {readOnlyAcademic.gpa || "—"}
                  </Text>
                </View>

                <Text style={[styles.label, { marginTop: spacing.lg }]}>Languages</Text>
                <View style={styles.chipWrap}>
                  {ALL_LANGUAGES.map((lang) => {
                    const active = form.languages.includes(lang);
                    return (
                      <Pressable
                        key={lang}
                        onPress={() => toggleArr("languages", lang)}
                        style={[styles.chip, active && styles.chipIndigo]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextIndigo]}>
                          {active ? "✓ " : ""}
                          {lang}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {activeSection === "work" ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Work style</Text>
                <Text style={styles.cardSub}>Help teammates understand how you work best</Text>

                <Text style={styles.label}>Weekly availability</Text>
                {AVAILABILITY_OPTIONS.map((a) => {
                  const active = form.availability === a;
                  return (
                    <Pressable
                      key={a}
                      onPress={() => setField("availability", a)}
                      style={[styles.radioRow, active && styles.radioRowActive]}
                    >
                      <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                        {active ? <View style={styles.radioInner} /> : null}
                      </View>
                      <Text style={[styles.radioLabel, active && styles.radioLabelActive]}>{a}</Text>
                    </Pressable>
                  );
                })}

                <Text style={[styles.label, { marginTop: spacing.lg }]}>Looking for</Text>
                <View style={styles.chipWrap}>
                  {LOOKING_FOR_OPTIONS.map((l) => {
                    const active = form.lookingFor === l;
                    return (
                      <Pressable
                        key={l}
                        onPress={() => setField("lookingFor", l)}
                        style={[styles.chip, active && styles.chipPurple]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextPurple]}>
                          {active ? "✓ " : ""}
                          {l}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {activeSection === "skills" ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Your Skills</Text>
                <Text style={styles.skillsCardSub}>Help the AI find the best team matches for you</Text>

                <View style={styles.skillHeadRow}>
                  <Text style={styles.skillHeadTitle}>Team roles</Text>
                  <View style={styles.skillsBadge}>
                    <Text style={styles.skillsBadgeText}>{`${form.roles.length} selected`}</Text>
                  </View>
                </View>
                <Text style={styles.skillHintWeb}>
                  How you usually contribute on projects (separate from your major)
                </Text>
                <View style={styles.chipWrap}>
                  {rolesPool.map((r) => {
                    const active = form.roles.includes(r);
                    return (
                      <Pressable
                        key={r}
                        onPress={() => toggleArr("roles", r)}
                        style={[styles.chip, active && styles.chipIndigo]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextIndigo]} numberOfLines={2}>
                          {active ? "✓ " : ""}
                          {r}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {customSelections(form.roles, rolesPool).map((r) => (
                    <Pressable
                      key={`custom-${r}`}
                      onPress={() => toggleArr("roles", r)}
                      style={[styles.chip, styles.chipIndigo]}
                    >
                      <Text style={[styles.chipText, styles.chipTextIndigo]} numberOfLines={2}>
                        ✓ {r}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.customAddBlock}>
                  <Text style={styles.customOtherHint}>
                    Other — not listed? Type and press Enter or Add (max {CUSTOM_SKILL_MAX_LENGTH} characters).
                  </Text>
                  <View style={styles.customOtherRow}>
                    <TextInput
                      style={styles.customOtherInputFlex}
                      value={customDraft.roles}
                      onChangeText={(t) =>
                        setCustomDraft((d) => ({ ...d, roles: t.slice(0, CUSTOM_SKILL_MAX_LENGTH) }))
                      }
                      placeholder="e.g. specific framework or method"
                      placeholderTextColor="#94a3b8"
                      onSubmitEditing={() => addCustomSkill("roles")}
                      returnKeyType="done"
                      maxLength={CUSTOM_SKILL_MAX_LENGTH}
                    />
                    <Pressable style={styles.btnAddCustom} onPress={() => addCustomSkill("roles")}>
                      <Text style={styles.btnAddCustomText}>Add</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={[styles.skillHeadRow, { marginTop: spacing.lg }]}>
                  <Text style={styles.skillHeadTitle}>Technical Skills</Text>
                  <View style={styles.skillsBadge}>
                    <Text style={styles.skillsBadgeText}>{`${form.technicalSkills.length} selected`}</Text>
                  </View>
                </View>
                <Text style={styles.skillHintWeb}>{"Select skills you're comfortable with"}</Text>
                <View style={styles.chipWrap}>
                  {techPool.map((s) => {
                    const active = form.technicalSkills.includes(s);
                    return (
                      <Pressable
                        key={s}
                        onPress={() => toggleArr("technicalSkills", s)}
                        style={[styles.chip, active && styles.chipPurple]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextPurple]} numberOfLines={2}>
                          {active ? "✓ " : ""}
                          {s}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {customSelections(form.technicalSkills, techPool).map((s) => (
                    <Pressable
                      key={`custom-${s}`}
                      onPress={() => toggleArr("technicalSkills", s)}
                      style={[styles.chip, styles.chipPurple]}
                    >
                      <Text style={[styles.chipText, styles.chipTextPurple]} numberOfLines={2}>
                        ✓ {s}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.customAddBlock}>
                  <Text style={styles.customOtherHint}>
                    Other — not listed? Type and press Enter or Add (max {CUSTOM_SKILL_MAX_LENGTH} characters).
                  </Text>
                  <View style={styles.customOtherRow}>
                    <TextInput
                      style={styles.customOtherInputFlex}
                      value={customDraft.technicalSkills}
                      onChangeText={(t) =>
                        setCustomDraft((d) => ({
                          ...d,
                          technicalSkills: t.slice(0, CUSTOM_SKILL_MAX_LENGTH),
                        }))
                      }
                      placeholder="e.g. specific framework or method"
                      placeholderTextColor="#94a3b8"
                      onSubmitEditing={() => addCustomSkill("technicalSkills")}
                      returnKeyType="done"
                      maxLength={CUSTOM_SKILL_MAX_LENGTH}
                    />
                    <Pressable style={styles.btnAddCustom} onPress={() => addCustomSkill("technicalSkills")}>
                      <Text style={styles.btnAddCustomText}>Add</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={[styles.skillHeadRow, { marginTop: spacing.lg }]}>
                  <Text style={styles.skillHeadTitle}>Technologies & Tools</Text>
                  <View style={styles.skillsBadge}>
                    <Text style={styles.skillsBadgeText}>{`${form.tools.length} selected`}</Text>
                  </View>
                </View>
                <Text style={styles.skillHintWeb}>Languages, frameworks, and tools you use</Text>
                <View style={styles.chipWrap}>
                  {toolsPool.map((t) => {
                    const active = form.tools.includes(t);
                    return (
                      <Pressable
                        key={t}
                        onPress={() => toggleArr("tools", t)}
                        style={[styles.chip, active && styles.chipTeal]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextTeal]} numberOfLines={2}>
                          {active ? "✓ " : ""}
                          {t}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {customSelections(form.tools, toolsPool).map((t) => (
                    <Pressable
                      key={`custom-${t}`}
                      onPress={() => toggleArr("tools", t)}
                      style={[styles.chip, styles.chipTeal]}
                    >
                      <Text style={[styles.chipText, styles.chipTextTeal]} numberOfLines={2}>
                        ✓ {t}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.customAddBlock}>
                  <Text style={styles.customOtherHint}>
                    Other — not listed? Type and press Enter or Add (max {CUSTOM_SKILL_MAX_LENGTH} characters).
                  </Text>
                  <View style={styles.customOtherRow}>
                    <TextInput
                      style={styles.customOtherInputFlex}
                      value={customDraft.tools}
                      onChangeText={(t) =>
                        setCustomDraft((d) => ({ ...d, tools: t.slice(0, CUSTOM_SKILL_MAX_LENGTH) }))
                      }
                      placeholder="e.g. specific framework or method"
                      placeholderTextColor="#94a3b8"
                      onSubmitEditing={() => addCustomSkill("tools")}
                      returnKeyType="done"
                      maxLength={CUSTOM_SKILL_MAX_LENGTH}
                    />
                    <Pressable style={styles.btnAddCustom} onPress={() => addCustomSkill("tools")}>
                      <Text style={styles.btnAddCustomText}>Add</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : null}

            {activeSection === "links" ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Links & profiles</Text>
                <Text style={styles.cardSub}>Connect your online presence</Text>

                <Text style={styles.label}>GitHub</Text>
                <View style={styles.inputIconRow}>
                  <Ionicons name="logo-github" size={16} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.inputPadded]}
                    value={form.github}
                    onChangeText={(t) => setField("github", t)}
                    placeholder="github.com/username"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                  />
                </View>

                <Text style={styles.label}>LinkedIn</Text>
                <View style={styles.inputIconRow}>
                  <Ionicons name="logo-linkedin" size={16} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.inputPadded]}
                    value={form.linkedin}
                    onChangeText={(t) => setField("linkedin", t)}
                    placeholder="linkedin.com/in/username"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                  />
                </View>

                <Text style={styles.label}>Portfolio / website</Text>
                <View style={styles.inputIconRow}>
                  <Ionicons name="globe-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.inputPadded]}
                    value={form.portfolio}
                    onChangeText={(t) => setField("portfolio", t)}
                    placeholder="yourwebsite.com"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ) : null}

            {saveError ? (
              <View style={styles.errBanner}>
                <Text style={styles.errText}>{saveError}</Text>
              </View>
            ) : null}

            <View style={styles.bottomBar}>
              <Pressable onPress={() => router.replace("/ProfilePage" as Href)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void handleSave()}
                disabled={isSaving}
                style={[styles.saveBtn, saved && styles.saveBtnDone, isSaving && styles.saveBtnDisabled]}
              >
                <Text style={styles.saveBtnText}>
                  {isSaving ? "Saving…" : saved ? "Saved!" : "Save changes"}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8f7ff" },
  flex: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  loadingOrb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  loadingText: { fontSize: 14, color: "#94a3b8", fontWeight: "600" },
  blob1: {
    position: "absolute",
    top: -120,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(99,102,241,0.08)",
    zIndex: 0,
  },
  blob2: {
    position: "absolute",
    bottom: -90,
    left: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(168,85,247,0.06)",
    zIndex: 0,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(99,102,241,0.12)",
    backgroundColor: "rgba(248,247,255,0.95)",
    zIndex: 2,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backBtnText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  navTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  avatarCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "#fff",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: spacing.lg,
    marginBottom: spacing.lg,
    zIndex: 1,
  },
  avatarCardRow: { alignItems: "flex-start" },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    backgroundColor: "#eef2ff",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366f1",
  },
  avatarFallbackText: { fontSize: 24, fontWeight: "800", color: "#fff" },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    left: 0,
    height: 28,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: { fontSize: 12, color: "#94a3b8", marginBottom: spacing.xs },
  changePicBtn: { alignSelf: "flex-start" },
  changePicBtnText: { fontSize: 12, fontWeight: "700", color: "#6366f1" },
  sectionTabs: { gap: spacing.sm, paddingBottom: spacing.md, flexDirection: "row" },
  sectionTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionTabActive: { backgroundColor: "#eef2ff", borderColor: "#c7d2fe" },
  sectionTabText: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  sectionTabTextActive: { color: "#4f46e5" },
  card: {
    backgroundColor: "#fff",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: spacing.lg,
    marginBottom: spacing.lg,
    zIndex: 1,
  },
  cardTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  cardSub: { fontSize: 13, color: "#94a3b8", marginBottom: spacing.lg },
  skillsCardSub: { fontSize: 13, color: "#64748b", marginBottom: spacing.lg, lineHeight: 18 },
  skillHeadRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  skillHeadTitle: { fontSize: 13, fontWeight: "700", color: "#374151" },
  skillsBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 10,
  },
  skillsBadgeText: { fontSize: 11, fontWeight: "700", color: "#6366f1" },
  skillHintWeb: { fontSize: 12, color: "#94a3b8", marginBottom: 10 },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: spacing.sm },
  req: { color: "#ef4444" },
  hint: { fontSize: 12, color: "#94a3b8", marginBottom: spacing.sm, marginTop: -4 },
  input: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: radius.md,
    padding: 12,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
    marginBottom: spacing.md,
  },
  textarea: { minHeight: 120, textAlignVertical: "top" },
  charCount: { fontSize: 11, color: "#94a3b8", alignSelf: "flex-end", marginTop: -spacing.sm, marginBottom: spacing.md },
  readOnlyBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: spacing.md,
  },
  readOnlyTitle: { fontSize: 12, fontWeight: "800", color: "#334155", marginBottom: 6 },
  readOnlyNote: { fontSize: 11, color: "#64748b", lineHeight: 16, marginBottom: spacing.sm },
  readOnlyLine: { fontSize: 13, color: "#0f172a", marginBottom: 4 },
  readOnlyLabel: { fontWeight: "700", color: "#64748b" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  customAddBlock: { marginTop: 12 },
  customOtherHint: { fontSize: 11, color: "#94a3b8", marginBottom: 8 },
  customOtherRow: { flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" },
  customOtherInputFlex: {
    flex: 1,
    minWidth: 160,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#1e293b",
    backgroundColor: "#fff",
  },
  btnAddCustom: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#c7d2fe",
    borderRadius: radius.md,
  },
  btnAddCustomText: { color: "#4f46e5", fontSize: 13, fontWeight: "600" },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  chipIndigo: { backgroundColor: "#eef2ff", borderColor: "#6366f1" },
  chipPurple: { backgroundColor: "#faf5ff", borderColor: "#a855f7" },
  chipTeal: { backgroundColor: "#f0fdfa", borderColor: "#14b8a6" },
  chipText: { fontSize: 12, fontWeight: "500", color: "#64748b", maxWidth: 280 },
  chipTextIndigo: { color: "#6366f1", fontWeight: "700" },
  chipTextPurple: { color: "#a855f7", fontWeight: "700" },
  chipTextTeal: { color: "#0d9488", fontWeight: "700" },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    marginBottom: spacing.sm,
  },
  radioRowActive: { backgroundColor: "#eef2ff", borderColor: "#c7d2fe" },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: { borderColor: "#6366f1" },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#6366f1" },
  radioLabel: { fontSize: 13, color: "#475569", flex: 1 },
  radioLabelActive: { color: "#6366f1", fontWeight: "600" },
  inputIconRow: { position: "relative", marginBottom: spacing.md },
  inputIcon: { position: "absolute", left: 12, top: 14, zIndex: 1 },
  inputPadded: { paddingLeft: 38, marginBottom: 0 },
  errBanner: {
    padding: spacing.md,
    backgroundColor: "#fef2f2",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: spacing.md,
  },
  errText: { color: "#b91c1c", fontWeight: "600", fontSize: 13 },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  cancelBtn: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: radius.md,
    backgroundColor: "#6366f1",
  },
  saveBtnDone: { backgroundColor: "#16a34a" },
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
