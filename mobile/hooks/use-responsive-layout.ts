import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

import {
  COMPACT_PHONE_MAX_WIDTH,
  DASHBOARD_CONTENT_MAX_WIDTH,
  FORM_CARD_MAX_WIDTH,
  TABLET_MIN_WIDTH,
} from "@/constants/responsiveLayout";

export type ResponsiveLayout = {
  width: number;
  height: number;
  isTablet: boolean;
  isCompact: boolean;
  horizontalPadding: number;
  /** Usable inner width after horizontal padding */
  innerWidth: number;
  maxFormWidth: number;
  maxDashboardWidth: number;
  /** Decorative blob diameter scaled to screen (clamped) */
  blobDiameter: (factor?: number) => number;
};

/**
 * Window-aware layout values for responsive screens.
 */
export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isTablet = width >= TABLET_MIN_WIDTH;
    const isCompact = width <= COMPACT_PHONE_MAX_WIDTH;
    const horizontalPadding = Math.max(
      12,
      Math.min(isTablet ? 28 : 20, Math.round(width * (isTablet ? 0.04 : 0.045)))
    );
    const innerWidth = Math.max(0, width - horizontalPadding * 2);
    const maxFormWidth = Math.min(FORM_CARD_MAX_WIDTH, innerWidth);
    const maxDashboardWidth = Math.min(DASHBOARD_CONTENT_MAX_WIDTH, innerWidth);

    const blobDiameter = (factor = 0.85) => {
      const base = Math.min(width, height) * factor;
      return Math.min(520, Math.max(220, Math.round(base)));
    };

    return {
      width,
      height,
      isTablet,
      isCompact,
      horizontalPadding,
      innerWidth,
      maxFormWidth,
      maxDashboardWidth,
      blobDiameter,
    };
  }, [width, height]);
}
