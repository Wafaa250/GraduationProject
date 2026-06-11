import { Stack } from "expo-router";

import { StudentRouteGuard } from "@/components/student/StudentRouteGuard";

export default function GraduationProjectsLayout() {
  return (
    <StudentRouteGuard>
      <Stack screenOptions={{ headerShown: false }} />
    </StudentRouteGuard>
  );
}
