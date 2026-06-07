import { ChevronRight, Palette } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import type { CompanyColorScheme } from "@/constants/companyTheme";
import { useCompanyWorkspaceTheme } from "@/contexts/CompanyWorkspaceThemeContext";
import { useThemePreference, type ThemeMode } from "@/contexts/ThemePreferenceContext";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { COMPANY_THEME_META } from "@/lib/companyThemes";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";

const OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: "light", label: "Light" },
  { mode: "dark", label: "Dark" },
  { mode: "system", label: "System" },
];

export function CompanyThemeModeSelector() {
  const colors = useCompanyTheme();
  const layout = useResponsiveLayout();
  const { themeMode, setThemeMode } = useThemePreference();
  const { themeId } = useCompanyWorkspaceTheme();
  const styles = createStyles(colors);
  const activePalette = COMPANY_THEME_META[themeId];

  return (
    <View style={{ gap: HOME_SPACE.lg }}>
      <View>
        <Text style={{ fontSize: layout.fontSize.label, fontWeight: "600", color: colors.foreground, marginBottom: HOME_SPACE.sm }}>
          Theme mode
        </Text>
        <View
          style={[
            styles.segmentedWrap,
            {
              borderRadius: COMPANY_RADIUS.md,
              padding: 3,
              backgroundColor: colors.surfaceMuted,
            },
          ]}
        >
          {OPTIONS.map((option) => {
            const active = themeMode === option.mode;
            return (
              <Pressable
                key={option.mode}
                onPress={() => void setThemeMode(option.mode)}
                style={[
                  styles.segment,
                  {
                    borderRadius: COMPANY_RADIUS.sm,
                    paddingVertical: layout.space("sm") + 2,
                  },
                  active && {
                    backgroundColor: colors.cardBg,
                    shadowColor: colors.cardShadow,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 1,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    {
                      fontSize: layout.fontSize.footer,
                      color: active ? colors.accent : colors.muted,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text
          style={{
            marginTop: HOME_SPACE.sm,
            fontSize: layout.fontSize.footer,
            color: colors.muted,
            lineHeight: 20,
          }}
        >
          Stored on this device only. System follows your OS light or dark setting.
        </Text>
      </View>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: HOME_SPACE.lg,
          gap: HOME_SPACE.sm,
        }}
      >
        <Text style={{ fontSize: layout.fontSize.body, fontWeight: "700", color: colors.foreground }}>
          Company workspace palette
        </Text>
        <Text style={{ fontSize: layout.fontSize.footer, color: colors.muted, lineHeight: 20 }}>
          Five hiring themes — copper, forest, champagne, terracotta, sage — with live previews.
        </Text>
        <Text style={{ fontSize: layout.fontSize.footer, color: colors.textSecondary }}>
          Active now:{" "}
          <Text style={{ fontWeight: "700", color: colors.foreground }}>{activePalette.label}</Text>
        </Text>

        <Pressable
          onPress={() => router.push(COMPANY_ROUTES.themeShowcase as Href)}
          accessibilityRole="button"
          style={({ pressed }) => ({
            opacity: pressed ? 0.92 : 1,
            borderRadius: COMPANY_RADIUS.md,
            overflow: "hidden",
            minHeight: 46,
            marginTop: HOME_SPACE.xs,
          })}
        >
          <LinearGradient
            colors={[...colors.gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              minHeight: 46,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingHorizontal: HOME_SPACE.lg,
            }}
          >
            <Palette size={16} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>Open Theme Gallery</Text>
            <ChevronRight size={16} color="#FFFFFF" strokeWidth={2.4} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: CompanyColorScheme) {
  return StyleSheet.create({
    segmentedWrap: {
      flexDirection: "row",
    },
    segment: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentLabel: {
      fontWeight: "700",
    },
  });
}
