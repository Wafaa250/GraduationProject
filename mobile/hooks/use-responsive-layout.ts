import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  CONTENT_MAX_WIDTH,
  SPACING,
  type DeviceSize,
  type SpacingKey,
  getDeviceSize,
  horizontalPaddingForWidth,
  scaleSize,
} from "@/constants/responsiveLayout";

export type ResponsiveLayout = {
  width: number;
  height: number;
  deviceSize: DeviceSize;
  horizontalPadding: number;
  maxContentWidth: number;
  contentWidth: number;
  isCompactHeight: boolean;
  insets: ReturnType<typeof useSafeAreaInsets>;
  scale: (base: number) => number;
  space: (key: SpacingKey) => number;
  fontSize: {
    title: number;
    subtitle: number;
    label: number;
    body: number;
    button: number;
    footer: number;
  };
  touchTarget: number;
  radius: {
    input: number;
    button: number;
  };
  iconSize: number;
};

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const deviceSize = getDeviceSize(width);
  const horizontalPadding = horizontalPaddingForWidth(width);
  const maxContentWidth = deviceSize === "tablet" ? CONTENT_MAX_WIDTH : width;
  const contentWidth = Math.min(width - horizontalPadding * 2, maxContentWidth);
  const isCompactHeight = height < 680 || deviceSize === "small";

  const scale = (base: number) => scaleSize(base, width);

  const space = (key: SpacingKey) => {
    const base = SPACING[key];
    if (deviceSize === "small") return Math.round(base * 0.9);
    if (deviceSize === "tablet") return Math.round(base * 1.1);
    return base;
  };

  return {
    width,
    height,
    deviceSize,
    horizontalPadding,
    maxContentWidth,
    contentWidth,
    isCompactHeight,
    insets,
    scale,
    space,
    fontSize: {
      title: scale(deviceSize === "small" ? 30 : deviceSize === "tablet" ? 38 : 34),
      subtitle: scale(16),
      label: scale(14),
      body: scale(16),
      button: scale(17),
      footer: scale(15),
    },
    touchTarget: scale(56),
    radius: {
      input: scale(16),
      button: scale(16),
    },
    iconSize: scale(20),
  };
}
