import { View } from "react-native";

import { SkeletonBlock } from "@/components/doctor/DoctorDashboardSkeleton";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

function NotificationRowSkeleton() {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const iconSize = layout.scale(44);

  return (
    <View
      style={{
        flexDirection: "row",
        gap: layout.space("md"),
        paddingVertical: layout.space("md"),
        paddingHorizontal: layout.space("md"),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <SkeletonBlock width={iconSize} height={iconSize} borderRadius={layout.radius.input} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBlock width="72%" height={layout.scale(14)} />
        <SkeletonBlock width="100%" height={layout.scale(12)} />
        <SkeletonBlock width="55%" height={layout.scale(12)} />
        <SkeletonBlock width="28%" height={layout.scale(10)} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

type Props = {
  count?: number;
};

export function NotificationsListSkeleton({ count = 6 }: Props) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <NotificationRowSkeleton key={index} />
      ))}
    </View>
  );
}
