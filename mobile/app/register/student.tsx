import { useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { registerStudent } from "@/api/authApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { AcademicYearPicker } from "@/components/registration/AcademicYearPicker";
import { ReadyToSubmitCard } from "@/components/registration/ReadyToSubmitCard";
import { RegSelectField } from "@/components/registration/RegSelectField";
import { RegTextField } from "@/components/registration/RegTextField";
import { ReviewSummaryCard } from "@/components/registration/ReviewSummaryCard";
import { SkillSectionMobile } from "@/components/registration/SkillSectionMobile";
import { RegistrationWizardLayout } from "@/components/registration/RegistrationWizardLayout";
import {
  ACADEMIC_YEARS,
  MAJORS,
  UNIVERSITIES,
  UNIVERSITY_FACULTIES,
} from "@/constants/registrationData";
import {
  CUSTOM_SKILL_MAX_LENGTH,
  customSelections,
  getSkillsPack,
  normalizeCustomSkill,
} from "@/constants/studentSkillPools";
import { AUTH_COLORS } from "@/constants/authTheme";
import { persistAuthSession } from "@/lib/authSession";
import { getRegistrationGraduationCourses } from "@/lib/graduationProjectTypes";
import { navigateHome } from "@/utils/homeNavigation";

const STEP_TITLES = [
  "Create your student account",
  "Academic profile",
  "Skills & interests",
  "Review and confirm",
];
const STEP_SUBTITLES = [
  "Build your SkillSwap profile and join AI-assisted teams.",
  "Tell us about your university program so we can tailor graduation project matching.",
  "Select roles, skills, and tools that reflect how you contribute on your projects.",
  "Review your information before submitting your registration.",
];

export default function StudentRegisterScreen() {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [profilePictureBase64, setProfilePictureBase64] = useState<string | null>(null);
  const [customDraft, setCustomDraft] = useState({ roles: "", technicalSkills: "", tools: "" });
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    studentId: "",
    university: "",
    faculty: "",
    major: "",
    academicYear: "",
    gpa: "",
    roles: [] as string[],
    technicalSkills: [] as string[],
    tools: [] as string[],
  });

  const faculties = form.university ? UNIVERSITY_FACULTIES[form.university] ?? [] : [];
  const majors = form.faculty ? MAJORS[form.faculty] ?? [] : [];
  const skillsData = useMemo(() => getSkillsPack(form.faculty, form.major), [form.faculty, form.major]);
  const graduationCourses = useMemo(
    () => getRegistrationGraduationCourses(form.faculty || null, form.major || null),
    [form.faculty, form.major],
  );

  const setField = (field: keyof typeof form, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field as string]: "" }));
    setApiError(null);
  };

  const resetSkills = () => {
    setField("roles", []);
    setField("technicalSkills", []);
    setField("tools", []);
    setCustomDraft({ roles: "", technicalSkills: "", tools: "" });
  };

  const toggleSkill = (field: "roles" | "technicalSkills" | "tools", value: string) => {
    setForm((prev) => {
      const list = prev[field];
      const next = list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
      return { ...prev, [field]: next };
    });
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const addCustomSkill = (field: "roles" | "technicalSkills" | "tools") => {
    const value = normalizeCustomSkill(customDraft[field]);
    if (!value) return;
    setForm((prev) => {
      const list = prev[field];
      if (list.some((x) => x.toLowerCase() === value.toLowerCase())) return prev;
      return { ...prev, [field]: [...list, value] };
    });
    setCustomDraft((prev) => ({ ...prev, [field]: "" }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      const mime = result.assets[0].mimeType ?? "image/jpeg";
      setProfilePictureBase64(`data:${mime};base64,${result.assets[0].base64}`);
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (step === 0) {
      if (!form.fullName.trim()) next.fullName = "Full name is required";
      if (!form.email.trim()) next.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Please enter a valid email";
      if (!form.password) next.password = "Password is required";
      else if (form.password.length < 8) next.password = "Password must be at least 8 characters";
      if (form.password !== form.confirmPassword) next.confirmPassword = "Passwords do not match";
    }
    if (step === 1) {
      if (!form.studentId.trim()) next.studentId = "Student ID is required";
      if (!form.university) next.university = "Please select your university";
      if (!form.faculty) next.faculty = "Please select your faculty";
      if (!form.major) next.major = "Please select your major";
      if (!form.academicYear) next.academicYear = "Please select your academic year";
      if (
        form.gpa.trim() &&
        (Number.isNaN(parseFloat(form.gpa)) || parseFloat(form.gpa) < 0 || parseFloat(form.gpa) > 4)
      ) {
        next.gpa = "GPA must be between 0.0 and 4.0";
      }
    }
    if (step === 2) {
      if (form.roles.length === 0) next.roles = "Please select at least one team role";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    if (isLoading) return;
    setIsLoading(true);
    setApiError(null);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        profilePictureBase64,
        studentId: form.studentId.trim(),
        university: form.university,
        faculty: form.faculty,
        major: form.major,
        academicYear: form.academicYear,
        gpa: form.gpa.trim() ? parseFloat(form.gpa) : null,
        roles: form.roles,
        technicalSkills: form.technicalSkills,
        tools: form.tools,
        generalSkills: form.roles,
        majorSkills: form.technicalSkills,
      };
      const data = await registerStudent(payload);
      await persistAuthSession(data);
      await navigateHome();
    } catch (error) {
      setApiError(parseApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (!validate()) return;
    if (step < 3) setStep((s) => s + 1);
    else submit();
  };

  const handleBack = () => {
    if (step === 0) router.replace("/register");
    else setStep((s) => Math.max(0, s - 1));
  };

  const handleGpaChange = (value: string) => {
    if (value === "" || (/^\d*\.?\d*$/.test(value) && (value === "." || parseFloat(value) <= 4))) {
      setField("gpa", value);
    }
  };

  return (
    <RegistrationWizardLayout
      stepLabel={`Step ${step + 1} of 4`}
      title={STEP_TITLES[step]}
      subtitle={STEP_SUBTITLES[step]}
      onBack={handleBack}
      onContinue={handleContinue}
      continueLabel={step === 3 ? "Create account" : "Continue"}
      isLoading={isLoading}
      apiError={apiError}
      backLinkLabel={step === 0 ? "← Change account type" : "← Back"}
      keyboardAvoiding={step === 1 || step === 2}
    >
      {step === 0 ? (
        <>
          <RegTextField
            label="Full name"
            value={form.fullName}
            onChangeText={(v) => setField("fullName", v)}
            autoCapitalize="words"
            error={errors.fullName}
          />
          <RegTextField
            label="Email"
            value={form.email}
            onChangeText={(v) => setField("email", v)}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <RegTextField
            label="Password"
            value={form.password}
            onChangeText={(v) => setField("password", v)}
            secureTextEntry
            error={errors.password}
          />
          <RegTextField
            label="Confirm password"
            value={form.confirmPassword}
            onChangeText={(v) => setField("confirmPassword", v)}
            secureTextEntry
            error={errors.confirmPassword}
          />
          <Pressable onPress={pickPhoto} style={styles.photoButton}>
            <Text style={styles.photoButtonText}>
              {profilePictureBase64 ? "Profile photo selected" : "Add profile photo (optional)"}
            </Text>
          </Pressable>
        </>
      ) : null}

      {step === 1 ? (
        <View style={styles.fullWidth}>
          <RegTextField
            label="Student ID"
            value={form.studentId}
            onChangeText={(v) => setField("studentId", v)}
            placeholder="2021123456"
            error={errors.studentId}
          />
          <RegSelectField
            label="University"
            value={form.university}
            onValueChange={(v) => {
              setField("university", v);
              setField("faculty", "");
              setField("major", "");
              resetSkills();
            }}
            options={UNIVERSITIES}
            placeholder="Select your university"
            error={errors.university}
          />
          <RegSelectField
            label="Faculty / college"
            value={form.faculty}
            onValueChange={(v) => {
              setField("faculty", v);
              setField("major", "");
              resetSkills();
            }}
            options={faculties}
            placeholder={form.university ? "Select faculty" : "Select university first"}
            error={errors.faculty}
          />
          <RegSelectField
            label="Major / department"
            value={form.major}
            onValueChange={(v) => {
              setField("major", v);
              resetSkills();
            }}
            options={majors}
            placeholder={form.faculty ? "Select major" : "Select faculty first"}
            error={errors.major}
          />
          <AcademicYearPicker
            label="Academic year"
            options={ACADEMIC_YEARS}
            value={form.academicYear}
            onChange={(v) => setField("academicYear", v)}
            error={errors.academicYear}
            required
          />
          <RegTextField
            label="GPA (optional)"
            value={form.gpa}
            onChangeText={handleGpaChange}
            placeholder="e.g. 3.50"
            keyboardType="numeric"
            error={errors.gpa}
          />
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.fullWidth}>
          {!skillsData ? (
            <View style={styles.alertBox}>
              <Text style={styles.alertTitle}>Complete your academic profile first</Text>
              <Text style={styles.alertBody}>
                Select your faculty and major to view skills aligned with your program.
              </Text>
            </View>
          ) : (
            <>
              <SkillSectionMobile
                title="Team roles"
                hint="How you typically contribute on graduation projects (independent of your major)"
                selectedCount={form.roles.length}
                options={skillsData.roles}
                selected={form.roles}
                customOptions={customSelections(form.roles, skillsData.roles)}
                customDraft={customDraft.roles}
                onCustomDraftChange={(v) => setCustomDraft((d) => ({ ...d, roles: v }))}
                onAddCustom={() => addCustomSkill("roles")}
                onToggle={(v) => toggleSkill("roles", v)}
                color="indigo"
                required
                error={errors.roles}
              />
              <SkillSectionMobile
                title="Technical skills"
                hint="Areas where you have practical experience"
                selectedCount={form.technicalSkills.length}
                options={skillsData.technicalSkills}
                selected={form.technicalSkills}
                customOptions={customSelections(form.technicalSkills, skillsData.technicalSkills)}
                customDraft={customDraft.technicalSkills}
                onCustomDraftChange={(v) => setCustomDraft((d) => ({ ...d, technicalSkills: v }))}
                onAddCustom={() => addCustomSkill("technicalSkills")}
                onToggle={(v) => toggleSkill("technicalSkills", v)}
                color="purple"
              />
              <SkillSectionMobile
                title="Technologies & tools"
                hint="Languages, frameworks, and software you use in coursework or projects"
                selectedCount={form.tools.length}
                options={skillsData.tools}
                selected={form.tools}
                customOptions={customSelections(form.tools, skillsData.tools)}
                customDraft={customDraft.tools}
                onCustomDraftChange={(v) => setCustomDraft((d) => ({ ...d, tools: v }))}
                onAddCustom={() => addCustomSkill("tools")}
                onToggle={(v) => toggleSkill("tools", v)}
                color="teal"
              />
            </>
          )}
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.fullWidth}>
          <ReviewSummaryCard
            title="Account"
            rows={[
              { label: "Name", value: form.fullName },
              { label: "Email", value: form.email },
            ]}
            onEdit={() => setStep(0)}
          />
          <ReviewSummaryCard
            title="Academic"
            rows={[
              { label: "Student ID", value: form.studentId },
              { label: "University", value: form.university },
              { label: "Faculty", value: form.faculty },
              { label: "Major", value: form.major },
              { label: "Year", value: form.academicYear },
              { label: "GPA", value: form.gpa || "—" },
            ]}
            onEdit={() => setStep(1)}
          />
          <ReviewSummaryCard
            title="Skills"
            rows={[
              { label: "Team roles", value: form.roles.join(", ") },
              { label: "Technical", value: form.technicalSkills.join(", ") },
              { label: "Tools", value: form.tools.join(", ") },
            ]}
            onEdit={() => setStep(2)}
          />
          <ReadyToSubmitCard />
        </View>
      ) : null}
    </RegistrationWizardLayout>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: "100%",
  },
  photoButton: {
    borderWidth: 1,
    borderColor: AUTH_COLORS.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    alignItems: "center",
    backgroundColor: AUTH_COLORS.inputBg,
  },
  photoButtonText: {
    color: AUTH_COLORS.link,
    fontWeight: "600",
  },
  alertBox: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "rgba(254, 226, 226, 0.4)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  alertTitle: {
    fontWeight: "700",
    color: "#B91C1C",
    fontSize: 15,
    marginBottom: 6,
  },
  alertBody: {
    color: AUTH_COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
