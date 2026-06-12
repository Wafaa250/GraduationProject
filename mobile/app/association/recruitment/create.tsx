import axios from "axios";
import { router, type Href } from "expo-router";
import { useState } from "react";

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
import { showAlert } from "@/lib/confirmAlert";

export default function AssociationCreateRecruitmentScreen() {
  const [saving, setSaving] = useState(false);

  return (
    <AssociationWorkspaceScreen
      showBack
      fallbackHref={ASSOCIATION_ROUTES.recruitment}
      navTitle="Create campaign"
    >
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
          console.log(
            "[AssociationCreateRecruitment] submit handler executing",
          );
          setSaving(true);
          try {
            console.log(
              "[AssociationCreateRecruitment] request payload:",
              payload,
            );
            const created =
              await createOrganizationRecruitmentCampaign(payload);
            console.log(
              "[AssociationCreateRecruitment] API response:",
              created,
            );
            showAlert(
              "Selection saved as draft — complete application forms, then publish from the list",
              undefined,
              () => {
                router.replace(
                  associationRecruitmentCampaignEditPath(created.id) as Href,
                );
              },
            );
          } catch (err) {
            if (axios.isAxiosError(err)) {
              console.error(
                "[AssociationCreateRecruitment] API status:",
                err.response?.status,
              );
              console.error(
                "[AssociationCreateRecruitment] API response body:",
                err.response?.data,
              );
            }
            console.error("[AssociationCreateRecruitment] API error:", err);
            showAlert("Could not create campaign", parseApiErrorMessage(err));
            throw err;
          } finally {
            setSaving(false);
          }
        }}
      />
    </AssociationWorkspaceScreen>
  );
}
