import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { InsightMetric } from "@/lib/dashboardMappers";

type Props = {
  metrics: InsightMetric[];
};

const ICON_MAP: Record<InsightMetric["icon"], keyof typeof Ionicons.glyphMap> = {
  people: "people-outline",
  folder: "folder-open-outline",
  sparkles: "sparkles-outline",
  mail: "mail-outline",
};

export function StudentInsightsGrid({ metrics }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const cardWidth = layout.deviceSize === "tablet" ? layout.scale(220) : layout.scale(168);

  return (
    <View style={{ marginBottom: layout.space("lg") }}>
      <Text style={[styles.heading, { fontSize: layout.scale(20), marginBottom: layout.space("xs") }]}>
        Student Insights
      </Text>
      <Text style={[styles.subheading, { fontSize: layout.fontSize.footer, marginBottom: layout.space("md") }]}>
        Your collaboration signals at a glance.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { gap: layout.space("md"), paddingRight: layout.space("sm") }]}
      >
        {metrics.map((metric) => (
          <View
            key={metric.key}
            style={[
              styles.card,
              {
                width: cardWidth,
                borderRadius: layout.radius.button,
                padding: layout.space("md"),
                backgroundColor: metric.tint,
              },
            ]}
          >
            <View style={styles.cardTop}>
              <View style={styles.cardText}>
                <Text style={[styles.label, { fontSize: layout.scale(11) }]}>{metric.label}</Text>
                <Text style={[styles.value, { fontSize: layout.scale(32), marginTop: layout.space("sm") }]}>
                  {metric.value}
                </Text>
                <Text style={[styles.hint, { fontSize: layout.scale(11), marginTop: layout.space("xs") }]}>
                  {metric.hint}
                </Text>
              </View>
              <View
                style={[
                  styles.iconWrap,
                  {
                    width: layout.scale(40),
                    height: layout.scale(40),
                    borderRadius: layout.radius.input,
                  },
                ]}
              >
                <Ionicons name={ICON_MAP[metric.icon]} size={layout.iconSize} color={metric.iconColor} />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
  heading: {
    fontWeight: "700",
    color: colors.foreground,
  },
  subheading: {
    color: colors.muted,
  },
  scrollContent: {
    flexDirection: "row",
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardText: {
    flex: 1,
    paddingRight: 8,
  },
  label: {
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: colors.muted,
  },
  value: {
    fontWeight: "800",
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  hint: {
    color: colors.muted,
  },
  iconWrap: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
