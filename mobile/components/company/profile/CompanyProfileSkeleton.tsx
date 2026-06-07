import { View } from "react-native";

import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";

function Block({ width, height, style }: { width: number | `${number}%`; height: number; style?: object }) {
  const colors = useCompanyTheme();
  return (
    <View
      style={{
        width,
        height,
        borderRadius: COMPANY_RADIUS.sm,
        backgroundColor: colors.surfaceMuted,
        ...style,
      }}
    />
  );
}

export function CompanyProfileSkeleton() {
  const colors = useCompanyTheme();

  return (
    <View style={{ paddingHorizontal: HOME_SPACE.lg, gap: HOME_SPACE.md }}>
      <View
        style={{
          height: 200,
          borderRadius: COMPANY_RADIUS.xl,
          backgroundColor: colors.surfaceMuted,
        }}
      />
      <Block width="100%" height={120} />
      <Block width="100%" height={160} />
      <Block width="100%" height={140} />
    </View>
  );
}
