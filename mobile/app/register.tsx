import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

type UserRole = "student" | "doctor" | "company" | "association" | null;
type Step = 1 | 2;

type RoleCard = {
  id: Exclude<UserRole, null>;
  title: string;
  desc: string;
  icon: string;
  selectedBg: string;
  selectedBorder: string;
  iconBg: string;
};

const ROLES: RoleCard[] = [
  {
    id: "student",
    title: "Student",
    desc: "Looking for teammates & projects",
    icon: "🎓",
    selectedBg: "#eef2ff",
    selectedBorder: "#6366f1",
    iconBg: "#6366f1",
  },
  {
    id: "doctor",
    title: "Doctor / Supervisor",
    desc: "Seeking research collaborators",
    icon: "🩺",
    selectedBg: "#eff6ff",
    selectedBorder: "#3b82f6",
    iconBg: "#3b82f6",
  },
  {
    id: "company",
    title: "Company",
    desc: "Find talented students",
    icon: "🏢",
    selectedBg: "#ecfdf5",
    selectedBorder: "#10b981",
    iconBg: "#10b981",
  },
  {
    id: "association",
    title: "Student Association",
    desc: "Connect with student communities",
    icon: "👥",
    selectedBg: "#fffbeb",
    selectedBorder: "#f59e0b",
    iconBg: "#f59e0b",
  },
];

