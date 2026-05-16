import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getAssociationProfile, type StudentAssociationProfile } from "@/api/associationApi";
import {
  deleteOrganizationRecruitmentCampaign,
  listOrganizationRecruitmentCampaigns,
  type RecruitmentCampaign,
} from "@/api/organizationRecruitmentCampaignsApi";
import { OrgRecruitmentCampaignCard } from "@/components/organization/OrgRecruitmentCampaignCard";
import { OrgScreenHeader } from "@/components/organization/OrgScreenHeader";
import { assocColors } from "@/constants/associationTheme";
import { spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { clearSession } from "@/utils/authStorage";

export default function OrganizationRecruitmentCampaignsListScreen() {
  const layout = useResponsiveLayout();
  const [profile, setProfile] = useState<StudentAssociationProfile | null>(null);
  const [campaigns, setCampaigns] = useState<RecruitmentCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [p, list] = await Promise.all([
        getAssociationProfile(),
        listOrganizationRecruitmentCampaigns(),
      ]);
      setProfile(p);
      setCampaigns(list);
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadAll();
  };

  const logout = async () => {
    await clearSession();
    router.replace("/login" as Href);
  };

  const confirmDelete = (c: RecruitmentCampaign) => {
    Alert.alert("Delete campaign", `Delete "${c.title}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void doDelete(c) },
    ]);
  };

  const doDelete = async (c: RecruitmentCampaign) => {
    setDeletingId(c.id);
    try {
      await deleteOrganizationRecruitmentCampaign(c.id);
      setCampaigns((prev) => prev.filter((x) => x.id !== c.id));
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
    } finally {
      setDeletingId(null);
    }
  };

  const name = profile?.associationName ?? "";

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <OrgScreenHeader
        title="Recruitment"
        subtitle={name || "Student Organization"}
        onBack={() => router.back()}
        right={
          <Pressable onPress={() => void logout()} hitSlop={10}>
            <Ionicons name="log-out-outline" size={22} color={assocColors.accentDark} />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.horizontalPadding,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxxl,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.kicker}>Student Organization</Text>
            <Text style={styles.h1}>Recruitment campaigns</Text>
            <Text style={styles.sub}>
              Publish open roles with custom position titles. Students will apply to a specific position
              later.
            </Text>
          </View>
          <Pressable
            style={styles.createBtn}
            onPress={() => router.push("/organization/recruitment-campaigns/create" as Href)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createTxt}>New</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={assocColors.accent} style={{ marginTop: 24 }} />
        ) : campaigns.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="megaphone-outline" size={40} color={assocColors.accent} />
            <Text style={styles.emptyTitle}>No campaigns yet</Text>
            <Text style={styles.emptySub}>
              Add positions like Graphic Designer or Organizer—your organization chooses the titles.
            </Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => router.push("/organization/recruitment-campaigns/create" as Href)}
            >
              <Text style={styles.primaryTxt}>Create campaign</Text>
            </Pressable>
          </View>
        ) : (
          campaigns.map((c) => (
            <OrgRecruitmentCampaignCard
              key={c.id}
              campaign={c}
              onPress={() => router.push(`/organization/recruitment-campaigns/${c.id}` as Href)}
              onEdit={() => router.push(`/organization/recruitment-campaigns/${c.id}/edit` as Href)}
              onDelete={() => confirmDelete(c)}
              deleting={deletingId === c.id}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: assocColors.bg },
  headRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "800",
    color: assocColors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  h1: { marginTop: 4, fontSize: 26, fontWeight: "900", color: assocColors.text },
  sub: { marginTop: 8, fontSize: 14, color: assocColors.muted, lineHeight: 20, fontWeight: "500" },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: assocColors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 3,
  },
  createTxt: { color: "#fff", fontWeight: "900", fontSize: 14 },
  empty: {
    backgroundColor: assocColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: assocColors.border,
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyTitle: { marginTop: spacing.md, fontSize: 18, fontWeight: "900", color: assocColors.text },
  emptySub: {
    marginTop: 8,
    textAlign: "center",
    color: assocColors.muted,
    fontWeight: "500",
    lineHeight: 20,
  },
  primaryBtn: {
    marginTop: spacing.lg,
    backgroundColor: assocColors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryTxt: { color: "#fff", fontWeight: "900", fontSize: 15 },
});
