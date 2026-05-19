import type { ReactNode } from "react";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, type Href } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import {
  analyzeCompany,
  parseApiErrorMessage,
  registerCompany,
} from "@/api/companyApi";
import { companyColors } from "@/constants/companyTheme";
import { spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { setItem as storageSetItem } from "@/utils/authStorage";

const STEP_LABELS = ["Account", "Company links", "Company profile"] as const;

type FormState = {
  contactName: string;
  email: string;
  password: string;
  confirmPassword: string;
  websiteUrl: string;
  linkedInUrl: string;
  companyName: string;
  industry: string;
  description: string;
  location: string;
};

export function CompanyRegisterStep({ onBack }: { onBack: () => void }) {
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    contactName: "",
    email: "",
    password: "",
    confirmPassword: "",
    websiteUrl: "",
    linkedInUrl: "",
    companyName: "",
    industry: "",
    description: "",
    location: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisNote, setAnalysisNote] = useState<string | null>(null);
  const [skippedAi, setSkippedAi] = useState(false);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field as string]: "" }));
  };

  const hasLink = () => Boolean(form.websiteUrl.trim() || form.linkedInUrl.trim());

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!form.contactName.trim()) e.contactName = "Contact name is required";
      if (!form.email.trim()) e.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
      if (!form.password) e.password = "Password is required";
      else if (form.password.length < 8) e.password = "Min. 8 characters";
      if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    }
    if (step === 2) {
      if (!form.companyName.trim()) e.companyName = "Company name is required";
      if (!hasLink() && form.description.trim().length < 40) {
        e.description =
          "Add a website or LinkedIn on the previous step, or write at least 40 characters about your company.";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goBack = () => {
    if (step === 0) onBack();
    else {
      if (step === 2) setSkippedAi(false);
      setStep((s) => Math.max(0, s - 1));
    }
  };

  const skipAiAndGoManual = () => {
    setErrors((e) => ({ ...e, websiteUrl: "" }));
    setAnalysisNote(null);
    setSkippedAi(true);
    setStep(2);
  };

  const runAnalysis = async () => {
    if (!hasLink()) {
      setErrors({ websiteUrl: "Add your website or LinkedIn URL" });
      return;
    }
    setAnalyzing(true);
    setApiError(null);
    setAnalysisNote(null);
    try {
      const result = await analyzeCompany({
        websiteUrl: form.websiteUrl.trim() || undefined,
        linkedInUrl: form.linkedInUrl.trim() || undefined,
      });
      setForm((f) => ({
        ...f,
        companyName: result.companyName || f.companyName,
        industry: result.industry ?? "",
        description: result.description ?? "",
        location: result.location ?? "",
      }));
      if (result.message) setAnalysisNote(result.message);
      setSkippedAi(false);
      setStep(2);
    } catch (err) {
      setApiError(parseApiErrorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
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
        location: form.location.trim() || undefined,
        websiteUrl: form.websiteUrl.trim() || undefined,
        linkedInUrl: form.linkedInUrl.trim() || undefined,
      });

      await storageSetItem("token", String(data.token ?? ""));
      await storageSetItem("userId", String(data.userId ?? ""));
      await storageSetItem("role", String(data.role ?? ""));
      await storageSetItem("name", String(data.name ?? ""));
      await storageSetItem("email", String(data.email ?? ""));

      router.replace("/company/dashboard" as Href);
    } catch (err) {
      setApiError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const kav = Platform.OS === "ios" ? "padding" : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={kav}
        keyboardVerticalOffset={insets.top + spacing.sm}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: layout.horizontalPadding,
            paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.lg),
            paddingTop: spacing.md,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { maxWidth: layout.maxFormWidth, alignSelf: "center", width: "100%" }]}>
            <View style={styles.stepper}>
              {STEP_LABELS.map((label, i) => (
                <View key={label} style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepDot,
                      i === step && styles.stepDotActive,
                      i < step && styles.stepDotDone,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepDotText,
                        (i === step || i < step) && styles.stepDotTextActive,
                      ]}
                    >
                      {i < step ? "✓" : i + 1}
                    </Text>
                  </View>
                  <Text
                    style={[styles.stepLabel, i === step && styles.stepLabelActive]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </View>
              ))}
            </View>

            {step === 0 ? (
              <>
                <Text style={styles.title}>Account</Text>
                <Text style={styles.sub}>Create the account for your company representative</Text>
                <FormField
                  label="Your name (contact person) *"
                  value={form.contactName}
                  onChangeText={(t) => setField("contactName", t)}
                  error={errors.contactName}
                  placeholder="e.g. Sara Ahmad"
                />
                <FormField
                  label="Work email"
                  value={form.email}
                  onChangeText={(t) => setField("email", t)}
                  error={errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="hr@company.com"
                />
                <FormField
                  label="Password"
                  value={form.password}
                  onChangeText={(t) => setField("password", t)}
                  error={errors.password}
                  secureTextEntry={!showPass}
                  suffix={
                    <Pressable onPress={() => setShowPass((x) => !x)} hitSlop={8}>
                      <Text style={styles.eye}>{showPass ? "Hide" : "Show"}</Text>
                    </Pressable>
                  }
                />
                <FormField
                  label="Confirm password"
                  value={form.confirmPassword}
                  onChangeText={(t) => setField("confirmPassword", t)}
                  error={errors.confirmPassword}
                  secureTextEntry={!showConfirm}
                  suffix={
                    <Pressable onPress={() => setShowConfirm((x) => !x)} hitSlop={8}>
                      <Text style={styles.eye}>{showConfirm ? "Hide" : "Show"}</Text>
                    </Pressable>
                  }
                />
              </>
            ) : null}

            {step === 1 ? (
              <>
                <Text style={styles.title}>Company links</Text>
                <Text style={styles.sub}>
                  We use AI to read your website or LinkedIn and fill your company profile
                </Text>
                <FormField
                  label="Company website"
                  value={form.websiteUrl}
                  onChangeText={(t) => setField("websiteUrl", t)}
                  error={errors.websiteUrl}
                  placeholder="https://yourcompany.com"
                  autoCapitalize="none"
                />
                <FormField
                  label="LinkedIn company page"
                  value={form.linkedInUrl}
                  onChangeText={(t) => setField("linkedInUrl", t)}
                  placeholder="https://linkedin.com/company/..."
                  autoCapitalize="none"
                />
                <Text style={styles.hint}>Provide at least one link. LinkedIn alone is fine.</Text>
                <Pressable
                  style={[styles.analyzeBtn, analyzing && { opacity: 0.75 }]}
                  onPress={() => void runAnalysis()}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <View style={styles.row}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.analyzeTxt}>Analyzing with AI…</Text>
                    </View>
                  ) : (
                    <Text style={styles.analyzeTxt}>✨ Analyze company with AI</Text>
                  )}
                </Pressable>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <Text style={styles.title}>Company profile</Text>
                <Text style={styles.sub}>
                  {skippedAi
                    ? "Enter your company details manually. You can add links on the previous step anytime."
                    : "Review and edit what AI suggested before creating your account"}
                </Text>
                {skippedAi ? (
                  <Text style={styles.hint}>
                    No website yet? Write at least 40 characters about your company below, or go back and add a
                    link.
                  </Text>
                ) : null}
                {analysisNote ? <Text style={styles.note}>{analysisNote}</Text> : null}
                <FormField
                  label="Company name *"
                  value={form.companyName}
                  onChangeText={(t) => setField("companyName", t)}
                  error={errors.companyName}
                />
                <FormField
                  label="Industry"
                  value={form.industry}
                  onChangeText={(t) => setField("industry", t)}
                  placeholder="e.g. Software, FinTech"
                />
                <FormField
                  label="Location"
                  value={form.location}
                  onChangeText={(t) => setField("location", t)}
                  placeholder="e.g. Nablus, Palestine"
                />
                <FormField
                  label="About the company"
                  value={form.description}
                  onChangeText={(t) => setField("description", t)}
                  multiline
                  placeholder="What does your company do?"
                  error={errors.description}
                />
              </>
            ) : null}

            {apiError ? (
              <View style={styles.apiBox}>
                <Text style={styles.apiText}>❌ {apiError}</Text>
              </View>
            ) : null}

            <View style={styles.nav}>
              <Pressable onPress={goBack} style={styles.outlineBtn} disabled={loading || analyzing}>
                <Text style={styles.outlineTxt}>← Back</Text>
              </Pressable>
              {step === 0 ? (
                <Pressable
                  style={styles.primaryBtn}
                  onPress={() => {
                    if (validate()) setStep(1);
                  }}
                >
                  <Text style={styles.primaryTxt}>Continue →</Text>
                </Pressable>
              ) : null}
              {step === 1 ? (
                <Pressable style={styles.skipBtn} onPress={skipAiAndGoManual} disabled={analyzing}>
                  <Text style={styles.skipTxt}>Skip AI — fill manually →</Text>
                </Pressable>
              ) : null}
              {step === 2 ? (
                <Pressable
                  style={[styles.primaryBtn, loading && { opacity: 0.75 }]}
                  onPress={() => void submit()}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryTxt}>Create company account</Text>
                  )}
                </Pressable>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  multiline,
  placeholder,
  suffix,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences";
  multiline?: boolean;
  placeholder?: string;
  suffix?: ReactNode;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.lbl}>{label}</Text>
      <View style={[styles.inputRow, multiline && { alignItems: "flex-start" }]}>
        <TextInput
          style={[styles.input, multiline && { minHeight: 100, textAlignVertical: "top" }]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
        />
        {suffix ? <View style={styles.suffix}>{suffix}</View> : null}
      </View>
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: companyColors.bg },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: companyColors.accentBorder,
    padding: 18,
    shadowColor: companyColors.accent,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  stepper: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  stepItem: { flexDirection: "row", alignItems: "center", gap: 6, maxWidth: "100%" },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: { backgroundColor: companyColors.accent, borderColor: companyColors.accent },
  stepDotDone: { backgroundColor: companyColors.accent, borderColor: companyColors.accent },
  stepDotText: { fontSize: 11, fontWeight: "800", color: "#94a3b8" },
  stepDotTextActive: { color: "#fff" },
  stepLabel: { fontSize: 11, fontWeight: "600", color: "#94a3b8", flexShrink: 1 },
  stepLabelActive: { color: companyColors.accentDark },
  title: { fontSize: 22, fontWeight: "800", color: companyColors.text },
  sub: { fontSize: 13, color: companyColors.muted, marginBottom: 14, lineHeight: 19 },
  hint: { fontSize: 13, color: companyColors.muted, marginBottom: 12, lineHeight: 18 },
  note: {
    fontSize: 13,
    color: "#b45309",
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  lbl: { fontSize: 12, fontWeight: "700", color: "#334155", marginBottom: 6 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    minHeight: 48,
    paddingHorizontal: 12,
  },
  input: { flex: 1, fontSize: 16, color: "#0f172a", paddingVertical: 10 },
  suffix: { marginLeft: 4 },
  eye: { color: companyColors.accent, fontWeight: "700", fontSize: 13 },
  err: { color: "#dc2626", fontSize: 12, marginTop: 4, fontWeight: "600" },
  analyzeBtn: {
    marginTop: 8,
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: companyColors.ai,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  analyzeTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  apiBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  apiText: { color: "#dc2626", fontWeight: "600" },
  nav: { flexDirection: "column", gap: 10, marginTop: 18 },
  outlineBtn: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  outlineTxt: { fontWeight: "700", color: "#64748b" },
  skipBtn: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: companyColors.accentBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: companyColors.accentMuted,
  },
  skipTxt: { fontWeight: "700", color: companyColors.accentDark, fontSize: 14 },
  primaryBtn: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: companyColors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: companyColors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
