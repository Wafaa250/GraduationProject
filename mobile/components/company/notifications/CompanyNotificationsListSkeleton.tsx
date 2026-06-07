import { View } from "react-native";

import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";

function SkeletonBlock({
  width,
  height,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  style?: object;
}) {
  const colors = useCompanyTheme();
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: 6,
          backgroundColor: colors.surfaceMuted,
        },
        style,
      ]}
    />
  );
}

function RowSkeleton() {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: COMPANY_RADIUS.md,
        marginBottom: 8,
      }}
    >
      <SkeletonBlock width={36} height={36} style={{ borderRadius: 18 }} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonBlock width="65%" height={13} />
        <SkeletonBlock width="100%" height={11} />
        <SkeletonBlock width="22%" height={9} style={{ marginTop: 2 }} />
      </View>
    </View>
  );
}

type Props = {
  count?: number;
};

export function CompanyNotificationsListSkeleton({ count = 6 }: Props) {
  return (
    <View style={{ paddingHorizontal: HOME_SPACE.lg, paddingTop: HOME_SPACE.sm }}>
      {Array.from({ length: count }).map((_, index) => (
        <RowSkeleton key={index} />
      ))}
    </View>
  );
}
