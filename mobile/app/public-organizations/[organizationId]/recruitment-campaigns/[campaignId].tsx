import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, type Href } from "expo-router";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  getPublicRecruitmentCampaign,
  type PublicRecruitmentCampaignDetail,
} from "@/api/organizationRecruitmentCampaignsApi";
import { AssociationAvatar } from "@/components/organization/AssociationAvatar";
import { OrgScreenHeader } from "@/components/organization/OrgScreenHeader";
import { PublicRecruitmentPositionCard } from "@/components/organization/PublicRecruitmentPositionCard";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";
import { formatEventDate } from "@/utils/eventFormUtils";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function PublicRecruitmentCampaignScreen() {
  const { organizationId, campaignId } = useLocalSearchParams<{
    organizationId: string;
    campaignId: string;
  }>();
  const layout = useResponsiveLayout();
  const orgId = Number(organizationId);
  const campId = Number(campaignId);
  const [campaign, setCampaign] = useState<PublicRecruitmentCampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!Number.isFinite(orgId) || !Number.isFinite(campId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getPublicRecruitmentCampaign(orgId, campId);
      setCampaign(data);
    } catch (e) {
      console.warn(parseApiErrorMessage(e));
      router.replace(`/public-organizations/${organizationId}` as Href);
    } finally {
      setLoading(false);
    }
  }, [orgId, campId, organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const cover = campaign?.coverImageUrl ? resolveApiFileUrl(campaign.coverImageUrl) : null;
  const positions = [...(campaign?.positions ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);
  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <OrgScreenHeader title="Recruitment" onBack={() => router.back()} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={assocColors.accent} size="large" />
        </View>
      ) : !campaign ? (
        <Text style={styles.err}>Campaign not found.</Text>
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
                <View style={styles.coverPh}>
                  <Ionicons name="megaphone-outline" size={36} color={assocColors.accent} />
                </View>
              )}
            </View>
            <View style={styles.pad}>
              <Text style={styles.title}>{campaign.title}</Text>
              <View style={styles.meta}>
                <Ionicons name="time-outline" size={16} color={assocColors.muted} />
                <Text style={styles.metaTxt}>
                  Apply by {formatEventDate(campaign.applicationDeadline)}
                </Text>
              </View>
              <Text style={styles.section}>About</Text>
              <Text style={styles.body}>{campaign.description}</Text>

              <Text style={styles.section}>Hosted by</Text>
              <View style={styles.host}>
                <AssociationAvatar
                  name={campaign.organizationName}
                  logoUrl={campaign.organizationLogoUrl}
                  size="md"
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.hostName}>{campaign.organizationName}</Text>
                  <Pressable onPress={() => router.push(`/public-organizations/${orgId}` as Href)}>
                    <Text style={styles.hostLink}>View organization profile →</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.posSection}>
            <Text style={styles.section}>Open Positions</Text>
            {positions.length === 0 ? (
              <Text style={styles.muted}>No positions listed for this campaign.</Text>
            ) : (
              positions.map((position) => (
                <PublicRecruitmentPositionCard
                  key={position.id}
                  position={position}
                  questions={campaign.questions}
                />
              ))
            )}
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
    marginBottom: spacing.lg,
  },
  coverWrap: { width: "100%" },
  cover: { width: "100%", height: 180, backgroundColor: assocColors.bg },
  coverPh: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: assocColors.accentMuted,
  },
  pad: { padding: spacing.lg },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: assocColors.text,
    lineHeight: 30,
    marginBottom: spacing.sm,
  },
  meta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  metaTxt: { flex: 1, fontSize: 14, color: assocColors.muted, fontWeight: "600" },
  section: { marginTop: spacing.xl, fontSize: 16, fontWeight: "900", color: assocColors.text },
  body: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 22,
    color: assocColors.text,
    fontWeight: "500",
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
  posSection: { marginTop: spacing.sm },
  muted: { marginTop: spacing.sm, fontSize: 14, color: assocColors.muted, fontWeight: "500" },
});
