import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams, type Href } from "expo-router";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getOrganizationRecruitmentCampaign,
  updateOrganizationRecruitmentCampaign,
  type RecruitmentCampaign,
} from "@/api/organizationRecruitmentCampaignsApi";
import { OrganizationRecruitmentCampaignForm } from "@/components/organization/OrganizationRecruitmentCampaignForm";
import { OrgScreenHeader } from "@/components/organization/OrgScreenHeader";
import { assocColors } from "@/constants/associationTheme";
import { spacing } from "@/constants/responsiveLayout";

export default function OrganizationRecruitmentCampaignEditScreen() {
  const { campaignId } = useLocalSearchParams<{ campaignId: string }>();
  const id = Number(campaignId);
  const insets = useSafeAreaInsets();
  const [campaign, setCampaign] = useState<RecruitmentCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const kav = Platform.OS === "ios" ? "padding" : undefined;

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getOrganizationRecruitmentCampaign(id);
      setCampaign(data);
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <OrgScreenHeader title="Edit campaign" onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={kav}
        keyboardVerticalOffset={insets.top + spacing.sm}
      >
        {loading || !campaign ? (
          <View style={styles.center}>
            <ActivityIndicator color={assocColors.accent} size="large" />
          </View>
        ) : (
          <OrganizationRecruitmentCampaignForm
            key={campaign.id}
            initialCampaign={campaign}
            submitLabel="Save changes"
            saving={saving}
            campaignId={id}
            onCancel={() => router.back()}
            onSubmit={async (payload) => {
              setSaving(true);
              try {
                await updateOrganizationRecruitmentCampaign(campaign.id, payload);
                router.replace(`/organization/recruitment-campaigns/${campaign.id}` as Href);
              } catch (e) {
                Alert.alert("Error", parseApiErrorMessage(e));
              } finally {
                setSaving(false);
              }
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: assocColors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
