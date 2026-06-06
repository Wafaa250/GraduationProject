import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  getFollowing,
  unfollowCompany,
  unfollowOrganization,
  type FollowingAssociation,
  type FollowingCompany,
} from "@/api/followingApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { StudentWorkspaceScreen } from "@/components/student/StudentWorkspaceScreen";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type FollowingTab = "all" | "companies" | "associations";

function FollowingRow({
  name,
  detail,
  logoUrl,
  roleType,
  viewLabel,
  onView,
  onUnfollow,
  unfollowing,
}: {
  name: string;
  detail: string;
  logoUrl?: string | null;
  roleType: "company" | "association";
  viewLabel: string;
  onView: () => void;
  onUnfollow: () => void;
  unfollowing: boolean;
}) {
  const layout = useResponsiveLayout();
  const resolvedLogo = logoUrl ? resolveApiFileUrl(logoUrl) : null;

  return (
    <View style={[styles.row, { borderRadius: layout.radius.input, padding: layout.space("md") }]}>
      <View style={styles.rowMain}>
        {resolvedLogo ? (
          <Image source={{ uri: resolvedLogo }} style={styles.logo} />
        ) : (
          <FeedAvatar name={name} size={layout.scale(44)} roleType={roleType} />
        )}
        <View style={styles.rowInfo}>
          <Text style={styles.rowName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.rowDetail} numberOfLines={2}>
            {detail}
          </Text>
        </View>
      </View>
      <View style={styles.rowActions}>
        <Pressable style={styles.primaryBtn} onPress={onView}>
          <Text style={styles.primaryBtnText}>{viewLabel}</Text>
        </Pressable>
        <Pressable style={styles.outlineBtn} onPress={onUnfollow} disabled={unfollowing}>
          {unfollowing ? (
            <ActivityIndicator size="small" color={HUB_COLORS.muted} />
          ) : (
            <>
              <Ionicons name="person-remove-outline" size={16} color={HUB_COLORS.muted} />
              <Text style={styles.outlineBtnText}>Unfollow</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default function FollowingScreen() {
  const layout = useResponsiveLayout();
  const [tab, setTab] = useState<FollowingTab>("all");
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<FollowingCompany[]>([]);
  const [associations, setAssociations] = useState<FollowingAssociation[]>([]);
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFollowing();
      setCompanies(data.companies);
      setAssociations(data.associations);
    } catch (err) {
      Alert.alert("Could not load following", parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUnfollowCompany = async (id: number) => {
    setUnfollowingId(`company-${id}`);
    try {
      await unfollowCompany(id);
      setCompanies((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      Alert.alert("Unfollow failed", parseApiErrorMessage(err));
    } finally {
      setUnfollowingId(null);
    }
  };

  const handleUnfollowAssociation = async (id: number) => {
    setUnfollowingId(`association-${id}`);
    try {
      await unfollowOrganization(id);
      setAssociations((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      Alert.alert("Unfollow failed", parseApiErrorMessage(err));
    } finally {
      setUnfollowingId(null);
    }
  };

  const tabs = useMemo(
    () => [
      { key: "all" as const, label: `All (${companies.length + associations.length})` },
      { key: "companies" as const, label: `Companies (${companies.length})` },
      { key: "associations" as const, label: `Associations (${associations.length})` },
    ],
    [companies.length, associations.length],
  );

  const showCompanies = tab === "all" || tab === "companies";
  const showAssociations = tab === "all" || tab === "associations";
  const isEmpty =
    (tab === "all" && companies.length === 0 && associations.length === 0) ||
    (tab === "companies" && companies.length === 0) ||
    (tab === "associations" && associations.length === 0);

  return (
    <StudentWorkspaceScreen
      title="Following"
      subtitle="Companies and associations you follow."
      refreshing={loading}
      onRefresh={() => void load()}
    >
      <View style={[styles.tabs, { gap: layout.space("sm") }]}>
        {tabs.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => setTab(item.key)}
            style={[styles.tab, tab === item.key && styles.tabActive, { borderRadius: layout.radius.input }]}
          >
            <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={HUB_COLORS.primary} style={{ marginTop: 24 }} />
      ) : isEmpty ? (
        <Text style={styles.empty}>
          {tab === "companies"
            ? "You are not following any companies yet. Discover companies in the Communication Hub."
            : tab === "associations"
              ? "You are not following any associations yet. Discover associations in the Communication Hub."
              : "You are not following any organizations yet. Follow companies and associations from the Communication Hub."}
        </Text>
      ) : (
        <View style={{ gap: layout.space("md"), width: "100%" }}>
          {showCompanies && companies.length > 0 ? (
            <View style={{ gap: layout.space("sm") }}>
              {tab === "all" ? <Text style={styles.groupTitle}>Companies</Text> : null}
              {companies.map((company) => (
                <FollowingRow
                  key={`company-${company.id}`}
                  name={company.name}
                  detail={company.industry?.trim() || "Industry not listed"}
                  logoUrl={company.logoUrl}
                  roleType="company"
                  viewLabel="View Company"
                  onView={() => router.push(`/companies/${company.id}` as never)}
                  onUnfollow={() => void handleUnfollowCompany(company.id)}
                  unfollowing={unfollowingId === `company-${company.id}`}
                />
              ))}
            </View>
          ) : null}

          {showAssociations && associations.length > 0 ? (
            <View style={{ gap: layout.space("sm") }}>
              {tab === "all" ? <Text style={styles.groupTitle}>Associations</Text> : null}
              {associations.map((association) => (
                <FollowingRow
                  key={`association-${association.id}`}
                  name={association.name}
                  detail={association.category?.trim() || "Category not listed"}
                  logoUrl={association.logoUrl}
                  roleType="association"
                  viewLabel="View Association"
                  onView={() => router.push(`/organizations/${association.id}` as never)}
                  onUnfollow={() => void handleUnfollowAssociation(association.id)}
                  unfollowing={unfollowingId === `association-${association.id}`}
                />
              ))}
            </View>
          ) : null}
        </View>
      )}
    </StudentWorkspaceScreen>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: HUB_COLORS.inputBg,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    minHeight: 44,
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: HUB_COLORS.primarySoft,
    borderColor: HUB_COLORS.primaryBorder,
  },
  tabText: {
    color: HUB_COLORS.muted,
    fontWeight: "600",
    fontSize: 13,
  },
  tabTextActive: {
    color: HUB_COLORS.primary,
  },
  groupTitle: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
    fontSize: 15,
  },
  row: {
    width: "100%",
    backgroundColor: HUB_COLORS.cardBg,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    gap: 12,
  },
  rowMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  rowInfo: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
    fontSize: 16,
  },
  rowDetail: {
    color: HUB_COLORS.muted,
    fontSize: 13,
    marginTop: 2,
  },
  rowActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: HUB_COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    backgroundColor: HUB_COLORS.inputBg,
  },
  outlineBtnText: {
    color: HUB_COLORS.muted,
    fontWeight: "600",
    fontSize: 14,
  },
  empty: {
    color: HUB_COLORS.muted,
    lineHeight: 22,
    textAlign: "center",
  },
});
