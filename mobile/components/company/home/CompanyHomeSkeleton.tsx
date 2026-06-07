import { View, type DimensionValue } from "react-native";

import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";

function Block({ height, width = "100%" }: { height: number; width?: DimensionValue }) {
  const colors = useCompanyTheme();
  return (
    <View
      style={{
        height,
        width,
        borderRadius: COMPANY_RADIUS.md,
        backgroundColor: colors.surfaceMuted,
      }}
    />
  );
}

export function CompanyHomeSkeleton() {
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: HOME_SPACE.lg,
          paddingVertical: 12,
          gap: 10,
        }}
      >
        <Block height={36} width={36} />
        <Block height={18} width="45%" />
        <View style={{ flex: 1 }} />
        <Block height={40} width={40} />
        <Block height={40} width={40} />
      </View>

      <View style={{ padding: HOME_SPACE.lg, gap: HOME_SPACE.lg }}>
        <View style={{ gap: 8 }}>
          <Block height={26} width="55%" />
          <Block height={14} width="90%" />
          <Block height={40} width={150} />
        </View>

        <View style={{ flexDirection: "row", gap: HOME_SPACE.sm }}>
          <Block height={76} width={132} />
          <Block height={76} width={132} />
          <Block height={76} width={132} />
        </View>

        <Block height={160} />
        <Block height={120} />
      </View>
    </View>
  );
}
