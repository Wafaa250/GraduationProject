import { SkillSwapSelectField } from "@/components/form/SkillSwapSelectField";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type RegSelectFieldProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly string[] | string[];
  placeholder?: string;
  error?: string;
};

/** Registration dropdown — matches `RegTextField` chrome exactly. */
export function RegSelectField({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  error,
}: RegSelectFieldProps) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();

  return (
    <SkillSwapSelectField
      label={label}
      value={value}
      onValueChange={onValueChange}
      options={options}
      placeholder={placeholder}
      includePlaceholderOption
      error={error}
      colors={hubColorsToFieldColors(colors)}
      labelFontWeight="600"
      errorBorderColor="#FCA5A5"
      minHeight={layout.touchTarget}
      paddingHorizontal={layout.space("lg")}
      paddingVertical={12}
    />
  );
}

function hubColorsToFieldColors(colors: HubColorScheme) {
  return {
    border: colors.border,
    inputBg: colors.inputBg,
    foreground: colors.foreground,
    muted: colors.muted,
  };
}
