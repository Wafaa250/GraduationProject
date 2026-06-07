import { useMemo } from "react";
import { Text, View } from "react-native";

import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";

type Stat = {
  label: string;
  value: string;
};

type Props = {
  stats: Stat[];
};

export function CompanyTeamStatsStrip({ stats }: Props) {
  const colors = useCompanyTheme();
  const pairs = useMemo(() => {
    const rows: Stat[][] = [];
    for (let i = 0; i < stats.length; i += 2) {
      rows.push(stats.slice(i, i + 2));
    }
    return rows;
  }, [stats]);

  return (
    <View style={{ gap: HOME_SPACE.sm }}>
      {pairs.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: "row", gap: HOME_SPACE.sm }}>
          {row.map((stat) => (
            <View
              key={stat.label}
              style={{
                flex: 1,
                padding: HOME_SPACE.md,
                borderRadius: COMPANY_RADIUS.lg,
                backgroundColor: colors.surfaceMuted,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "700", color: colors.muted, letterSpacing: 0.5 }}>
                {stat.label.toUpperCase()}
              </Text>
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground, marginTop: 4 }}>
                {stat.value}
              </Text>
            </View>
          ))}
          {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  );
}
