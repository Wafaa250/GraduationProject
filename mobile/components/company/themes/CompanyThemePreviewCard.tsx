import { Check } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { CompanyThemePreviewMock } from "@/components/company/themes/CompanyThemePreviewMock";
import { COMPANY_RADIUS, companyCardShadow } from "@/components/company/ui/companyDesignSystem";
import { getCompanyThemeColors } from "@/constants/companyThemePalettes";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import type { CompanyThemeId, CompanyThemeMeta } from "@/lib/companyThemes";

type Props = {
  themeId: CompanyThemeId;
  meta: CompanyThemeMeta;
  selected: boolean;
  active: boolean;
  onPress: () => void;
};

export function CompanyThemePreviewCard({ themeId, meta, selected, active, onPress }: Props) {
  const colors = useCompanyTheme();
  const previewColors = getCompanyThemeColors(themeId, "light");

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        borderRadius: COMPANY_RADIUS.lg,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? previewColors.accent : colors.border,
        backgroundColor: colors.cardBg,
        padding: HOME_SPACE.md,
        opacity: pressed ? 0.94 : 1,
        ...companyCardShadow(colors),
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>{meta.label}</Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 3 }}>{meta.tagline}</Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          {active ? (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: colors.successMuted,
                borderWidth: 1,
                borderColor: colors.successBorder,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "800", color: colors.success, letterSpacing: 0.5 }}>
                LIVE
              </Text>
            </View>
          ) : null}
          {selected ? (
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: previewColors.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check size={14} color="#FFFFFF" strokeWidth={3} />
            </View>
          ) : null}
        </View>
      </View>

      <Text style={{ fontSize: 11, fontWeight: "600", color: colors.subtle, marginTop: 8, marginBottom: 10 }}>
        {meta.mood}
      </Text>

      <CompanyThemePreviewMock themeId={themeId} />
    </Pressable>
  );
}
