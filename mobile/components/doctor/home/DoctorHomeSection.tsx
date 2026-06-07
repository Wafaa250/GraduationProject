import { ChevronDown } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useCallback, useState, type ReactNode } from "react";
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { createDoctorHomeStyles, HOME_SPACE } from "@/components/doctor/home/doctorHomeStyles";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  count?: number;
  seeAllLabel?: string;
  onSeeAll?: () => void;
  children: ReactNode;
  /** Enable accordion collapse on the section header. */
  collapsible?: boolean;
  defaultExpanded?: boolean;
};

export function DoctorHomeSection({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  count,
  seeAllLabel = "See all",
  onSeeAll,
  children,
  collapsible = false,
  defaultExpanded = true,
}: Props) {
  const { colors } = useDoctorTheme();
  const styles = createDoctorHomeStyles(colors);
  const tint = iconColor ?? colors.primary;
  const bg = iconBg ?? colors.primarySoft;
  const [expanded, setExpanded] = useState(defaultExpanded);
  const chevronRotation = useSharedValue(defaultExpanded ? 0 : -90);

  const toggle = useCallback(() => {
    if (!collapsible) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => {
      const next = !prev;
      chevronRotation.value = withTiming(next ? 0 : -90, { duration: 220 });
      return next;
    });
  }, [collapsible, chevronRotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const titleBlock = (
    <View style={{ flex: 1, minWidth: 0 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {count != null && count > 0 ? (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{count > 99 ? "99+" : count}</Text>
          </View>
        ) : null}
      </View>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );

  return (
    <View style={{ marginBottom: HOME_SPACE.xl }}>
      <View style={styles.sectionHeader}>
        {collapsible ? (
          <Pressable
            onPress={toggle}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={`${title}, ${expanded ? "expanded" : "collapsed"}`}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: HOME_SPACE.sm,
              opacity: pressed ? 0.88 : 1,
            })}
          >
            {Icon ? (
              <View style={[styles.sectionIconWrap, { backgroundColor: bg }]}>
                <Icon size={16} color={tint} strokeWidth={2.2} />
              </View>
            ) : null}
            {titleBlock}
          </Pressable>
        ) : (
          <View style={[styles.sectionTitleRow, { flex: 1 }]}>
            {Icon ? (
              <View style={[styles.sectionIconWrap, { backgroundColor: bg }]}>
                <Icon size={16} color={tint} strokeWidth={2.2} />
              </View>
            ) : null}
            {titleBlock}
          </View>
        )}

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {onSeeAll ? (
            <Pressable onPress={onSeeAll} hitSlop={8} style={styles.seeAllPill}>
              <Text style={styles.seeAll}>{seeAllLabel}</Text>
            </Pressable>
          ) : null}
          {collapsible ? (
            <Pressable
              onPress={toggle}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              accessibilityLabel={expanded ? "Collapse section" : "Expand section"}
              style={({ pressed }) => ({
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: pressed ? colors.primarySoft : colors.inputBg,
              })}
            >
              <Animated.View style={chevronStyle}>
                <ChevronDown size={18} color={colors.muted} strokeWidth={2.4} />
              </Animated.View>
            </Pressable>
          ) : null}
        </View>
      </View>

      {!collapsible || expanded ? children : null}
    </View>
  );
}
