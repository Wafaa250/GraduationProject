import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

export default function LoginScreen() {
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
      const response = await fetch("http://10.0.2.2:5262/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Invalid email or password. Please try again.");
      }

      await SecureStore.setItemAsync("token", String(result.token ?? ""));
      await SecureStore.setItemAsync("userId", String(result.userId ?? ""));
      await SecureStore.setItemAsync("role", String(result.role ?? ""));
      await SecureStore.setItemAsync("name", String(result.name ?? ""));
      await SecureStore.setItemAsync("email", String(result.email ?? ""));

      const role = (result.role ?? "").toString().toLowerCase();
      if (role === "doctor") {
        router.replace("/doctor-dashboard");
      } else if (role === "student") {
        router.replace("/dashboard");
      } else if (role === "company") {
        router.replace("/company-dashboard");
      } else {
        router.replace("/dashboard");
      }
    } catch (error: any) {
      const msg = error?.message || "Invalid email or password. Please try again.";
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.blobTop} />
          <View style={styles.blobBottom} />

          <View style={styles.content}>
            <View style={styles.logoRow}>
              <View style={styles.logoBox}>
                <Text style={styles.logoIcon}>▲</Text>
              </View>
              <Text style={styles.logoText}>
                Skill<Text style={styles.logoTextGradient}>Swap</Text>
              </Text>
            </View>

            <Text style={styles.title}>Welcome back 👋</Text>
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
                style={[styles.input, styles.passwordInput]}
                editable={!isLoading}
              />
              <Pressable
                style={styles.toggleButton}
                onPress={() => setShowPassword((prev) => !prev)}
                disabled={isLoading}
              >
                <Text style={styles.toggleText}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </View>
          </View>

          {apiError ? <Text style={styles.errorText}>❌ {apiError}</Text> : null}

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
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable style={styles.googleButton} disabled={isLoading}>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </Pressable>

            <Text style={styles.registerText}>
              Don't have an account?{" "}
              <Text style={styles.registerLink} onPress={() => router.push("/register")}>
                Sign up for free
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    maxWidth: 448,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 48,
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
    top: -80,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: "rgba(99, 102, 241, 0.08)",
  },
  blobBottom: {
    position: "absolute",
    bottom: -60,
    right: -60,
    width: 250,
    height: 250,
    borderRadius: 999,
    backgroundColor: "rgba(168, 85, 247, 0.07)",
  },
  content: {
    position: "relative",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    marginRight: 10,
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
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
  },
  logoTextGradient: {
    color: "#7c3aed",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
    fontSize: 14,
    color: "#64748b",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  passwordRow: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 70,
  },
  toggleButton: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4f46e5",
  },
  errorText: {
    marginBottom: 14,
    fontSize: 14,
    color: "#dc2626",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
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
    gap: 8,
  },
  submitText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 24,
    columnGap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  dividerText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
  googleButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    paddingVertical: 14,
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
    color: "#64748b",
    marginTop: 28,
  },
  registerLink: {
    color: "#4f46e5",
    fontWeight: "700",
  },
});