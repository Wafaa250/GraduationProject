import { router, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  deleteOrganizationRecruitmentCampaign,
  listOrganizationRecruitmentCampaigns,
  publishOrganizationRecruitmentCampaign,
  type RecruitmentCampaign,
} from "@/api/recruitmentCampaignsApi";
import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { AssociationListEmpty } from "@/components/association/AssociationListEmpty";
import { AssociationLoadingState } from "@/components/association/AssociationLoadingState";
import { AssociationPageHeader } from "@/components/association/AssociationPageHeader";
import { AssociationWorkspaceScreen } from "@/components/association/AssociationWorkspaceScreen";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import {
  ASSOCIATION_ROUTES,
  associationRecruitmentCampaignEditPath,
  associationRecruitmentCampaignPath,
} from "@/lib/associationRoutes";
import { confirmAlert, showAlert } from "@/lib/confirmAlert";
import { formatEventDate } from "@/lib/eventFormUtils";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function AssociationRecruitmentListScreen() {
  const layout = useResponsiveLayout();
  const [campaigns, setCampaigns] = useState<RecruitmentCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await listOrganizationRecruitmentCampaigns();
      setCampaigns(data);
    } catch (err) {
      Alert.alert("Could not load campaigns", parseApiErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = (campaign: RecruitmentCampaign) => {
    confirmAlert({
      title: "Delete campaign",
      message: `Delete "${campaign.title}"? This cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: async () => {
        setBusyId(campaign.id);
        try {
          await deleteOrganizationRecruitmentCampaign(campaign.id);
          setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id));
          showAlert("Campaign deleted", "The selection application cycle was removed.");
        } catch (err) {
          showAlert("Delete failed", parseApiErrorMessage(err));
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  const handlePublish = async (campaign: RecruitmentCampaign) => {
    setBusyId(campaign.id);
    try {
      await publishOrganizationRecruitmentCampaign(campaign.id);
      await load(true);
    } catch (err) {
      Alert.alert("Publish failed", parseApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AssociationWorkspaceScreen refreshing={refreshing} onRefresh={() => void load(true)}>
      <AssociationPageHeader
        title="Executive Board Selection Applications"
        subtitle="Selection applications are open for executive board, committee, and volunteer positions within your organization."
        action={
          <AssociationActionButton
            label="Open Selection Applications"
            onPress={() => router.push(ASSOCIATION_ROUTES.recruitmentCreate as Href)}
            compact
          />
        }
      />

      {loading ? (
        <AssociationLoadingState message="Loading campaigns…" />
      ) : campaigns.length === 0 ? (
        <AssociationListEmpty
          title="No selection applications yet"
          description="Open your first executive board, committee, or volunteer selection cycle."
          actionLabel="Open Selection Applications"
          onAction={() => router.push(ASSOCIATION_ROUTES.recruitmentCreate as Href)}
        />
      ) : (
        <View style={{ gap: layout.space("md"), width: "100%" }}>
          {campaigns.map((campaign) => (
            <Pressable
              key={campaign.id}
              onPress={() => router.push(associationRecruitmentCampaignPath(campaign.id) as Href)}
              style={[styles.card, { borderRadius: layout.radius.input, padding: layout.space("md") }]}
            >
              <Text style={styles.title}>{campaign.title}</Text>
              <Text style={styles.meta}>{formatEventDate(campaign.applicationDeadline)}</Text>
              <Text style={styles.preview} numberOfLines={2}>{campaign.description}</Text>
              <Text style={styles.meta}>{campaign.positions.length} position(s)</Text>
              <View style={[styles.actions, { marginTop: layout.space("md"), gap: layout.space("sm") }]}>
                <AssociationActionButton label="View" variant="outline" compact onPress={() => router.push(associationRecruitmentCampaignPath(campaign.id) as Href)} />
                <AssociationActionButton label="Edit" variant="outline" compact onPress={() => router.push(associationRecruitmentCampaignEditPath(campaign.id) as Href)} />
                {!campaign.isPublished ? (
                  <AssociationActionButton label="Publish" compact loading={busyId === campaign.id} onPress={() => void handlePublish(campaign)} />
                ) : null}
                <AssociationActionButton label="Delete" variant="danger" compact loading={busyId === campaign.id} onPress={() => handleDelete(campaign)} />
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </AssociationWorkspaceScreen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: ASSOC_COLORS.cardBg, borderWidth: 1, borderColor: ASSOC_COLORS.border, width: "100%" },
  title: { fontWeight: "800", color: ASSOC_COLORS.foreground, fontSize: 16 },
  meta: { marginTop: 4, color: ASSOC_COLORS.muted, fontSize: 13 },
  preview: { marginTop: 6, color: ASSOC_COLORS.muted, lineHeight: 20 },
  actions: { flexDirection: "row", flexWrap: "wrap" },
});
