import { ASSOC_COLORS } from "@/constants/associationTheme";
import { SkillSwapSelectField } from "@/components/form/SkillSwapSelectField";

type Props = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly string[] | string[];
  error?: string;
  placeholder?: string;
};

/** Association dropdown — matches `AssociationTextField` chrome exactly. */
export function AssociationSelectField({
  label,
  value,
  onValueChange,
  options,
  error,
  placeholder,
}: Props) {
  return (
    <SkillSwapSelectField
      label={label}
      value={value}
      onValueChange={onValueChange}
      options={options}
      placeholder={placeholder}
      error={error}
      colors={{
        border: ASSOC_COLORS.border,
        inputBg: ASSOC_COLORS.inputBg,
        foreground: ASSOC_COLORS.foreground,
        muted: ASSOC_COLORS.muted,
      }}
      labelFontWeight="700"
      errorBorderColor="#DC2626"
      minHeight={44}
      paddingHorizontal={14}
      paddingVertical={12}
    />
  );
}
