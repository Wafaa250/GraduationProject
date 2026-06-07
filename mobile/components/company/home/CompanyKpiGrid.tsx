import { router, type Href } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";

import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import type { CompanyMetricKey } from "@/lib/companyRoutes";

export type KpiCardConfig = {
  key: CompanyMetricKey;
  label: string;
  icon: LucideIcon;
  href?: string;
  highlight?: boolean;
};

type Props = {
  metrics: Record<CompanyMetricKey, number>;
  configs: KpiCardConfig[];
};

const KPI_WIDTH = 132;

export function CompanyKpiGrid({ metrics, configs }: Props) {
  const colors = useCompanyTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: HOME_SPACE.sm, paddingBottom: 2 }}
      style={{ marginBottom: HOME_SPACE.xl, marginHorizontal: -HOME_SPACE.lg, paddingHorizontal: HOME_SPACE.lg }}
    >
      {configs.map((config) => {
        const value = metrics[config.key];
        const Icon = config.icon;
        const card = (
          <View
            style={{
              width: KPI_WIDTH,
              backgroundColor: config.highlight ? colors.accentSoft : colors.cardBg,
              borderRadius: COMPANY_RADIUS.md,
              borderWidth: 1,
              borderColor: config.highlight ? colors.accentBorder : colors.border,
              paddingHorizontal: HOME_SPACE.md,
              paddingVertical: HOME_SPACE.md,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Icon size={14} color={colors.accent} strokeWidth={2.2} />
              <Text
                style={{ flex: 1, fontSize: 11, fontWeight: "600", color: colors.muted }}
                numberOfLines={1}
              >
                {config.label}
              </Text>
            </View>
            <Text
              style={{
                marginTop: 8,
                fontSize: 26,
                fontWeight: "800",
                color: colors.foreground,
                letterSpacing: -0.8,
              }}
            >
              {value}
            </Text>
          </View>
        );

        if (config.href) {
          return (
            <Pressable
              key={config.key}
              onPress={() => router.push(config.href as Href)}
              style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
              accessibilityRole="button"
              accessibilityLabel={`${config.label}: ${value}`}
            >
              {card}
            </Pressable>
          );
        }

        return <View key={config.key}>{card}</View>;
      })}
    </ScrollView>
  );
}
