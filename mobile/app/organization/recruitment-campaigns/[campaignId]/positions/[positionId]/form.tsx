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
import { getOrganizationRecruitmentCampaign } from "@/api/organizationRecruitmentCampaignsApi";
import { PositionApplicationFormEditor } from "@/components/organization/PositionApplicationFormEditor";
import { OrgScreenHeader } from "@/components/organization/OrgScreenHeader";
import { assocColors } from "@/constants/associationTheme";
import { spacing } from "@/constants/responsiveLayout";

export default function OrganizationPositionApplicationFormScreen() {
  const { campaignId, positionId } = useLocalSearchParams<{
    campaignId: string;
    positionId: string;
  }>();
  const campaignNum = Number(campaignId);
  const positionNum = Number(positionId);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [positionTitle, setPositionTitle] = useState("");
  const kav = Platform.OS === "ios" ? "padding" : undefined;
  const backHref = Number.isFinite(campaignNum)
    ? (`/organization/recruitment-campaigns/${campaignNum}/edit` as Href)
    : ("/organization/recruitment-campaigns" as Href);

  const load = useCallback(async () => {
    if (!Number.isFinite(campaignNum) || !Number.isFinite(positionNum)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const campaign = await getOrganizationRecruitmentCampaign(campaignNum);
      const position = campaign.positions.find((p) => p.id === positionNum);
      if (!position) {
        Alert.alert("Error", "Position not found");
        router.replace(backHref);
        return;
      }
      setPositionTitle(position.roleTitle);
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
      router.replace(backHref);
    } finally {
      setLoading(false);
    }
  }, [campaignNum, positionNum, backHref]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <OrgScreenHeader
        title={positionTitle.trim() ? `${positionTitle} form` : "Application form"}
        onBack={() => router.replace(backHref)}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={kav}
        keyboardVerticalOffset={insets.top + spacing.sm}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={assocColors.accent} size="large" />
          </View>
        ) : Number.isFinite(campaignNum) && Number.isFinite(positionNum) ? (
          <PositionApplicationFormEditor
            campaignId={campaignNum}
            positionId={positionNum}
            positionTitle={positionTitle}
          />
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: assocColors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
