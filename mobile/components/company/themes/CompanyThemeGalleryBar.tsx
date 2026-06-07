import { ArrowRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS, companyElevatedShadow } from "@/components/company/ui/companyDesignSystem";
import { getCompanyThemeColors } from "@/constants/companyThemePalettes";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import type { CompanyThemeId } from "@/lib/companyThemes";
import { COMPANY_THEME_META } from "@/lib/companyThemes";

type Props = {
  selectedThemeId: CompanyThemeId;
  onCancel: () => void;
  onApply: () => void;
  applying: boolean;
};

export function CompanyThemeGalleryBar({ selectedThemeId, onCancel, onApply, applying }: Props) {
  const colors = useCompanyTheme();
  const insets = useSafeAreaInsets();
  const selectedMeta = COMPANY_THEME_META[selectedThemeId];
  const selectedColors = getCompanyThemeColors(selectedThemeId, "light");

  return (
    <View
      style={{
        position: "absolute",
        left: HOME_SPACE.md,
        right: HOME_SPACE.md,
        bottom: insets.bottom + HOME_SPACE.sm,
        borderRadius: COMPANY_RADIUS.lg,
        backgroundColor: colors.cardBg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: HOME_SPACE.md,
        gap: HOME_SPACE.sm,
        ...companyElevatedShadow(colors),
      }}
    >
      <View style={{ minWidth: 0 }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.muted, letterSpacing: 0.5 }}>
          SELECTED THEME
        </Text>
        <Text style={{ fontSize: 15, fontWeight: "800", color: colors.foreground, marginTop: 2 }} numberOfLines={1}>
          {selectedMeta.label}
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 1 }} numberOfLines={1}>
          {selectedMeta.tagline}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: HOME_SPACE.sm }}>
        <Pressable
          onPress={onCancel}
          disabled={applying}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flex: 1,
            minHeight: 44,
            borderRadius: COMPANY_RADIUS.md,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? colors.surfaceMuted : colors.cardBg,
          })}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>Cancel</Text>
        </Pressable>

        <Pressable
          onPress={onApply}
          disabled={applying}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flex: 1.4,
            minHeight: 44,
            borderRadius: COMPANY_RADIUS.md,
            overflow: "hidden",
            opacity: applying || pressed ? 0.88 : 1,
          })}
        >
          <LinearGradient
            colors={[...selectedColors.gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flex: 1,
              minHeight: 44,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingHorizontal: HOME_SPACE.md,
            }}
          >
            {applying ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>Apply Theme</Text>
            {!applying ? <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.4} /> : null}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}
