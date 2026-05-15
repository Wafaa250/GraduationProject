import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { radius, spacing } from "@/constants/responsiveLayout";
import { assocColors } from "@/constants/associationTheme";
import { resolveApiFileUrl } from "@/api/axiosInstance";
import { formatEventDate } from "@/utils/eventFormUtils";
import type { StudentOrganizationEvent } from "@/api/organizationEventsApi";

type Props = {
  event: StudentOrganizationEvent;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
};

export function OrgEventCard({ event, onPress, onEdit, onDelete, deleting }: Props) {
  const cover = resolveApiFileUrl(event.coverImageUrl ?? undefined);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && onPress && styles.cardPressed]}
      disabled={!onPress}
    >
      <View style={styles.coverWrap}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.cover} contentFit="cover" />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="calendar-outline" size={28} color={assocColors.accent} />
          </View>
        )}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{event.eventType}</Text>
          </View>
          <View style={[styles.badge, styles.badgeMuted]}>
            <Text style={[styles.badgeText, styles.badgeTextMuted]}>{event.category}</Text>
          </View>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={assocColors.muted} />
          <Text style={styles.meta} numberOfLines={1}>
            {formatEventDate(event.eventDate)}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name={event.isOnline ? "wifi-outline" : "location-outline"} size={14} color={assocColors.muted} />
          <Text style={styles.meta} numberOfLines={1}>
            {event.isOnline ? "Online" : event.location?.trim() || "On-site (TBA)"}
          </Text>
        </View>
        {(onEdit || onDelete) && (
          <View style={styles.actions}>
            {onEdit ? (
              <Pressable onPress={onEdit} style={styles.actionBtn} hitSlop={6}>
                <Ionicons name="pencil-outline" size={18} color={assocColors.accentDark} />
                <Text style={styles.actionLabel}>Edit</Text>
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable
                onPress={onDelete}
                style={styles.actionBtn}
                hitSlop={6}
                disabled={deleting}
              >
                <Ionicons name="trash-outline" size={18} color="#dc2626" />
                <Text style={[styles.actionLabel, { color: "#dc2626" }]}>Delete</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: assocColors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
    overflow: "hidden",
    marginBottom: spacing.lg,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardPressed: { opacity: 0.96 },
  coverWrap: { position: "relative" },
  cover: {
    width: "100%",
    height: 140,
    backgroundColor: assocColors.bg,
  },
  coverPlaceholder: {
    width: "100%",
    height: 140,
    backgroundColor: assocColors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRow: {
    position: "absolute",
    left: spacing.md,
    bottom: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(15,23,42,0.75)",
  },
  badgeMuted: {
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  badgeTextMuted: {
    color: assocColors.text,
  },
  body: { padding: spacing.md },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: assocColors.text,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    minWidth: 0,
  },
  meta: {
    flex: 1,
    fontSize: 13,
    color: assocColors.muted,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: assocColors.border,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingRight: spacing.sm,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: assocColors.accentDark,
  },
});
