import { useLocalSearchParams } from "expo-router";
import { Bookmark, Mail, UsersRound } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import {
  getCompanyProjectRequest,
  getCompanyRequestTeamRecommendations,
  getSavedRecommendationIds,
  parseApiErrorMessage,
  saveTeamRecommendation,
  unsaveTeamRecommendation,
  type CompanyRequestTeamRecommendation,
  type CompanySavedRecommendationIds,
} from "@/api/companyApi";
import { CompanyMatchScoreRing } from "@/components/company/CompanyMatchScoreRing";
import { CompanyEmptyState } from "@/components/company/home/CompanyEmptyState";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { CompanyTeamMemberCard } from "@/components/company/teams/CompanyTeamMemberCard";
import { CompanyTeamMemberContactCard } from "@/components/company/teams/CompanyTeamMemberContactCard";
import { CompanyTeamStatsStrip } from "@/components/company/teams/CompanyTeamStatsStrip";
import { CompanyAccordionSection } from "@/components/company/ui/CompanyAccordionSection";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { CompanyScreen } from "@/components/company/ui/CompanyScreen";
import { CompanyStackHeader } from "@/components/company/ui/CompanyStackHeader";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { chemistryLabel } from "@/lib/companyTeamDiscovery";

export default function CompanyTeamDiscoveryScreen() {
  const { requestId: reqParam, teamId: teamParam } = useLocalSearchParams<{
    requestId: string;
    teamId: string;
  }>();
  const requestId = Number(reqParam);
  const teamId = Number(teamParam);
  const colors = useCompanyTheme();
  const scrollRef = useRef<ScrollView>(null);
  const contactYRef = useRef(0);

  const [team, setTeam] = useState<CompanyRequestTeamRecommendation | null>(null);
  const [requestTitle, setRequestTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(requestId) || !Number.isFinite(teamId)) {
      setError("Invalid team link.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [teamsResult, request, savedIds] = await Promise.all([
        getCompanyRequestTeamRecommendations(requestId).catch((err: unknown) => {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 404) return null;
          throw err;
        }),
        getCompanyProjectRequest(requestId).catch(() => null),
        getSavedRecommendationIds(requestId).catch(
          (): CompanySavedRecommendationIds => ({ studentProfileIds: [], teamRecommendationIds: [] }),
        ),
      ]);

      if (!teamsResult) {
        setError("No team recommendations found for this request.");
        setTeam(null);
      } else {
        const match = teamsResult.teams.find((t) => t.teamId === teamId) ?? null;
        if (!match) {
          setError("This team recommendation could not be found.");
          setTeam(null);
        } else {
          setTeam(match);
          setError(null);
        }
      }
      setRequestTitle(request?.title?.trim() || "Project Request");
      setSaved(savedIds.teamRecommendationIds.includes(teamId));
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [requestId, teamId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleSave = async () => {
    setSaving(true);
    try {
      if (saved) {
        await unsaveTeamRecommendation(requestId, teamId);
        setSaved(false);
      } else {
        await saveTeamRecommendation(requestId, teamId);
        setSaved(true);
      }
    } catch (err) {
      Alert.alert("Could not update saved state", parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const scrollToContact = () => {
    scrollRef.current?.scrollTo({ y: contactYRef.current, animated: true });
  };

  const chemistry = team ? chemistryLabel(team.compatibilityScore) : "";

  return (
    <CompanyScreen edges={[]}>
      <CompanyStackHeader
        title={team ? `Team #${team.teamRank}` : "Team"}
        subtitle={requestTitle}
        showAccountMenu={false}
      />
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={{ padding: HOME_SPACE.lg }}>
          <CompanyEmptyState icon={UsersRound} message={error} actionLabel="Retry" onAction={() => void load()} />
        </View>
      ) : team ? (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: HOME_SPACE.lg, gap: HOME_SPACE.lg, paddingBottom: HOME_SPACE.xxxl }}
        >
          <View
            style={{
              padding: HOME_SPACE.lg,
              borderRadius: COMPANY_RADIUS.xl,
              backgroundColor: colors.cardBg,
              borderWidth: 1,
              borderColor: colors.border,
              gap: HOME_SPACE.md,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "800", color: colors.accent, letterSpacing: 0.8 }}>
              AI-RECOMMENDED TEAM
            </Text>
            <View style={{ flexDirection: "row", gap: HOME_SPACE.lg, alignItems: "center" }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: COMPANY_RADIUS.lg,
                  backgroundColor: colors.accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UsersRound size={26} color={colors.accent} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground }}>Team #{team.teamRank}</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>{requestTitle}</Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                  {team.members.length} members · {chemistry}
                </Text>
              </View>
              <CompanyMatchScoreRing score={team.totalScore} size={64} />
            </View>

            <CompanyTeamStatsStrip
              stats={[
                { label: "Team score", value: `${team.totalScore}%` },
                { label: "Role coverage", value: `${team.roleCoverageScore}%` },
                { label: "Chemistry", value: `${team.compatibilityScore}%` },
                { label: "Members", value: String(team.members.length) },
              ]}
            />

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: HOME_SPACE.sm }}>
              <Pressable
                onPress={scrollToContact}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: COMPANY_RADIUS.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.88 : 1,
                })}
              >
                <Mail size={15} color={colors.foreground} strokeWidth={2.2} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}>View contact</Text>
              </Pressable>
              <Pressable
                onPress={() => void toggleSave()}
                disabled={saving}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: COMPANY_RADIUS.md,
                  borderWidth: 1,
                  borderColor: saved ? colors.border : colors.accent,
                  backgroundColor: saved ? colors.cardBg : colors.accent,
                  opacity: saving ? 0.6 : pressed ? 0.88 : 1,
                })}
              >
                <Bookmark
                  size={15}
                  color={saved ? colors.foreground : "#FFFFFF"}
                  strokeWidth={2.2}
                  fill={saved ? colors.foreground : "transparent"}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: saved ? colors.foreground : "#FFFFFF",
                  }}
                >
                  {saved ? "Saved" : "Save team"}
                </Text>
              </Pressable>
            </View>
          </View>

          <CompanyAccordionSection
            title="Team Summary"
            summary={team.summaryReason ? team.summaryReason.slice(0, 60) : "AI team overview"}
            defaultExpanded
          >
            {team.summaryReason ? (
              <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textSecondary, paddingTop: HOME_SPACE.sm }}>
                {team.summaryReason}
              </Text>
            ) : (
              <Text style={{ fontSize: 14, color: colors.muted, paddingTop: HOME_SPACE.sm }}>No summary available.</Text>
            )}
          </CompanyAccordionSection>

          <CompanyAccordionSection
            title="Role Coverage"
            summary={`${team.roleCoverageScore}% coverage · ${team.members.length} roles filled`}
            defaultExpanded
          >
            <View style={{ gap: HOME_SPACE.sm, paddingTop: HOME_SPACE.sm }}>
              {team.members.map((member) => (
                <View
                  key={`${member.companyRequestRoleId}-${member.studentProfileId}`}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: HOME_SPACE.sm,
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                      {member.roleName}
                      <Text style={{ color: colors.muted }}> → </Text>
                      {member.studentName}
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: COMPANY_RADIUS.pill,
                      backgroundColor: colors.accentSoft,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "700", color: colors.accent }}>
                      {member.roleScore}% fit
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </CompanyAccordionSection>

          <CompanyAccordionSection
            title="Team Members"
            icon={UsersRound}
            summary={`${team.members.length} members`}
            defaultExpanded
          >
            <View style={{ gap: HOME_SPACE.md, paddingTop: HOME_SPACE.sm }}>
              {team.members.map((member) => (
                <CompanyTeamMemberCard
                  key={`${member.companyRequestRoleId}-${member.studentProfileId}`}
                  member={member}
                  requestId={requestId}
                  teamId={teamId}
                />
              ))}
            </View>
          </CompanyAccordionSection>

          <View
            onLayout={(e) => {
              contactYRef.current = e.nativeEvent.layout.y;
            }}
          >
            <CompanyAccordionSection
              title="Contact Information"
              icon={Mail}
              summary="Email, LinkedIn, GitHub, portfolio"
              defaultExpanded={false}
            >
              <View style={{ gap: HOME_SPACE.md, paddingTop: HOME_SPACE.sm }}>
                {team.members.map((member) => (
                  <CompanyTeamMemberContactCard
                    key={`contact-${member.studentProfileId}`}
                    member={member}
                    requestId={requestId}
                    teamId={teamId}
                  />
                ))}
              </View>
            </CompanyAccordionSection>
          </View>
        </ScrollView>
      ) : null}
    </CompanyScreen>
  );
}
