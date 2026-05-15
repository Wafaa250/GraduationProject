import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, type Href } from "expo-router";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  deleteOrganizationEvent,
  getOrganizationEvent,
  type StudentOrganizationEvent,
} from "@/api/organizationEventsApi";
import { OrgScreenHeader } from "@/components/organization/OrgScreenHeader";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";
import { formatEventDate } from "@/utils/eventFormUtils";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function OrganizationEventDetailsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const layout = useResponsiveLayout();
  const id = Number(eventId);
  const [event, setEvent] = useState<StudentOrganizationEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getOrganizationEvent(id);
      setEvent(data);
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const cover = event?.coverImageUrl ? resolveApiFileUrl(event.coverImageUrl) : null;

  const confirmDelete = () => {
    if (!event) return;
    Alert.alert("Delete event", `Delete "${event.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => void doDelete(),
      },
    ]);
  };

  const doDelete = async () => {
    if (!event) return;
    try {
      await deleteOrganizationEvent(event.id);
      router.replace("/organization/events" as Href);
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <OrgScreenHeader title="Event details" onBack={() => router.back()} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={assocColors.accent} size="large" />
        </View>
      ) : !event ? (
        <Text style={styles.err}>Event not found.</Text>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: layout.horizontalPadding,
            paddingBottom: spacing.xxxl,
            paddingTop: spacing.md,
          }}
        >
          <View style={styles.coverWrap}>
            {cover ? (
              <Image source={{ uri: cover }} style={styles.cover} contentFit="cover" />
            ) : (
              <View style={styles.coverPh}>
                <Ionicons name="calendar-outline" size={36} color={assocColors.accent} />
              </View>
            )}
          </View>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>{event.eventType}</Text>
            </View>
            <View style={[styles.badge, styles.badge2]}>
              <Text style={[styles.badgeTxt, styles.badgeTxt2]}>{event.category}</Text>
            </View>
          </View>
          <Text style={styles.title}>{event.title}</Text>
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={16} color={assocColors.muted} />
            <Text style={styles.metaTxt}>{formatEventDate(event.eventDate)}</Text>
          </View>
          <View style={styles.meta}>
            <Ionicons
              name={event.isOnline ? "wifi-outline" : "location-outline"}
              size={16}
              color={assocColors.muted}
            />
            <Text style={styles.metaTxt}>
              {event.isOnline ? "Online" : event.location?.trim() || "On-site"}
            </Text>
          </View>
          {event.registrationDeadline ? (
            <View style={styles.meta}>
              <Ionicons name="flag-outline" size={16} color={assocColors.muted} />
              <Text style={styles.metaTxt}>
                Registration by {formatEventDate(event.registrationDeadline)}
              </Text>
            </View>
          ) : null}
          {event.maxParticipants != null ? (
            <View style={styles.meta}>
              <Ionicons name="people-outline" size={16} color={assocColors.muted} />
              <Text style={styles.metaTxt}>Up to {event.maxParticipants} participants</Text>
            </View>
          ) : null}

          <Text style={styles.section}>Description</Text>
          <Text style={styles.body}>{event.description}</Text>

          <View style={styles.actions}>
            <Pressable
              style={styles.secondary}
              onPress={() => router.push(`/organization/events/${event.id}/edit` as Href)}
            >
              <Ionicons name="pencil" size={18} color={assocColors.accentDark} />
              <Text style={styles.secondaryTxt}>Edit</Text>
            </Pressable>
            <Pressable style={styles.danger} onPress={confirmDelete}>
              <Ionicons name="trash" size={18} color="#fff" />
              <Text style={styles.dangerTxt}>Delete</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: assocColors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  err: { textAlign: "center", marginTop: 24, color: assocColors.muted },
  coverWrap: {
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: assocColors.border,
    marginBottom: spacing.md,
  },
  cover: { width: "100%", height: 180, backgroundColor: assocColors.bg },
  coverPh: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: assocColors.accentMuted,
  },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.sm },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: assocColors.accentMuted,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
  },
  badge2: { backgroundColor: assocColors.surface },
  badgeTxt: { fontSize: 12, fontWeight: "800", color: assocColors.accentDark },
  badgeTxt2: { color: assocColors.text },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: assocColors.text,
    lineHeight: 30,
    marginBottom: spacing.sm,
  },
  meta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  metaTxt: { flex: 1, fontSize: 14, color: assocColors.muted, fontWeight: "600" },
  section: { marginTop: spacing.xl, fontSize: 16, fontWeight: "900", color: assocColors.text },
  body: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 22,
    color: assocColors.text,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: assocColors.border,
  },
  secondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
    backgroundColor: assocColors.accentMuted,
  },
  secondaryTxt: { fontWeight: "900", color: assocColors.accentDark, fontSize: 15 },
  danger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    borderRadius: radius.lg,
    backgroundColor: "#dc2626",
  },
  dangerTxt: { fontWeight: "900", color: "#fff", fontSize: 15 },
});
