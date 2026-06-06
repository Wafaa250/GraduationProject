import { Stack } from "expo-router";

import { DoctorRouteGuard } from "@/components/doctor/DoctorRouteGuard";

export default function DoctorLayout() {
  return (
    <DoctorRouteGuard>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(main)" />
        <Stack.Screen name="edit-profile" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="messages" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="notifications" options={{ animation: "slide_from_right" }} />
      </Stack>
    </DoctorRouteGuard>
  );
}
