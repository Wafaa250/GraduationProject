import { Platform, StyleSheet, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";

import {
  skillSwapFieldLabelStyle,
  type SkillSwapFieldColors,
} from "@/constants/skillSwapFieldTokens";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export type SkillSwapSelectFieldProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly string[] | string[];
  placeholder?: string;
  error?: string;
  colors: SkillSwapFieldColors;
  labelFontWeight?: "600" | "700";
  errorBorderColor?: string;
  minHeight?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
  /** When true, prepends an empty placeholder option (registration flows). */
  includePlaceholderOption?: boolean;
};

export function SkillSwapSelectField({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  error,
  colors,
  labelFontWeight = "700",
  errorBorderColor = "#DC2626",
  minHeight = 44,
  paddingHorizontal = 14,
  paddingVertical = 12,
  includePlaceholderOption = false,
}: SkillSwapSelectFieldProps) {
  const layout = useResponsiveLayout();

  const metrics = {
    borderRadius: layout.radius.input,
    minHeight,
    paddingHorizontal,
    paddingVertical,
    fontSize: layout.fontSize.body,
    labelFontSize: layout.fontSize.label,
  };

  return (
    <View style={{ gap: layout.space("xs"), marginBottom: layout.space("md"), width: "100%" }}>
      <Text style={skillSwapFieldLabelStyle(colors, metrics.labelFontSize, labelFontWeight)}>
        {label}
      </Text>

      <View
        style={[
          styles.shell,
          {
            borderRadius: metrics.borderRadius,
            minHeight: metrics.minHeight,
            borderColor: error ? errorBorderColor : colors.border,
            backgroundColor: colors.inputBg,
            paddingHorizontal: Platform.OS === "android" ? metrics.paddingHorizontal : 0,
          },
        ]}
      >
        <Picker
          selectedValue={value}
          onValueChange={(itemValue) => onValueChange(String(itemValue))}
          mode={Platform.OS === "android" ? "dropdown" : undefined}
          style={[
            styles.picker,
            {
              height: metrics.minHeight,
              fontSize: metrics.fontSize,
              color: colors.foreground,
              paddingHorizontal: Platform.OS === "ios" ? metrics.paddingHorizontal : 0,
            },
          ]}
          itemStyle={Platform.OS === "ios" ? styles.iosItem : undefined}
          dropdownIconColor={colors.inputBg}
          dropdownIconRippleColor="transparent"
          numberOfLines={1}
        >
          {includePlaceholderOption ? (
            <Picker.Item label={placeholder} value="" color={colors.muted} />
          ) : null}
          {options.map((option) => (
            <Picker.Item key={option} label={option} value={option} color={colors.foreground} />
          ))}
        </Picker>

        {Platform.OS === "android" ? (
          <>
            <View
              pointerEvents="none"
              style={[
                styles.androidEdgeMask,
                {
                  left: 0,
                  width: 4,
                  backgroundColor: colors.inputBg,
                  borderTopLeftRadius: metrics.borderRadius,
                  borderBottomLeftRadius: metrics.borderRadius,
                },
              ]}
            />
            <View
              pointerEvents="none"
              style={[
                styles.androidEdgeMask,
                {
                  right: 0,
                  width: 40,
                  backgroundColor: colors.inputBg,
                  borderTopRightRadius: metrics.borderRadius,
                  borderBottomRightRadius: metrics.borderRadius,
                },
              ]}
            />
          </>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    borderWidth: 1,
    overflow: "hidden",
    justifyContent: "center",
    position: "relative",
  },
  picker: {
    width: "100%",
    backgroundColor: "transparent",
    marginTop: Platform.OS === "android" ? 0 : -4,
    marginBottom: Platform.OS === "android" ? 0 : -4,
  },
  androidEdgeMask: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  iosItem: {
    fontSize: 16,
    height: 140,
  },
  error: {
    color: "#DC2626",
    fontSize: 12,
  },
});
