import { router, type Href } from "expo-router";
import { UserPlus, Users } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import {
  listCompanyMembers,
  parseApiErrorMessage,
  removeCompanyMember,
  type AddCompanyMemberResponse,
  type CompanyMember,
} from "@/api/companyApi";
import { CompanyEmptyState } from "@/components/company/home/CompanyEmptyState";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { CompanyInviteMemberSheet } from "@/components/company/members/CompanyInviteMemberSheet";
import { CompanyMemberCard } from "@/components/company/members/CompanyMemberCard";
import { CompanyAccordionSection } from "@/components/company/ui/CompanyAccordionSection";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { CompanyScreen } from "@/components/company/ui/CompanyScreen";
import { CompanyStackHeader } from "@/components/company/ui/CompanyStackHeader";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { sortCompanyMembers } from "@/lib/companyMembers";
import { isCompanyOwner } from "@/lib/companyWorkspace";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";
import { getItem } from "@/utils/authStorage";

export default function CompanyMembersScreen() {
  const colors = useCompanyTheme();
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(0);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const sortedMembers = useMemo(() => sortCompanyMembers(members), [members]);
  const memberCount = members.length;

  const load = useCallback(async () => {
    try {
      const rows = await listCompanyMembers();
      setMembers(rows);
      setError(null);
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const owner = await isCompanyOwner();
      if (!owner) {
        router.replace(COMPANY_ROUTES.dashboard as Href);
        return;
      }
      const userIdRaw = await getItem("userId");
      if (!cancelled) {
        setCurrentUserId(Number(userIdRaw) || 0);
        setAccessChecked(true);
      }
      await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleAdded = (result: AddCompanyMemberResponse) => {
    setMembers((prev) => sortCompanyMembers([...prev, result.member]));
  };

  const handleRemove = async (member: CompanyMember) => {
    if (member.userId === currentUserId) return;
    setRemovingId(member.id);
    try {
      await removeCompanyMember(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch (err) {
      Alert.alert("Could not remove member", parseApiErrorMessage(err));
    } finally {
      setRemovingId(null);
    }
  };

  const addButton = !loading && !error ? (
    <Pressable
      onPress={() => setInviteOpen(true)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Add member"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: COMPANY_RADIUS.pill,
        backgroundColor: colors.accentSoft,
        borderWidth: 1,
        borderColor: colors.accentBorder,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <UserPlus size={15} color={colors.accent} strokeWidth={2.4} />
      <Text style={{ fontSize: 13, fontWeight: "800", color: colors.accent }}>Add</Text>
    </Pressable>
  ) : null;

  if (!accessChecked) {
    return (
      <CompanyScreen edges={[]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </CompanyScreen>
    );
  }

  return (
    <CompanyScreen edges={[]}>
      <CompanyStackHeader
        title="Company Members"
        subtitle={
          loading
            ? "Loading members…"
            : `${memberCount} member${memberCount === 1 ? "" : "s"}`
        }
        right={addButton}
        showAccountMenu={false}
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={{ padding: HOME_SPACE.lg }}>
          <CompanyEmptyState icon={Users} message={error} actionLabel="Retry" onAction={() => void load()} />
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.accent} />
          }
          contentContainerStyle={{ padding: HOME_SPACE.lg, gap: HOME_SPACE.md, paddingBottom: HOME_SPACE.xxxl }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textSecondary }}>
            Everyone listed here can sign in and collaborate within your company workspace.
          </Text>

          <CompanyAccordionSection
            title="Members"
            icon={Users}
            summary={`${memberCount} in workspace`}
            defaultExpanded
          >
            <View style={{ gap: HOME_SPACE.sm, paddingTop: HOME_SPACE.sm }}>
              {memberCount === 0 ? (
                <CompanyEmptyState
                  icon={Users}
                  message="No members yet. Invite teammates to share access to project requests and recommendations."
                  actionLabel="Add your first member"
                  onAction={() => setInviteOpen(true)}
                />
              ) : (
                sortedMembers.map((member) => (
                  <CompanyMemberCard
                    key={member.id}
                    member={member}
                    isSelf={member.userId === currentUserId}
                    removing={removingId === member.id}
                    onRemove={() => void handleRemove(member)}
                  />
                ))
              )}
            </View>
          </CompanyAccordionSection>
        </ScrollView>
      )}

      <CompanyInviteMemberSheet
        visible={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onAdded={handleAdded}
      />
    </CompanyScreen>
  );
}
