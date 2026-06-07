import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { navigateToCompanyTabRoot } from "@/lib/companyTabNavigation";

const VISIBLE_TABS = new Set(["dashboard", "requests", "saved", "workspace", "profile"]);

export function CompanyTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const colors = useCompanyTheme();
  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.tabBarBorder,
          paddingBottom: bottomPad,
          height: layout.scale(56) + bottomPad,
        },
        Platform.select({
          ios: {
            shadowColor: colors.cardShadow,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.8,
            shadowRadius: 8,
          },
          android: { elevation: 8 },
          default: {},
        }),
      ]}
    >
      {state.routes.map((route, index) => {
        if (!VISIBLE_TABS.has(route.name)) return null;

        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          if (Platform.OS === "ios") {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (event.defaultPrevented) return;
          navigateToCompanyTabRoot(route.name);
        };

        const color = isFocused ? colors.accent : colors.muted;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title ?? route.name}
            onPress={onPress}
            style={styles.tab}
          >
            <View
              style={[
                styles.iconWrap,
                isFocused && { backgroundColor: colors.navActive, borderRadius: COMPANY_RADIUS.sm },
              ]}
            >
              {options.tabBarIcon?.({ focused: isFocused, color, size: 21 })}
            </View>
            <Text style={[styles.label, { color }, isFocused && styles.labelFocused]} numberOfLines={1}>
              {options.title ?? route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    gap: 3,
  },
  iconWrap: {
    width: 40,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 9,
    fontWeight: "600",
    maxWidth: "100%",
  },
  labelFocused: {
    fontWeight: "800",
  },
});
