import { Stack } from "expo-router";

export default function AssociationRecruitmentCampaignLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="positions/[positionId]/form" />
      <Stack.Screen name="applications/[applicationId]" />
    </Stack>
  );
}
