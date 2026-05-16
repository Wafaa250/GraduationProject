import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, type Href } from "expo-router";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  getPublicOrganizationEvent,
  type PublicOrganizationEventDetail,
} from "@/api/publicOrganizationsApi";
import { OrgScreenHeader } from "@/components/organization/OrgScreenHeader";
import { AssociationAvatar } from "@/components/organization/AssociationAvatar";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";
import { ApplicationFormPreview } from "@/components/organization/ApplicationFormPreview";
import { formatEventDate } from "@/utils/eventFormUtils";
import { eventFieldsToPreviewFields } from "@/utils/eventRegistrationFormFields";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function PublicOrganizationEventScreen() {
  const { organizationId, eventId } = useLocalSearchParams<{
    organizationId: string;
    eventId: string;
  }>();
  const layout = useResponsiveLayout();
  const orgId = Number(organizationId);
  const evId = Number(eventId);
  const [event, setEvent] = useState<PublicOrganizationEventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!Number.isFinite(orgId) || !Number.isFinite(evId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getPublicOrganizationEvent(orgId, evId);
      setEvent(data);
    } catch (e) {
      console.warn(parseApiErrorMessage(e));
      router.replace(`/public-organizations/${organizationId}` as Href);
    } finally {
      setLoading(false);
    }
  }, [orgId, evId, organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const cover = event?.coverImageUrl ? resolveApiFileUrl(event.coverImageUrl) : null;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <OrgScreenHeader title="Event" onBack={() => router.back()} />
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
          <Pressable
            onPress={() => router.push(`/public-organizations/${orgId}` as Href)}
            style={styles.backOrg}
          >
            <Ionicons name="arrow-back" size={16} color={assocColors.accentDark} />
            <Text style={styles.backOrgTxt}>Back to organization</Text>
          </Pressable>

          <View style={styles.card}>
            <View style={styles.coverWrap}>
              {cover ? (
                <Image source={{ uri: cover }} style={styles.cover} contentFit="cover" />
              ) : (
                <View style={styles.coverPh} />
              )}
            </View>
            <View style={styles.pad}>
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

              <Text style={styles.section}>About</Text>
              <Text style={styles.body}>{event.description}</Text>

              {event.registrationForm ? (
                <>
                  <Text style={styles.section}>Registration form preview</Text>
                  <Text style={styles.previewHint}>
                    Read-only preview until registration opens.
                  </Text>
                  <ApplicationFormPreview
                    fields={eventFieldsToPreviewFields(event.registrationForm.fields)}
                    title={event.registrationForm.title}
                  />
                </>
              ) : null}

              <Text style={styles.section}>Hosted by</Text>
              <View style={styles.host}>
                <AssociationAvatar
                  name={event.organizationName}
                  logoUrl={event.organizationLogoUrl}
                  size="md"
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.hostName}>{event.organizationName}</Text>
                  <Pressable onPress={() => router.push(`/public-organizations/${orgId}` as Href)}>
                    <Text style={styles.hostLink}>View organization profile →</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: assocColors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  err: { padding: spacing.lg, color: assocColors.muted },
  backOrg: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.lg,
    alignSelf: "flex-start",
  },
  backOrgTxt: { fontSize: 14, fontWeight: "800", color: assocColors.accentDark },
  card: {
    backgroundColor: assocColors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
    overflow: "hidden",
  },
  coverWrap: { width: "100%" },
  cover: { width: "100%", height: 200, backgroundColor: assocColors.bg },
  coverPh: { height: 200, backgroundColor: assocColors.accentMuted },
  pad: { padding: spacing.lg },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.sm },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: assocColors.accentMuted,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
  },
  badge2: { backgroundColor: assocColors.bg },
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
  previewHint: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    fontSize: 13,
    color: assocColors.muted,
    lineHeight: 18,
  },
  host: {
    marginTop: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: assocColors.border,
    backgroundColor: assocColors.bg,
  },
  hostName: { fontSize: 16, fontWeight: "900", color: assocColors.text },
  hostLink: { marginTop: 4, fontSize: 14, fontWeight: "800", color: assocColors.accentDark },
});
