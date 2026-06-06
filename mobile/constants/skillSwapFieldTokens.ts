import type { TextStyle, ViewStyle } from "react-native";

/** Shared SkillSwap field chrome — keep TextInput and Select visually identical. */
export type SkillSwapFieldColors = {
  border: string;
  inputBg: string;
  foreground: string;
  muted: string;
};

export type SkillSwapFieldMetrics = {
  borderRadius: number;
  minHeight: number;
  paddingHorizontal: number;
  paddingVertical: number;
  fontSize: number;
  labelFontSize: number;
};

export function skillSwapInputShellStyle(
  colors: SkillSwapFieldColors,
  metrics: SkillSwapFieldMetrics,
  error?: boolean,
  errorBorderColor = "#DC2626",
): ViewStyle {
  return {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderWidth: 1,
    borderColor: error ? errorBorderColor : colors.border,
    backgroundColor: colors.inputBg,
    borderRadius: metrics.borderRadius,
    minHeight: metrics.minHeight,
    paddingHorizontal: metrics.paddingHorizontal,
    paddingVertical: metrics.paddingVertical,
  };
}

export function skillSwapFieldLabelStyle(
  colors: SkillSwapFieldColors,
  fontSize: number,
  fontWeight: TextStyle["fontWeight"] = "700",
): TextStyle {
  return {
    fontWeight,
    color: colors.foreground,
    fontSize,
  };
}

export function skillSwapFieldValueStyle(
  colors: SkillSwapFieldColors,
  fontSize: number,
): TextStyle {
  return {
    flex: 1,
    color: colors.foreground,
    fontSize,
    fontWeight: "400",
  };
}

export function skillSwapFieldPlaceholderStyle(
  colors: SkillSwapFieldColors,
  fontSize: number,
): TextStyle {
  return {
    flex: 1,
    color: colors.muted,
    fontSize,
    fontWeight: "400",
  };
}
