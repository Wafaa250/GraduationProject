import { router, useLocalSearchParams, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  deleteOrganizationEvent,
  getOrganizationEvent,
  publishOrganizationEvent,
  type StudentOrganizationEvent,
} from "@/api/organizationEventsApi";
import { listOrganizationEventRegistrations } from "@/api/eventRegistrationsApi";
import { getEventRegistrationForm } from "@/api/eventRegistrationFormApi";
import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { AssociationCard } from "@/components/association/AssociationCard";
import { AssociationErrorState } from "@/components/association/AssociationErrorState";
import { AssociationListEmpty } from "@/components/association/AssociationListEmpty";
import { AssociationLoadingState } from "@/components/association/AssociationLoadingState";
import { AssociationWorkspaceScreen } from "@/components/association/AssociationWorkspaceScreen";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import {
  ASSOCIATION_ROUTES,
  associationEventEditPath,
  associationEventRegistrationDetailPath,
  associationEventRegistrationFormPath,
} from "@/lib/associationRoutes";
import { confirmAlert, showAlert } from "@/lib/confirmAlert";
import {
  formatEventDate,
  formatRegistrationCloseDate,
  getRegistrationDeadlineStatus,
} from "@/lib/eventFormUtils";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function AssociationEventDetailScreen() {
  const layout = useResponsiveLayout();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const numericId = Number(eventId);
  const [event, setEvent] = useState<StudentOrganizationEvent | null>(null);
  const [registrations, setRegistrations] = useState<
    Awaited<ReturnType<typeof listOrganizationEventRegistrations>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(numericId)) return;
    setLoading(true);
    setError(null);
    try {
      const [details, regItems] = await Promise.all([
        getOrganizationEvent(numericId),
        listOrganizationEventRegistrations(numericId).catch(() => []),
      ]);
      setEvent(details);
      setRegistrations(regItems);
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [numericId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePublish = async () => {
    if (!event) return;
    setBusy(true);
    try {
      const form = await getEventRegistrationForm(event.id);
      if (!form || form.fields.length === 0) {
        showAlert(
          "Registration form required",
          "Add at least one field to the registration form before publishing.",
        );
        return;
      }
      await publishOrganizationEvent(event.id);
      await load();
    } catch (err) {
      showAlert("Publish failed", parseApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = () => {
    if (!event) return;
    confirmAlert({
      title: "Delete event",
      message: "Are you sure you want to delete this event?",
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          await deleteOrganizationEvent(event.id);
          showAlert("Event deleted", "The event was removed successfully.", () => {
            router.replace(ASSOCIATION_ROUTES.events as Href);
          });
        } catch (err) {
          showAlert("Delete failed", parseApiErrorMessage(err));
        } finally {
          setBusy(false);
        }
      },
    });
  };

  if (loading && !event) {
    return (
      <AssociationWorkspaceScreen showBack fallbackHref={ASSOCIATION_ROUTES.events}>
        <AssociationLoadingState message="Loading event…" />
      </AssociationWorkspaceScreen>
    );
  }

  if (error && !event) {
    return (
      <AssociationWorkspaceScreen showBack fallbackHref={ASSOCIATION_ROUTES.events}>
        <AssociationErrorState
          message={error}
          onRetry={() => void load()}
          backLabel="Back to events"
          onBack={() => router.replace(ASSOCIATION_ROUTES.events as Href)}
        />
      </AssociationWorkspaceScreen>
    );
  }

  if (!event) {
    return (
      <AssociationWorkspaceScreen showBack fallbackHref={ASSOCIATION_ROUTES.events}>
        <AssociationErrorState message="Event not found." />
      </AssociationWorkspaceScreen>
    );
  }

  const coverUrl = event.coverImageUrl
    ? resolveApiFileUrl(event.coverImageUrl) ?? event.coverImageUrl
    : null;
  const regStatus = getRegistrationDeadlineStatus(event.registrationDeadline);
  const showClosed = event.isPublished && regStatus === "closed";

  return (
    <AssociationWorkspaceScreen showBack fallbackHref={ASSOCIATION_ROUTES.events} navTitle="Event">
      {coverUrl ? <Image source={{ uri: coverUrl }} style={styles.cover} resizeMode="cover" /> : null}

      <AssociationCard compact>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.meta}>{formatEventDate(event.eventDate)}</Text>
        <View style={styles.badgeRow}>
          {showClosed ? <Text style={[styles.badge, styles.closedBadge]}>Closed</Text> : null}
          <Text style={[styles.badge, event.isPublished ? styles.published : styles.draft]}>
            {event.isPublished ? "Published" : "Draft"}
          </Text>
        </View>
        {event.registrationDeadline ? (
          <Text style={styles.meta}>
            {regStatus === "closed"
              ? "Registration closed"
              : `Registration closes ${formatRegistrationCloseDate(event.registrationDeadline) ?? ""}`}
          </Text>
        ) : null}
        <Text style={styles.body}>{event.description}</Text>
        <Text style={styles.meta}>
          {event.isOnline ? "Online" : event.location || "Location TBD"} · {event.eventType} ·{" "}
          {event.category}
        </Text>
        <Text style={styles.meta}>{registrations.length} registration(s)</Text>
      </AssociationCard>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: layout.space("sm") }}>
        <AssociationActionButton
          label="Edit event"
          variant="outline"
          onPress={() => router.push(associationEventEditPath(event.id) as Href)}
        />
        <AssociationActionButton
          label="Registration form"
          variant="outline"
          onPress={() => router.push(associationEventRegistrationFormPath(event.id) as Href)}
        />
        {!event.isPublished ? (
          <AssociationActionButton label="Publish" loading={busy} onPress={() => void handlePublish()} />
        ) : null}
        <AssociationActionButton label="Delete" variant="danger" loading={busy} onPress={handleDelete} />
      </View>

      <View style={{ marginTop: layout.space("lg"), width: "100%" }}>
        <Text style={styles.sectionTitle}>Registrations</Text>
        {registrations.length === 0 ? (
          <AssociationListEmpty
            title="No registrations yet"
            description="Student registrations will appear here once your event is published and students sign up."
          />
        ) : (
          <View style={{ gap: layout.space("sm"), marginTop: layout.space("sm") }}>
            {registrations.map((item) => (
              <AssociationActionButton
                key={item.id}
                label={`${item.studentName} — ${new Date(item.submittedAt).toLocaleDateString()}`}
                variant="outline"
                onPress={() =>
                  router.push(associationEventRegistrationDetailPath(event.id, item.id) as Href)
                }
              />
            ))}
          </View>
        )}
      </View>
    </AssociationWorkspaceScreen>
  );
}

const styles = StyleSheet.create({
  cover: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: ASSOC_COLORS.accentSoft,
  },
  title: {
    fontWeight: "800",
    fontSize: 22,
    color: ASSOC_COLORS.foreground,
  },
  meta: {
    color: ASSOC_COLORS.muted,
    fontSize: 13,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    flexWrap: "wrap",
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "700",
  },
  closedBadge: {
    backgroundColor: ASSOC_COLORS.background,
    color: ASSOC_COLORS.muted,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
  },
  published: {
    backgroundColor: ASSOC_COLORS.successMuted,
    color: ASSOC_COLORS.success,
  },
  draft: {
    backgroundColor: ASSOC_COLORS.accentMuted,
    color: ASSOC_COLORS.accentDark,
  },
  body: {
    color: ASSOC_COLORS.foreground,
    lineHeight: 22,
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: "800",
    color: ASSOC_COLORS.foreground,
    fontSize: 16,
  },
});
