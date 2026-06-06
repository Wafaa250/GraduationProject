import { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, View, type ViewStyle } from "react-native";

import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function SkeletonBlock({ width = "100%", height, borderRadius = 8, style }: Props) {
  const { colors } = useHubTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.border, opacity },
        style,
      ]}
    />
  );
}

export function DoctorDashboardSkeleton() {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = createStyles(colors, layout);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <SkeletonBlock width={layout.scale(40)} height={layout.scale(40)} borderRadius={layout.scale(20)} />
        <View style={styles.headerText}>
          <SkeletonBlock width="50%" height={layout.scale(11)} />
          <SkeletonBlock width="65%" height={layout.scale(16)} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.headerActions}>
          <SkeletonBlock width={layout.scale(34)} height={layout.scale(34)} borderRadius={10} />
          <SkeletonBlock width={layout.scale(34)} height={layout.scale(34)} borderRadius={10} />
        </View>
      </View>

      <View style={styles.metricGrid}>
        {Array.from({ length: 5 }).map((_, index) => (
          <View key={index} style={styles.metricCard}>
            <SkeletonBlock width={layout.scale(32)} height={layout.scale(32)} borderRadius={10} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <SkeletonBlock width="40%" height={layout.scale(18)} />
              <SkeletonBlock width="70%" height={layout.scale(10)} style={{ marginTop: 4 }} />
            </View>
          </View>
        ))}
      </View>

      {["Requests", "Projects", "Courses"].map((section) => (
        <View key={section} style={{ marginTop: layout.space("md") }}>
          <SkeletonBlock width="55%" height={layout.scale(14)} />
          <SkeletonBlock width="80%" height={layout.scale(10)} style={{ marginTop: 4 }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: layout.space("sm") }}>
            <View style={{ flexDirection: "row", gap: layout.space("sm") }}>
              {[0, 1].map((i) => (
                <SkeletonBlock
                  key={i}
                  width={layout.scale(240)}
                  height={layout.scale(130)}
                  borderRadius={14}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: HubColorScheme, layout: ReturnType<typeof useResponsiveLayout>) =>
  StyleSheet.create({
    container: { flex: 1 },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: layout.space("md"),
    },
    headerText: { flex: 1, marginLeft: 10 },
    headerActions: { flexDirection: "row", gap: 6 },
    metricGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: layout.space("sm"),
    },
    metricCard: {
      width: "48%",
      flexGrow: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: layout.space("sm") + 2,
      minHeight: 64,
    },
  });
