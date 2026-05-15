import type { ReactNode } from "react";
import { useState } from "react";
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
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, type Href } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  ASSOCIATION_CATEGORIES,
  registerStudentAssociation,
  uploadAssociationLogoFromUri,
} from "@/api/associationApi";
import { spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { setItem as storageSetItem } from "@/utils/authStorage";

const FACULTIES = [
  "Engineering and Information Technology",
  "Information Technology",
  "Science",
  "Medicine and Health Sciences",
  "Pharmacy",
  "Nursing",
  "Agriculture and Veterinary Medicine",
] as const;

type FormState = {
  associationName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  description: string;
  faculty: string;
  category: string;
  instagramUrl: string;
  facebookUrl: string;
  linkedInUrl: string;
};

export function AssociationRegisterStep({ onBack }: { onBack: () => void }) {
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [logoMime, setLogoMime] = useState<string | null>(null);
  const [facultyOpen, setFacultyOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field as string]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!form.associationName.trim()) e.associationName = "Organization name is required";
      if (!form.username.trim()) e.username = "Username is required";
      else if (!/^[a-zA-Z0-9_]+$/.test(form.username))
        e.username = "Letters, numbers, underscores only";
      if (!form.email.trim()) e.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
      if (!form.password) e.password = "Password is required";
      else if (form.password.length < 8) e.password = "Min. 8 characters";
      if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    }
    if (step === 1) {
      if (!form.faculty) e.faculty = "Faculty is required";
      if (!form.category) e.category = "Category is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickLogo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (res.canceled || !res.assets?.[0]) return;
    setLogoUri(res.assets[0].uri);
    setLogoMime(res.assets[0].mimeType ?? "image/jpeg");
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
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

      await storageSetItem("token", String(data.token ?? ""));
      await storageSetItem("userId", String(data.userId ?? ""));
      await storageSetItem("role", String(data.role ?? ""));
      await storageSetItem("name", String(data.name ?? ""));
      await storageSetItem("email", String(data.email ?? ""));

      if (logoUri && logoMime) {
        await uploadAssociationLogoFromUri(logoUri, logoMime);
      }

      router.replace("/organization/dashboard" as Href);
    } catch (err) {
      setApiError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const kav = Platform.OS === "ios" ? "padding" : undefined;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fffbeb" }} edges={["top", "left", "right"]}>
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
      >
        <View style={[styles.card, { maxWidth: layout.maxFormWidth, alignSelf: "center", width: "100%" }]}>
          <Text style={styles.stepHint}>
            Step {step + 1} of 2 · Student Organization
          </Text>
          {step === 0 ? (
            <>
              <Text style={styles.title}>Account</Text>
              <Text style={styles.sub}>Create your organization login</Text>
              <Pressable style={styles.logoPick} onPress={pickLogo}>
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={styles.logoImg} contentFit="cover" />
                ) : (
                  <Text style={styles.logoPickText}>+ Logo (optional, upload after account)</Text>
                )}
              </Pressable>
              <FormField
                label="Organization name"
                value={form.associationName}
                onChangeText={(t) => setField("associationName", t)}
                error={errors.associationName}
              />
              <FormField
                label="Username"
                value={form.username}
                onChangeText={(t) => setField("username", t)}
                error={errors.username}
                autoCapitalize="none"
              />
              <FormField
                label="Email"
                value={form.email}
                onChangeText={(t) => setField("email", t)}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <FormField
                label="Password"
                value={form.password}
                onChangeText={(t) => setField("password", t)}
                error={errors.password}
                secureTextEntry={!showPass}
                suffix={
                  <Pressable onPress={() => setShowPass((x) => !x)}>
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
                  <Pressable onPress={() => setShowConfirm((x) => !x)}>
                    <Text style={styles.eye}>{showConfirm ? "Hide" : "Show"}</Text>
                  </Pressable>
                }
              />
            </>
          ) : (
            <>
              <Text style={styles.title}>Details</Text>
              <Text style={styles.sub}>Tell students about your community</Text>
              <FormField
                label="Description (optional)"
                value={form.description}
                onChangeText={(t) => setField("description", t)}
                multiline
              />
              <Text style={styles.lbl}>Faculty *</Text>
              <Pressable style={styles.select} onPress={() => setFacultyOpen(true)}>
                <Text style={[styles.selectTxt, !form.faculty && styles.ph]}>
                  {form.faculty || "Select faculty"}
                </Text>
                <Text style={styles.chev}>▼</Text>
              </Pressable>
              {errors.faculty ? <Text style={styles.err}>{errors.faculty}</Text> : null}

              <Text style={styles.lbl}>Category *</Text>
              <Pressable style={styles.select} onPress={() => setCategoryOpen(true)}>
                <Text style={[styles.selectTxt, !form.category && styles.ph]}>
                  {form.category || "Select category"}
                </Text>
                <Text style={styles.chev}>▼</Text>
              </Pressable>
              {errors.category ? <Text style={styles.err}>{errors.category}</Text> : null}

              <FormField
                label="Instagram (optional)"
                value={form.instagramUrl}
                onChangeText={(t) => setField("instagramUrl", t)}
                autoCapitalize="none"
              />
              <FormField
                label="Facebook (optional)"
                value={form.facebookUrl}
                onChangeText={(t) => setField("facebookUrl", t)}
                autoCapitalize="none"
              />
              <FormField
                label="LinkedIn (optional)"
                value={form.linkedInUrl}
                onChangeText={(t) => setField("linkedInUrl", t)}
                autoCapitalize="none"
              />
            </>
          )}

          {apiError ? (
            <View style={styles.apiBox}>
              <Text style={styles.apiText}>❌ {apiError}</Text>
            </View>
          ) : null}

          <View style={styles.nav}>
            {step === 0 ? (
              <Pressable onPress={onBack} style={styles.outlineBtn}>
                <Text style={styles.outlineTxt}>Back</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => setStep(0)} style={styles.outlineBtn}>
                <Text style={styles.outlineTxt}>← Previous</Text>
              </Pressable>
            )}
            {step === 0 ? (
              <Pressable
                style={styles.primaryBtn}
                onPress={() => {
                  if (validate()) setStep(1);
                }}
              >
                <Text style={styles.primaryTxt}>Continue →</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.primaryBtn, loading && { opacity: 0.75 }]}
                onPress={() => void submit()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryTxt}>Create organization</Text>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={facultyOpen} transparent animationType="fade">
        <Pressable style={styles.modalBg} onPress={() => setFacultyOpen(false)}>
          <View style={styles.modalCard}>
            <ScrollView>
              {FACULTIES.map((f) => (
                <Pressable
                  key={f}
                  style={styles.modalRow}
                  onPress={() => {
                    setField("faculty", f);
                    setFacultyOpen(false);
                  }}
                >
                  <Text style={styles.modalRowTxt}>{f}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.modalX} onPress={() => setFacultyOpen(false)}>
              <Text style={styles.modalXTxt}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={categoryOpen} transparent animationType="fade">
        <Pressable style={styles.modalBg} onPress={() => setCategoryOpen(false)}>
          <View style={styles.modalCard}>
            <ScrollView>
              {ASSOCIATION_CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  style={styles.modalRow}
                  onPress={() => {
                    setField("category", c);
                    setCategoryOpen(false);
                  }}
                >
                  <Text style={styles.modalRowTxt}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.modalX} onPress={() => setCategoryOpen(false)}>
              <Text style={styles.modalXTxt}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  suffix?: ReactNode;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.lbl}>{label}</Text>
      <View style={[styles.inputRow, multiline && { alignItems: "flex-start" }]}>
        <TextInput
          style={[styles.input, multiline && { minHeight: 88, textAlignVertical: "top" }]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          placeholderTextColor="#94a3b8"
        />
        {suffix ? <View style={styles.suffix}>{suffix}</View> : null}
      </View>
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 18,
  },
  stepHint: { fontSize: 12, fontWeight: "700", color: "#d97706", marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  sub: { fontSize: 13, color: "#64748b", marginBottom: 14 },
  logoPick: {
    height: 88,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    overflow: "hidden",
    backgroundColor: "#fffbeb",
  },
  logoImg: { width: "100%", height: "100%" },
  logoPickText: { color: "#b45309", fontWeight: "700", fontSize: 13 },
  lbl: { fontSize: 12, fontWeight: "700", color: "#334155", marginBottom: 6 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    minHeight: 46,
    paddingHorizontal: 12,
  },
  input: { flex: 1, fontSize: 15, color: "#0f172a", paddingVertical: 10 },
  suffix: { marginLeft: 4 },
  eye: { color: "#4f46e5", fontWeight: "700", fontSize: 13 },
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 46,
    backgroundColor: "#f8fafc",
    marginBottom: 12,
  },
  selectTxt: { flex: 1, fontSize: 14, color: "#0f172a", fontWeight: "600" },
  ph: { color: "#94a3b8", fontWeight: "500" },
  chev: { fontSize: 10, color: "#64748b" },
  err: { color: "#dc2626", fontSize: 12, marginTop: 4, fontWeight: "600" },
  apiBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  apiText: { color: "#dc2626", fontWeight: "600" },
  nav: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    flexWrap: "wrap",
  },
  outlineBtn: {
    flex: 1,
    minWidth: 120,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  outlineTxt: { fontWeight: "700", color: "#64748b" },
  primaryBtn: {
    flex: 1,
    minWidth: 120,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: "#d97706",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#d97706",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryTxt: { color: "#fff", fontWeight: "800" },
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
    maxHeight: "75%",
  },
  modalRow: { paddingVertical: 14, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  modalRowTxt: { fontSize: 14, color: "#334155" },
  modalX: { padding: 14, alignItems: "center" },
  modalXTxt: { color: "#d97706", fontWeight: "700" },
});
