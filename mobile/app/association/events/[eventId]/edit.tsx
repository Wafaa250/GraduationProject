import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getOrganizationEvent,
  updateOrganizationEvent,
  type StudentOrganizationEvent,
} from "@/api/organizationEventsApi";
import { AssociationEventForm, type EventFormState } from "@/components/association/AssociationEventForm";
import { AssociationLoadingState } from "@/components/association/AssociationLoadingState";
import { AssociationPageHeader } from "@/components/association/AssociationPageHeader";
import { AssociationWorkspaceScreen } from "@/components/association/AssociationWorkspaceScreen";
import { associationEventPath } from "@/lib/associationRoutes";
import type { Href } from "expo-router";

function eventBackHref(eventId: number): Href {
  return associationEventPath(eventId) as Href;
}

function eventToForm(event: StudentOrganizationEvent): EventFormState {
  return {
    title: event.title,
    description: event.description,
    eventType: event.eventType,
    category: event.category,
    location: event.location ?? "",
    isOnline: event.isOnline,
    eventDate: new Date(event.eventDate),
    registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline) : null,
    maxParticipants: event.maxParticipants != null ? String(event.maxParticipants) : "",
    coverImageUrl: event.coverImageUrl ?? null,
  };
}

export default function AssociationEditEventScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const numericId = Number(eventId);
  const [initial, setInitial] = useState<EventFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(numericId)) return;
    setLoading(true);
    try {
      const event = await getOrganizationEvent(numericId);
      setInitial(eventToForm(event));
    } catch (err) {
      Alert.alert("Could not load event", parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [numericId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !initial) {
    return (
      <AssociationWorkspaceScreen showBack fallbackHref={eventBackHref(numericId)} navTitle="Edit event">
        <AssociationLoadingState message="Loading event…" />
      </AssociationWorkspaceScreen>
    );
  }

  return (
    <AssociationWorkspaceScreen showBack fallbackHref={eventBackHref(numericId)} navTitle="Edit event">
      <AssociationPageHeader title="Edit event" subtitle="Update event details and registration settings." />
      <AssociationEventForm
        initial={initial}
        submitLabel="Save changes"
        saving={saving}
        onCancel={() => router.back()}
        onSubmit={async (payload) => {
          setSaving(true);
          try {
            await updateOrganizationEvent(numericId, payload);
            router.back();
          } catch (err) {
            Alert.alert("Could not save event", parseApiErrorMessage(err));
          } finally {
            setSaving(false);
          }
        }}
      />
    </AssociationWorkspaceScreen>
  );
}
