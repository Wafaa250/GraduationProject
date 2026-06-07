import { Plus, X } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import {
  CompanyWizardPickerSheet,
  normalizeWizardPickerOptions,
} from "@/components/company/requests/wizard/CompanyWizardPickerSheet";
import { COMPANY_RADIUS, companyCardShadow } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";

type Props = {
  label: string;
  required?: boolean;
  selected: string[];
  onChange: (skills: string[]) => void;
  options: string[];
};

export function CompanyWizardSkillsField({ label, required, selected, onChange, options }: Props) {
  const colors = useCompanyTheme();
  const [open, setOpen] = useState(false);
  const pickerOptions = normalizeWizardPickerOptions(options);

  const remove = (skill: string) => {
    onChange(selected.filter((s) => s !== skill));
  };

  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}>
          {label}
          {required ? <Text style={{ color: "#DC2626" }}> *</Text> : null}
        </Text>
        {selected.length > 0 ? (
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.accent }}>
            {selected.length} selected
          </Text>
        ) : null}
      </View>

      {selected.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: HOME_SPACE.sm }}>
          {selected.map((skill) => (
            <Pressable
              key={skill}
              onPress={() => remove(skill)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: COMPANY_RADIUS.pill,
                backgroundColor: colors.accentSoft,
                borderWidth: 1,
                borderColor: colors.accentBorder,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.accentInk }}>{skill}</Text>
              <X size={12} color={colors.accent} strokeWidth={2.5} />
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={{ fontSize: 13, color: colors.muted, marginBottom: HOME_SPACE.sm }}>
          No skills selected yet.
        </Text>
      )}

      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          minHeight: 52,
          borderRadius: COMPANY_RADIUS.md,
          borderWidth: 1,
          borderColor: colors.accentBorder,
          backgroundColor: colors.accentSoft,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: pressed ? 0.94 : 1,
          ...companyCardShadow(colors),
        })}
      >
        <Plus size={16} color={colors.accent} strokeWidth={2.4} />
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.accent }}>Add skills</Text>
      </Pressable>

      <CompanyWizardPickerSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={label}
        options={pickerOptions}
        mode="multi"
        value={selected}
        onApply={onChange}
        allowCustom
        searchPlaceholder="Search skills…"
      />
    </View>
  );
}
