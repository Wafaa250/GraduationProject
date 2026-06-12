import { useFocusEffect } from "@react-navigation/native";
import { router, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  deleteOrganizationEvent,
  listOrganizationEvents,
  publishOrganizationEvent,
  type StudentOrganizationEvent,
} from "@/api/organizationEventsApi";
import { getEventRegistrationForm } from "@/api/eventRegistrationFormApi";
import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { AssociationListEmpty } from "@/components/association/AssociationListEmpty";
import { AssociationLoadingState } from "@/components/association/AssociationLoadingState";
import { AssociationPageHeader } from "@/components/association/AssociationPageHeader";
import { AssociationWorkspaceScreen } from "@/components/association/AssociationWorkspaceScreen";
import { associationCardStyles } from "@/constants/associationCardStyles";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import {
  ASSOCIATION_ROUTES,
  associationEventEditPath,
  associationEventPath,
  associationEventRegistrationFormPath,
} from "@/lib/associationRoutes";
import { confirmAlert, showAlert } from "@/lib/confirmAlert";
import {
  formatEventDate,
  formatRegistrationCloseDate,
  getRegistrationDeadlineStatus,
} from "@/lib/eventFormUtils";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

const DELETE_CONFIRM_TITLE = "Delete event";
const DELETE_CONFIRM_MESSAGE = "Are you sure you want to delete this event?";

