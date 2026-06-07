import { ChevronDown } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useCallback, useState, type ReactNode } from "react";
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS, companyCardShadow } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  title: string;
  children: ReactNode;
  icon?: LucideIcon;
  /** Shown when collapsed to preview content. */
  summary?: string;
  defaultExpanded?: boolean;
  /** Hide chevron toggle — section always expanded. */
  alwaysExpanded?: boolean;
};

export function CompanyAccordionSection({
  title,
  children,
  icon: Icon,
  summary,
  defaultExpanded = false,
  alwaysExpanded = false,
}: Props) {
  const colors = useCompanyTheme();
  const [expanded, setExpanded] = useState(defaultExpanded || alwaysExpanded);
  const chevronRotation = useSharedValue(defaultExpanded || alwaysExpanded ? 0 : -90);

  const toggle = useCallback(() => {
    if (alwaysExpanded) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => {
      const next = !prev;
      chevronRotation.value = withTiming(next ? 0 : -90, { duration: 200 });
      return next;
    });
  }, [alwaysExpanded, chevronRotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  return (
    <View
      style={{
        backgroundColor: colors.cardBg,
        borderRadius: COMPANY_RADIUS.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
        ...companyCardShadow(colors),
      }}
    >
      <Pressable
        onPress={toggle}
        disabled={alwaysExpanded}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}, ${expanded ? "expanded" : "collapsed"}`}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingHorizontal: HOME_SPACE.md,
          paddingVertical: HOME_SPACE.md,
          backgroundColor: pressed && !alwaysExpanded ? colors.accentSoft : colors.cardBg,
        })}
      >
        {!alwaysExpanded ? (
          <Animated.View style={chevronStyle}>
            <ChevronDown size={18} color={colors.muted} strokeWidth={2.4} />
          </Animated.View>
        ) : null}
        {Icon ? (
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: COMPANY_RADIUS.sm,
              backgroundColor: colors.accentSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={15} color={colors.accent} strokeWidth={2.2} />
          </View>
        ) : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{title}</Text>
          {!expanded && summary ? (
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 3 }} numberOfLines={2}>
              {summary}
            </Text>
          ) : null}
        </View>
      </Pressable>

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
