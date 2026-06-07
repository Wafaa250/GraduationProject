import { Pressable, ScrollView, Text } from "react-native";

import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";

export type CompanySegmentTab<T extends string> = {
  key: T;
  label: string;
};

type Props<T extends string> = {
  tabs: CompanySegmentTab<T>[];
  active: T;
  onChange: (key: T) => void;
};

export function CompanySegmentTabs<T extends string>({ tabs, active, onChange }: Props<T>) {
  const colors = useCompanyTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: HOME_SPACE.sm, paddingVertical: 2 }}
      style={{ marginBottom: HOME_SPACE.md }}
    >
      {tabs.map((tab) => {
        const selected = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={({ pressed }) => ({
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: COMPANY_RADIUS.pill,
              backgroundColor: selected ? colors.accent : colors.surfaceMuted,
              borderWidth: 1,
              borderColor: selected ? colors.accent : colors.border,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: selected ? "700" : "600",
                color: selected ? "#FFFFFF" : colors.foreground,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
