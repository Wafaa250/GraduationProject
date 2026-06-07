import { useMemo, useState } from "react";

import {
  CompanyWizardPickerSheet,
  normalizeWizardPickerOptions,
} from "@/components/company/requests/wizard/CompanyWizardPickerSheet";
import { CompanyWizardSelectTrigger } from "@/components/company/requests/wizard/CompanyWizardSelectTrigger";

type OptionItem = { value: string; label: string };

type Props = {
  label: string;
  required?: boolean;
  value: string;
  placeholder: string;
  options: string[] | OptionItem[];
  onChange: (value: string) => void;
  allowCustom?: boolean;
  disabled?: boolean;
  searchPlaceholder?: string;
};

function labelForValue(items: OptionItem[], value: string): string {
  return items.find((o) => o.value === value)?.label ?? value;
}

export function CompanyWizardOptionField({
  label,
  required,
  value,
  placeholder,
  options,
  onChange,
  allowCustom = false,
  disabled,
  searchPlaceholder,
}: Props) {
  const [open, setOpen] = useState(false);
  const items = useMemo(() => normalizeWizardPickerOptions(options), [options]);
  const display = value ? labelForValue(items, value) : "";

  return (
    <>
      <CompanyWizardSelectTrigger
        label={label}
        required={required}
        value={display}
        placeholder={placeholder}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
      />
      <CompanyWizardPickerSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={label}
        options={items}
        mode="single"
        value={value}
        onSelect={onChange}
        allowCustom={allowCustom}
        searchPlaceholder={searchPlaceholder ?? `Search ${label.toLowerCase()}…`}
      />
    </>
  );
}
