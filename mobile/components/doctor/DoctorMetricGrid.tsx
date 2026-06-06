import {
  Activity,
  BookOpen,
  FileText,
  MessageSquare,
  Users,
} from "lucide-react-native";
import { router, type Href } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  DOCTOR_HUB_METRIC_SLOTS,
  type DoctorHubMetricSlot,
  type DoctorHubMetricTone,
} from "@/lib/doctorHubConfig";
import { doctorMetricRoute, type DoctorMetricKey } from "@/lib/doctorRoutes";

const ICON_MAP = {
  "file-text": FileText,
  activity: Activity,
  "book-open": BookOpen,
  users: Users,
  "message-square": MessageSquare,
} as const;

type Props = {
  values: Record<DoctorMetricKey, number>;
};

function toneColors(tone: DoctorHubMetricTone, colors: HubColorScheme) {
  switch (tone) {
    case "primary":
      return { accent: colors.primary, bg: colors.primarySoft, icon: colors.primary };
    case "info":
      return { accent: colors.doctor, bg: "rgba(14, 165, 233, 0.1)", icon: colors.doctor };
    case "accent":
      return { accent: "#A855F7", bg: "rgba(168, 85, 247, 0.1)", icon: "#A855F7" };
    case "success":
      return { accent: colors.association, bg: "rgba(16, 185, 129, 0.1)", icon: colors.association };
    case "warning":
      return { accent: colors.company, bg: "rgba(245, 158, 11, 0.1)", icon: colors.company };
    default:
      return { accent: colors.primary, bg: colors.primarySoft, icon: colors.primary };
  }
}

function MetricCard({
  slot,
  value,
  onPress,
  isLastOdd,
}: {
  slot: DoctorHubMetricSlot;
  value: number;
  onPress: () => void;
  isLastOdd?: boolean;
}) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createCardStyles(colors), [colors]);
  const Icon = ICON_MAP[slot.icon];
  const tone = toneColors(slot.tone, colors);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${slot.label}, ${value}`}
      style={({ pressed }) => [
        styles.card,
        {
          borderRadius: 14,
          paddingVertical: layout.space("sm") + 2,
          paddingHorizontal: layout.space("sm") + 2,
          borderLeftColor: tone.accent,
          opacity: pressed ? 0.94 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          width: isLastOdd ? "48.5%" : undefined,
          flex: isLastOdd ? 0 : 1,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: tone.bg, borderRadius: 10, width: 34, height: 34 }]}>
        <Icon size={16} color={tone.icon} strokeWidth={2.3} />
      </View>
      <Text style={[styles.value, { fontSize: layout.scale(20), marginTop: 8 }]}>{value}</Text>
      <Text style={[styles.label, { fontSize: layout.scale(10.5), marginTop: 2 }]} numberOfLines={2}>
        {slot.label}
      </Text>
    </Pressable>
  );
}

export function DoctorMetricGrid({ values }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const slots = DOCTOR_HUB_METRIC_SLOTS;
  const rows: DoctorHubMetricSlot[][] = [];
  for (let i = 0; i < slots.length; i += 2) {
    rows.push(slots.slice(i, i + 2));
  }

  return (
    <View style={{ marginBottom: layout.space("md") }}>
      <Text style={{ fontSize: layout.scale(12), fontWeight: "700", color: colors.muted, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: layout.space("sm") }}>
        Overview
      </Text>
      <View style={{ gap: layout.space("sm") }}>
        {rows.map((row, rowIndex) => {
          const isLastRow = rowIndex === rows.length - 1;
          const isOddLast = isLastRow && row.length === 1;
          return (
            <View key={rowIndex} style={{ flexDirection: "row", gap: layout.space("sm") }}>
              {row.map((slot) => (
                <MetricCard
                  key={slot.key}
                  slot={slot}
                  value={values[slot.key as DoctorMetricKey] ?? 0}
                  onPress={() => router.push(doctorMetricRoute(slot.key as DoctorMetricKey) as Href)}
                  isLastOdd={isOddLast}
                />
              ))}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const createCardStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 3,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
      minHeight: 88,
    },
    iconWrap: {
      alignItems: "center",
      justifyContent: "center",
    },
    value: {
      fontWeight: "800",
      color: colors.foreground,
      letterSpacing: -0.5,
      lineHeight: 24,
    },
    label: {
      fontWeight: "600",
      color: colors.muted,
      lineHeight: 13,
    },
  });
