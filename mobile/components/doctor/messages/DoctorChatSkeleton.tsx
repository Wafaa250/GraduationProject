import { View } from "react-native";

import { SkeletonBlock } from "@/components/doctor/DoctorDashboardSkeleton";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

function BubbleSkeleton({ align, width }: { align: "left" | "right"; width: `${number}%` }) {
  const layout = useResponsiveLayout();

  return (
    <View
      style={{
        width: "100%",
        alignItems: align === "right" ? "flex-end" : "flex-start",
        marginBottom: 10,
      }}
    >
      <SkeletonBlock width={width} height={layout.scale(44)} borderRadius={16} />
    </View>
  );
}

export function DoctorChatSkeleton() {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: layout.horizontalPadding,
        paddingTop: layout.space("sm"),
        backgroundColor: colors.background,
      }}
    >
      <BubbleSkeleton align="left" width="62%" />
      <BubbleSkeleton align="right" width="58%" />
      <BubbleSkeleton align="right" width="48%" />
      <BubbleSkeleton align="left" width="66%" />
    </View>
  );
}
