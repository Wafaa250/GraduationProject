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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";

import api, { parseApiErrorMessage } from "@/api/axiosInstance";
import { AuthChrome } from "@/components/auth/AuthChrome";
import { SkillSwapLogo } from "@/components/auth/SkillSwapLogo";
import { radius, spacing } from "@/constants/responsiveLayout";
import { SS } from "@/constants/skillswapTheme";
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
  const { horizontalPadding, maxFormWidth } = useResponsiveLayout();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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
      } else if (role === "company") {
        router.replace("/company/dashboard" as Href);
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
    <AuthChrome edges={["top", "left", "right", "bottom"]}>
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
              paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.lg),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.column, { maxWidth: maxFormWidth }]}>
            <SkillSwapLogo size="md" centered style={styles.logo} />
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue collaborating on SkillSwap.</Text>

            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email address</Text>
                <View style={styles.inputShell}>
                  <Ionicons name="mail-outline" size={18} color={SS.muted} style={styles.inputIcon} />
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
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, styles.labelStandalone]}>Password</Text>
                <View style={styles.inputShell}>
                  <Ionicons name="lock-closed-outline" size={18} color={SS.muted} style={styles.inputIcon} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    style={styles.input}
                    editable={!isLoading}
                    placeholderTextColor="#94a3b8"
                  />
                  <Pressable
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((prev) => !prev)}
                    disabled={isLoading}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={SS.muted}
                    />
                  </Pressable>
                </View>
              </View>

              {apiError ? (
                <Text style={styles.errorText} accessibilityRole="alert">
                  {apiError}
                </Text>
              ) : null}

              <Pressable
                style={[styles.submitWrap, isLoading && styles.submitDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[...SS.gradientPrimary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitButton}
                >
                  {isLoading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color={SS.primaryForeground} />
                      <Text style={styles.submitText}>Signing in…</Text>
                    </View>
                  ) : (
                    <View style={styles.loadingRow}>
                      <Text style={styles.submitText}>Sign in</Text>
                      <Ionicons name="arrow-forward" size={18} color={SS.primaryForeground} />
                    </View>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            <Text style={styles.registerText}>
              Don&apos;t have an account?{" "}
              <Text style={styles.registerLink} onPress={() => router.push("/register")}>
                Sign up for free
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthChrome>
  );
}

const styles = StyleSheet.create({
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
    paddingTop: spacing.xl,
  },
  column: {
    width: "100%",
    alignSelf: "center",
  },
  logo: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: SS.foreground,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    fontSize: 15,
    lineHeight: 22,
    color: SS.muted,
    textAlign: "center",
  },
  card: {
    width: "100%",
    backgroundColor: SS.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: SS.border,
    padding: spacing.xl,
    ...SS.shadowPop,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: SS.muted,
  },
  labelStandalone: {
    marginBottom: spacing.sm,
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: SS.border,
    borderRadius: radius.lg,
    backgroundColor: SS.background,
    minHeight: 48,
  },
  inputIcon: {
    marginLeft: spacing.md,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
    fontSize: 16,
    color: SS.foreground,
  },
  eyeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  errorText: {
    marginBottom: spacing.md,
    fontSize: 14,
    lineHeight: 20,
    color: SS.destructive,
    backgroundColor: SS.destructiveBg,
    borderWidth: 1,
    borderColor: SS.destructiveBorder,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  submitWrap: {
    borderRadius: radius.lg,
    overflow: "hidden",
    ...SS.shadowGlow,
  },
  submitDisabled: {
    opacity: 0.75,
  },
  submitButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    paddingVertical: 14,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  submitText: {
    color: SS.primaryForeground,
    fontSize: 16,
    fontWeight: "700",
  },
  registerText: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
    color: SS.muted,
    marginTop: spacing.xl,
  },
  registerLink: {
    color: SS.primaryBright,
    fontWeight: "700",
  },
});
