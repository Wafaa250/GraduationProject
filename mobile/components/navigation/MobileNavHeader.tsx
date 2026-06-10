import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Href } from "expo-router";

import { MobileBackButton } from "@/components/navigation/MobileBackButton";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  title?: string;
  subtitle?: string;
  fallbackHref?: Href | string;
  onBackPress?: () => void;
  backColor?: string;
  titleColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  leftAccessory?: ReactNode;
  rightSlot?: ReactNode;
  showBack?: boolean;
};

export function MobileNavHeader({
  title,
  subtitle,
  fallbackHref,
  onBackPress,
  backColor = "#0F172A",
  titleColor = "#0F172A",
  backgroundColor = "transparent",
  borderColor = "transparent",
  leftAccessory,
  rightSlot,
  showBack = true,
}: Props) {
  const layout = useResponsiveLayout();

  return (
    <View
      style={[
        styles.bar,
        {
          paddingHorizontal: layout.horizontalPadding,
          minHeight: layout.scale(44),
          backgroundColor,
          borderBottomColor: borderColor,
        },
      ]}
    >
      <View style={[styles.side, leftAccessory ? styles.sideWithAccessory : null]}>
        {showBack ? (
          <MobileBackButton
            fallbackHref={fallbackHref}
            color={backColor}
            onPress={onBackPress}
          />
        ) : null}
        {leftAccessory}
        {!showBack && !leftAccessory ? <View style={{ width: layout.scale(44) }} /> : null}
      </View>

      {title ? (
        <View style={styles.titleBlock} pointerEvents="box-none">
          <Text
            style={[styles.title, { fontSize: layout.fontSize.label, color: titleColor }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { fontSize: layout.fontSize.footer - 1 }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.titleSpacer} />
      )}

      <View
        style={[styles.side, styles.rightSide, rightSlot ? styles.rightSideWithSlot : null]}
        pointerEvents="box-none"
      >
        {rightSlot ?? <View style={{ width: layout.scale(44) }} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  side: {
    width: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  sideWithAccessory: {
    width: undefined,
    minWidth: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flexShrink: 0,
  },
  rightSide: {
    alignItems: "flex-end",
  },
  rightSideWithSlot: {
    width: undefined,
    minWidth: 44,
    flexShrink: 0,
  },
  titleBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  title: {
    textAlign: "center",
    fontWeight: "700",
  },
  subtitle: {
    textAlign: "center",
    color: "#64748B",
    fontWeight: "500",
  },
  titleSpacer: {
    flex: 1,
  },
});
