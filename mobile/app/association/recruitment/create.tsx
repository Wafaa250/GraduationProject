import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { createOrganizationRecruitmentCampaign } from "@/api/recruitmentCampaignsApi";
import { AssociationPageHeader } from "@/components/association/AssociationPageHeader";
import {
  AssociationRecruitmentForm,
  emptyRecruitmentFormState,
} from "@/components/association/AssociationRecruitmentForm";
import { AssociationWorkspaceScreen } from "@/components/association/AssociationWorkspaceScreen";
import { ASSOCIATION_ROUTES } from "@/lib/associationRoutes";
import { associationRecruitmentCampaignEditPath } from "@/lib/associationRoutes";

export default function AssociationCreateRecruitmentScreen() {
  const [saving, setSaving] = useState(false);

  return (
    <AssociationWorkspaceScreen showBack fallbackHref={ASSOCIATION_ROUTES.recruitment} navTitle="Create campaign">
      <AssociationPageHeader
        title="Open Selection Applications"
        subtitle="Create a new executive board, committee, or volunteer selection cycle."
      />
      <AssociationRecruitmentForm
        initial={emptyRecruitmentFormState()}
        submitLabel="Create campaign"
        saving={saving}
        onCancel={() => router.back()}
        onSubmit={async (payload) => {
          setSaving(true);
          try {
            const created = await createOrganizationRecruitmentCampaign(payload);
            router.replace(associationRecruitmentCampaignEditPath(created.id) as never);
          } catch (err) {
            Alert.alert("Could not create campaign", parseApiErrorMessage(err));
          } finally {
            setSaving(false);
          }
        }}
      />
    </AssociationWorkspaceScreen>
  );
}