export default function AssociationEventsListScreen() {
  const layout = useResponsiveLayout();
  const [events, setEvents] = useState<StudentOrganizationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await listOrganizationEvents();
      setEvents(data);
    } catch (err) {
      Alert.alert("Could not load events", parseApiErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleDelete = (event: StudentOrganizationEvent) => {
    confirmAlert({
      title: DELETE_CONFIRM_TITLE,
      message: DELETE_CONFIRM_MESSAGE,
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: async () => {
        setDeletingId(event.id);
        try {
          await deleteOrganizationEvent(event.id);
          setEvents((prev) => prev.filter((item) => item.id !== event.id));
          await load(true);
          showAlert("Event deleted", "The event was removed successfully.");
        } catch (err) {
          showAlert("Delete failed", parseApiErrorMessage(err));
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const handlePublish = async (event: StudentOrganizationEvent) => {
    setPublishingId(event.id);
    try {
      const form = await getEventRegistrationForm(event.id);
      if (!form || form.fields.length === 0) {
        confirmAlert({
          title: "Registration form required",
          message: "Add at least one field to the registration form before publishing.",
          confirmLabel: "Complete form",
          onConfirm: () =>
            router.push(associationEventRegistrationFormPath(event.id) as Href),
        });
        return;
      }
      await publishOrganizationEvent(event.id);
      await load(true);
    } catch (err) {
      Alert.alert("Publish failed", parseApiErrorMessage(err));
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <AssociationWorkspaceScreen refreshing={refreshing} onRefresh={() => void load(true)}>
      <AssociationPageHeader
        title="My events"
        subtitle="Create and manage events for your student organization."
        action={
          <AssociationActionButton
            label="Create event"
            onPress={() => router.push(ASSOCIATION_ROUTES.eventsCreate as Href)}
            compact
          />
        }
      />

      {loading ? (
        <AssociationLoadingState message="Loading events…" />
      ) : events.length === 0 ? (
        <AssociationListEmpty
          title="No events yet"
          description="Host workshops, hackathons, and community gatherings. Your first event is one click away."
          actionLabel="Create your first event"
          onAction={() => router.push(ASSOCIATION_ROUTES.eventsCreate as Href)}
        />
      ) : (
        <View style={{ gap: layout.space("md"), width: "100%" }}>
          {events.map((event) => {
            const coverUrl = event.coverImageUrl
              ? resolveApiFileUrl(event.coverImageUrl) ?? event.coverImageUrl
              : null;
            const regStatus = getRegistrationDeadlineStatus(event.registrationDeadline);
            const showClosed = event.isPublished && regStatus === "closed";

            return (
            <View
              key={event.id}
              style={[associationCardStyles.card, associationCardStyles.cardCompact, styles.card]}
            >
              {coverUrl ? (
                <Image source={{ uri: coverUrl }} style={styles.cover} resizeMode="cover" />
              ) : null}
              <Pressable
                onPress={() => router.push(associationEventPath(event.id) as Href)}
                style={({ pressed }) => [styles.cardBody, pressed ? styles.cardBodyPressed : null]}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.title} numberOfLines={2}>
                    {event.title}
                  </Text>
                  <View style={styles.badges}>
                    {showClosed ? (
                      <View style={[styles.badge, styles.badgeClosed]}>
                        <Text style={[styles.badgeText, styles.badgeClosedText]}>Closed</Text>
                      </View>
                    ) : null}
                    <View
                      style={[
                        styles.badge,
                        event.isPublished ? styles.badgePublished : styles.badgeDraft,
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {event.isPublished ? "Published" : "Draft"}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.meta}>{formatEventDate(event.eventDate)}</Text>
                {event.registrationDeadline ? (
                  <Text style={styles.regMeta}>
                    {regStatus === "closed"
                      ? "Registration closed"
                      : `Registration closes ${formatRegistrationCloseDate(event.registrationDeadline) ?? ""}`}
                  </Text>
                ) : null}
                <Text style={styles.preview} numberOfLines={2}>
                  {event.description}
                </Text>
              </Pressable>

              <View style={[styles.actions, { marginTop: layout.space("sm"), gap: layout.space("sm") }]}>
                <AssociationActionButton
                  label="View"
                  variant="outline"
                  compact
                  onPress={() => router.push(associationEventPath(event.id) as Href)}
                />
                <AssociationActionButton
                  label="Edit"
                  variant="outline"
                  compact
                  onPress={() => router.push(associationEventEditPath(event.id) as Href)}
                />
                {!event.isPublished ? (
                  <AssociationActionButton
                    label="Publish"
                    compact
                    loading={publishingId === event.id}
                    disabled={deletingId === event.id}
                    onPress={() => void handlePublish(event)}
                  />
                ) : null}
                <AssociationActionButton
                  label={deletingId === event.id ? "Deleting…" : "Delete"}
                  variant="danger"
                  compact
                  loading={deletingId === event.id}
                  disabled={publishingId === event.id}
                  onPress={() => handleDelete(event)}
                />
              </View>
            </View>
            );
          })}
        </View>
      )}
    </AssociationWorkspaceScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
  },
  cardBody: {
    width: "100%",
  },
  cardBodyPressed: {
    opacity: 0.92,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  cover: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: -4,
    backgroundColor: ASSOC_COLORS.accentSoft,
  },
  badges: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  title: {
    flex: 1,
    fontWeight: "800",
    color: ASSOC_COLORS.foreground,
    fontSize: 16,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  badgePublished: {
    backgroundColor: ASSOC_COLORS.successMuted,
    borderColor: ASSOC_COLORS.successBorder,
  },
  badgeDraft: {
    backgroundColor: ASSOC_COLORS.accentMuted,
    borderColor: ASSOC_COLORS.accentBorder,
  },
  badgeClosed: {
    backgroundColor: ASSOC_COLORS.background,
    borderColor: ASSOC_COLORS.border,
  },
  badgeClosedText: {
    color: ASSOC_COLORS.muted,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: ASSOC_COLORS.accentDark,
  },
  meta: {
    marginTop: 6,
    color: ASSOC_COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  regMeta: {
    marginTop: 4,
    color: ASSOC_COLORS.muted,
    fontSize: 12,
  },
  preview: {
    marginTop: 6,
    color: ASSOC_COLORS.muted,
    lineHeight: 20,
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor: ASSOC_COLORS.border,
    paddingTop: 10,
  },
});

