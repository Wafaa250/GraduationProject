import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  DOCTOR_RADIUS,
  DOCTOR_SPACE,
  doctorCardShadow,
} from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { DoctorMessagesFilter } from "@/lib/doctorMessagesNavigation";

const FILTERS: { id: DoctorMessagesFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "team", label: "Teams" },
  { id: "student", label: "Students" },
];

type Props = {
  value: DoctorMessagesFilter;
  onChange: (value: DoctorMessagesFilter) => void;
  embedded?: boolean;
};

export function DoctorMessagesFilterBar({ value, onChange, embedded = false }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = createStyles(colors);

  return (
    <View
      style={[
        styles.wrap,
        {
          marginHorizontal: embedded ? DOCTOR_SPACE.sm : layout.horizontalPadding,
          marginBottom: DOCTOR_SPACE.sm,
        },
      ]}
    >
      {FILTERS.map((item) => {
        const active = value === item.id;
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            style={[styles.segment, active && styles.segmentActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text
              style={[
                styles.label,
                { fontSize: layout.fontSize.footer, color: active ? colors.primary : colors.muted },
              ]}
            >
              {item.label}
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
      paddingVertical: DOCTOR_SPACE.sm,
      borderRadius: DOCTOR_RADIUS.sm,
    },
    segmentActive: {
      backgroundColor: colors.cardBg,
      ...doctorCardShadow(colors),
    },
    label: {
      fontWeight: "700",
    },
  });
}
