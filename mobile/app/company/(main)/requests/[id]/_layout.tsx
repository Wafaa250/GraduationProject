import { Stack } from "expo-router";

export default function CompanyRequestIdLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="recommendations" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}
