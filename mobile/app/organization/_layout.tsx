import { Stack } from "expo-router";

import { OrganizationGate } from "@/components/organization/OrganizationGate";

export default function OrganizationLayout() {
  return (
    <OrganizationGate>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="events" />
        <Stack.Screen name="recruitment-campaigns" />
        <Stack.Screen name="team-members" />
      </Stack>
    </OrganizationGate>
  );
}
