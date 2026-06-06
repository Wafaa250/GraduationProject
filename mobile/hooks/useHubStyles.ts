import { useMemo } from "react";
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from "react-native";

import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";

type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

export function useHubStyles<T extends NamedStyles>(factory: (colors: HubColorScheme) => T): T {
  const { colors } = useHubTheme();
  return useMemo(() => StyleSheet.create(factory(colors)), [colors, factory]);
}
