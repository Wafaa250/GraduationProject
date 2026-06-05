import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { analyzeCompany, registerCompany } from "@/api/companyApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { AnalysisNoteBanner } from "@/components/registration/AnalysisNoteBanner";
import { CompanyOnboardingBadge } from "@/components/registration/CompanyOnboardingBadge";
import { GradientAuthButton } from "@/components/auth/GradientAuthButton";
import { OutlineAuthButton } from "@/components/registration/OutlineAuthButton";
import { PasswordStrengthBar } from "@/components/registration/PasswordStrengthBar";
import { RegTextField } from "@/components/registration/RegTextField";
import { RegistrationWizardLayout } from "@/components/registration/RegistrationWizardLayout";
import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { persistAuthSession } from "@/lib/authSession";
import { setStoredCompanyRole } from "@/lib/companyWorkspace";
import { navigateHome } from "@/utils/homeNavigation";

const STEP_TITLES = ["Create your company account", "Company links", "Company profile"];
const STEP_SUBTITLES = [
  "Represent your organization on SkillSwap.",
  "Provide at least one link. If you only have LinkedIn, that works too.",
  "Review and edit your company details before creating your account.",
];

export default function CompanyRegisterScreen() {
  const layout = useResponsiveLayout();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [analysisNote, setAnalysisNote] = useState<string | null>(null);
  const [skippedAi, setSkippedAi] = useState(false);
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

  const profileSubtitle = useMemo(
    () =>
      skippedAi
        ? "Enter your company details manually. Add a website or LinkedIn on the previous step anytime if you have one."
        : "Review and edit what AI suggested before creating your account.",
    [skippedAi],
  );

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
      setErrors({ websiteUrl: "Add your website or LinkedIn URL" });
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
      setAnalysisNote(
        result.message ?? (result.usedAi ? "Company profile analyzed with AI." : "Profile draft ready — please review."),
      );
      setSkippedAi(false);
      setStep(2);
    } catch (error) {
      setApiError(parseApiErrorMessage(error));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const skipAiAndGoManual = () => {
    setErrors((e) => ({ ...e, websiteUrl: "" }));
    setAnalysisNote(null);
    setSkippedAi(true);
    setStep(2);
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
    if (!validate()) return;
    if (step < 2) setStep((s) => s + 1);
    else submit();
  };

  const handleBack = () => {
    if (step === 0) {
      router.replace("/register");
      return;
    }
    if (step === 2) setSkippedAi(false);
    setStep((s) => Math.max(0, s - 1));
  };

  const busy = isLoading || isAnalyzing;

  const linksStepFooter = (
    <View style={{ marginTop: layout.space("lg"), gap: layout.space("md"), width: "100%" }}>
      <GradientAuthButton
        label={isAnalyzing ? "Analyzing with AI…" : "Analyze company with AI"}
        onPress={() => void runAnalyze()}
        loading={isAnalyzing}
        disabled={busy}
        icon={!isAnalyzing ? <Ionicons name="sparkles" size={18} color="#FFFFFF" /> : undefined}
      />
      <OutlineAuthButton
        label="Skip AI — fill manually"
        onPress={skipAiAndGoManual}
        disabled={busy}
      />
      <Pressable onPress={handleBack} hitSlop={layout.space("sm")} disabled={busy}>
        <Text style={[styles.backLink, { fontSize: layout.fontSize.footer }]}>← Back</Text>
      </Pressable>
    </View>
  );

  return (
    <RegistrationWizardLayout
      stepLabel={`Step ${step + 1} of 3`}
      title={STEP_TITLES[step]}
      subtitle={step === 2 ? profileSubtitle : STEP_SUBTITLES[step]}
      badge={step === 0 ? <CompanyOnboardingBadge /> : null}
      onBack={handleBack}
      onContinue={handleContinue}
      continueLabel={step === 2 ? "Create company account" : "Continue"}
      isLoading={busy}
      apiError={apiError}
      backLinkLabel={step === 0 ? "← Change account type" : "← Back"}
      keyboardAvoiding
      customFooter={step === 1 ? linksStepFooter : undefined}
    >
      {step === 0 ? (
        <View style={styles.fullWidth}>
          <RegTextField
            label="Contact person name"
            value={form.contactName}
            onChangeText={(v) => setField("contactName", v)}
            placeholder="e.g. Sara Ahmad"
            autoCapitalize="words"
            error={errors.contactName}
          />
          <RegTextField
            label="Work email"
            value={form.email}
            onChangeText={(v) => setField("email", v)}
            placeholder="hr@company.com"
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
      ) : null}

      {step === 1 ? (
        <View style={styles.fullWidth}>
          <RegTextField
            label="Company website"
            value={form.websiteUrl}
            onChangeText={(v) => setField("websiteUrl", v)}
            placeholder="https://yourcompany.com"
            autoCapitalize="none"
            keyboardType="url"
            error={errors.websiteUrl}
          />
          <RegTextField
            label="LinkedIn company page"
            value={form.linkedInUrl}
            onChangeText={(v) => setField("linkedInUrl", v)}
            placeholder="https://linkedin.com/company/..."
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.fullWidth}>
          {skippedAi ? (
            <Text style={[styles.manualHint, { fontSize: layout.fontSize.footer, marginBottom: layout.space("md") }]}>
              No website yet? Describe your company clearly below (at least 40 characters), or go back and add a
              link.
            </Text>
          ) : null}
          {analysisNote ? <AnalysisNoteBanner message={analysisNote} /> : null}
          <RegTextField
            label="Company name"
            value={form.companyName}
            onChangeText={(v) => setField("companyName", v)}
            error={errors.companyName}
          />
          <RegTextField
            label="Industry"
            value={form.industry}
            onChangeText={(v) => setField("industry", v)}
            placeholder="e.g. Software, FinTech"
          />
          <RegTextField
            label="About company"
            value={form.description}
            onChangeText={(v) => setField("description", v)}
            placeholder="What does your company do?"
            multiline
            tall
            error={errors.description}
          />
          {hasLink() ? (
            <View style={[styles.linkSummary, { borderRadius: layout.radius.input, padding: layout.space("md") }]}>
              {form.websiteUrl.trim() ? (
                <Text style={[styles.linkLine, { fontSize: layout.fontSize.footer }]} numberOfLines={2}>
                  {form.websiteUrl.trim()}
                </Text>
              ) : null}
              {form.linkedInUrl.trim() ? (
                <Text style={[styles.linkLine, { fontSize: layout.fontSize.footer }]} numberOfLines={2}>
                  {form.linkedInUrl.trim()}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </RegistrationWizardLayout>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: "100%",
  },
  backLink: {
    textAlign: "center",
    color: AUTH_COLORS.muted,
    fontWeight: "500",
  },
  manualHint: {
    color: AUTH_COLORS.muted,
    lineHeight: 20,
  },
  linkSummary: {
    width: "100%",
    backgroundColor: AUTH_COLORS.primarySoft,
    borderWidth: 1,
    borderColor: AUTH_COLORS.border,
    gap: 4,
    marginTop: 4,
  },
  linkLine: {
    color: AUTH_COLORS.muted,
  },
});
