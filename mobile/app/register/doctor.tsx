import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { registerDoctor } from "@/api/authApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { DepartmentChipField } from "@/components/registration/DepartmentChipField";
import { DoctorOnboardingBadge } from "@/components/registration/DoctorOnboardingBadge";
import { PasswordStrengthBar } from "@/components/registration/PasswordStrengthBar";
import { ProfilePhotoUploadMobile } from "@/components/registration/ProfilePhotoUploadMobile";
import { RegSelectField } from "@/components/registration/RegSelectField";
import { RegTextField } from "@/components/registration/RegTextField";
import { RegistrationWizardLayout } from "@/components/registration/RegistrationWizardLayout";
import {
  DOCTOR_SPECIALIZATIONS,
  UNIVERSITIES,
  UNIVERSITY_FACULTIES,
} from "@/constants/registrationData";
import { persistAuthSession } from "@/lib/authSession";
import { navigateHome } from "@/utils/homeNavigation";

const STEP_TITLES = ["Create your doctor account", "Academic profile"];
const STEP_SUBTITLES = [
  "Supervise teams and publish graduation projects on SkillSwap.",
  "Tell us about your university position and departments.",
];

export default function DoctorRegisterScreen() {
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
    university: "",
    faculty: "",
    departments: [""] as string[],
    specialization: "",
    bio: "",
  });

  const faculties = form.university ? UNIVERSITY_FACULTIES[form.university] ?? [] : [];

  const setField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field as string]: "" }));
    setApiError(null);
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

  const handleDepartmentChange = (index: number, value: string) => {
    const updated = [...form.departments];
    updated[index] = value;
    setField("departments", updated);
    setErrors((prev) => ({ ...prev, departments: "" }));
  };

  const addDepartment = () => {
    setField("departments", [...form.departments, ""]);
  };

  const removeDepartment = (index: number) => {
    setField(
      "departments",
      form.departments.filter((_, i) => i !== index),
    );
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (step === 0) {
      if (!form.fullName.trim()) next.fullName = "Full name is required";
      if (!form.email.trim()) next.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Invalid email";
      if (!form.password) next.password = "Password is required";
      else if (form.password.length < 8) next.password = "Min. 8 characters";
      if (form.password !== form.confirmPassword) next.confirmPassword = "Passwords do not match";
    }
    if (step === 1) {
      if (!form.university) next.university = "Please select university";
      if (!form.faculty) next.faculty = "Please select faculty";
      if (form.departments.some((d) => !d.trim())) next.departments = "All departments are required";
      if (!form.specialization) next.specialization = "Please select specialization";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (form.departments.some((d) => !d.trim())) {
      setErrors((e) => ({ ...e, departments: "All departments are required" }));
      return;
    }
    if (!validate()) return;
    if (isLoading) return;
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await registerDoctor({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        university: form.university,
        faculty: form.faculty,
        department: form.departments.map((d) => d.trim()).join(", "),
        specialization: form.specialization,
        bio: form.bio.trim(),
        profilePictureBase64,
        role: "doctor",
      });
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
    if (step < 1) setStep((s) => s + 1);
    else submit();
  };

  const handleBack = () => {
    if (step === 0) router.replace("/register");
    else setStep((s) => Math.max(0, s - 1));
  };

  return (
    <RegistrationWizardLayout
      stepLabel={`Step ${step + 1} of 2`}
      title={STEP_TITLES[step]}
      subtitle={STEP_SUBTITLES[step]}
      badge={step === 0 ? <DoctorOnboardingBadge /> : null}
      onBack={handleBack}
      onContinue={handleContinue}
      continueLabel={step === 1 ? "Create account" : "Continue"}
      isLoading={isLoading}
      apiError={apiError}
      backLinkLabel={step === 0 ? "← Change account type" : "← Back"}
      keyboardAvoiding
    >
      {step === 0 ? (
        <View style={styles.fullWidth}>
          <ProfilePhotoUploadMobile previewUri={profilePictureBase64} onPick={pickPhoto} />
          <RegTextField
            label="Full name"
            value={form.fullName}
            onChangeText={(v) => setField("fullName", v)}
            placeholder="Dr. Mohammad Khalil"
            autoCapitalize="words"
            error={errors.fullName}
          />
          <RegTextField
            label="University email"
            value={form.email}
            onChangeText={(v) => setField("email", v)}
            placeholder="doctor@najah.edu"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <RegTextField
            label="Password"
            value={form.password}
            onChangeText={(v) => setField("password", v)}
            placeholder="Min. 8 characters"
            secureTextEntry
            error={errors.password}
          />
          <PasswordStrengthBar password={form.password} />
          <RegTextField
            label="Confirm password"
            value={form.confirmPassword}
            onChangeText={(v) => setField("confirmPassword", v)}
            placeholder="Re-enter password"
            secureTextEntry
            error={errors.confirmPassword}
          />
        </View>
      ) : (
        <View style={styles.fullWidth}>
          <RegSelectField
            label="University"
            value={form.university}
            onValueChange={(v) => {
              setField("university", v);
              setField("faculty", "");
            }}
            options={UNIVERSITIES}
            placeholder="Select your university"
            error={errors.university}
          />
          <RegSelectField
            label="Faculty / college"
            value={form.faculty}
            onValueChange={(v) => setField("faculty", v)}
            options={faculties}
            placeholder={form.university ? "Select your faculty" : "Select a university first"}
            error={errors.faculty}
          />
          <DepartmentChipField
            departments={form.departments}
            onUpdate={handleDepartmentChange}
            onAdd={addDepartment}
            onRemove={removeDepartment}
            error={errors.departments}
          />
          <RegSelectField
            label="Specialization"
            value={form.specialization}
            onValueChange={(v) => setField("specialization", v)}
            options={DOCTOR_SPECIALIZATIONS}
            placeholder="Select your specialization"
            error={errors.specialization}
          />
          <RegTextField
            label="Bio"
            value={form.bio}
            onChangeText={(v) => setField("bio", v)}
            placeholder="Brief description about your research interests and teaching areas..."
            multiline
            tall
          />
        </View>
      )}
    </RegistrationWizardLayout>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: "100%",
  },
});
