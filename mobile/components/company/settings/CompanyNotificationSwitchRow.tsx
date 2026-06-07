import type { LucideIcon } from "lucide-react-native";
import { ActivityIndicator, Switch, Text, View } from "react-native";

import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  icon: LucideIcon;
  label: string;
  description: string;
  value: boolean;
  disabled?: boolean;
  saving?: boolean;
  onValueChange: (value: boolean) => void;
};

export function CompanyNotificationSwitchRow({
  icon: Icon,
  label,
  description,
  value,
  disabled,
  saving,
  onValueChange,
}: Props) {
  const colors = useCompanyTheme();
  const layout = useResponsiveLayout();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: HOME_SPACE.sm,
        paddingVertical: HOME_SPACE.sm + 2,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: COMPANY_RADIUS.sm,
          backgroundColor: colors.accentSoft,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        <Icon size={17} color={colors.accent} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
        <Text style={{ fontSize: layout.fontSize.body, fontWeight: "600", color: colors.foreground }}>
          {label}
        </Text>
        <Text
          style={{
            fontSize: layout.fontSize.footer,
            color: colors.muted,
            marginTop: 2,
            lineHeight: 18,
          }}
        >
          {description}
        </Text>
      </View>
      {saving ? (
        <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 8 }} />
      ) : (
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: colors.border, true: colors.accentMuted }}
          thumbColor={value ? colors.accent : "#FFFFFF"}
          style={{ marginTop: 4 }}
        />
      )}
    </View>
  );
}
