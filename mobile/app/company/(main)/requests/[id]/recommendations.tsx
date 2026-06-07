import { router, useLocalSearchParams, type Href } from "expo-router";
import { Sparkles, UserRound, UsersRound } from "lucide-react-native";
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
  generateCompanyRequestRecommendations,
  generateCompanyRequestTeamRecommendations,
  getCompanyProjectRequest,
  getCompanyRequestRecommendations,
  getCompanyRequestTeamRecommendations,
  getSavedRecommendationIds,
  parseApiErrorMessage,
  regenerateCompanyRequestTeamRecommendations,
  saveStudentRecommendation,
  saveTeamRecommendation,
  unsaveStudentRecommendation,
  unsaveTeamRecommendation,
  updateCompanyProjectRequestStatus,
  type CompanyProjectRequestDetail,
  type CompanyRequestTeamRecommendation,
} from "@/api/companyApi";
import { CompanyEmptyState } from "@/components/company/home/CompanyEmptyState";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { CompanyMatchScoreRing } from "@/components/company/CompanyMatchScoreRing";
import { CompanyRecommendationCard } from "@/components/company/requests/CompanyRecommendationCard";
import { CompanyRequestStatsStrip } from "@/components/company/requests/CompanyRequestStatsStrip";
import { createRequestStyles } from "@/components/company/requests/requestStyles";
import { CompanyScreen } from "@/components/company/ui/CompanyScreen";
import { CompanyStackHeader } from "@/components/company/ui/CompanyStackHeader";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { isAxiosStatus } from "@/lib/axiosErrors";
import { mapRecommendationToCandidate, type RecommendationCandidate } from "@/lib/companyRecommendationMappers";
import {
  formatCollaborationLine,
  getRequestProjectTitle,
  getRequestRoleLabels,
  getRequestSkillLabels,
  getRequestLifecycleStatus,
  isRequestViewOnly,
  requestTypeLabel,
} from "@/lib/companyRequestDisplay";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";
import {
  COMPANY_RECOMMENDATIONS_STUDENTS_DESC,
  COMPANY_RECOMMENDATIONS_TEAMS_DESC,
} from "@/lib/companyWorkspaceCopy";

