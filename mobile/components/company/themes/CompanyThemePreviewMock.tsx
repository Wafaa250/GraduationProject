import { LayoutDashboard, Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { getCompanyThemeColors, COMPANY_THEME_SECONDARY } from "@/constants/companyThemePalettes";
import type { CompanyThemeId } from "@/lib/companyThemes";

type Props = {
  themeId: CompanyThemeId;
};

export function CompanyThemePreviewMock({ themeId }: Props) {
  const colors = getCompanyThemeColors(themeId, "light");
  const secondary = COMPANY_THEME_SECONDARY[themeId];

  return (
    <View
      style={{
        borderRadius: COMPANY_RADIUS.md,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
      }}
    >
      <LinearGradient
        colors={[`${colors.accent}18`, `${secondary}10`, colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 12 }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 0.8, color: colors.muted }}>
            WORKSPACE
          </Text>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 999,
              backgroundColor: colors.accentMuted,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "700", color: colors.accent }}>3 active</Text>
          </View>
        </View>

        <Text style={{ fontSize: 14, fontWeight: "800", color: colors.foreground, marginTop: 10 }}>
          Hiring pipeline
        </Text>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          <View
            style={{
              flex: 1,
              borderRadius: 10,
              padding: 10,
              backgroundColor: colors.cardBg,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>12</Text>
            <Text style={{ fontSize: 10, color: colors.muted, marginTop: 2 }}>Requests</Text>
          </View>
          <View
            style={{
              flex: 1,
              borderRadius: 10,
              padding: 10,
              backgroundColor: colors.accentMuted,
              borderWidth: 1,
              borderColor: colors.accentBorder,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.accent }}>87%</Text>
            <Text style={{ fontSize: 10, color: colors.muted, marginTop: 2 }}>Match</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 10,
              paddingVertical: 7,
              borderRadius: 999,
              backgroundColor: colors.navActive,
            }}
          >
            <LayoutDashboard size={12} color={colors.accent} strokeWidth={2.2} />
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.accent }}>Dashboard</Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 10,
              paddingVertical: 7,
              borderRadius: 999,
              backgroundColor: colors.surfaceMuted,
            }}
          >
            <Sparkles size={12} color={colors.muted} strokeWidth={2.2} />
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted }}>Saved</Text>
          </View>
        </View>

        <LinearGradient
          colors={[...colors.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            marginTop: 12,
            borderRadius: 10,
            minHeight: 36,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>New project request</Text>
        </LinearGradient>
      </LinearGradient>
    </View>
  );
}
