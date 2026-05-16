import { Stack } from "expo-router";

export default function OrgRecruitmentCampaignsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="[campaignId]" />
    </Stack>
  );
}