export default function RegisterScreen() {
  const [step, setStep] = useState<Step>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedRoleData = useMemo(
    () => ROLES.find((role) => role.id === selectedRole),
    [selectedRole]
  );

  const validateAccount = () => {
    const nextErrors: Record<string, string> = {};
    if (!fullName.trim()) nextErrors.fullName = "Full name is required";
    if (!email.trim()) nextErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = "Please enter a valid email";
    if (!password) nextErrors.password = "Password is required";
    else if (password.length < 8) nextErrors.password = "Password must be at least 8 characters";
    if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = async () => {
    if (!selectedRole) return;
    await SecureStore.setItemAsync("selectedRole", selectedRole);
    setStep(2);
  };

  const handleBack = async () => {
    await SecureStore.deleteItemAsync("selectedRole");
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!validateAccount()) return;

    setIsLoading(true);
    setApiError(null);
    try {
      const response = await fetch("http://10.0.2.2:5262/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName,
          email,
          password,
          confirmPassword,
          role: selectedRole,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Something went wrong. Please try again.");
      }

      router.replace("/login");
    } catch (error: any) {
      const msg =
        error?.message ||
        "Something went wrong. Please try again.";
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.bgBlobTop} />
      <View style={styles.bgBlobBottom} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.cardWrap}>
          <View style={styles.card}>
            <View style={styles.topGradientBar} />

            <View style={styles.cardContent}>
              <View style={styles.logoRow}>
                <View style={styles.logoIcon}>
                  <Text style={styles.logoIconText}>▲</Text>
                </View>
                <Text style={styles.logoText}>
                  Skill<Text style={styles.logoAccent}>Swap</Text>
                </Text>
              </View>

              <View style={styles.stepperRow}>
                {[1, 2].map((s) => {
                  const isActive = step === s;
                  const isDone = step > s;
                  return (
                    <View key={s} style={styles.stepperItem}>
                      <View
                        style={[
                          styles.stepDot,
                          (isActive || isDone) && styles.stepDotActive,
                        ]}
                      >
                        <Text style={[styles.stepDotText, (isActive || isDone) && styles.stepDotTextActive]}>
                          {s}
                        </Text>
                      </View>
                      <Text style={[styles.stepLabel, isActive ? styles.stepLabelActive : styles.stepLabelIdle]}>
                        {s === 1 ? "Choose Role" : "Account Info"}
                      </Text>
                      {s < 2 ? (
                        <View style={[styles.stepLine, step > 1 ? styles.stepLineDone : styles.stepLineIdle]} />
                      ) : null}
                    </View>
                  );
                })}
              </View>

              {step === 1 ? (
                <>
                  <Text style={styles.title}>How will you use SkillSwap?</Text>
                  <Text style={styles.subtitle}>Choose your role to get started</Text>

                  <View style={styles.rolesGrid}>
                    {ROLES.map((role) => {
                      const isSelected = selectedRole === role.id;
                      return (
                        <Pressable
                          key={role.id}
                          style={[
                            styles.roleCard,
                            isSelected
                              ? { backgroundColor: role.selectedBg, borderColor: role.selectedBorder }
                              : styles.roleCardIdle,
                          ]}
                          onPress={() => setSelectedRole(role.id)}
                        >
                          {isSelected ? <Text style={styles.roleSelectedMark}>✓</Text> : null}
                          <View style={[styles.roleIconCircle, { backgroundColor: role.iconBg }]}>
                            <Text style={styles.roleIcon}>{role.icon}</Text>
                          </View>
                          <Text style={styles.roleTitle}>{role.title}</Text>
                          <Text style={styles.roleDesc}>{role.desc}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Pressable
                    style={[styles.primaryButton, !selectedRole && styles.primaryButtonDisabled]}
                    onPress={handleNext}
                    disabled={!selectedRole}
                  >
                    <Text style={styles.primaryButtonText}>
                      Continue as {selectedRoleData?.title ?? "..."}
                    </Text>
                  </Pressable>

                  <Text style={styles.bottomText}>
                    Already have an account?{" "}
                    <Text style={styles.bottomLink} onPress={() => router.replace("/login")}>
                      Sign in
                    </Text>
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.title}>Account Information</Text>
                  <Text style={styles.subtitle}>Create your SkillSwap account</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                      value={fullName}
                      onChangeText={(text) => {
                        setFullName(text);
                        setErrors((prev) => ({ ...prev, fullName: "" }));
                      }}
                      placeholder="Mohammad Abdullah"
                      style={[styles.input, errors.fullName ? styles.inputError : null]}
                      editable={!isLoading}
                    />
                    {errors.fullName ? <Text style={styles.errorInline}>{errors.fullName}</Text> : null}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      placeholder="student@najah.edu"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={[styles.input, errors.email ? styles.inputError : null]}
                      editable={!isLoading}
                    />
                    {errors.email ? <Text style={styles.errorInline}>{errors.email}</Text> : null}
                  </View>

                  <View style={styles.row2}>
                    <View style={styles.halfCol}>
                      <Text style={styles.label}>Password</Text>
                      <View style={styles.passwordWrap}>
                        <TextInput
                          value={password}
                          onChangeText={(text) => {
                            setPassword(text);
                            setErrors((prev) => ({ ...prev, password: "" }));
                          }}
                          placeholder="Min. 8 characters"
                          secureTextEntry={!showPassword}
                          style={[
                            styles.input,
                            styles.passwordInput,
                            errors.password ? styles.inputError : null,
                          ]}
                          editable={!isLoading}
                        />
                        <Pressable
                          onPress={() => setShowPassword((prev) => !prev)}
                          style={styles.eyeButton}
                          disabled={isLoading}
                        >
                          <Text style={styles.eyeButtonText}>{showPassword ? "Hide" : "Show"}</Text>
                        </Pressable>
                      </View>
                      {errors.password ? <Text style={styles.errorInline}>{errors.password}</Text> : null}
                    </View>

                    <View style={styles.halfCol}>
                      <Text style={styles.label}>Confirm Password</Text>
                      <View style={styles.passwordWrap}>
                        <TextInput
                          value={confirmPassword}
                          onChangeText={(text) => {
                            setConfirmPassword(text);
                            setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                          }}
                          placeholder="Re-enter password"
                          secureTextEntry={!showConfirmPassword}
                          style={[
                            styles.input,
                            styles.passwordInput,
                            errors.confirmPassword ? styles.inputError : null,
                          ]}
                          editable={!isLoading}
                        />
                        <Pressable
                          onPress={() => setShowConfirmPassword((prev) => !prev)}
                          style={styles.eyeButton}
                          disabled={isLoading}
                        >
                          <Text style={styles.eyeButtonText}>{showConfirmPassword ? "Hide" : "Show"}</Text>
                        </Pressable>
                      </View>
                      {errors.confirmPassword ? (
                        <Text style={styles.errorInline}>{errors.confirmPassword}</Text>
                      ) : null}
                    </View>
                  </View>

                  {apiError ? <Text style={styles.apiError}>❌ {apiError}</Text> : null}

                  <View style={styles.actionRow}>
                    <Pressable style={styles.backButton} onPress={handleBack} disabled={isLoading}>
                      <Text style={styles.backButtonText}>Back</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.primaryButton, styles.submitBtn, isLoading && styles.primaryButtonDisabled]}
                      onPress={handleSubmit}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <View style={styles.loadingRow}>
                          <ActivityIndicator size="small" color="#ffffff" />
                          <Text style={styles.primaryButtonText}>Creating...</Text>
                        </View>
                      ) : (
                        <Text style={styles.primaryButtonText}>Create Account</Text>
                      )}
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f7ff",
  },
  bgBlobTop: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 500,
    height: 500,
    borderRadius: 500,
    backgroundColor: "rgba(99,102,241,0.10)",
  },
  bgBlobBottom: {
    position: "absolute",
    bottom: -80,
    left: -80,
    width: 400,
    height: 400,
    borderRadius: 400,
    backgroundColor: "rgba(168,85,247,0.08)",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  cardWrap: {
    width: "100%",
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 560,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
    shadowColor: "#6366f1",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  topGradientBar: {
    height: 6,
    backgroundColor: "#7c3aed",
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366f1",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logoIconText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    transform: [{ rotate: "90deg" }],
  },
  logoText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },
  logoAccent: {
    color: "#7c3aed",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  stepperItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
  },
  stepDotActive: {
    backgroundColor: "#6366f1",
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
  },
  stepDotTextActive: {
    color: "#ffffff",
  },
  stepLabel: {
    marginLeft: 8,
    marginRight: 8,
    fontSize: 12,
    fontWeight: "500",
  },
  stepLabelActive: {
    color: "#334155",
  },
  stepLabelIdle: {
    color: "#94a3b8",
  },
  stepLine: {
    width: 32,
    height: 1,
  },
  stepLineDone: {
    backgroundColor: "#a5b4fc",
  },
  stepLineIdle: {
    backgroundColor: "#e2e8f0",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 24,
  },
  rolesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: 24,
  },
  roleCard: {
    width: "48.5%",
    minHeight: 148,
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 14,
    position: "relative",
  },
  roleCardIdle: {
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  roleSelectedMark: {
    position: "absolute",
    right: 10,
    top: 8,
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "900",
  },
  roleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  roleIcon: {
    fontSize: 18,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  roleDesc: {
    fontSize: 11,
    color: "#64748b",
    lineHeight: 16,
  },
  primaryButton: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6d28d9",
    shadowColor: "#6366f1",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  submitBtn: {
    width: 170,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  bottomText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    color: "#64748b",
  },
  bottomLink: {
    color: "#4f46e5",
    fontWeight: "700",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    color: "#1e293b",
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  inputError: {
    borderColor: "#fca5a5",
  },
  errorInline: {
    marginTop: 4,
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "500",
  },
  row2: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  halfCol: {
    width: "48%",
  },
  passwordWrap: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 52,
  },
  eyeButton: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  eyeButtonText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
  },
  apiError: {
    marginTop: 10,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "500",
  },
  actionRow: {
    marginTop: 6,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    backgroundColor: "#ffffff",
  },
  backButtonText: {
    color: "#64748b",
    fontWeight: "600",
    fontSize: 14,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  successWrap: {
    flex: 1,
    marginHorizontal: 20,
    marginVertical: 60,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
    shadowColor: "#6366f1",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  successIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  successText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
    marginBottom: 24,
  },
  successName: {
    color: "#6366f1",
    fontWeight: "700",
  },
});
