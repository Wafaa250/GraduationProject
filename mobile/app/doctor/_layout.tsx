import { Stack } from "expo-router";

import { DoctorRouteGuard } from "@/components/doctor/DoctorRouteGuard";
import { DoctorAccountMenuProvider } from "@/components/doctor/DoctorAccountMenuProvider";

export default function DoctorLayout() {
  return (
    <DoctorRouteGuard>
      <DoctorAccountMenuProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(main)" />
          <Stack.Screen name="edit-profile" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="messages" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="notifications" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="students/[userId]" options={{ animation: "slide_from_right" }} />
        </Stack>
      </DoctorAccountMenuProvider>
    </DoctorRouteGuard>
  );
}
