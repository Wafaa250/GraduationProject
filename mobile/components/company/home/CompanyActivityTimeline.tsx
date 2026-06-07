import { Text, View } from "react-native";

import type { CompanyDashboardActivityItem } from "@/api/companyApi";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { formatRelativeTime } from "@/lib/companyDashboardUtils";

type Props = {
  items: CompanyDashboardActivityItem[];
};

export function CompanyActivityTimeline({ items }: Props) {
  const colors = useCompanyTheme();

  return (
    <View style={{ paddingVertical: HOME_SPACE.sm }}>
      {items.map((item, index) => (
        <View
          key={item.id}
          style={{
            flexDirection: "row",
            gap: HOME_SPACE.md,
            paddingBottom: index < items.length - 1 ? HOME_SPACE.lg : 0,
          }}
        >
          <View style={{ alignItems: "center", width: 14 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: colors.accent,
                marginTop: 4,
              }}
            />
            {index < items.length - 1 ? (
              <View
                style={{
                  flex: 1,
                  width: 2,
                  backgroundColor: colors.accentBorder,
                  marginTop: 4,
                  minHeight: 24,
                }}
              />
            ) : null}
          </View>
          <View style={{ flex: 1, minWidth: 0, paddingBottom: HOME_SPACE.sm }}>
            <Text style={{ fontSize: 14, lineHeight: 20, fontWeight: "500", color: colors.foreground }}>
              {item.description}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 12, fontWeight: "600", color: colors.muted }}>
              {formatRelativeTime(item.createdAt)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
