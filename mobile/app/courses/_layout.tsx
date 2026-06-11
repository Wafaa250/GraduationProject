import { Stack } from "expo-router";

import { StudentRouteGuard } from "@/components/student/StudentRouteGuard";

export default function CoursesLayout() {
  return (
    <StudentRouteGuard>
      <Stack screenOptions={{ headerShown: false }} />
    </StudentRouteGuard>
  );
}
