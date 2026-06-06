import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getOrganizationRecruitmentCampaign,
  updateOrganizationRecruitmentCampaign,
  type RecruitmentCampaign,
} from "@/api/recruitmentCampaignsApi";
import { AssociationPageHeader } from "@/components/association/AssociationPageHeader";
import {
  AssociationRecruitmentForm,
  type RecruitmentFormState,
} from "@/components/association/AssociationRecruitmentForm";
import { AssociationLoadingState } from "@/components/association/AssociationLoadingState";
import { AssociationWorkspaceScreen } from "@/components/association/AssociationWorkspaceScreen";
import { associationRecruitmentCampaignPath } from "@/lib/associationRoutes";

function campaignToForm(campaign: RecruitmentCampaign): RecruitmentFormState {
  return {
    title: campaign.title,
    description: campaign.description,
    applicationDeadline: new Date(campaign.applicationDeadline),
    coverImageUrl: campaign.coverImageUrl ?? null,
    positions: campaign.positions.map((p) => ({
      id: p.id,
      roleTitle: p.roleTitle,
      neededCount: p.neededCount,
      description: p.description,
      requirements: p.requirements,
      requiredSkills: p.requiredSkills,
      displayOrder: p.displayOrder,
    })),
  };
}

export default function AssociationEditRecruitmentScreen() {
  const { campaignId } = useLocalSearchParams<{ campaignId: string }>();
  const numericId = Number(campaignId);
  const [initial, setInitial] = useState<RecruitmentFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(numericId)) return;
    setLoading(true);
    try {
      const campaign = await getOrganizationRecruitmentCampaign(numericId);
      setInitial(campaignToForm(campaign));
    } catch (err) {
      Alert.alert("Could not load campaign", parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [numericId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !initial) {
    return (
      <AssociationWorkspaceScreen
        showBack
        fallbackHref={associationRecruitmentCampaignPath(numericId)}
        navTitle="Edit campaign"
      >
        <AssociationLoadingState message="Loading campaign…" />
      </AssociationWorkspaceScreen>
    );
  }

  return (
    <AssociationWorkspaceScreen
      showBack
      fallbackHref={associationRecruitmentCampaignPath(numericId)}
      navTitle="Edit campaign"
    >
      <AssociationPageHeader title="Edit selection applications" subtitle="Update campaign details and positions." />
      <AssociationRecruitmentForm
        initial={initial}
        submitLabel="Save changes"
        saving={saving}
        onCancel={() => router.back()}
        onSubmit={async (payload) => {
          setSaving(true);
          try {
            await updateOrganizationRecruitmentCampaign(numericId, payload);
            router.back();
          } catch (err) {
            Alert.alert("Could not save campaign", parseApiErrorMessage(err));
          } finally {
            setSaving(false);
          }
        }}
      />
    </AssociationWorkspaceScreen>
  );
}
