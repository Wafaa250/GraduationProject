import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  DOCTOR_RADIUS,
  DOCTOR_SPACE,
  doctorCardShadow,
} from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { STATUS_TABS, type SupervisionRequestTab } from "@/lib/supervisionRequestUi";

type Props = {
  value: SupervisionRequestTab;
  counts: Record<SupervisionRequestTab, number>;
  loading?: boolean;
  onChange: (value: SupervisionRequestTab) => void;
};

export function SupervisionRequestsFilterBar({ value, counts, loading, onChange }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.wrap}>
      {STATUS_TABS.map((tab) => {
        const active = value === tab.id;
        const count = loading ? null : counts[tab.id];
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[styles.segment, active && styles.segmentActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text
              style={[
                styles.label,
                { fontSize: layout.scale(13), color: active ? colors.primary : colors.muted },
              ]}
              numberOfLines={1}
            >
              {tab.label}
              {count !== null && count > 0 ? ` · ${count}` : ""}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      backgroundColor: colors.inputBg,
      borderRadius: DOCTOR_RADIUS.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: 3,
      gap: 3,
    },
    segment: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: DOCTOR_SPACE.sm + 2,
      paddingHorizontal: 2,
      borderRadius: DOCTOR_RADIUS.sm,
      minHeight: 36,
    },
    segmentActive: {
      backgroundColor: colors.cardBg,
      ...doctorCardShadow(colors),
    },
    label: {
      fontWeight: "700",
      textAlign: "center",
    },
  });
}
