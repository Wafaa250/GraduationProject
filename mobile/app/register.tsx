import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";

import { spacing } from "@/constants/responsiveLayout";
import {
  CUSTOM_SKILL_MAX_LENGTH,
  customSelections,
  getSkillsPack,
  normalizeCustomSkill,
} from "@/constants/editProfilePools";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getApiBaseUrl } from "@/utils/apiBaseUrl";
import { AssociationRegisterStep } from "@/components/organization/AssociationRegisterStep";

type UserRole = "student" | "doctor" | "company" | "association" | null;
type FlowStep = 1 | 2;

type RoleCard = {
  id: Exclude<UserRole, null>;
  title: string;
  desc: string;
  icon: string;
  selectedBg: string;
  selectedBorder: string;
  iconBg: string;
};

const ROLES: RoleCard[] = [
  {
    id: "student",
    title: "Student",
    desc: "Looking for teammates & projects",
    icon: "🎓",
    selectedBg: "#eef2ff",
    selectedBorder: "#6366f1",
    iconBg: "#6366f1",
  },
  {
    id: "doctor",
    title: "Doctor / Supervisor",
    desc: "Seeking research collaborators",
    icon: "🩺",
    selectedBg: "#eff6ff",
    selectedBorder: "#3b82f6",
    iconBg: "#3b82f6",
  },
  {
    id: "company",
    title: "Company",
    desc: "Find talented students",
    icon: "🏢",
    selectedBg: "#ecfdf5",
    selectedBorder: "#10b981",
    iconBg: "#10b981",
  },
  {
    id: "association",
    title: "Student Association",
    desc: "Connect with student communities",
    icon: "👥",
    selectedBg: "#fffbeb",
    selectedBorder: "#f59e0b",
    iconBg: "#f59e0b",
  },
];

const UNIVERSITIES = ["An-Najah National University (NNU)"] as const;

const UNIVERSITY_FACULTIES: Record<string, string[]> = {
  "An-Najah National University (NNU)": [
    "Engineering and Information Technology",
    "Information Technology",
    "Science",
    "Medicine and Health Sciences",
    "Pharmacy",
    "Nursing",
    "Agriculture and Veterinary Medicine",
  ],
};

const MAJORS: Record<string, string[]> = {
  "Engineering and Information Technology": [
    "Computer Engineering",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Industrial Engineering",
    "Architectural Engineering",
    "Mechatronics Engineering",
    "Communication Engineering",
    "Energy and Renewable Energy Engineering",
  ],
  "Information Technology": [
    "Computer Science",
    "Information Technology",
    "Software Engineering",
    "Artificial Intelligence",
    "Data Science",
    "Cyber Security",
    "Network Systems",
  ],
  Science: [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Biotechnology",
    "Statistics",
    "Environmental Sciences",
  ],
  "Medicine and Health Sciences": [
    "Medicine",
    "Health Information Management",
    "Medical Imaging",
    "Clinical Nutrition",
    "Physical Therapy",
    "Anesthesia and Resuscitation Technology",
    "Medical Laboratory Sciences",
    "Optometry",
  ],
  Pharmacy: ["Pharmacy", "Doctor of Pharmacy (PharmD)"],
  Nursing: ["Nursing"],
  "Agriculture and Veterinary Medicine": [
    "Agriculture",
    "Plant Production and Protection",
    "Animal Production",
    "Food Science and Technology",
    "Veterinary Medicine",
  ],
};

const STEPS = [
  { id: "account", label: "Account", icon: "👤" },
  { id: "student", label: "Student Info", icon: "🎓" },
  { id: "academic", label: "Academic", icon: "📚" },
  { id: "skills", label: "Skills", icon: "⚡" },
] as const;

const ACADEMIC_YEARS = ["First Year", "Second Year", "Third Year", "Fourth Year", "Fifth Year"] as const;

interface FormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  profilePicPreview: string | null;
  studentId: string;
  university: string;
  faculty: string;
  major: string;
  academicYear: string;
  gpa: string;
  roles: string[];
  technicalSkills: string[];
  tools: string[];
}

function filterSkillItems(items: string[], query: string): string[] {
  const t = query.trim().toLowerCase();
  if (!t) return items;
  return items.filter((x) => x.toLowerCase().includes(t));
}

function parseRegisterError(data: unknown): string {
  if (data == null || typeof data !== "object") {
    return "Something went wrong. Please try again.";
  }
  const d = data as Record<string, unknown>;
  if (typeof d.message === "string" && d.message.trim()) return d.message;
  const errs = d.errors;
  if (Array.isArray(errs) && errs.length > 0 && typeof errs[0] === "string") return errs[0];
  if (errs && typeof errs === "object" && !Array.isArray(errs)) {
    const first = Object.values(errs as Record<string, unknown[]>)[0];
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
  }
  return "Something went wrong. Please try again.";
}

