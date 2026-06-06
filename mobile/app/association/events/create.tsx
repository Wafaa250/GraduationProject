import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { createOrganizationEvent } from "@/api/organizationEventsApi";
import {
  AssociationEventForm,
  emptyEventFormState,
} from "@/components/association/AssociationEventForm";
import { AssociationPageHeader } from "@/components/association/AssociationPageHeader";
import { AssociationWorkspaceScreen } from "@/components/association/AssociationWorkspaceScreen";
import { associationEventEditPath, ASSOCIATION_ROUTES } from "@/lib/associationRoutes";

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
            const created = await createOrganizationEvent(payload);
            router.replace(associationEventEditPath(created.id) as never);
          } catch (err) {
            Alert.alert("Could not create event", parseApiErrorMessage(err));
          } finally {
            setSaving(false);
          }
        }}
      />
    </AssociationWorkspaceScreen>
  );
}
