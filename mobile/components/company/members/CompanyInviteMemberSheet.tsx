import { CheckCircle2, Info, Mail, UserPlus, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  addCompanyMember,
  parseApiErrorMessage,
  type AddCompanyMemberResponse,
} from "@/api/companyApi";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { confirmAlert } from "@/lib/confirmAlert";
import { COMPANY_RADIUS, companyElevatedShadow } from "@/components/company/ui/companyDesignSystem";
import type { CompanyColorScheme } from "@/constants/companyTheme";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";

const ROLE_OPTIONS: { value: "owner" | "member"; label: string }[] = [
  { value: "member", label: "Member" },
  { value: "owner", label: "Owner" },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdded: (result: AddCompanyMemberResponse) => void;
};

function SuccessCheckRow({ text }: { text: string }) {
  const colors = useCompanyTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
      <CheckCircle2 size={18} color={colors.accent} strokeWidth={2.4} style={{ marginTop: 1 }} />
      <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", lineHeight: 20, color: colors.foreground }}>
        {text}
      </Text>
    </View>
  );
}

export function CompanyInviteMemberSheet({ visible, onClose, onAdded }: Props) {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(480)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "member">("member");
  const [submitting, setSubmitting] = useState(false);
  const [credentialsEmailed, setCredentialsEmailed] = useState(false);
  const [addedMemberEmail, setAddedMemberEmail] = useState<string | null>(null);

  const isSuccess = credentialsEmailed && Boolean(addedMemberEmail);
  const isDirty = fullName.trim().length > 0 || email.trim().length > 0 || role !== "member";
  const canSubmit = fullName.trim().length > 0 && email.trim().length > 0 && !submitting;

  const reset = () => {
    setFullName("");
    setEmail("");
    setRole("member");
    setCredentialsEmailed(false);
    setAddedMemberEmail(null);
    setSubmitting(false);
  };

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(480);
      fadeAnim.setValue(0);
      return;
    }

    reset();
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, damping: 26, stiffness: 280, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => nameRef.current?.focus(), 320);
    return () => clearTimeout(timer);
  }, [visible, slideAnim, fadeAnim]);

  const closeImmediately = () => {
    Keyboard.dismiss();
    reset();
    onClose();
  };

  const requestClose = () => {
    if (isSuccess) {
      closeImmediately();
      return;
    }
    if (isDirty) {
      confirmAlert({
        title: "Discard invite?",
        message: "Your changes will be lost.",
        cancelLabel: "Keep editing",
        confirmLabel: "Discard",
        destructive: true,
        onConfirm: closeImmediately,
      });
      return;
    }
    closeImmediately();
  };

  const handleSubmit = async () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail) return;

    Keyboard.dismiss();
    setSubmitting(true);
    try {
      const result = await addCompanyMember({
        fullName: trimmedName,
        email: trimmedEmail,
        role,
      });
      onAdded(result);
      if (result.credentialsEmailSent) {
        setAddedMemberEmail(result.member.email);
        setCredentialsEmailed(true);
      } else {
        Alert.alert("Member added", "Existing user linked to this workspace.");
        closeImmediately();
      }
    } catch (err) {
      Alert.alert("Could not add member", parseApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  const sheetContent = isSuccess ? (
    <Animated.View
      style={[
        styles.sheet,
        styles.sheetCompact,
        {
          paddingBottom: Math.max(insets.bottom, HOME_SPACE.lg),
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.handleWrap}>
        <View style={styles.handle} />
      </View>

      <View style={styles.successHeader}>
        <Text style={styles.successHeaderTitle}>Invitation sent</Text>
        <Pressable
          onPress={closeImmediately}
          hitSlop={10}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.85 }]}
          accessibilityLabel="Close"
        >
          <X size={20} color={colors.foreground} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View style={styles.successBody}>
        <View style={styles.successPanel}>
          <SuccessCheckRow text="Member added successfully." />
          <SuccessCheckRow text="Login credentials were sent to the member's email." />
        </View>

        <View style={styles.emailRow}>
          <Mail size={16} color={colors.accent} strokeWidth={2.2} />
          <Text style={styles.emailRowText}>
            Email sent to:{" "}
            <Text style={styles.successEmail}>{addedMemberEmail}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={closeImmediately}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.92 }]}
        >
          <Text style={styles.primaryBtnText}>Done</Text>
        </Pressable>
      </View>
    </Animated.View>
  ) : (
    <Animated.View
      style={[
        styles.sheet,
        {
          paddingBottom: Math.max(insets.bottom, HOME_SPACE.md),
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.handleWrap}>
        <View style={styles.handle} />
      </View>

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Add member</Text>
          <Text style={styles.subtitle}>Invite someone to your company workspace</Text>
        </View>
        <Pressable
          onPress={requestClose}
          hitSlop={10}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.85 }]}
          accessibilityLabel="Close"
        >
          <X size={20} color={colors.foreground} strokeWidth={2.2} />
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.form}
      >
        <View style={styles.hintCard}>
          <Info size={16} color={colors.accent} strokeWidth={2.2} />
          <Text style={styles.hintText}>
            New users receive login credentials by email and set a password on first sign-in.
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            ref={nameRef}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Jane Doe"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            ref={emailRef}
            value={email}
            onChangeText={setEmail}
            placeholder="jane@company.com"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => {
              if (canSubmit) void handleSubmit();
            }}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Role</Text>
          <View style={styles.segmentTrack}>
            {ROLE_OPTIONS.map((option) => {
              const selected = role === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setRole(option.value)}
                  style={[styles.segmentOption, selected && styles.segmentOptionSelected]}
                >
                  <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.roleHint}>
            {role === "owner"
              ? "Owners can manage members and workspace settings."
              : "Members can access requests, recommendations, and saved lists."}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => void handleSubmit()}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.primaryBtn,
            !canSubmit && styles.primaryBtnDisabled,
            pressed && canSubmit && { opacity: 0.92 },
          ]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <UserPlus size={17} color="#FFFFFF" strokeWidth={2.3} />
              <Text style={styles.primaryBtnText}>Add member</Text>
            </>
          )}
        </Pressable>
      </View>
    </Animated.View>
  );

  return (
    <Modal visible transparent animationType="none" onRequestClose={requestClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} accessibilityLabel="Close" />
        </Animated.View>

        {isSuccess ? (
          sheetContent
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardWrap}
            pointerEvents="box-none"
          >
            {sheetContent}
          </KeyboardAvoidingView>
        )}
      </View>
    </Modal>
  );
}

