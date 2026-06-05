import { useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Pressable, StyleSheet, Text } from "react-native";
import { router } from "expo-router";

import { registerStudent } from "@/api/authApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { RegSelectField } from "@/components/registration/RegSelectField";
import { RegTextField } from "@/components/registration/RegTextField";
import { SkillChipGrid } from "@/components/registration/SkillChipGrid";
import { RegistrationWizardLayout } from "@/components/registration/RegistrationWizardLayout";
import {
  ACADEMIC_YEARS,
  MAJORS,
  UNIVERSITIES,
  UNIVERSITY_FACULTIES,
} from "@/constants/registrationData";
import { getSkillsPack } from "@/constants/studentSkillPools";
import { AUTH_COLORS } from "@/constants/authTheme";
import { persistAuthSession } from "@/lib/authSession";
import { navigateHome } from "@/utils/homeNavigation";

const STEP_TITLES = [
  "Create your student account",
  "Academic profile",
  "Skills & interests",
  "Review & submit",
];
const STEP_SUBTITLES = [
  "Build your SkillSwap profile and join AI-assisted teams.",
  "Tell us about your university program.",
  "Select roles and skills for smarter team matching.",
  "Confirm your details and create your account.",
];

export default function StudentRegisterScreen() {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [profilePictureBase64, setProfilePictureBase64] = useState<string | null>(null);
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

  const setField = (field: keyof typeof form, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field as string]: "" }));
    setApiError(null);
  };

  const toggleSkill = (field: "roles" | "technicalSkills" | "tools", value: string) => {
    setForm((prev) => {
      const list = prev[field];
      const next = list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
      return { ...prev, [field]: next };
    });
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
      if (form.gpa.trim() && (Number.isNaN(parseFloat(form.gpa)) || parseFloat(form.gpa) < 0 || parseFloat(form.gpa) > 4)) {
        next.gpa = "GPA must be between 0.0 and 4.0";
      }
    }
    if (step === 2) {
      if (!skillsData) next.major = "Select a valid major to load skills";
      else if (form.roles.length === 0) next.roles = "Please select at least one team role";
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

  return (
    <RegistrationWizardLayout
      stepLabel={`Step ${step + 1} of 4 · Student registration`}
      title={STEP_TITLES[step]}
      subtitle={STEP_SUBTITLES[step]}
      onBack={handleBack}
      onContinue={handleContinue}
      continueLabel={step === 3 ? "Create account" : "Continue"}
      isLoading={isLoading}
      apiError={apiError}
      backLinkLabel={step === 0 ? "← Change account type" : "← Back"}
    >
      {step === 0 ? (
        <>
          <RegTextField label="Full name" value={form.fullName} onChangeText={(v) => setField("fullName", v)} autoCapitalize="words" error={errors.fullName} />
          <RegTextField label="Email" value={form.email} onChangeText={(v) => setField("email", v)} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
          <RegTextField label="Password" value={form.password} onChangeText={(v) => setField("password", v)} secureTextEntry error={errors.password} />
          <RegTextField label="Confirm password" value={form.confirmPassword} onChangeText={(v) => setField("confirmPassword", v)} secureTextEntry error={errors.confirmPassword} />
          <Pressable onPress={pickPhoto} style={styles.photoButton}>
            <Text style={styles.photoButtonText}>
              {profilePictureBase64 ? "Profile photo selected" : "Add profile photo (optional)"}
            </Text>
          </Pressable>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <RegTextField label="Student ID" value={form.studentId} onChangeText={(v) => setField("studentId", v)} error={errors.studentId} />
          <RegSelectField label="University" value={form.university} onValueChange={(v) => { setField("university", v); setField("faculty", ""); setField("major", ""); setField("roles", []); setField("technicalSkills", []); setField("tools", []); }} options={UNIVERSITIES} error={errors.university} />
          <RegSelectField label="Faculty" value={form.faculty} onValueChange={(v) => { setField("faculty", v); setField("major", ""); setField("roles", []); setField("technicalSkills", []); setField("tools", []); }} options={faculties} placeholder="Select faculty" error={errors.faculty} />
          <RegSelectField label="Major" value={form.major} onValueChange={(v) => { setField("major", v); setField("roles", []); setField("technicalSkills", []); setField("tools", []); }} options={majors} placeholder="Select major" error={errors.major} />
          <RegSelectField label="Academic year" value={form.academicYear} onValueChange={(v) => setField("academicYear", v)} options={ACADEMIC_YEARS} error={errors.academicYear} />
          <RegTextField label="GPA (optional)" value={form.gpa} onChangeText={(v) => setField("gpa", v)} keyboardType="numeric" />
        </>
      ) : null}

      {step === 2 && skillsData ? (
        <>
          <SkillChipGrid title="Team roles" options={skillsData.roles} selected={form.roles} onToggle={(v) => toggleSkill("roles", v)} error={errors.roles} />
          <SkillChipGrid title="Technical skills" options={skillsData.technicalSkills} selected={form.technicalSkills} onToggle={(v) => toggleSkill("technicalSkills", v)} />
          <SkillChipGrid title="Tools" options={skillsData.tools} selected={form.tools} onToggle={(v) => toggleSkill("tools", v)} />
        </>
      ) : null}

      {step === 2 && !skillsData ? (
        <Text style={styles.hint}>Select your faculty and major first to load skill options.</Text>
      ) : null}

      {step === 3 ? (
        <>
          <Text style={styles.reviewLine}>Name: {form.fullName}</Text>
          <Text style={styles.reviewLine}>Email: {form.email}</Text>
          <Text style={styles.reviewLine}>Student ID: {form.studentId}</Text>
          <Text style={styles.reviewLine}>Program: {form.major}, {form.faculty}</Text>
          <Text style={styles.reviewLine}>Roles selected: {form.roles.length}</Text>
          <Text style={styles.reviewLine}>Technical skills: {form.technicalSkills.length}</Text>
          <Text style={styles.reviewLine}>Tools: {form.tools.length}</Text>
        </>
      ) : null}
    </RegistrationWizardLayout>
  );
}

const styles = StyleSheet.create({
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
  hint: {
    color: AUTH_COLORS.muted,
    fontSize: 14,
  },
  reviewLine: {
    color: AUTH_COLORS.foreground,
    fontSize: 15,
    marginBottom: 8,
  },
});
