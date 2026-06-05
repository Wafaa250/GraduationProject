import { useState } from "react";
import { router } from "expo-router";

import { ASSOCIATION_CATEGORIES, registerStudentAssociation } from "@/api/associationApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { RegSelectField } from "@/components/registration/RegSelectField";
import { RegTextField } from "@/components/registration/RegTextField";
import { RegistrationWizardLayout } from "@/components/registration/RegistrationWizardLayout";
import { ASSOCIATION_FACULTIES } from "@/constants/registrationData";
import { persistAuthSession } from "@/lib/authSession";
import { navigateHome } from "@/utils/homeNavigation";

const STEP_TITLES = ["Create your organization account", "Organization details"];
const STEP_SUBTITLES = [
  "Register your student organization on SkillSwap.",
  "Tell students about your organization and how to find you.",
];

export default function AssociationRegisterScreen() {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    associationName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    description: "",
    faculty: "",
    category: "",
    instagramUrl: "",
    facebookUrl: "",
    linkedInUrl: "",
  });

  const setField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setApiError(null);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (step === 0) {
      if (!form.associationName.trim()) next.associationName = "Organization name is required";
      if (!form.username.trim()) next.username = "Username is required";
      else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) next.username = "Letters, numbers, underscores only";
      if (!form.email.trim()) next.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Invalid email";
      if (!form.password) next.password = "Password is required";
      else if (form.password.length < 8) next.password = "Min. 8 characters";
      if (form.password !== form.confirmPassword) next.confirmPassword = "Passwords do not match";
    }
    if (step === 1) {
      if (!form.faculty) next.faculty = "Faculty is required";
      if (!form.category) next.category = "Category is required";
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
      const data = await registerStudentAssociation({
        associationName: form.associationName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        description: form.description.trim() || undefined,
        faculty: form.faculty,
        category: form.category,
        instagramUrl: form.instagramUrl.trim() || undefined,
        facebookUrl: form.facebookUrl.trim() || undefined,
        linkedInUrl: form.linkedInUrl.trim() || undefined,
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
      stepLabel={`Step ${step + 1} of 2 · Organization registration`}
      title={STEP_TITLES[step]}
      subtitle={STEP_SUBTITLES[step]}
      onBack={handleBack}
      onContinue={handleContinue}
      continueLabel={step === 1 ? "Create account" : "Continue"}
      isLoading={isLoading}
      apiError={apiError}
      backLinkLabel={step === 0 ? "← Change account type" : "← Back"}
    >
      {step === 0 ? (
        <>
          <RegTextField label="Organization name" value={form.associationName} onChangeText={(v) => setField("associationName", v)} error={errors.associationName} />
          <RegTextField label="Username" value={form.username} onChangeText={(v) => setField("username", v)} autoCapitalize="none" error={errors.username} />
          <RegTextField label="Email" value={form.email} onChangeText={(v) => setField("email", v)} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
          <RegTextField label="Password" value={form.password} onChangeText={(v) => setField("password", v)} secureTextEntry error={errors.password} />
          <RegTextField label="Confirm password" value={form.confirmPassword} onChangeText={(v) => setField("confirmPassword", v)} secureTextEntry error={errors.confirmPassword} />
        </>
      ) : (
        <>
          <RegSelectField label="Faculty" value={form.faculty} onValueChange={(v) => setField("faculty", v)} options={ASSOCIATION_FACULTIES} error={errors.faculty} />
          <RegSelectField label="Category" value={form.category} onValueChange={(v) => setField("category", v)} options={ASSOCIATION_CATEGORIES} error={errors.category} />
          <RegTextField label="Description" value={form.description} onChangeText={(v) => setField("description", v)} multiline placeholder="What does your organization do?" />
          <RegTextField label="Instagram URL" value={form.instagramUrl} onChangeText={(v) => setField("instagramUrl", v)} autoCapitalize="none" keyboardType="url" />
          <RegTextField label="Facebook URL" value={form.facebookUrl} onChangeText={(v) => setField("facebookUrl", v)} autoCapitalize="none" keyboardType="url" />
          <RegTextField label="LinkedIn URL" value={form.linkedInUrl} onChangeText={(v) => setField("linkedInUrl", v)} autoCapitalize="none" keyboardType="url" />
        </>
      )}
    </RegistrationWizardLayout>
  );
}