function createStyles(colors: CompanyColorScheme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
    },
    keyboardWrap: {
      justifyContent: "flex-end",
    },
    sheet: {
      maxHeight: "90%",
      backgroundColor: colors.cardBg,
      borderTopLeftRadius: COMPANY_RADIUS.xl,
      borderTopRightRadius: COMPANY_RADIUS.xl,
      ...companyElevatedShadow(colors),
    },
    sheetCompact: {
      maxHeight: undefined,
    },
    handleWrap: {
      alignItems: "center",
      paddingTop: HOME_SPACE.sm,
      paddingBottom: HOME_SPACE.xs,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: COMPANY_RADIUS.pill,
      backgroundColor: colors.border,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingHorizontal: HOME_SPACE.lg,
      paddingBottom: HOME_SPACE.sm,
      gap: HOME_SPACE.md,
    },
    successHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: HOME_SPACE.lg,
      paddingBottom: HOME_SPACE.md,
    },
    successHeaderTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.foreground,
      letterSpacing: -0.3,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.foreground,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.muted,
      marginTop: 3,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    form: {
      paddingHorizontal: HOME_SPACE.lg,
      paddingBottom: HOME_SPACE.md,
      gap: HOME_SPACE.md,
    },
    hintCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      padding: HOME_SPACE.md,
      borderRadius: COMPANY_RADIUS.md,
      backgroundColor: colors.accentSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.accentBorder,
    },
    hintText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 19,
      color: colors.textSecondary,
    },
    field: {
      gap: 8,
    },
    label: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.foreground,
    },
    input: {
      minHeight: 50,
      borderRadius: COMPANY_RADIUS.md,
      paddingHorizontal: HOME_SPACE.md,
      paddingVertical: Platform.OS === "ios" ? 14 : 12,
      fontSize: 16,
      color: colors.foreground,
      backgroundColor: colors.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    segmentTrack: {
      flexDirection: "row",
      padding: 4,
      borderRadius: COMPANY_RADIUS.md,
      backgroundColor: colors.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    segmentOption: {
      flex: 1,
      minHeight: 40,
      borderRadius: COMPANY_RADIUS.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentOptionSelected: {
      backgroundColor: colors.cardBg,
      ...Platform.select({
        ios: {
          shadowColor: colors.cardShadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.12,
          shadowRadius: 3,
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    segmentLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.muted,
    },
    segmentLabelSelected: {
      fontWeight: "800",
      color: colors.foreground,
    },
    roleHint: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.muted,
    },
    footer: {
      paddingHorizontal: HOME_SPACE.lg,
      paddingTop: HOME_SPACE.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    primaryBtn: {
      minHeight: 52,
      borderRadius: COMPANY_RADIUS.lg,
      backgroundColor: colors.accent,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    primaryBtnDisabled: {
      opacity: 0.45,
    },
    primaryBtnText: {
      fontSize: 16,
      fontWeight: "800",
      color: "#FFFFFF",
    },
    successBody: {
      paddingHorizontal: HOME_SPACE.lg,
      gap: HOME_SPACE.md,
    },
    successPanel: {
      gap: HOME_SPACE.md,
      padding: HOME_SPACE.md,
      borderRadius: COMPANY_RADIUS.lg,
      backgroundColor: colors.accentSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.accentBorder,
    },
    emailRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingBottom: HOME_SPACE.sm,
    },
    emailRowText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    successEmail: {
      fontWeight: "700",
      color: colors.accent,
    },
  });
}
