import { Eye, EyeOff } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import type { CompanyColorScheme } from "@/constants/companyTheme";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  autoComplete?: "password" | "new-password" | "current-password";
  showToggle?: boolean;
  returnKeyType?: "done" | "next";
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
};

export function CompanySettingsPasswordField({
  label,
  value,
  onChangeText,
  autoComplete,
  showToggle = true,
  returnKeyType = "next",
  onSubmitEditing,
  inputRef,
}: Props) {
  const colors = useCompanyTheme();
  const layout = useResponsiveLayout();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [visible, setVisible] = useState(false);

  return (
    <View style={{ gap: HOME_SPACE.xs, marginBottom: HOME_SPACE.md }}>
      <Text style={[styles.label, { fontSize: layout.fontSize.label }]}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={autoComplete === "new-password" ? "newPassword" : "password"}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            {
              minHeight: layout.touchTarget,
              fontSize: layout.fontSize.body,
              paddingRight: showToggle ? 48 : HOME_SPACE.md,
            },
          ]}
        />
        {showToggle ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Hide password" : "Show password"}
            style={styles.toggle}
          >
            {visible ? (
              <EyeOff size={18} color={colors.muted} strokeWidth={2.2} />
            ) : (
              <Eye size={18} color={colors.muted} strokeWidth={2.2} />
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(colors: CompanyColorScheme) {
  return StyleSheet.create({
    label: {
      fontWeight: "600",
      color: colors.foreground,
    },
    inputWrap: {
      position: "relative",
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      color: colors.foreground,
      borderRadius: COMPANY_RADIUS.md,
      paddingHorizontal: HOME_SPACE.md,
      width: "100%",
    },
    toggle: {
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      width: 44,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