export default function CompanyRequestRecommendationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const colors = useCompanyTheme();
  const styles = useMemo(() => createRequestStyles(colors), [colors]);

  const [request, setRequest] = useState<CompanyProjectRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [recError, setRecError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<RecommendationCandidate[]>([]);
  const [teams, setTeams] = useState<CompanyRequestTeamRecommendation[]>([]);
  const [savedStudentIds, setSavedStudentIds] = useState<Set<number>>(new Set());
  const [savedTeamIds, setSavedTeamIds] = useState<Set<number>>(new Set());
  const [reactivating, setReactivating] = useState(false);
  const [regeneratingTeams, setRegeneratingTeams] = useState(false);
  const [teamOrchestrationFailed, setTeamOrchestrationFailed] = useState(false);

  const isTeamRequest = request?.requestType === "ai-built-team";
  const lifecycle = request ? getRequestLifecycleStatus(request) : "active";
  const viewOnly = isRequestViewOnly(lifecycle);
  const isPaused = lifecycle === "paused";
  const isClosed = lifecycle === "closed";

  const loadRequest = useCallback(async () => {
    if (!Number.isFinite(requestId) || requestId < 1) {
      setPageError("Invalid request.");
      return null;
    }
    const data = await getCompanyProjectRequest(requestId);
    setRequest(data);
    return data;
  }, [requestId]);

  const loadSavedIds = useCallback(async () => {
    const ids = await getSavedRecommendationIds(requestId);
    setSavedStudentIds(new Set(ids.studentProfileIds));
    setSavedTeamIds(new Set(ids.teamRecommendationIds));
  }, [requestId]);

  const loadRecommendations = useCallback(
    async (req: CompanyProjectRequestDetail) => {
      setLoadingRecs(true);
      setRecError(null);
      const viewOnlyLocal = isRequestViewOnly(getRequestLifecycleStatus(req));

      try {
        if (req.requestType === "ai-built-team") {
          try {
            const existing = await getCompanyRequestTeamRecommendations(req.id);
            setTeams(existing.teams);
            return;
          } catch (err) {
            if (!isAxiosStatus(err, 404)) throw err;
            if (viewOnlyLocal) {
              setTeams([]);
              return;
            }
            const generated = await generateCompanyRequestTeamRecommendations(req.id);
            setTeams(generated.teams);
            return;
          }
        }

        try {
          const existing = await getCompanyRequestRecommendations(req.id);
          setCandidates(existing.items.map(mapRecommendationToCandidate));
        } catch (err) {
          if (!isAxiosStatus(err, 404)) throw err;
          if (viewOnlyLocal) {
            setCandidates([]);
            return;
          }
          const generated = await generateCompanyRequestRecommendations(req.id);
          setCandidates(generated.items.map(mapRecommendationToCandidate));
        }
      } catch (err) {
        setRecError(parseApiErrorMessage(err));
      } finally {
        setLoadingRecs(false);
      }
    },
    [],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const req = await loadRequest();
      if (req) {
        await Promise.all([loadSavedIds(), loadRecommendations(req)]);
      }
    } catch (err) {
      setPageError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [loadRequest, loadSavedIds, loadRecommendations]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const regenerateTeams = useCallback(async () => {
    if (!request || viewOnly) return;
    setRegeneratingTeams(true);
    setTeamOrchestrationFailed(false);
    setLoadingRecs(true);
    setRecError(null);
    try {
      const result = await regenerateCompanyRequestTeamRecommendations(request.id, {
        forceRegenerate: true,
      });
      setTeams(result.teams);
      if (result.teams.length === 0) {
        Alert.alert(
          "No teams produced",
          "No new team compositions were produced. Try adjusting role requirements.",
        );
      } else {
        Alert.alert("Teams regenerated", "New team compositions generated.");
      }
    } catch (err) {
      setTeamOrchestrationFailed(true);
      setTeams([]);
      setRecError(
        parseApiErrorMessage(err) ||
          "Team orchestration is temporarily unavailable. Please try again.",
      );
    } finally {
      setRegeneratingTeams(false);
      setLoadingRecs(false);
    }
  }, [request, viewOnly]);

  const toggleSaveStudent = async (studentProfileId: number) => {
    if (!request || viewOnly) return;
    try {
      if (savedStudentIds.has(studentProfileId)) {
        await unsaveStudentRecommendation(request.id, studentProfileId);
        setSavedStudentIds((prev) => {
          const next = new Set(prev);
          next.delete(studentProfileId);
          return next;
        });
      } else {
        await saveStudentRecommendation(request.id, studentProfileId);
        setSavedStudentIds((prev) => new Set(prev).add(studentProfileId));
      }
    } catch (err) {
      Alert.alert("Could not update saved state", parseApiErrorMessage(err));
    }
  };

  const toggleSaveTeam = async (teamId: number) => {
    if (!request || viewOnly) return;
    try {
      if (savedTeamIds.has(teamId)) {
        await unsaveTeamRecommendation(request.id, teamId);
        setSavedTeamIds((prev) => {
          const next = new Set(prev);
          next.delete(teamId);
          return next;
        });
      } else {
        await saveTeamRecommendation(request.id, teamId);
        setSavedTeamIds((prev) => new Set(prev).add(teamId));
      }
    } catch (err) {
      Alert.alert("Could not update saved state", parseApiErrorMessage(err));
    }
  };

  const matchCount = isTeamRequest ? teams.length : candidates.length;
  const savedCount = isTeamRequest ? savedTeamIds.size : savedStudentIds.size;
  const title = request ? getRequestProjectTitle(request) : "AI Recommendations";

  return (
    <CompanyScreen edges={[]}>
      <CompanyStackHeader
        title={isTeamRequest ? "AI Team Recommendations" : "AI Student Recommendations"}
        subtitle={title}
        fallbackHref={COMPANY_ROUTES.requestDetail(requestId)}
        showAccountMenu={false}
      />

      {loading && !request ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : pageError ? (
        <View style={{ padding: HOME_SPACE.lg }}>
          <CompanyEmptyState icon={Sparkles} message={pageError} actionLabel="Retry" onAction={() => void loadAll()} />
        </View>
      ) : request ? (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.accent} />
          }
          contentContainerStyle={[styles.screenPad, { gap: HOME_SPACE.md }]}
        >
          {isPaused ? (
            <View style={[styles.card, { backgroundColor: colors.pausedMuted, borderColor: colors.warning }]}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>Request paused</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
                This request is view-only. Reactivate it to run AI matching or save candidates.
              </Text>
              <Pressable
                onPress={() => {
                  void (async () => {
                    setReactivating(true);
                    try {
                      const updated = await updateCompanyProjectRequestStatus(request.id, "Active");
                      setRequest(updated);
                      await loadRecommendations(updated);
                    } catch (err) {
                      Alert.alert("Could not reactivate", parseApiErrorMessage(err));
                    } finally {
                      setReactivating(false);
                    }
                  })();
                }}
                style={({ pressed }) => [styles.primaryBtn, { marginTop: 12 }, pressed && { opacity: 0.92 }]}
              >
                <Text style={styles.primaryBtnText}>{reactivating ? "Reactivating…" : "Reactivate Request"}</Text>
              </Pressable>
            </View>
          ) : null}

          {isClosed ? (
            <View style={[styles.card, { backgroundColor: colors.closedMuted }]}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>Request closed</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
                Recommendations remain visible for reference. Saving new candidates or teams is disabled.
              </Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accent, letterSpacing: 0.6 }}>
              REQUEST SUMMARY
            </Text>
            <Text style={[styles.heroTitle, { fontSize: 20, marginTop: 8 }]}>{title}</Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
              {isTeamRequest ? COMPANY_RECOMMENDATIONS_TEAMS_DESC : COMPANY_RECOMMENDATIONS_STUDENTS_DESC}
            </Text>
            <View style={[styles.chipWrap, { marginTop: 12 }]}>
              {request.category ? (
                <View style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{request.category}</Text>
                </View>
              ) : null}
              {getRequestRoleLabels(request).map((role) => (
                <View key={role} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{role}</Text>
                </View>
              ))}
              {request.collaborationType ? (
                <View style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{formatCollaborationLine(request.collaborationType)}</Text>
                </View>
              ) : null}
              {getRequestSkillLabels(request).slice(0, 6).map((skill) => (
                <View key={skill} style={styles.chip}>
                  <Text style={styles.chipText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>

          <CompanyRequestStatsStrip
            stats={[
              {
                label: isTeamRequest ? "Teams" : "Students",
                value: matchCount,
                icon: isTeamRequest ? UsersRound : UserRound,
                accent: true,
              },
              { label: "Saved", value: savedCount, icon: Sparkles },
            ]}
          />

          {loadingRecs ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={{ marginTop: 12, color: colors.muted }}>Loading recommendations…</Text>
            </View>
          ) : recError ? (
            <CompanyEmptyState
              icon={Sparkles}
              message={recError}
              actionLabel={
                isTeamRequest && !viewOnly
                  ? regeneratingTeams
                    ? undefined
                    : "Regenerate teams"
                  : "Retry"
              }
              onAction={() =>
                void (isTeamRequest && !viewOnly ? regenerateTeams() : loadRecommendations(request))
              }
            />
          ) : isTeamRequest ? (
            teams.length === 0 ? (
              <CompanyEmptyState
                icon={UsersRound}
                message={
                  teamOrchestrationFailed
                    ? "Team orchestration is temporarily unavailable. Please try again."
                    : "No team recommendations yet."
                }
                actionLabel={!viewOnly && !regeneratingTeams ? "Regenerate teams" : undefined}
                onAction={!viewOnly ? () => void regenerateTeams() : undefined}
              />
            ) : (
              <>
                {!viewOnly ? (
                  <Pressable
                    onPress={() => void regenerateTeams()}
                    disabled={regeneratingTeams}
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      { alignSelf: "flex-start" },
                      regeneratingTeams && { opacity: 0.6 },
                      pressed && !regeneratingTeams && { opacity: 0.92 },
                    ]}
                  >
                    <Text style={{ fontWeight: "700", color: colors.accent }}>
                      {regeneratingTeams ? "Regenerating teams…" : "Regenerate teams"}
                    </Text>
                  </Pressable>
                ) : null}
                {teams.map((team) => (
                <View key={team.teamId} style={styles.card}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 17, fontWeight: "800", color: colors.foreground }}>
                      Team #{team.teamRank}
                    </Text>
                    <CompanyMatchScoreRing score={team.totalScore} size={48} />
                  </View>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8, lineHeight: 20 }}>
                    {team.summaryReason}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 8 }}>
                    {team.members.length} members · {requestTypeLabel(request.requestType)}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                    <Pressable
                      onPress={() =>
                        router.push(COMPANY_ROUTES.teamDiscoveryProfile(request.id, team.teamId) as Href)
                      }
                      style={({ pressed }) => [styles.primaryBtn, { flex: 1 }, pressed && { opacity: 0.92 }]}
                    >
                      <Text style={styles.primaryBtnText}>View Team</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void toggleSaveTeam(team.teamId)}
                      disabled={viewOnly}
                      style={({ pressed }) => [
                        styles.secondaryBtn,
                        { width: 52, paddingHorizontal: 0 },
                        savedTeamIds.has(team.teamId) && {
                          backgroundColor: colors.accentSoft,
                          borderColor: colors.accentBorder,
                        },
                        viewOnly && { opacity: 0.45 },
                        pressed && !viewOnly && { opacity: 0.92 },
                      ]}
                    >
                      <Text style={{ fontWeight: "800", color: colors.accent }}>
                        {savedTeamIds.has(team.teamId) ? "✓" : "+"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
                ))}
              </>
            )
          ) : candidates.length === 0 ? (
            <CompanyEmptyState icon={UserRound} message="No student recommendations yet." />
          ) : (
            candidates.map((candidate) => (
              <CompanyRecommendationCard
                key={candidate.id}
                candidate={candidate}
                saved={savedStudentIds.has(candidate.studentProfileId)}
                saveDisabled={viewOnly}
                onViewProfile={() =>
                  router.push(
                    COMPANY_ROUTES.studentDiscoveryProfile(request.id, candidate.studentProfileId) as Href,
                  )
                }
                onToggleSave={() => void toggleSaveStudent(candidate.studentProfileId)}
              />
            ))
          )}
        </ScrollView>
      ) : null}
    </CompanyScreen>
  );
}
