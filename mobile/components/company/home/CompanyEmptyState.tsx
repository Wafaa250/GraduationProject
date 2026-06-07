import type { LucideIcon } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";

type Props = {
  icon: LucideIcon;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function CompanyEmptyState({ icon: Icon, message, actionLabel, onAction }: Props) {
  const colors = useCompanyTheme();

  return (
    <View
      style={{
        padding: HOME_SPACE.xl,
        alignItems: "center",
        backgroundColor: colors.surfaceMuted,
        borderRadius: COMPANY_RADIUS.lg,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: COMPANY_RADIUS.sm,
          backgroundColor: colors.accentSoft,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: HOME_SPACE.md,
        }}
      >
        <Icon size={20} color={colors.accent} strokeWidth={2} />
      </View>
      <Text
        style={{
          fontSize: 14,
          lineHeight: 20,
          color: colors.textSecondary,
          textAlign: "center",
          fontWeight: "500",
        }}
      >
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => ({
            marginTop: HOME_SPACE.lg,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: COMPANY_RADIUS.sm,
            backgroundColor: colors.accent,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 13 }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
