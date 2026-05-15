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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";

import api, { parseApiErrorMessage } from "@/api/axiosInstance";
import { radius, spacing } from "@/constants/responsiveLayout";
import { setItem as storageSetItem } from "@/utils/authStorage";
import { isAssociationRole } from "@/utils/organizationRole";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type AuthLoginResponse = {
  token: string;
  role: string;
  userId: number;
  name: string;
  email: string;
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { horizontalPadding, maxFormWidth, blobDiameter } = useResponsiveLayout();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const topBlob = blobDiameter(0.95);
  const bottomBlob = blobDiameter(0.78);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setApiError("Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      const { data: result } = await api.post<AuthLoginResponse>("/auth/login", {
        email: email.trim(),
        password,
      });

      await storageSetItem("token", String(result.token ?? ""));
      await storageSetItem("userId", String(result.userId ?? ""));
      await storageSetItem("role", String(result.role ?? ""));
      await storageSetItem("name", String(result.name ?? ""));
      await storageSetItem("email", String(result.email ?? ""));

      const role = (result.role ?? "").toString().toLowerCase();
      if (role === "doctor") {
        router.replace("/doctor-dashboard" as Href);
      } else if (isAssociationRole(role)) {
        router.replace("/organization/dashboard" as Href);
      } else if (role === "student") {
        router.replace("/dashboard");
      } else {
        router.replace("/dashboard");
      }
    } catch (error: unknown) {
      setApiError(parseApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const kavBehavior = Platform.OS === "ios" ? "padding" : undefined;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={kavBehavior}
        keyboardVerticalOffset={insets.top + spacing.sm}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: horizontalPadding,
              paddingTop: spacing.lg,
              paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.lg),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.cardOuter, { maxWidth: maxFormWidth }]}>
            <View style={styles.card}>
              <View
                style={[
                  styles.blobTop,
                  {
                    width: topBlob,
                    height: topBlob,
                    borderRadius: topBlob / 2,
                    top: -topBlob * 0.28,
                    left: -topBlob * 0.28,
                  },
                ]}
              />
              <View
                style={[
                  styles.blobBottom,
                  {
                    width: bottomBlob,
                    height: bottomBlob,
                    borderRadius: bottomBlob / 2,
                    bottom: -bottomBlob * 0.22,
                    right: -bottomBlob * 0.22,
                  },
                ]}
              />

              <View style={styles.content}>
                <View style={styles.logoRow}>
                  <View style={styles.logoBox}>
                    <Text style={styles.logoIcon}>▲</Text>
                  </View>
                  <Text style={styles.logoText} numberOfLines={1}>
                    Skill<Text style={styles.logoTextGradient}>Swap</Text>
                  </Text>
                </View>

                <Text style={styles.title} numberOfLines={2}>
                  Welcome back 👋
                </Text>
                <Text style={styles.subtitle}>
                  Sign in to continue building your dream team
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@university.edu"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.input}
                    editable={!isLoading}
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordRow}>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      secureTextEntry={!showPassword}
                      style={styles.passwordField}
                      editable={!isLoading}
                      placeholderTextColor="#94a3b8"
                    />
                    <Pressable
                      style={styles.toggleButton}
                      onPress={() => setShowPassword((prev) => !prev)}
                      disabled={isLoading}
                      hitSlop={8}
                    >
                      <Text style={styles.toggleText}>{showPassword ? "Hide" : "Show"}</Text>
                    </Pressable>
                  </View>
                </View>

                {apiError ? (
                  <Text style={styles.errorText} accessibilityRole="alert">
                    ❌ {apiError}
                  </Text>
                ) : null}

                <Pressable
                  style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.submitText}>Signing in...</Text>
                    </View>
                  ) : (
                    <Text style={styles.submitText}>Sign In</Text>
                  )}
                </Pressable>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText} numberOfLines={1}>
                    or continue with
                  </Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable style={styles.googleButton} disabled={isLoading}>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </Pressable>

                <Text style={styles.registerText}>
                  {"Don't have an account? "}
                  <Text style={styles.registerLink} onPress={() => router.push("/register")}>
                    Sign up for free
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardOuter: {
    width: "100%",
    alignSelf: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: radius.card,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  blobTop: {
    position: "absolute",
    backgroundColor: "rgba(99, 102, 241, 0.08)",
  },
  blobBottom: {
    position: "absolute",
    backgroundColor: "rgba(168, 85, 247, 0.07)",
  },
  content: {
    position: "relative",
    width: "100%",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xxxl,
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366f1",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logoIcon: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    transform: [{ rotate: "90deg" }],
  },
  logoText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    flexShrink: 1,
  },
  logoTextGradient: {
    color: "#7c3aed",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: spacing.sm,
    flexShrink: 1,
  },
  subtitle: {
    marginBottom: spacing.xl,
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
    flexShrink: 1,
  },
  inputGroup: {
    marginBottom: spacing.lg,
    width: "100%",
  },
  label: {
    marginBottom: spacing.sm,
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
    minHeight: 48,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: radius.lg,
    backgroundColor: "#f8fafc",
    minHeight: 48,
    paddingLeft: spacing.lg,
    overflow: "hidden",
  },
  passwordField: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    paddingRight: spacing.sm,
    fontSize: 16,
    color: "#0f172a",
  },
  toggleButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    justifyContent: "center",
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4f46e5",
  },
  errorText: {
    marginBottom: 14,
    fontSize: 14,
    lineHeight: 20,
    color: "#dc2626",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    flexShrink: 1,
  },
  submitButton: {
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    width: "100%",
    backgroundColor: "#6d28d9",
    shadowColor: "#6366f1",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  submitText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.lg,
    flexWrap: "nowrap",
    width: "100%",
  },
  dividerLine: {
    flex: 1,
    minWidth: 0,
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  dividerText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
    flexShrink: 0,
  },
  googleButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    minHeight: 48,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  googleButtonText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "500",
  },
  registerText: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
    marginTop: spacing.xl + 4,
    flexShrink: 1,
  },
  registerLink: {
    color: "#4f46e5",
    fontWeight: "700",
  },
});
