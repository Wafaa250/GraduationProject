import { Stack } from "expo-router";

export default function CompanyDiscoveryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[requestId]/students/[studentProfileId]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="[requestId]/teams/[teamId]" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}
