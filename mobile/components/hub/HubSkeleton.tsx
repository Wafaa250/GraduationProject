import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { HubCard } from "@/components/hub/HubCard";
import { useHubDesign } from "@/hooks/use-hub-design";

function SkeletonBlock({
  width,
  height,
  radius = 8,
}: {
  width: number | `${number}%`;
  height: number;
  radius?: number;
}) {
  const hub = useHubDesign();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.block,
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: hub.colors.border,
          opacity,
        },
      ]}
    />
  );
}

export function HubFeedSkeleton() {
  const hub = useHubDesign();

  return (
    <HubCard>
      <View style={styles.row}>
        <SkeletonBlock width={hub.avatar.feed} height={hub.avatar.feed} radius={hub.avatar.feed / 2} />
        <View style={styles.metaCol}>
          <SkeletonBlock width="55%" height={14} />
          <SkeletonBlock width="35%" height={11} />
        </View>
      </View>
      <SkeletonBlock width="100%" height={14} />
      <SkeletonBlock width="88%" height={14} />
      <SkeletonBlock width="100%" height={140} radius={hub.radius.md} />
      <View style={styles.actions}>
        <SkeletonBlock width="42%" height={hub.button.height} radius={hub.radius.button} />
        <SkeletonBlock width="32%" height={hub.button.height} radius={hub.radius.button} />
      </View>
    </HubCard>
  );
}

export function HubRecommendedSkeleton() {
  const hub = useHubDesign();
  const cardWidth = hub.layout.scale(152);

  return (
    <View style={{ paddingHorizontal: hub.layout.horizontalPadding, flexDirection: "row", gap: 12 }}>
      {[0, 1, 2].map((key) => (
        <View
          key={key}
          style={[
            styles.recCard,
            hub.shadow,
            {
              width: cardWidth,
              backgroundColor: hub.colors.cardBg,
              borderColor: hub.colors.border,
              borderRadius: hub.card.radius,
              padding: hub.card.padding - 2,
            },
          ]}
        >
          <SkeletonBlock
            width={hub.avatar.recommended}
            height={hub.avatar.recommended}
            radius={hub.avatar.recommended / 2}
          />
          <SkeletonBlock width="80%" height={13} />
          <SkeletonBlock width="60%" height={11} />
          <SkeletonBlock width="100%" height={hub.button.heightSm} radius={hub.radius.button} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {},
  row: { flexDirection: "row", gap: 12, alignItems: "center" },
  metaCol: { flex: 1, gap: 8 },
  actions: { flexDirection: "row", gap: 10 },
  recCard: {
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
});
