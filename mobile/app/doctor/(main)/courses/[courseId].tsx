import { useLocalSearchParams } from "expo-router";

import { DoctorPlaceholderScreen } from "@/components/doctor/DoctorPlaceholderScreen";

export default function DoctorCourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();

  return (
    <DoctorPlaceholderScreen
      title="Course Workspace"
      description={`Course #${courseId ?? ""} management is coming soon to mobile.`}
    />
  );
}
