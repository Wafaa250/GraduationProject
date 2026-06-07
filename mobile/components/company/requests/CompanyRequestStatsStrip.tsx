import type { LucideIcon } from "lucide-react-native";
import { useMemo } from "react";
import { Text, View } from "react-native";

import { createRequestStyles } from "@/components/company/requests/requestStyles";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";

type Stat = {
  label: string;
  value: number;
  icon?: LucideIcon;
  accent?: boolean;
};

type Props = {
  stats: Stat[];
};

export function CompanyRequestStatsStrip({ stats }: Props) {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createRequestStyles(colors), [colors]);

  return (
    <View style={styles.statGrid}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <View key={stat.label} style={styles.statCard}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={[styles.statValue, stat.accent && { color: colors.accent }]}>{stat.value}</Text>
              {Icon ? <Icon size={16} color={stat.accent ? colors.accent : colors.muted} strokeWidth={2} /> : null}
            </View>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        );
      })}
    </View>
  );
}
