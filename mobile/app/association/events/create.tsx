import { router, type Href } from "expo-router";
import { useState } from "react";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { createOrganizationEvent } from "@/api/organizationEventsApi";
import {
  AssociationEventForm,
  emptyEventFormState,
} from "@/components/association/AssociationEventForm";
import { AssociationPageHeader } from "@/components/association/AssociationPageHeader";
import { AssociationWorkspaceScreen } from "@/components/association/AssociationWorkspaceScreen";
import { associationEventPath, ASSOCIATION_ROUTES } from "@/lib/associationRoutes";
import { showAlert } from "@/lib/confirmAlert";

export default function AssociationCreateEventScreen() {
  const [saving, setSaving] = useState(false);

  return (
    <AssociationWorkspaceScreen showBack fallbackHref={ASSOCIATION_ROUTES.events}>
      <AssociationPageHeader
        title="Create event"
        subtitle="Set up a new workshop, hackathon, or gathering."
      />
      <AssociationEventForm
        initial={emptyEventFormState()}
        submitLabel="Create event"
        saving={saving}
        onCancel={() => router.back()}
        onSubmit={async (payload) => {
          setSaving(true);
          try {
            console.log("[AssociationCreateEvent] request payload:", payload);
            const created = await createOrganizationEvent(payload);
            console.log("[AssociationCreateEvent] API response:", created);
            showAlert("Event created successfully", undefined, () => {
              router.replace(associationEventPath(created.id) as Href);
            });
          } catch (err) {
            console.error("[AssociationCreateEvent] API error:", err);
            showAlert("Could not create event", parseApiErrorMessage(err));
            throw err;
          } finally {
            setSaving(false);
          }
        }}
      />
    </AssociationWorkspaceScreen>
  );
}
