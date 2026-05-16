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
  deleteOrganizationRecruitmentCampaign,
  getOrganizationRecruitmentCampaign,
  parseSkillsList,
  type RecruitmentCampaign,
} from "@/api/organizationRecruitmentCampaignsApi";
import { OrgScreenHeader } from "@/components/organization/OrgScreenHeader";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";
import { formatEventDate } from "@/utils/eventFormUtils";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function OrganizationRecruitmentCampaignDetailsScreen() {
  const { campaignId } = useLocalSearchParams<{ campaignId: string }>();
  const layout = useResponsiveLayout();
  const id = Number(campaignId);
  const [campaign, setCampaign] = useState<RecruitmentCampaign | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getOrganizationRecruitmentCampaign(id);
      setCampaign(data);
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

  const cover = campaign?.coverImageUrl ? resolveApiFileUrl(campaign.coverImageUrl) : null;
  const positions = [...(campaign?.positions ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);

  const confirmDelete = () => {
    if (!campaign) return;
    Alert.alert("Delete campaign", `Delete "${campaign.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void doDelete() },
    ]);
  };

  const doDelete = async () => {
    if (!campaign) return;
    try {
      await deleteOrganizationRecruitmentCampaign(campaign.id);
      router.replace("/organization/recruitment-campaigns" as Href);
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <OrgScreenHeader title="Campaign details" onBack={() => router.back()} />
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
          <View style={styles.coverWrap}>
            {cover ? (
              <Image source={{ uri: cover }} style={styles.cover} contentFit="cover" />
            ) : (
              <View style={styles.coverPh}>
                <Ionicons name="megaphone-outline" size={36} color={assocColors.accent} />
              </View>
            )}
          </View>
          {!campaign.isPublished ? (
            <View style={styles.draftBadge}>
              <Text style={styles.draftTxt}>Draft</Text>
            </View>
          ) : null}
          <Text style={styles.title}>{campaign.title}</Text>
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={16} color={assocColors.muted} />
            <Text style={styles.metaTxt}>Apply by {formatEventDate(campaign.applicationDeadline)}</Text>
          </View>

          <Text style={styles.section}>Description</Text>
          <Text style={styles.body}>{campaign.description}</Text>

          <Text style={styles.section}>Required positions ({positions.length})</Text>
          {positions.map((p) => {
            const skills = parseSkillsList(p.requiredSkills);
            return (
              <View key={p.id} style={styles.posCard}>
                <View style={styles.posHead}>
                  <Text style={styles.posTitle}>{p.roleTitle}</Text>
                  <View style={styles.countBadge}>
                    <Ionicons name="people" size={14} color={assocColors.accentDark} />
                    <Text style={styles.countTxt}>{p.neededCount} needed</Text>
                  </View>
                </View>
                {p.description?.trim() ? <Text style={styles.body}>{p.description}</Text> : null}
                {p.requirements?.trim() ? (
                  <>
                    <Text style={styles.posLabel}>Requirements</Text>
                    <Text style={styles.body}>{p.requirements}</Text>
                  </>
                ) : null}
                {skills.length > 0 ? (
                  <>
                    <Text style={styles.posLabel}>Skills</Text>
                    <View style={styles.chips}>
                      {skills.map((s) => (
                        <View key={s} style={styles.chip}>
                          <Text style={styles.chipTxt}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : null}
              </View>
            );
          })}

          <View style={styles.actions}>
            <Pressable
              style={styles.secondary}
              onPress={() => router.push(`/organization/recruitment-campaigns/${campaign.id}/edit` as Href)}
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
  cover: { width: "100%", height: 160, backgroundColor: assocColors.bg },
  coverPh: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: assocColors.accentMuted,
  },
  draftBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: assocColors.accentMuted,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
    marginBottom: spacing.sm,
  },
  draftTxt: { fontSize: 11, fontWeight: "800", color: assocColors.accentDark },
  title: { fontSize: 24, fontWeight: "900", color: assocColors.text, lineHeight: 30 },
  meta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: spacing.sm },
  metaTxt: { flex: 1, fontSize: 14, color: assocColors.muted, fontWeight: "600" },
  section: { marginTop: spacing.xl, fontSize: 16, fontWeight: "900", color: assocColors.text },
  body: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 22,
    color: assocColors.text,
    fontWeight: "500",
  },
  posCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
    backgroundColor: assocColors.surface,
  },
  posHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  posTitle: { flex: 1, fontSize: 17, fontWeight: "900", color: assocColors.text },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: assocColors.accentMuted,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
  },
  countTxt: { fontSize: 12, fontWeight: "800", color: assocColors.accentDark },
  posLabel: {
    marginTop: spacing.sm,
    fontSize: 11,
    fontWeight: "800",
    color: assocColors.subtle,
    textTransform: "uppercase",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.sm },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: assocColors.accentMuted,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
  },
  chipTxt: { fontSize: 12, fontWeight: "700", color: assocColors.accentDark },
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
