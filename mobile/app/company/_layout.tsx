import { Stack } from "expo-router";

import { CompanyGate } from "@/components/company/CompanyGate";

export default function CompanyLayout() {
  return (
    <CompanyGate>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="talent-search" />
        <Stack.Screen name="talent-results" />
      </Stack>
    </CompanyGate>
  );
}
