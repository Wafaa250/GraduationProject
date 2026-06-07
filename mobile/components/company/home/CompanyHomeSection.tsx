import { ChevronDown } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useCallback, useState, type ReactNode } from "react";
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { createCompanyHomeStyles, HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  count?: number;
  seeAllLabel?: string;
  onSeeAll?: () => void;
  children: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
};

export function CompanyHomeSection({
  title,
  subtitle,
  icon: Icon,
  count,
  seeAllLabel = "View all",
  onSeeAll,
  children,
  collapsible = false,
  defaultExpanded = true,
}: Props) {
  const colors = useCompanyTheme();
  const styles = createCompanyHomeStyles(colors);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const chevronRotation = useSharedValue(defaultExpanded ? 0 : -90);

  const toggle = useCallback(() => {
    if (!collapsible) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => {
      const next = !prev;
      chevronRotation.value = withTiming(next ? 0 : -90, { duration: 200 });
      return next;
    });
  }, [collapsible, chevronRotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const titleLabel =
    count != null && collapsible ? `${title} (${count > 99 ? "99+" : count})` : title;

  const headerContent = (
    <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 8 }}>
      {collapsible ? (
        <Animated.View style={chevronStyle}>
          <ChevronDown size={18} color={colors.muted} strokeWidth={2.4} />
        </Animated.View>
      ) : null}
      {Icon ? (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: COMPANY_RADIUS.sm,
            backgroundColor: colors.accentSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={16} color={colors.accent} strokeWidth={2.2} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Text style={styles.sectionTitle}>{collapsible ? titleLabel : title}</Text>
          {!collapsible && count != null && count > 0 ? (
            <View
              style={{
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: COMPANY_RADIUS.pill,
                backgroundColor: colors.accentSoft,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "800", color: colors.accent }}>
                {count > 99 ? "99+" : count}
              </Text>
            </View>
          ) : null}
        </View>
        {subtitle && (!collapsible || expanded) ? (
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );

  if (!collapsible) {
    return (
      <View style={{ marginBottom: HOME_SPACE.xxl }}>
        <View style={styles.sectionHeader}>
          {headerContent}
          {onSeeAll ? (
            <Pressable onPress={onSeeAll} hitSlop={8} style={styles.seeAllPill}>
              <Text style={styles.seeAll}>{seeAllLabel}</Text>
            </Pressable>
          ) : null}
        </View>
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          marginBottom: HOME_SPACE.md,
          overflow: "hidden",
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingRight: onSeeAll && expanded ? 0 : HOME_SPACE.md,
          gap: HOME_SPACE.sm,
        }}
      >
        <Pressable
          onPress={toggle}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={`${titleLabel}, ${expanded ? "expanded" : "collapsed"}`}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: HOME_SPACE.md,
            paddingVertical: HOME_SPACE.md,
            backgroundColor: pressed ? colors.accentSoft : colors.cardBg,
          })}
        >
          {headerContent}
        </Pressable>
        {onSeeAll && expanded ? (
          <Pressable onPress={onSeeAll} hitSlop={8} style={[styles.seeAllPill, { marginRight: HOME_SPACE.md }]}>
            <Text style={styles.seeAll}>{seeAllLabel}</Text>
          </Pressable>
        ) : null}
      </View>

      {expanded ? (
        <View
          style={{
            paddingHorizontal: HOME_SPACE.md,
            paddingBottom: HOME_SPACE.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}
