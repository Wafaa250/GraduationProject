import { router, type Href } from "expo-router";
import { Calendar, CalendarPlus, MapPin, Pencil, Trash2, Wifi } from "lucide-react-native";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  deleteOrganizationEvent,
  type StudentOrganizationEvent,
} from "@/api/organizationEventsApi";
import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { AssociationCard } from "@/components/association/AssociationCard";
import { associationCardStyles } from "@/constants/associationCardStyles";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { ASSOCIATION_ROUTES, associationEventEditPath, associationEventPath } from "@/lib/associationRoutes";
import { confirmAlert, showAlert } from "@/lib/confirmAlert";
import { formatEventDate } from "@/lib/eventFormUtils";
import { isUpcomingEvent } from "@/lib/organizationProfileData";

type Props = {
  events: StudentOrganizationEvent[];
  loading: boolean;
  onEventsChanged?: () => void | Promise<void>;
};

export function OrganizationProfileEventsSection({ events, loading, onEventsChanged }: Props) {
  const upcoming = events.filter((event) => isUpcomingEvent(event.eventDate));

  const handleDelete = (event: StudentOrganizationEvent) => {
    confirmAlert({
      title: "Delete event",
      message: "Are you sure you want to delete this event?",
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteOrganizationEvent(event.id);
          await onEventsChanged?.();
          showAlert("Event deleted", "The event was removed successfully.");
        } catch (err) {
          showAlert("Delete failed", parseApiErrorMessage(err));
        }
      },
    });
  };

  return (
    <AssociationCard compact>
      <View style={styles.head}>
        <Text style={associationCardStyles.sectionTitle}>Events</Text>
        <AssociationActionButton
          label="Create event"
          compact
          onPress={() => router.push(ASSOCIATION_ROUTES.eventsCreate as Href)}
          icon={<CalendarPlus size={14} color="#FFFFFF" strokeWidth={2.25} />}
        />
      </View>

      {loading ? (
        <Text style={styles.muted}>Loading events…</Text>
      ) : upcoming.length === 0 ? (
        <Text style={styles.muted}>
          No upcoming events. Create one to show it on your public profile.
        </Text>
      ) : (
        <View style={{ gap: 10 }}>
          {upcoming.map((event) => (
            <EventRow key={event.id} event={event} onDelete={() => handleDelete(event)} />
          ))}
        </View>
      )}
    </AssociationCard>
  );
}

function EventRow({
  event,
  onDelete,
}: {
  event: StudentOrganizationEvent;
  onDelete: () => void;
}) {
  const cover = event.coverImageUrl
    ? resolveApiFileUrl(event.coverImageUrl) ?? event.coverImageUrl
    : null;

  return (
    <View style={styles.eventRow}>
      {cover ? (
        <Image source={{ uri: cover }} style={styles.eventThumb} resizeMode="cover" />
      ) : (
        <View style={[styles.eventThumb, styles.eventThumbPlaceholder]}>
          <Text style={styles.eventThumbLabel}>Event</Text>
        </View>
      )}

      <View style={styles.eventBody}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.eventMeta}>
          <Calendar size={13} color={ASSOC_COLORS.muted} strokeWidth={2} />
          <Text style={styles.eventMetaText}>{formatEventDate(event.eventDate)}</Text>
        </View>
        {event.isOnline ? (
          <View style={styles.eventMeta}>
            <Wifi size={13} color={ASSOC_COLORS.muted} strokeWidth={2} />
            <Text style={styles.eventMetaText}>Online</Text>
          </View>
        ) : event.location ? (
          <View style={styles.eventMeta}>
            <MapPin size={13} color={ASSOC_COLORS.muted} strokeWidth={2} />
            <Text style={styles.eventMetaText} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        ) : null}

        <View style={styles.eventActions}>
          <Pressable onPress={() => router.push(associationEventPath(event.id) as Href)}>
            <Text style={styles.actionLink}>View event</Text>
          </Pressable>
          <Pressable onPress={() => router.push(associationEventEditPath(event.id) as Href)}>
            <View style={styles.actionBtn}>
              <Pencil size={12} color={ASSOC_COLORS.foreground} strokeWidth={2} />
              <Text style={styles.actionBtnText}>Edit</Text>
            </View>
          </Pressable>
          <Pressable onPress={onDelete}>
            <View style={styles.actionBtn}>
              <Trash2 size={12} color="#B91C1C" strokeWidth={2} />
              <Text style={[styles.actionBtnText, styles.actionDanger]}>Delete</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  muted: {
    fontSize: 14,
    color: ASSOC_COLORS.muted,
  },
  eventRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: ASSOC_COLORS.cardBg,
  },
  eventThumb: {
    width: 88,
    height: 80,
  },
  eventThumbPlaceholder: {
    backgroundColor: ASSOC_COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  eventThumbLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: ASSOC_COLORS.muted,
  },
  eventBody: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: ASSOC_COLORS.foreground,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventMetaText: {
    fontSize: 11,
    color: ASSOC_COLORS.muted,
    flex: 1,
  },
  eventActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  actionLink: {
    fontSize: 12,
    fontWeight: "600",
    color: ASSOC_COLORS.accent,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: ASSOC_COLORS.foreground,
  },
  actionDanger: {
    color: "#B91C1C",
  },
});
