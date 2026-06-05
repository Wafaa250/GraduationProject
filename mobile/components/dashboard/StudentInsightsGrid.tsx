import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { HUB_COLORS } from "@/constants/studentHubTheme";
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
  const isTablet = layout.deviceSize === "tablet";
  const cardBasis = isTablet ? "23%" : "47%";

  return (
    <View style={{ marginBottom: layout.space("lg") }}>
      <Text style={[styles.heading, { fontSize: layout.scale(20), marginBottom: layout.space("xs") }]}>
        Student Insights
      </Text>
      <Text style={[styles.subheading, { fontSize: layout.fontSize.footer, marginBottom: layout.space("md") }]}>
        Your collaboration signals at a glance.
      </Text>

      <View style={[styles.grid, { gap: layout.space("md") }]}>
        {metrics.map((metric) => (
          <View
            key={metric.key}
            style={[
              styles.card,
              {
                flexBasis: cardBasis,
                flexGrow: 1,
                minWidth: isTablet ? 140 : 148,
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
  },
  subheading: {
    color: HUB_COLORS.muted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  card: {
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
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
    color: HUB_COLORS.muted,
  },
  value: {
    fontWeight: "800",
    color: HUB_COLORS.foreground,
    letterSpacing: -0.5,
  },
  hint: {
    color: HUB_COLORS.muted,
  },
  iconWrap: {
    backgroundColor: HUB_COLORS.cardBg,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
