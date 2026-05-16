import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { createOrganizationRecruitmentCampaign } from "@/api/organizationRecruitmentCampaignsApi";
import { OrganizationRecruitmentCampaignForm } from "@/components/organization/OrganizationRecruitmentCampaignForm";
import { OrgScreenHeader } from "@/components/organization/OrgScreenHeader";
import { assocColors } from "@/constants/associationTheme";
import { spacing } from "@/constants/responsiveLayout";

export default function OrganizationRecruitmentCampaignCreateScreen() {
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);
  const kav = Platform.OS === "ios" ? "padding" : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <OrgScreenHeader title="Create campaign" onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={kav}
        keyboardVerticalOffset={insets.top + spacing.sm}
      >
        <OrganizationRecruitmentCampaignForm
          submitLabel="Create campaign"
          saving={saving}
          onCancel={() => router.back()}
          onSubmit={async (payload) => {
            setSaving(true);
            try {
              const created = await createOrganizationRecruitmentCampaign(payload);
              router.replace(
                `/organization/recruitment-campaigns/${created.id}/edit` as Href,
              );
            } catch (e) {
              Alert.alert("Error", parseApiErrorMessage(e));
            } finally {
              setSaving(false);
            }
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: assocColors.bg },
});
