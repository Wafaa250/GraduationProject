import { ChevronDown } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS, companyCardShadow } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";

type Props = {
  label: string;
  required?: boolean;
  value: string;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
  hint?: string;
};

export function CompanyWizardSelectTrigger({
  label,
  required,
  value,
  placeholder,
  onPress,
  disabled,
  hint,
}: Props) {
  const colors = useCompanyTheme();
  const hasValue = Boolean(value.trim());

  return (
    <View>
      <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
        {label}
        {required ? <Text style={{ color: "#DC2626" }}> *</Text> : null}
      </Text>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => ({
          minHeight: 52,
          borderWidth: 1,
          borderColor: hasValue ? colors.accentBorder : colors.border,
          borderRadius: COMPANY_RADIUS.md,
          paddingHorizontal: HOME_SPACE.md,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: HOME_SPACE.sm,
          backgroundColor: disabled ? colors.surfaceMuted : colors.cardBg,
          opacity: disabled ? 0.65 : pressed ? 0.96 : 1,
          ...companyCardShadow(colors),
        })}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${hasValue ? value : placeholder}`}
      >
        <Text
          style={{
            flex: 1,
            fontSize: 16,
            fontWeight: hasValue ? "600" : "500",
            color: hasValue ? colors.foreground : colors.muted,
            lineHeight: 22,
          }}
          numberOfLines={2}
        >
          {hasValue ? value : placeholder}
        </Text>
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: COMPANY_RADIUS.sm,
            backgroundColor: colors.accentSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronDown size={16} color={colors.accent} strokeWidth={2.4} />
        </View>
      </Pressable>
      {hint ? (
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 6, lineHeight: 16 }}>{hint}</Text>
      ) : null}
    </View>
  );
}
