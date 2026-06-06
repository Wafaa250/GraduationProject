import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Href } from "expo-router";

import { MobileBackButton } from "@/components/navigation/MobileBackButton";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  title?: string;
  fallbackHref?: Href | string;
  onBackPress?: () => void;
  backColor?: string;
  titleColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  rightSlot?: ReactNode;
  showBack?: boolean;
};

export function MobileNavHeader({
  title,
  fallbackHref,
  onBackPress,
  backColor = "#0F172A",
  titleColor = "#0F172A",
  backgroundColor = "transparent",
  borderColor = "transparent",
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
      <View style={styles.side}>
        {showBack ? (
          <MobileBackButton
            fallbackHref={fallbackHref}
            color={backColor}
            onPress={onBackPress}
          />
        ) : (
          <View style={{ width: layout.scale(44) }} />
        )}
      </View>

      {title ? (
        <Text
          style={[styles.title, { fontSize: layout.fontSize.label, color: titleColor }]}
          numberOfLines={1}
        >
          {title}
        </Text>
      ) : (
        <View style={styles.titleSpacer} />
      )}

      <View style={[styles.side, styles.rightSide]}>{rightSlot ?? <View style={{ width: layout.scale(44) }} />}</View>
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
  rightSide: {
    alignItems: "flex-end",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontWeight: "700",
  },
  titleSpacer: {
    flex: 1,
  },
});
