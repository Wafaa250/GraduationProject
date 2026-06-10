import { useWindowDimensions } from "react-native";

import { TABLET_MIN_WIDTH } from "@/constants/responsiveLayout";

/** Matches WEB `student-messages-shell` split at 768px. */
export const MESSAGES_SPLIT_MIN_WIDTH = TABLET_MIN_WIDTH;

/** Sidebar width aligned with WEB `minmax(280px, 340px)`. */
export const MESSAGES_SIDEBAR_WIDTH = 340;

export function useMessagesSplitLayout(): boolean {
  const { width } = useWindowDimensions();
  return width >= MESSAGES_SPLIT_MIN_WIDTH;
}
