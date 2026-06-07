import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DOCTOR_RADIUS } from "@/components/doctor/ui/doctorDesignSystem";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

const VISIBLE_TABS = new Set(["dashboard", "requests", "projects", "courses", "profile"]);

export function DoctorTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
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
        const label =
          typeof options.tabBarAccessibilityLabel === "string"
            ? options.tabBarAccessibilityLabel
            : typeof options.title === "string"
              ? options.title
              : route.name;

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
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const color = isFocused ? colors.primary : colors.muted;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            onPress={onPress}
            onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
            style={styles.tab}
          >
            <View
              style={[
                styles.iconWrap,
                isFocused && { backgroundColor: colors.primarySoft, borderRadius: DOCTOR_RADIUS.sm },
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
    paddingHorizontal: 6,
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
    fontSize: 10,
    fontWeight: "600",
    maxWidth: "100%",
  },
  labelFocused: {
    fontWeight: "800",
  },
});
