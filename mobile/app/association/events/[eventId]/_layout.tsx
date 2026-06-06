import { Stack } from "expo-router";

export default function AssociationEventDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="registration-form" />
      <Stack.Screen name="registrations/[registrationId]" />
    </Stack>
  );
}
