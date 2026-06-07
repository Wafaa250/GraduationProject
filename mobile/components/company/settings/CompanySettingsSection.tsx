import { ChevronDown } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useCallback, useEffect, type ReactNode } from "react";
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS, companyCardShadow } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type CompanySettingsSectionId = "workspace" | "security" | "notifications" | "appearance";

type Props = {
  id: CompanySettingsSectionId;
  title: string;
  summary?: string;
  icon: LucideIcon;
  expanded: boolean;
  onToggle: (id: CompanySettingsSectionId) => void;
  children: ReactNode;
};

export function CompanySettingsSection({
  id,
  title,
  summary,
  icon: Icon,
  expanded,
  onToggle,
  children,
}: Props) {
  const colors = useCompanyTheme();
  const chevronRotation = useSharedValue(expanded ? 0 : -90);

  useEffect(() => {
    chevronRotation.value = withTiming(expanded ? 0 : -90, { duration: 200 });
  }, [expanded, chevronRotation]);

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle(id);
  }, [id, onToggle]);

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
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}, ${expanded ? "expanded" : "collapsed"}`}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingHorizontal: HOME_SPACE.md,
          paddingVertical: 14,
          minHeight: 52,
          backgroundColor: pressed ? colors.accentSoft : colors.cardBg,
        })}
      >
        <Animated.View style={chevronStyle}>
          <ChevronDown size={18} color={colors.muted} strokeWidth={2.4} />
        </Animated.View>
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
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{title}</Text>
          {!expanded && summary ? (
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }} numberOfLines={2}>
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