function StudentRegisterFullScreen({ onBackToRoles }: { onBackToRoles: () => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    profilePicPreview: null,
    studentId: "",
    university: "",
    faculty: "",
    major: "",
    academicYear: "",
    gpa: "",
    roles: [],
    technicalSkills: [],
    tools: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customDraft, setCustomDraft] = useState({ roles: "", technicalSkills: "", tools: "" });
  const [skillPanelOpen, setSkillPanelOpen] = useState({
    roles: true,
    technicalSkills: true,
    tools: true,
  });
  const [skillFilterQ, setSkillFilterQ] = useState({
    roles: "",
    technicalSkills: "",
    tools: "",
  });

  const layout = useResponsiveLayout();
  /** Align with web skills UX (StudentRegisterForm): narrow columns use accordion + summary */
  const skillsCompactLayout = layout.width < 560;
  const insets = useSafeAreaInsets();

  const [selectModal, setSelectModal] = useState<{
    kind: "university" | "faculty" | "major";
    options: string[];
    placeholder: string;
  } | null>(null);

  useEffect(() => {
    if (step !== 3) return;
    setSkillFilterQ({ roles: "", technicalSkills: "", tools: "" });
    setSkillPanelOpen({
      roles: true,
      technicalSkills: !skillsCompactLayout,
      tools: !skillsCompactLayout,
    });
  }, [step, skillsCompactLayout]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field as string]: "" }));
  };

  const toggle = (field: "roles" | "technicalSkills" | "tools", val: string) => {
    setForm((f) => {
      const arr = f[field] as string[];
      const next = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
      return { ...f, [field]: next };
    });
    setErrors((e) => ({ ...e, roles: "" }));
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
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const handleUniversity = (val: string) => {
    setForm((f) => ({
      ...f,
      university: val,
      faculty: "",
      major: "",
      roles: [],
      technicalSkills: [],
      tools: [],
    }));
    setCustomDraft({ roles: "", technicalSkills: "", tools: "" });
    setErrors((e) => ({ ...e, university: "", faculty: "", major: "" }));
  };

  const handleFaculty = (val: string) => {
    setForm((f) => ({
      ...f,
      faculty: val,
      major: "",
      roles: [],
      technicalSkills: [],
      tools: [],
    }));
    setCustomDraft({ roles: "", technicalSkills: "", tools: "" });
    setErrors((e) => ({ ...e, faculty: "", major: "" }));
  };

  const handleMajor = (val: string) => {
    setForm((f) => ({
      ...f,
      major: val,
      roles: [],
      technicalSkills: [],
      tools: [],
    }));
    setCustomDraft({ roles: "", technicalSkills: "", tools: "" });
    setErrors((e) => ({ ...e, major: "" }));
  };

  const availableFaculties = form.university ? UNIVERSITY_FACULTIES[form.university] ?? [] : [];
  const availableMajors = MAJORS[form.faculty] ?? [];
  const skillsData = getSkillsPack(form.faculty, form.major);

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!form.fullName.trim()) e.fullName = "Full name is required";
      if (!form.email.trim()) e.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Please enter a valid email";
      if (!form.password) e.password = "Password is required";
      else if (form.password.length < 8) e.password = "Password must be at least 8 characters";
      if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    }
    if (step === 1) {
      if (!form.studentId.trim()) e.studentId = "Student ID is required";
      if (!form.university) e.university = "Please select your university";
      if (!form.faculty) e.faculty = "Please select your faculty";
      if (!form.major) e.major = "Please select your major";
    }
    if (step === 2) {
      if (!form.academicYear) e.academicYear = "Please select your academic year";
      if (
        form.gpa.trim() &&
        (Number.isNaN(Number.parseFloat(form.gpa)) ||
          Number.parseFloat(form.gpa) < 0 ||
          Number.parseFloat(form.gpa) > 4)
      ) {
        e.gpa = "GPA must be between 0.0 and 4.0";
      }
    }
    if (step === 3) {
      if (form.roles.length === 0) e.roles = "Please select at least one team role";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validate()) setStep((s) => s + 1);
  };
  const back = () => setStep((s) => s - 1);

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
  };

  const submit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setApiError(null);
    const gpaNum = form.gpa.trim() === "" ? null : Number.parseFloat(form.gpa);
    const payload = {
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      confirmPassword: form.confirmPassword,
      profilePictureBase64: form.profilePicPreview,
      studentId: form.studentId,
      university: form.university,
      faculty: form.faculty,
      major: form.major,
      academicYear: form.academicYear,
      gpa: gpaNum !== null && Number.isFinite(gpaNum) ? gpaNum : null,
      roles: form.roles,
      technicalSkills: form.technicalSkills,
      tools: form.tools,
      generalSkills: form.roles,
      majorSkills: form.technicalSkills,
    };
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/register/student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(parseRegisterError(result));
      }
      router.replace("/login");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const passChecks = [
    form.password.length >= 8,
    /[A-Z]/.test(form.password),
    /[0-9]/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ];
  const passScore = passChecks.filter(Boolean).length;
  const passLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const passColors = ["", "#ef4444", "#f59e0b", "#10b981", "#6366f1"];
  const gpaVal = Number.parseFloat(form.gpa);
  const gpaPct = Math.min((gpaVal / 4) * 100, 100);
  const gpaColor = gpaVal >= 3.5 ? "#10b981" : gpaVal >= 2.5 ? "#f59e0b" : "#ef4444";
  const gpaLabel = gpaVal >= 3.5 ? "Excellent" : gpaVal >= 2.5 ? "Good" : "Needs Improvement";

  const topBlob = layout.blobDiameter(1);
  const bottomBlob = layout.blobDiameter(0.82);
  const kavBehavior = Platform.OS === "ios" ? "padding" : undefined;
  const modalListMax = Math.min(layout.height * 0.55, 420);

  return (
    <SafeAreaView style={st.page} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={st.keyboardFlex}
        behavior={kavBehavior}
        keyboardVerticalOffset={insets.top + spacing.sm}
      >
        <View
          style={[
            st.blobTop,
            {
              width: topBlob,
              height: topBlob,
              borderRadius: topBlob / 2,
              top: -topBlob * 0.32,
              right: -topBlob * 0.32,
            },
          ]}
          pointerEvents="none"
        />
        <View
          style={[
            st.blobBottom,
            {
              width: bottomBlob,
              height: bottomBlob,
              borderRadius: bottomBlob / 2,
              bottom: -bottomBlob * 0.32,
              left: -bottomBlob * 0.32,
            },
          ]}
          pointerEvents="none"
        />

        <ScrollView
          contentContainerStyle={[
            st.pageScroll,
            {
              paddingHorizontal: layout.horizontalPadding,
              paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.lg),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[st.wrap, { maxWidth: layout.maxFormWidth }]}>
            <View style={st.logoRow}>
              <View style={st.logoIconBox}>
                <Text style={st.logoGlyph}>▲</Text>
              </View>
              <Text style={st.logoTitle}>
                Skill<Text style={st.logoAccent}>Swap</Text>
              </Text>
            </View>

            <View style={st.changeRoleRow}>
              <Pressable onPress={onBackToRoles}>
                <Text style={st.changeRoleBtn}>← Change role</Text>
              </Pressable>
              <View style={st.roleBadge}>
                <Text style={st.roleBadgeText}>Student</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={st.stepperScroll}
              style={st.stepperScrollView}
            >
              <View style={st.stepper}>
                {STEPS.map((s, i) => (
                  <View key={s.id} style={st.stepperSegment}>
                    <View style={st.stepperInner}>
                      <View
                        style={[
                          st.stepDot,
                          i === step ? st.stepDotActive : i < step ? st.stepDotDone : st.stepDotIdle,
                        ]}
                      >
                        {i < step ? (
                          <Text style={st.stepCheck}>✓</Text>
                        ) : (
                          <Text
                            style={[
                              st.stepNum,
                              i === step ? st.stepNumOnActive : st.stepNumIdle,
                            ]}
                          >
                            {i + 1}
                          </Text>
                        )}
                      </View>
                      <Text
                        style={[
                          st.stepLabel,
                          i === step ? st.stepLabelActive : i < step ? st.stepLabelDone : st.stepLabelMuted,
                        ]}
                        numberOfLines={1}
                      >
                        {s.icon} {s.label}
                      </Text>
                    </View>
                    {i < STEPS.length - 1 ? (
                      <View style={[st.stepConnector, i < step ? st.stepConnectorDone : st.stepConnectorIdle]} />
                    ) : null}
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={st.card}>
              {step === 0 ? (
                <View>
                  <View style={st.sectionHeader}>
                    <Text style={st.sectionTitle}>Account Information</Text>
                    <Text style={st.sectionSub}>Create your SkillSwap account</Text>
                  </View>
                  <View style={st.picRow}>
                    <Pressable style={st.picCircle} onPress={pickImage}>
                      {form.profilePicPreview ? (
                        <Image
                          source={{ uri: form.profilePicPreview }}
                          style={st.picImage}
                          contentFit="cover"
                        />
                      ) : (
                        <Text style={st.picPlus}>+</Text>
                      )}
                    </Pressable>
                    <View style={st.picCol}>
                      <Text style={st.picLabel}>
                        Profile Picture <Text style={st.picOpt}>(Optional)</Text>
                      </Text>
                      <Pressable style={st.picBtn} onPress={pickImage}>
                        <Text style={st.picBtnText}>Upload Photo</Text>
                      </Pressable>
                    </View>
                  </View>
                  <FormField
                    label="Full Name"
                    required
                    placeholder="Mohammad Abdullah"
                    value={form.fullName}
                    onChangeText={(v) => setField("fullName", v)}
                    error={errors.fullName}
                  />
                  <FormField
                    label="Email"
                    required
                    placeholder="student@najah.edu"
                    value={form.email}
                    onChangeText={(v) => setField("email", v)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={errors.email}
                  />
                  <View style={[st.row2, layout.isCompact ? st.row2Stack : st.row2Row]}>
                    <View style={[st.row2Col, layout.isCompact && st.row2ColFull]}>
                      <FormField
                        label="Password"
                        required
                        placeholder="Min. 8 characters"
                        value={form.password}
                        onChangeText={(v) => setField("password", v)}
                        secureTextEntry={!showPass}
                        error={errors.password}
                        suffix={
                          <Pressable onPress={() => setShowPass((x) => !x)} hitSlop={8}>
                            <Text style={st.eye}>{showPass ? "🙈" : "👁️"}</Text>
                          </Pressable>
                        }
                      />
                    </View>
                    <View style={[st.row2Col, layout.isCompact && st.row2ColFull]}>
                      <FormField
                        label="Confirm Password"
                        required
                        placeholder="Re-enter password"
                        value={form.confirmPassword}
                        onChangeText={(v) => setField("confirmPassword", v)}
                        secureTextEntry={!showConfirm}
                        error={errors.confirmPassword}
                        suffix={
                          <Pressable onPress={() => setShowConfirm((x) => !x)} hitSlop={8}>
                            <Text style={st.eye}>{showConfirm ? "🙈" : "👁️"}</Text>
                          </Pressable>
                        }
                      />
                    </View>
                  </View>
                  {form.password ? (
                    <View style={st.passStrengthRow}>
                      {[0, 1, 2, 3].map((i) => (
                        <View
                          key={i}
                          style={[
                            st.passBarSeg,
                            { backgroundColor: i < passScore ? passColors[passScore] : "#e2e8f0" },
                          ]}
                        />
                      ))}
                      <Text style={[st.passLabel, { color: passColors[passScore] }]}>
                        {passLabels[passScore]}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {step === 1 ? (
                <View>
                  <View style={st.sectionHeader}>
                    <Text style={st.sectionTitle}>Student Information</Text>
                    <Text style={st.sectionSub}>Tell us about your university</Text>
                  </View>
                  <View style={[st.row2, layout.isCompact ? st.row2Stack : st.row2Row]}>
                    <View style={[st.row2Col, layout.isCompact && st.row2ColFull]}>
                      <FormField
                        label="Student ID"
                        required
                        placeholder="2021123456"
                        value={form.studentId}
                        onChangeText={(v) => setField("studentId", v)}
                        error={errors.studentId}
                      />
                    </View>
                    <View style={[st.row2Col, layout.isCompact && st.row2ColFull]}>
                      <SelectTrigger
                        label="University"
                        required
                        value={form.university}
                        placeholder="Select your university"
                        error={errors.university}
                        onPress={() =>
                          setSelectModal({
                            kind: "university",
                            options: [...UNIVERSITIES],
                            placeholder: "Select your university",
                          })
                        }
                      />
                    </View>
                  </View>
                  <SelectTrigger
                    label="Faculty / College"
                    required
                    value={form.faculty}
                    placeholder={form.university ? "Select your faculty" : "Select a university first"}
                    error={errors.faculty}
                    disabled={!form.university}
                    onPress={() =>
                      setSelectModal({
                        kind: "faculty",
                        options: availableFaculties,
                        placeholder: "Select your faculty",
                      })
                    }
                  />
                  <SelectTrigger
                    label="Major / Department"
                    required
                    value={form.major}
                    placeholder={form.faculty ? "Select your major" : "Select a faculty first"}
                    error={errors.major}
                    disabled={!form.faculty}
                    onPress={() =>
                      setSelectModal({
                        kind: "major",
                        options: availableMajors,
                        placeholder: "Select your major",
                      })
                    }
                  />
                </View>
              ) : null}

              {step === 2 ? (
                <View>
                  <View style={st.sectionHeader}>
                    <Text style={st.sectionTitle}>Academic Information</Text>
                    <Text style={st.sectionSub}>Your current academic standing</Text>
                  </View>
                  <View style={st.academicBlock}>
                    <Text style={st.label}>
                      Academic Year <Text style={st.req}>*</Text>
                    </Text>
                    <View style={st.yearGrid}>
                      {ACADEMIC_YEARS.map((y) => (
                        <Pressable
                          key={y}
                          style={[st.yearBtn, form.academicYear === y ? st.yearBtnOn : st.yearBtnOff]}
                          onPress={() => setField("academicYear", y)}
                        >
                          <Text style={[st.yearBtnText, form.academicYear === y && st.yearBtnTextOn]}>{y}</Text>
                        </Pressable>
                      ))}
                    </View>
                    {errors.academicYear ? <Text style={st.errorText}>{errors.academicYear}</Text> : null}
                  </View>
                  <View style={st.academicBlock}>
                    <Text style={st.label}>
                      GPA <Text style={st.gpaOpt}>(Optional)</Text>
                    </Text>
                    <TextInput
                      style={[st.input, errors.gpa ? st.inputErr : null]}
                      placeholder="e.g. 3.50"
                      placeholderTextColor="#94a3b8"
                      value={form.gpa}
                      onChangeText={(val) => {
                        if (val === "" || (/^\d*\.?\d*$/.test(val) && Number.parseFloat(val) <= 4)) {
                          setField("gpa", val);
                        }
                      }}
                      keyboardType="decimal-pad"
                    />
                    {form.gpa && !Number.isNaN(gpaVal) ? (
                      <View style={st.gpaMeterWrap}>
                        <View style={st.gpaTrack}>
                          <View style={[st.gpaFill, { width: `${gpaPct}%`, backgroundColor: gpaColor }]} />
                        </View>
                        <Text style={[st.gpaMeterLabel, { color: gpaColor }]}>{gpaLabel}</Text>
                      </View>
                    ) : null}
                    {errors.gpa ? <Text style={st.errorText}>{errors.gpa}</Text> : null}
                  </View>
                </View>
              ) : null}

              {step === 3 ? (
                <View>
                  <View style={st.sectionHeader}>
                    <Text style={st.sectionTitle}>Your Skills</Text>
                    <Text style={st.sectionSub}>Help the AI find the best team matches for you</Text>
                  </View>
                  {!skillsData ? (
                    <View style={st.warnBox}>
                      <Text style={st.warnText}>
                        ⚠️ Please complete your faculty and major in Step 2 to see skills matched to your program.
                      </Text>
                    </View>
                  ) : (
                    <>
                      {skillsCompactLayout ? (
                        <View style={st.skillsSummaryBar}>
                          <Text style={st.skillsSummaryTitle}>Selections</Text>
                          <Text style={st.skillsSummaryLine}>
                            Roles {form.roles.length} · Tech {form.technicalSkills.length} · Tools{" "}
                            {form.tools.length}
                          </Text>
                        </View>
                      ) : null}
                      <SkillGroup
                        title="Team roles"
                        badge={`${form.roles.length} selected`}
                        hint="How you usually contribute on projects (separate from your major)"
                        required
                        error={errors.roles}
                        collapsible={skillsCompactLayout}
                        expanded={skillPanelOpen.roles}
                        onToggle={() =>
                          setSkillPanelOpen((p) => ({ ...p, roles: !p.roles }))
                        }
                        filterValue={skillFilterQ.roles}
                        onFilterChange={(t) =>
                          setSkillFilterQ((q) => ({ ...q, roles: t }))
                        }
                      >
                        {(() => {
                          const pool = filterSkillItems(skillsData.roles, skillFilterQ.roles);
                          const customs = filterSkillItems(
                            customSelections(form.roles, skillsData.roles),
                            skillFilterQ.roles,
                          );
                          const empty = pool.length === 0 && customs.length === 0;
                          if (empty) {
                            return (
                              <Text style={st.skillEmptyFilter}>
                                No matches — clear the filter to see every option.
                              </Text>
                            );
                          }
                          return (
                            <View style={st.chipGrid}>
                              {pool.map((r) => (
                                <Chip
                                  key={r}
                                  label={r}
                                  active={form.roles.includes(r)}
                                  onPress={() => toggle("roles", r)}
                                  tone="indigo"
                                />
                              ))}
                              {customs.map((r) => (
                                <Chip
                                  key={`custom-${r}`}
                                  label={r}
                                  active
                                  onPress={() => toggle("roles", r)}
                                  tone="indigo"
                                />
                              ))}
                            </View>
                          );
                        })()}
                        <CustomSkillAddRow
                          value={customDraft.roles}
                          onChange={(t) =>
                            setCustomDraft((d) => ({ ...d, roles: t.slice(0, CUSTOM_SKILL_MAX_LENGTH) }))
                          }
                          onAdd={() => addCustomSkill("roles")}
                          maxLen={CUSTOM_SKILL_MAX_LENGTH}
                        />
                      </SkillGroup>
                      <SkillGroup
                        title="Technical Skills"
                        badge={`${form.technicalSkills.length} selected`}
                        hint="Select skills you're comfortable with"
                        collapsible={skillsCompactLayout}
                        expanded={skillPanelOpen.technicalSkills}
                        onToggle={() =>
                          setSkillPanelOpen((p) => ({
                            ...p,
                            technicalSkills: !p.technicalSkills,
                          }))
                        }
                        filterValue={skillFilterQ.technicalSkills}
                        onFilterChange={(t) =>
                          setSkillFilterQ((q) => ({ ...q, technicalSkills: t }))
                        }
                      >
                        {(() => {
                          const pool = filterSkillItems(
                            skillsData.technicalSkills,
                            skillFilterQ.technicalSkills,
                          );
                          const customs = filterSkillItems(
                            customSelections(form.technicalSkills, skillsData.technicalSkills),
                            skillFilterQ.technicalSkills,
                          );
                          const empty = pool.length === 0 && customs.length === 0;
                          if (empty) {
                            return (
                              <Text style={st.skillEmptyFilter}>
                                No matches — clear the filter to see every option.
                              </Text>
                            );
                          }
                          return (
                            <View style={st.chipGrid}>
                              {pool.map((s) => (
                                <Chip
                                  key={s}
                                  label={s}
                                  active={form.technicalSkills.includes(s)}
                                  onPress={() => toggle("technicalSkills", s)}
                                  tone="purple"
                                />
                              ))}
                              {customs.map((s) => (
                                <Chip
                                  key={`custom-${s}`}
                                  label={s}
                                  active
                                  onPress={() => toggle("technicalSkills", s)}
                                  tone="purple"
                                />
                              ))}
                            </View>
                          );
                        })()}
                        <CustomSkillAddRow
                          value={customDraft.technicalSkills}
                          onChange={(t) =>
                            setCustomDraft((d) => ({
                              ...d,
                              technicalSkills: t.slice(0, CUSTOM_SKILL_MAX_LENGTH),
                            }))
                          }
                          onAdd={() => addCustomSkill("technicalSkills")}
                          maxLen={CUSTOM_SKILL_MAX_LENGTH}
                        />
                      </SkillGroup>
                      <SkillGroup
                        title="Technologies & Tools"
                        badge={`${form.tools.length} selected`}
                        hint="Languages, frameworks, and tools you use"
                        collapsible={skillsCompactLayout}
                        expanded={skillPanelOpen.tools}
                        onToggle={() =>
                          setSkillPanelOpen((p) => ({ ...p, tools: !p.tools }))
                        }
                        filterValue={skillFilterQ.tools}
                        onFilterChange={(t) =>
                          setSkillFilterQ((q) => ({ ...q, tools: t }))
                        }
                      >
                        {(() => {
                          const pool = filterSkillItems(skillsData.tools, skillFilterQ.tools);
                          const customs = filterSkillItems(
                            customSelections(form.tools, skillsData.tools),
                            skillFilterQ.tools,
                          );
                          const empty = pool.length === 0 && customs.length === 0;
                          if (empty) {
                            return (
                              <Text style={st.skillEmptyFilter}>
                                No matches — clear the filter to see every option.
                              </Text>
                            );
                          }
                          return (
                            <View style={st.chipGrid}>
                              {pool.map((t) => (
                                <Chip
                                  key={t}
                                  label={t}
                                  active={form.tools.includes(t)}
                                  onPress={() => toggle("tools", t)}
                                  tone="teal"
                                />
                              ))}
                              {customs.map((t) => (
                                <Chip
                                  key={`custom-${t}`}
                                  label={t}
                                  active
                                  onPress={() => toggle("tools", t)}
                                  tone="teal"
                                />
                              ))}
                            </View>
                          );
                        })()}
                        <CustomSkillAddRow
                          value={customDraft.tools}
                          onChange={(t) =>
                            setCustomDraft((d) => ({ ...d, tools: t.slice(0, CUSTOM_SKILL_MAX_LENGTH) }))
                          }
                          onAdd={() => addCustomSkill("tools")}
                          maxLen={CUSTOM_SKILL_MAX_LENGTH}
                        />
                      </SkillGroup>
                    </>
                  )}
                </View>
              ) : null}

              {apiError ? (
                <View style={st.apiErrBox}>
                  <Text style={st.apiErrText}>❌ {apiError}</Text>
                </View>
              ) : null}

              <View style={st.navRow}>
                {step > 0 ? (
                  <Pressable style={st.btnBack} onPress={back}>
                    <Text style={st.btnBackText}>← Back</Text>
                  </Pressable>
                ) : (
                  <View style={st.navSpacer} />
                )}
                <View style={[st.navRight, layout.isCompact && st.navRightStack]}>
                  <Text style={st.stepFraction}>
                    {step + 1} / {STEPS.length}
                  </Text>
                  {step < STEPS.length - 1 ? (
                    <Pressable
                      style={[st.btnPrimary, layout.isCompact && st.btnPrimaryWide]}
                      onPress={next}
                    >
                      <Text style={st.btnPrimaryText}>Continue →</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={[
                        st.btnPrimary,
                        layout.isCompact && st.btnPrimaryWide,
                        isLoading && st.btnPrimaryDisabled,
                      ]}
                      onPress={submit}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <View style={st.loadingRow}>
                          <ActivityIndicator color="#fff" size="small" />
                          <Text style={st.btnPrimaryText}>⏳ Creating...</Text>
                        </View>
                      ) : (
                        <Text style={st.btnPrimaryText}>✦ Create Account</Text>
                      )}
                    </Pressable>
                  )}
                </View>
              </View>
            </View>

            <Text style={st.footerTag}>SkillSwap · Academic Collaboration Platform</Text>
          </View>
        </ScrollView>

        <Modal visible={selectModal != null} transparent animationType="fade">
          <Pressable style={st.modalOverlay} onPress={() => setSelectModal(null)}>
            <Pressable style={[st.modalCard, { maxHeight: layout.height * 0.78 }]} onPress={(e) => e.stopPropagation()}>
              <Text style={st.modalTitle}>{selectModal?.placeholder}</Text>
              <FlatList
                data={selectModal?.options ?? []}
                keyExtractor={(item) => item}
                style={[st.modalList, { maxHeight: modalListMax }]}
                renderItem={({ item }) => (
                  <Pressable
                    style={st.modalRow}
                    onPress={() => {
                      if (!selectModal) return;
                      if (selectModal.kind === "university") handleUniversity(item);
                      else if (selectModal.kind === "faculty") handleFaculty(item);
                      else handleMajor(item);
                      setSelectModal(null);
                    }}
                  >
                    <Text style={st.modalRowText}>{item}</Text>
                  </Pressable>
                )}
              />
              <Pressable style={st.modalCancel} onPress={() => setSelectModal(null)}>
                <Text style={st.modalCancelText}>Cancel</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormField({
  label,
  required,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  suffix,
}: {
  label: string;
  required?: boolean;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "decimal-pad";
  autoCapitalize?: "none" | "sentences";
  suffix?: ReactNode;
}) {
  return (
    <View style={st.fieldMb}>
      <Text style={st.label}>
        {label}
        {required ? <Text style={st.req}> *</Text> : null}
      </Text>
      {suffix ? (
        <View style={[st.inputShell, error ? st.inputShellErr : null]}>
          <TextInput
            style={st.inputInner}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
          />
          <View style={st.suffixInline}>{suffix}</View>
        </View>
      ) : (
        <TextInput
          style={[st.input, error ? st.inputErr : null]}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      )}
      {error ? <Text style={st.errorText}>{error}</Text> : null}
    </View>
  );
}

function SelectTrigger({
  label,
  required,
  value,
  placeholder,
  error,
  disabled,
  onPress,
}: {
  label: string;
  required?: boolean;
  value: string;
  placeholder: string;
  error?: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <View style={st.fieldMb}>
      <Text style={st.label}>
        {label}
        {required ? <Text style={st.req}> *</Text> : null}
      </Text>
      <Pressable
        onPress={disabled ? undefined : onPress}
        style={[st.selectBox, error ? st.inputErr : null, disabled ? st.selectDisabled : null]}
      >
        <Text style={[st.selectText, !value && st.selectPlaceholder]}>
          {value || placeholder}
        </Text>
        <Text style={st.selectChevron}>▼</Text>
      </Pressable>
      {error ? <Text style={st.errorText}>{error}</Text> : null}
    </View>
  );
}

function CustomSkillAddRow({
  value,
  onChange,
  onAdd,
  maxLen,
}: {
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  maxLen: number;
}) {
  return (
    <View style={st.customAddBlock}>
      <Text style={st.customOtherHint}>
        Other — not listed? Type and press Enter or Add (max {maxLen} characters).
      </Text>
      <View style={st.customOtherRow}>
        <TextInput
          style={st.customOtherInputFlex}
          value={value}
          maxLength={maxLen}
          onChangeText={onChange}
          placeholder="e.g. specific framework or method"
          placeholderTextColor="#94a3b8"
          onSubmitEditing={onAdd}
          returnKeyType="done"
        />
        <Pressable style={st.btnAddCustom} onPress={onAdd}>
          <Text style={st.btnAddCustomText}>Add</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SkillGroup({
  title,
  badge,
  hint,
  required,
  error,
  children,
  collapsible = false,
  expanded = true,
  onToggle,
  filterValue = "",
  onFilterChange,
}: {
  title: string;
  badge: string;
  hint: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  filterValue?: string;
  onFilterChange?: (v: string) => void;
}) {
  const showBody = !collapsible || expanded;
  const headRow = (
    <View style={st.skillHead}>
      <View style={st.skillHeadLeft}>
        <Text style={st.skillTitle}>
          {title}
          {required ? <Text style={st.req}> *</Text> : null}
        </Text>
        <View style={st.badge}>
          <Text style={st.badgeText}>{badge}</Text>
        </View>
      </View>
      {collapsible ? (
        <Text style={st.skillCollapseChev}>{expanded ? "▲" : "▼"}</Text>
      ) : null}
    </View>
  );

  return (
    <View style={st.skillGroup}>
      {collapsible ? (
        <Pressable
          onPress={onToggle}
          style={({ pressed }) => [st.skillSectionHeadBtn, pressed && st.skillSectionHeadBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel={`${title}, ${expanded ? "expanded" : "collapsed"}`}
        >
          {headRow}
        </Pressable>
      ) : (
        <View style={st.skillHeadStaticWrap}>{headRow}</View>
      )}
      {collapsible && !expanded ? (
        <Text style={st.skillCollapsedHint}>
          Tap the header to open — every option stays available.
        </Text>
      ) : null}
      {showBody ? (
        <>
          <Text style={st.skillHint}>{hint}</Text>
          {onFilterChange ? (
            <TextInput
              style={st.skillFilterInput}
              value={filterValue}
              onChangeText={onFilterChange}
              placeholder="Filter this list…"
              placeholderTextColor="#94a3b8"
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          ) : null}
          {children}
        </>
      ) : null}
      {error ? <Text style={st.skillErr}>{error}</Text> : null}
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
  tone,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  tone: "indigo" | "purple" | "teal";
}) {
  const c =
    tone === "indigo"
      ? { bg: "#eef2ff", border: "#6366f1", text: "#6366f1" }
      : tone === "purple"
        ? { bg: "#faf5ff", border: "#a855f7", text: "#a855f7" }
        : { bg: "#f0fdfa", border: "#14b8a6", text: "#0d9488" };
  return (
    <Pressable
      onPress={onPress}
      style={[
        st.chip,
        {
          borderColor: active ? c.border : "#e2e8f0",
          backgroundColor: active ? c.bg : "#f8fafc",
          maxWidth: "100%",
        },
      ]}
    >
      {active ? <Text style={st.chipCheck}>✓ </Text> : null}
      <Text style={[st.chipLabel, { color: active ? c.text : "#64748b", fontWeight: active ? "700" : "500" }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function DoctorRegisterStep({ onBack }: { onBack: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [university, setUniversity] = useState("");
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [bio, setBio] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Min. 8 characters";
    if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    if (!university.trim()) e.university = "Please select university";
    if (!faculty.trim()) e.faculty = "Please select faculty";
    if (!department.trim()) e.department = "Department is required";
    if (!specialization.trim()) e.specialization = "Please select specialization";
    setFieldErrors(e);
    if (Object.keys(e).length > 0) return;

    const payload = {
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      confirmPassword,
      university: university.trim(),
      faculty: faculty.trim(),
      department: department.trim(),
      specialization: specialization.trim(),
      bio: bio.trim() || "",
      profilePictureBase64: null as string | null,
    };

    setSubmitting(true);
    setApiError(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/register/doctor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(parseRegisterError(result));
      }
      router.replace("/login");
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={roleStyles.formWrap}>
      <Text style={roleStyles.formTitle}>Account Information</Text>
      <Text style={roleStyles.formSubtitle}>Create your SkillSwap doctor account</Text>
      <DoctorField label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Dr. Mohammad Khalil" error={fieldErrors.fullName} editable={!submitting} />
      <DoctorField label="Email" value={email} onChangeText={setEmail} placeholder="doctor@najah.edu" keyboardType="email-address" autoCapitalize="none" error={fieldErrors.email} editable={!submitting} />
      <DoctorField label="Password" value={password} onChangeText={setPassword} placeholder="Min. 8 characters" secureTextEntry error={fieldErrors.password} editable={!submitting} />
      <DoctorField label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" secureTextEntry error={fieldErrors.confirmPassword} editable={!submitting} />
      <DoctorField label="University" value={university} onChangeText={setUniversity} placeholder="Select your university" error={fieldErrors.university} editable={!submitting} />
      <DoctorField label="Faculty / College" value={faculty} onChangeText={setFaculty} placeholder="Select your faculty" error={fieldErrors.faculty} editable={!submitting} />
      <DoctorField label="Department" value={department} onChangeText={setDepartment} placeholder="e.g. Computer Engineering" error={fieldErrors.department} editable={!submitting} />
      <DoctorField label="Specialization" value={specialization} onChangeText={setSpecialization} placeholder="Select your specialization" error={fieldErrors.specialization} editable={!submitting} />
      <DoctorField label="Bio (optional)" value={bio} onChangeText={setBio} placeholder="Brief description…" multiline error={fieldErrors.bio} editable={!submitting} />
      {apiError ? <Text style={roleStyles.apiError}>❌ {apiError}</Text> : null}
      <View style={roleStyles.formActions}>
        <Pressable style={roleStyles.backButton} onPress={onBack} disabled={submitting}>
          <Text style={roleStyles.backButtonText}>Back</Text>
        </Pressable>
        <Pressable style={[roleStyles.primaryBtn, submitting && roleStyles.primaryBtnDis]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <View style={roleStyles.loadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={roleStyles.primaryBtnText}>Creating…</Text>
            </View>
          ) : (
            <Text style={roleStyles.primaryBtnText}>Create Account</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function DoctorField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  editable,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  error?: string;
  editable?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences";
  multiline?: boolean;
}) {
  return (
    <View style={roleStyles.fieldGroup}>
      <Text style={roleStyles.fieldLabel}>{label}</Text>
      <TextInput
        style={[roleStyles.fieldInput, error ? roleStyles.fieldInputErr : null, multiline ? roleStyles.fieldMulti : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        editable={editable}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
      />
      {error ? <Text style={roleStyles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export default function RegisterScreen() {
  const [flowStep, setFlowStep] = useState<FlowStep>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  const selectedRoleData = useMemo(
    () => ROLES.find((role) => role.id === selectedRole),
    [selectedRole]
  );

  if (flowStep === 2 && selectedRole === "student") {
    return <StudentRegisterFullScreen onBackToRoles={() => setFlowStep(1)} />;
  }

  if (flowStep === 2 && selectedRole === "association") {
    return <AssociationRegisterStep onBack={() => setFlowStep(1)} />;
  }

  const handleNext = () => {
    if (!selectedRole) return;
    setFlowStep(2);
  };

  const handleBack = () => {
    setFlowStep(1);
  };

  const topBlob = layout.blobDiameter(0.95);
  const bottomBlob = layout.blobDiameter(0.78);
  const kavBehavior = Platform.OS === "ios" ? "padding" : undefined;

  return (
    <SafeAreaView style={roleStyles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={roleStyles.keyboardView}
        behavior={kavBehavior}
        keyboardVerticalOffset={insets.top + spacing.sm}
      >
        <View
          style={[
            roleStyles.bgBlobTop,
            {
              width: topBlob,
              height: topBlob,
              borderRadius: topBlob / 2,
              top: -topBlob * 0.22,
              right: -topBlob * 0.22,
            },
          ]}
        />
        <View
          style={[
            roleStyles.bgBlobBottom,
            {
              width: bottomBlob,
              height: bottomBlob,
              borderRadius: bottomBlob / 2,
              bottom: -bottomBlob * 0.22,
              left: -bottomBlob * 0.22,
            },
          ]}
        />
        <ScrollView
          contentContainerStyle={[
            roleStyles.scrollContent,
            {
              paddingHorizontal: layout.horizontalPadding,
              paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.lg),
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[roleStyles.cardWrap, { maxWidth: layout.maxFormWidth }]}>
            <View style={roleStyles.card}>
              <View style={roleStyles.topGradientBar} />
              <View style={roleStyles.cardContent}>
                <View style={roleStyles.logoRow}>
                  <View style={roleStyles.logoIcon}>
                    <Text style={roleStyles.logoIconText}>▲</Text>
                  </View>
                  <Text style={roleStyles.logoText}>
                    Skill<Text style={roleStyles.logoAccent}>Swap</Text>
                  </Text>
                </View>
                <View style={roleStyles.stepperRow}>
                  {[1, 2].map((s) => {
                    const isActive = flowStep === s;
                    const isDone = flowStep > s;
                    return (
                      <View key={s} style={roleStyles.stepperItem}>
                        <View style={[roleStyles.stepDot, (isActive || isDone) && roleStyles.stepDotActive]}>
                          <Text style={[roleStyles.stepDotText, (isActive || isDone) && roleStyles.stepDotTextActive]}>{s}</Text>
                        </View>
                        <Text style={[roleStyles.stepLabel, isActive ? roleStyles.stepLabelActive : roleStyles.stepLabelIdle]}>
                          {s === 1 ? "Choose Role" : "Account Info"}
                        </Text>
                        {s < 2 ? (
                          <View style={[roleStyles.stepLine, flowStep > 1 ? roleStyles.stepLineDone : roleStyles.stepLineIdle]} />
                        ) : null}
                      </View>
                    );
                  })}
                </View>
                {flowStep === 1 ? (
                  <>
                    <Text style={roleStyles.title}>How will you use SkillSwap?</Text>
                    <Text style={roleStyles.subtitle}>Choose your role to get started</Text>
                    <View style={[roleStyles.rolesGrid, layout.isCompact && roleStyles.rolesGridStack]}>
                      {ROLES.map((role) => {
                        const isSelected = selectedRole === role.id;
                        return (
                          <Pressable
                            key={role.id}
                            style={[
                              roleStyles.roleCard,
                              layout.isCompact && roleStyles.roleCardFull,
                              isSelected
                                ? { backgroundColor: role.selectedBg, borderColor: role.selectedBorder }
                                : roleStyles.roleCardIdle,
                            ]}
                            onPress={() => setSelectedRole(role.id)}
                          >
                            {isSelected ? <Text style={roleStyles.roleSelectedMark}>✓</Text> : null}
                            <View style={[roleStyles.roleIconCircle, { backgroundColor: role.iconBg }]}>
                              <Text style={roleStyles.roleIcon}>{role.icon}</Text>
                            </View>
                            <Text style={roleStyles.roleTitle}>{role.title}</Text>
                            <Text style={roleStyles.roleDesc}>{role.desc}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Pressable style={[roleStyles.primaryButton, !selectedRole && roleStyles.primaryButtonDisabled]} onPress={handleNext} disabled={!selectedRole}>
                      <Text style={roleStyles.primaryButtonText}>Continue as {selectedRoleData?.title ?? "..."}</Text>
                    </Pressable>
                    <Text style={roleStyles.bottomText}>
                      Already have an account?{" "}
                      <Text style={roleStyles.bottomLink} onPress={() => router.push("/login")}>
                        Sign in
                      </Text>
                    </Text>
                  </>
                ) : (
                  <View style={roleStyles.stepTwoWrap}>
                    {selectedRole === "doctor" ? <DoctorRegisterStep onBack={handleBack} /> : null}
                    {selectedRole === "company" ? (
                      <>
                        <Text style={roleStyles.stepTwoText}>Company registration coming soon</Text>
                        <Pressable style={roleStyles.backButton} onPress={handleBack}>
                          <Text style={roleStyles.backButtonText}>Back</Text>
                        </Pressable>
                      </>
                    ) : null}
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f3f1fc" },
  keyboardFlex: { flex: 1 },
  pageScroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 18,
  },
  blobTop: {
    position: "absolute",
    backgroundColor: "rgba(99,102,241,0.08)",
  },
  blobBottom: {
    position: "absolute",
    backgroundColor: "rgba(168,85,247,0.06)",
  },
  wrap: { width: "100%", zIndex: 1, alignSelf: "stretch" },
  logoRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 18 },
  logoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366f1",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logoGlyph: { color: "#fff", fontSize: 11, fontWeight: "900", transform: [{ rotate: "90deg" }] },
  logoTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  logoAccent: { color: "#7c3aed" },
  changeRoleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 },
  changeRoleBtn: { color: "#6366f1", fontWeight: "600", fontSize: 13 },
  roleBadge: {
    paddingVertical: 3,
    paddingHorizontal: 12,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 20,
  },
  roleBadgeText: { color: "#6366f1", fontSize: 12, fontWeight: "700" },
  stepperScrollView: { marginBottom: 18, maxWidth: "100%", flexGrow: 0 },
  stepperScroll: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 2,
    flexGrow: 1,
    justifyContent: "center",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "nowrap",
    gap: 2,
  },
  stepperSegment: { flexDirection: "row", alignItems: "center" },
  stepperInner: { flexDirection: "row", alignItems: "center", gap: 4 },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: { backgroundColor: "#6366f1", shadowColor: "#6366f1", shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  stepDotDone: { backgroundColor: "#6366f1" },
  stepDotIdle: { backgroundColor: "#fff", borderWidth: 2, borderColor: "#e2e8f0" },
  stepCheck: { fontSize: 10, color: "#fff", fontWeight: "900" },
  stepNum: { fontSize: 10, fontWeight: "700" },
  stepNumOnActive: { color: "#fff" },
  stepNumIdle: { color: "#94a3b8" },
  stepLabel: { fontSize: 11, fontWeight: "600" },
  stepLabelActive: { color: "#1e293b" },
  stepLabelDone: { color: "#6366f1" },
  stepLabelMuted: { color: "#94a3b8" },
  stepConnector: { width: 18, height: 2, marginHorizontal: 4, borderRadius: 2 },
  stepConnectorDone: { backgroundColor: "#a855f7" },
  stepConnectorIdle: { backgroundColor: "#e2e8f0" },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 26,
    shadowColor: "#6366f1",
    shadowOpacity: 0.08,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  sectionHeader: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
    flexShrink: 1,
  },
  sectionSub: { fontSize: 13, color: "#64748b", lineHeight: 18 },
  picRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  picCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#f1f5f9",
    borderWidth: 2,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  picImage: { width: "100%", height: "100%" },
  picPlus: { fontSize: 22, color: "#cbd5e1" },
  picCol: { flex: 1 },
  picLabel: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6 },
  picOpt: { color: "#94a3b8", fontWeight: "400" },
  picBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 8,
  },
  picBtnText: { color: "#6366f1", fontSize: 12, fontWeight: "600" },
  fieldMb: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 5 },
  req: { color: "#ef4444" },
  gpaOpt: { color: "#94a3b8", fontWeight: "400", fontSize: 12 },
  input: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    fontSize: 14,
    color: "#1e293b",
    minHeight: 44,
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    backgroundColor: "#fff",
    minHeight: 44,
    overflow: "hidden",
  },
  inputShellErr: { borderColor: "#fca5a5" },
  inputInner: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#1e293b",
  },
  inputErr: { borderColor: "#fca5a5" },
  suffixInline: { justifyContent: "center", alignItems: "center", paddingRight: 10 },
  eye: { fontSize: 15, color: "#94a3b8" },
  errorText: { fontSize: 12, color: "#ef4444", marginTop: 4, fontWeight: "500" },
  row2: { gap: 12, width: "100%" },
  row2Row: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" },
  row2Stack: { flexDirection: "column" },
  row2Col: { flex: 1, minWidth: 0, flexGrow: 1 },
  row2ColFull: { width: "100%", flexBasis: "100%" },
  passStrengthRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  passBarSeg: { flex: 1, height: 4, borderRadius: 2 },
  passLabel: { fontSize: 12, fontWeight: "700", minWidth: 44 },
  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 10,
  },
  selectDisabled: { opacity: 0.5 },
  selectText: { fontSize: 14, color: "#1e293b", flex: 1, flexShrink: 1, minWidth: 0 },
  selectPlaceholder: { color: "#94a3b8" },
  selectChevron: { fontSize: 10, color: "#64748b", marginLeft: 8 },
  academicBlock: { marginBottom: 16 },
  yearGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  yearBtn: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    flexGrow: 1,
    flexBasis: "30%",
    minWidth: 0,
    maxWidth: "100%",
    alignItems: "center",
  },
  yearBtnOn: { borderWidth: 2, borderColor: "#6366f1", backgroundColor: "#eef2ff" },
  yearBtnOff: { borderWidth: 2, borderColor: "#e2e8f0", backgroundColor: "#fff" },
  yearBtnText: { fontSize: 11, fontWeight: "700", color: "#64748b" },
  yearBtnTextOn: { color: "#6366f1" },
  gpaMeterWrap: { marginTop: 8 },
  gpaTrack: { height: 6, backgroundColor: "#f1f5f9", borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  gpaFill: { height: "100%", borderRadius: 3 },
  gpaMeterLabel: { fontSize: 11, fontWeight: "600" },
  warnBox: {
    padding: 16,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 10,
    marginBottom: 8,
  },
  warnText: { color: "#92400e", fontSize: 13 },
  skillsSummaryBar: {
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    gap: 4,
  },
  skillsSummaryTitle: { fontSize: 12, fontWeight: "800", color: "#475569" },
  skillsSummaryLine: { fontSize: 12, color: "#64748b" },
  skillGroup: { marginBottom: 28 },
  skillHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flex: 1,
  },
  skillHeadLeft: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1 },
  skillCollapseChev: { fontSize: 11, fontWeight: "800", color: "#64748b" },
  skillSectionHeadBtn: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 0,
  },
  skillSectionHeadBtnPressed: { opacity: 0.92 },
  skillHeadStaticWrap: { marginBottom: 4 },
  skillCollapsedHint: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 6,
    lineHeight: 16,
  },
  skillFilterInput: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1e293b",
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  skillEmptyFilter: {
    fontSize: 12,
    color: "#64748b",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    marginBottom: 8,
  },
  skillTitle: { fontSize: 13, fontWeight: "700", color: "#374151" },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 10,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#6366f1" },
  skillHint: { fontSize: 12, color: "#94a3b8", marginBottom: 8 },
  skillErr: { fontSize: 12, color: "#ef4444", marginTop: 6, fontWeight: "500" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  customAddBlock: { marginTop: 12 },
  customOtherHint: { fontSize: 11, color: "#94a3b8", marginBottom: 8 },
  customOtherRow: { flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" },
  customOtherInputFlex: {
    flex: 1,
    minWidth: 160,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 10,
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
    borderRadius: 10,
  },
  btnAddCustomText: { color: "#4f46e5", fontSize: 13, fontWeight: "600" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    flexShrink: 1,
    maxWidth: "100%",
  },
  chipCheck: { fontSize: 10, fontWeight: "900" },
  chipLabel: { fontSize: 12, flexShrink: 1 },
  apiErrBox: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 10,
  },
  apiErrText: { color: "#dc2626", fontSize: 13, fontWeight: "500" },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 28,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  navSpacer: { minWidth: 72 },
  navRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    minWidth: 0,
  },
  navRightStack: {
    flexDirection: "column",
    alignItems: "stretch",
    flexBasis: "100%",
    marginTop: 4,
  },
  stepFraction: { fontSize: 12, color: "#94a3b8", fontWeight: "600", flexShrink: 0 },
  btnBack: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 10,
  },
  btnBackText: { color: "#64748b", fontSize: 14, fontWeight: "600" },
  btnPrimary: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    paddingHorizontal: 26,
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    shadowColor: "#6366f1",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnPrimaryDisabled: { opacity: 0.7 },
  btnPrimaryWide: { width: "100%", flexGrow: 0, flex: 0 },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerTag: { textAlign: "center", color: "#cbd5e1", fontSize: 12, marginTop: 24 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexShrink: 1,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 12, paddingHorizontal: 8 },
  modalList: { flexGrow: 0, flexShrink: 1 },
  modalRow: { paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  modalRowText: { fontSize: 14, color: "#334155", flexShrink: 1 },
  modalCancel: { marginTop: 12, alignItems: "center", padding: 12 },
  modalCancelText: { color: "#6366f1", fontWeight: "600", fontSize: 14 },
});

const roleStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8f7ff" },
  keyboardView: { flex: 1 },
  bgBlobTop: {
    position: "absolute",
    backgroundColor: "rgba(99,102,241,0.10)",
  },
  bgBlobBottom: {
    position: "absolute",
    backgroundColor: "rgba(168,85,247,0.08)",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  cardWrap: { width: "100%", alignItems: "center", alignSelf: "stretch" },
  card: {
    width: "100%",
    borderRadius: 24,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
    shadowColor: "#6366f1",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  topGradientBar: { height: 6, backgroundColor: "#7c3aed" },
  cardContent: { paddingHorizontal: 18, paddingVertical: 18 },
  logoRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366f1",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logoIconText: { color: "#ffffff", fontSize: 11, fontWeight: "900", transform: [{ rotate: "90deg" }] },
  logoText: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  logoAccent: { color: "#7c3aed" },
  stepperRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, flexWrap: "nowrap" },
  stepperItem: { flexDirection: "row", alignItems: "center" },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
  },
  stepDotActive: { backgroundColor: "#6366f1" },
  stepDotText: { fontSize: 11, fontWeight: "700", color: "#94a3b8" },
  stepDotTextActive: { color: "#ffffff" },
  stepLabel: { marginLeft: 5, marginRight: 5, fontSize: 11, fontWeight: "500" },
  stepLabelActive: { color: "#334155" },
  stepLabelIdle: { color: "#94a3b8" },
  stepLine: { width: 20, height: 1 },
  stepLineDone: { backgroundColor: "#a5b4fc" },
  stepLineIdle: { backgroundColor: "#e2e8f0" },
  title: { fontSize: 24, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#64748b", marginBottom: 18 },
  rolesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    columnGap: 8,
    marginBottom: 18,
    width: "100%",
  },
  rolesGridStack: { flexDirection: "column" },
  roleCard: {
    width: "48.5%",
    minHeight: 132,
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 14,
    position: "relative",
  },
  roleCardFull: { width: "100%" },
  roleCardIdle: { borderColor: "#e2e8f0", backgroundColor: "#ffffff" },
  roleSelectedMark: { position: "absolute", right: 10, top: 8, fontSize: 12, color: "#6366f1", fontWeight: "900" },
  roleIconCircle: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  roleIcon: { fontSize: 18 },
  roleTitle: { fontSize: 14, fontWeight: "700", color: "#1f2937", marginBottom: 4, flexShrink: 1 },
  roleDesc: { fontSize: 11, color: "#64748b", lineHeight: 16, flexShrink: 1 },
  primaryButton: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6d28d9",
    shadowColor: "#6366f1",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  bottomText: { textAlign: "center", marginTop: 20, fontSize: 14, color: "#64748b" },
  bottomLink: { color: "#4f46e5", fontWeight: "700" },
  stepTwoWrap: { width: "100%", alignSelf: "stretch", paddingVertical: 8 },
  stepTwoText: { fontSize: 16, lineHeight: 24, color: "#334155", textAlign: "center", marginBottom: 22, fontWeight: "600" },
  formWrap: { width: "100%", alignSelf: "stretch" },
  formTitle: { fontSize: 23, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  formSubtitle: { fontSize: 14, color: "#64748b", marginBottom: 16 },
  fieldGroup: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#475569", marginBottom: 6 },
  fieldInput: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#0f172a",
  },
  fieldInputErr: { borderColor: "#fca5a5" },
  fieldMulti: { minHeight: 88, textAlignVertical: "top" },
  fieldError: { marginTop: 4, fontSize: 12, color: "#ef4444", fontWeight: "500" },
  apiError: {
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "500",
  },
  formActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  backButton: {
    minWidth: 88,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  backButtonText: { color: "#64748b", fontWeight: "600", fontSize: 14 },
  primaryBtn: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6d28d9",
  },
  primaryBtnDis: { opacity: 0.5 },
  primaryBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
