import {
  Activity,
  BookOpen,
  FileText,
  MessageSquare,
  Users,
} from "lucide-react-native";
import { router, type Href } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import {
  createDoctorHomeStyles,
  HOME_SPACE,
  STAT_CHIP_WIDTH,
} from "@/components/doctor/home/doctorHomeStyles";
import { doctorMetricToneColors } from "@/constants/doctorHubTheme";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import {
  DOCTOR_HUB_METRIC_SLOTS,
  type DoctorHubMetricSlot,
  type DoctorHubMetricTone,
} from "@/lib/doctorHubConfig";
import { doctorMetricRoute, type DoctorMetricKey } from "@/lib/doctorRoutes";

const ICONS = {
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
  return doctorMetricToneColors(tone, colors);
}

function StatChip({ slot, value }: { slot: DoctorHubMetricSlot; value: number }) {
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createDoctorHomeStyles(colors), [colors]);
  const Icon = ICONS[slot.icon];
  const tint = toneColors(slot.tone, colors);

  return (
    <View style={{ paddingVertical: 2 }}>
      <Pressable
        onPress={() => router.push(doctorMetricRoute(slot.key as DoctorMetricKey) as Href)}
        style={({ pressed }) => [
          styles.statChip,
          styles.cardShadow,
          { opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <View style={[styles.statIconWrap, { backgroundColor: tint.bg }]}>
          <Icon size={16} color={tint.fg} strokeWidth={2.2} />
        </View>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            color: colors.foreground,
            marginTop: HOME_SPACE.sm,
            letterSpacing: -0.8,
          }}
        >
          {value}
        </Text>
        <View style={{ minHeight: 30, marginTop: 4, justifyContent: "flex-start" }}>
          <Text
            style={{ fontSize: 11, fontWeight: "700", color: colors.foreground, lineHeight: 14 }}
            numberOfLines={2}
          >
            {slot.label}
          </Text>
        </View>
        <View style={{ minHeight: 26, marginTop: 3, justifyContent: "flex-start" }}>
          <Text style={{ fontSize: 10, color: colors.muted, lineHeight: 13 }} numberOfLines={2}>
            {slot.subLabel}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

export function DoctorHomeStatsStrip({ values }: Props) {
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createDoctorHomeStyles(colors), [colors]);
  const chipGap = HOME_SPACE.sm;
  const snapInterval = STAT_CHIP_WIDTH + chipGap;

  return (
    <View style={{ marginBottom: HOME_SPACE.lg }}>
      <Text style={[styles.sectionTitle, { marginBottom: HOME_SPACE.sm, paddingHorizontal: HOME_SPACE.lg }]}>
        Overview
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={{
          paddingHorizontal: HOME_SPACE.lg,
          paddingRight: HOME_SPACE.xl + STAT_CHIP_WIDTH / 2,
          gap: chipGap,
        }}
      >
        {DOCTOR_HUB_METRIC_SLOTS.map((slot) => (
          <StatChip key={slot.key} slot={slot} value={values[slot.key as DoctorMetricKey] ?? 0} />
        ))}
      </ScrollView>
    </View>
  );
}
