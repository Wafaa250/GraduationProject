import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { analyzeCompany, registerCompany } from "@/api/companyApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { RegTextField } from "@/components/registration/RegTextField";
import { RegistrationWizardLayout } from "@/components/registration/RegistrationWizardLayout";
import { AUTH_COLORS } from "@/constants/authTheme";
import { persistAuthSession } from "@/lib/authSession";
import { setStoredCompanyRole } from "@/lib/companyWorkspace";
import { navigateHome } from "@/utils/homeNavigation";

const STEP_TITLES = ["Create your company account", "Company links", "Company profile"];
const STEP_SUBTITLES = [
  "Represent your organization on SkillSwap.",
  "We use AI to read your website or LinkedIn and fill your company profile.",
  "Review and edit your company details before creating your account.",
];

export default function CompanyRegisterScreen() {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [analysisNote, setAnalysisNote] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    contactName: "",
    email: "",
    password: "",
    confirmPassword: "",
    websiteUrl: "",
    linkedInUrl: "",
    companyName: "",
    industry: "",
    description: "",
  });

  const setField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setApiError(null);
  };

  const hasLink = () => Boolean(form.websiteUrl.trim() || form.linkedInUrl.trim());

  const validate = () => {
    const next: Record<string, string> = {};
    if (step === 0) {
      if (!form.contactName.trim()) next.contactName = "Contact name is required";
      if (!form.email.trim()) next.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Invalid email";
      if (!form.password) next.password = "Password is required";
      else if (form.password.length < 8) next.password = "Min. 8 characters";
      if (form.password !== form.confirmPassword) next.confirmPassword = "Passwords do not match";
    }
    if (step === 2) {
      if (!form.companyName.trim()) next.companyName = "Company name is required";
      if (!hasLink() && form.description.trim().length < 40) {
        next.description =
          "Add a website or LinkedIn on the previous step, or write at least 40 characters about your company here.";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const runAnalyze = async () => {
    if (!hasLink()) {
      setErrors({ websiteUrl: "Add a website or LinkedIn URL to analyze" });
      return;
    }
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setApiError(null);
    setAnalysisNote(null);
    try {
      const result = await analyzeCompany({
        websiteUrl: form.websiteUrl.trim() || undefined,
        linkedInUrl: form.linkedInUrl.trim() || undefined,
      });
      setForm((prev) => ({
        ...prev,
        companyName: result.companyName || prev.companyName,
        industry: result.industry ?? prev.industry,
        description: result.description ?? prev.description,
      }));
      setAnalysisNote(result.message ?? (result.usedAi ? "Profile imported with AI." : "Profile details updated."));
      setStep(2);
    } catch (error) {
      setApiError(parseApiErrorMessage(error));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const submit = async () => {
    if (!validate()) return;
    if (isLoading) return;
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await registerCompany({
        contactName: form.contactName.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        companyName: form.companyName.trim(),
        industry: form.industry.trim() || undefined,
        description: form.description.trim() || undefined,
        websiteUrl: form.websiteUrl.trim() || undefined,
        linkedInUrl: form.linkedInUrl.trim() || undefined,
      });
      await persistAuthSession(data);
      await setStoredCompanyRole(data.companyRole ?? "owner");
      await navigateHome();
    } catch (error) {
      setApiError(parseApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (step === 1) {
      if (hasLink()) {
        runAnalyze();
      } else {
        setStep(2);
      }
      return;
    }
    if (!validate()) return;
    if (step < 2) setStep((s) => s + 1);
    else submit();
  };

  const handleBack = () => {
    if (step === 0) router.replace("/register");
    else setStep((s) => Math.max(0, s - 1));
  };

  const busy = isLoading || isAnalyzing;

  return (
    <RegistrationWizardLayout
      stepLabel={`Step ${step + 1} of 3 · Company registration`}
      title={STEP_TITLES[step]}
      subtitle={STEP_SUBTITLES[step]}
      onBack={handleBack}
      onContinue={handleContinue}
      continueLabel={step === 1 ? "Analyze & continue" : step === 2 ? "Create account" : "Continue"}
      isLoading={busy}
      apiError={apiError}
      backLinkLabel={step === 0 ? "← Change account type" : "← Back"}
    >
      {step === 0 ? (
        <>
          <RegTextField label="Contact name" value={form.contactName} onChangeText={(v) => setField("contactName", v)} autoCapitalize="words" error={errors.contactName} />
          <RegTextField label="Email" value={form.email} onChangeText={(v) => setField("email", v)} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
          <RegTextField label="Password" value={form.password} onChangeText={(v) => setField("password", v)} secureTextEntry error={errors.password} />
          <RegTextField label="Confirm password" value={form.confirmPassword} onChangeText={(v) => setField("confirmPassword", v)} secureTextEntry error={errors.confirmPassword} />
        </>
      ) : null}

      {step === 1 ? (
        <>
          <RegTextField label="Website URL" value={form.websiteUrl} onChangeText={(v) => setField("websiteUrl", v)} autoCapitalize="none" keyboardType="url" error={errors.websiteUrl} />
          <RegTextField label="LinkedIn URL" value={form.linkedInUrl} onChangeText={(v) => setField("linkedInUrl", v)} autoCapitalize="none" keyboardType="url" />
          <Text style={styles.hint}>Add at least one link so SkillSwap can import your company profile.</Text>
        </>
      ) : null}

      {step === 2 ? (
        <>
          {analysisNote ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>{analysisNote}</Text>
            </View>
          ) : null}
          <RegTextField label="Company name" value={form.companyName} onChangeText={(v) => setField("companyName", v)} error={errors.companyName} />
          <RegTextField label="Industry" value={form.industry} onChangeText={(v) => setField("industry", v)} />
          <RegTextField label="Description" value={form.description} onChangeText={(v) => setField("description", v)} multiline error={errors.description} />
        </>
      ) : null}
    </RegistrationWizardLayout>
  );
}

const styles = StyleSheet.create({
  hint: {
    color: AUTH_COLORS.muted,
    fontSize: 13,
    marginBottom: 8,
  },
  noteBox: {
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  noteText: {
    color: AUTH_COLORS.foreground,
    fontSize: 13,
  },
});
