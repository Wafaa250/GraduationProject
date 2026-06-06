import { useLocalSearchParams } from "expo-router";

import { DoctorPlaceholderScreen } from "@/components/doctor/DoctorPlaceholderScreen";

export default function DoctorProjectDetailScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();

  return (
    <DoctorPlaceholderScreen
      title="Project Workspace"
      description={`Project #${projectId ?? ""} details are coming soon to mobile.`}
    />
  );
}
