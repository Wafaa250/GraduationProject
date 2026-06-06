import { View } from "react-native";

import { SkeletonBlock } from "@/components/doctor/DoctorDashboardSkeleton";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

function ConversationRowSkeleton() {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const avatarSize = layout.scale(52);

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 14,
        paddingHorizontal: layout.horizontalPadding,
        paddingVertical: layout.space("md"),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <SkeletonBlock width={avatarSize} height={avatarSize} borderRadius={avatarSize / 2} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBlock width="55%" height={layout.scale(14)} />
        <SkeletonBlock width="35%" height={layout.scale(10)} />
        <SkeletonBlock width="88%" height={layout.scale(12)} />
      </View>
    </View>
  );
}

type Props = {
  count?: number;
};

export function DoctorConversationsListSkeleton({ count = 8 }: Props) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <ConversationRowSkeleton key={index} />
      ))}
    </View>
  );
}
