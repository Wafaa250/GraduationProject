import { router, useLocalSearchParams, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Sparkles } from "lucide-react-native";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  acceptRecruitmentApplication,
  analyzeRecruitmentApplicants,
  regenerateRecruitmentApplicants,
  rejectRecruitmentApplication,
  type RecruitmentApplicantAnalysisResponse,
  type RecruitmentApplicantAnalysisResult,
} from "@/api/recruitmentApplicationsApi";
import {
  deleteOrganizationRecruitmentCampaign,
  getOrganizationRecruitmentCampaign,
  publishOrganizationRecruitmentCampaign,
  type RecruitmentCampaign,
} from "@/api/recruitmentCampaignsApi";
import { AiRecruitmentCandidateCard } from "@/components/association/AiRecruitmentCandidateCard";
import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { AssociationCard } from "@/components/association/AssociationCard";
import { AssociationErrorState } from "@/components/association/AssociationErrorState";
import { AssociationLoadingState } from "@/components/association/AssociationLoadingState";
import { AssociationWorkspaceScreen } from "@/components/association/AssociationWorkspaceScreen";
import { CampaignApplicationsSection } from "@/components/association/CampaignApplicationsSection";
import { RecruitmentRegenerateModal } from "@/components/association/RecruitmentRegenerateModal";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import {
  ASSOCIATION_ROUTES,
  associationRecruitmentCampaignEditPath,
  associationRecruitmentPositionFormPath,
} from "@/lib/associationRoutes";
import { confirmAlert, showAlert } from "@/lib/confirmAlert";
import {
  formatEventDate,
  formatRegistrationCloseDate,
  getRegistrationDeadlineStatus,
} from "@/lib/eventFormUtils";
import { parseSkillsList } from "@/lib/recruitmentFormFields";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function AssociationRecruitmentDetailScreen() {
  const layout = useResponsiveLayout();
  const { campaignId } = useLocalSearchParams<{ campaignId: string }>();
  const numericId = Number(campaignId);
  const [campaign, setCampaign] = useState<RecruitmentCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [applicationsCount, setApplicationsCount] = useState<number | null>(null);
  const [aiAnalysisByPosition, setAiAnalysisByPosition] = useState<
    Record<number, RecruitmentApplicantAnalysisResponse | undefined>
  >({});
  const [aiAnalyzingPositionId, setAiAnalyzingPositionId] = useState<number | null>(null);
  const [decisionBusyApplicationId, setDecisionBusyApplicationId] = useState<number | null>(null);
  const [regenerateModalPositionId, setRegenerateModalPositionId] = useState<number | null>(null);
  const [regenerateSkills, setRegenerateSkills] = useState("");
  const [regenerateMajors, setRegenerateMajors] = useState("");
  const [regenerateMinMatch, setRegenerateMinMatch] = useState(70);
  const [regenerateExcludeRejected, setRegenerateExcludeRejected] = useState(true);
  const [rejectedStudentIdsByPosition, setRejectedStudentIdsByPosition] = useState<
    Record<number, number[]>
  >({});
  const [acceptedByPosition, setAcceptedByPosition] = useState<
    Record<number, RecruitmentApplicantAnalysisResult[]>
  >({});

  const load = useCallback(async () => {
    if (!Number.isFinite(numericId)) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getOrganizationRecruitmentCampaign(numericId);
      setCampaign(data);
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [numericId]);

  useEffect(() => {
    void load();
  }, [load]);

  const parseCommaList = (value: string): string[] =>
    value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const handlePublish = async () => {
    if (!campaign) return;
    setBusy(true);
    try {
      await publishOrganizationRecruitmentCampaign(campaign.id);
      await load();
      showAlert("Published", "Selection application cycle is now live.");
    } catch (err) {
      showAlert("Publish failed", parseApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = () => {
    if (!campaign) return;
    confirmAlert({
      title: "Delete campaign",
      message: `Delete "${campaign.title}"? This cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          await deleteOrganizationRecruitmentCampaign(campaign.id);
          router.replace(ASSOCIATION_ROUTES.recruitment as Href);
        } catch (err) {
          showAlert("Delete failed", parseApiErrorMessage(err));
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const handleAiAnalyze = async (positionId: number) => {
    if (!campaign) return;
    setAiAnalyzingPositionId(positionId);
    try {
      const data = await analyzeRecruitmentApplicants(campaign.id, positionId);
      setAiAnalysisByPosition((prev) => ({ ...prev, [positionId]: data }));
      showAlert(
        "AI analysis complete",
        data.results.length > 0
          ? `Showing ${data.results.length} top match${data.results.length === 1 ? "" : "es"}.`
          : "No applicants matched for AI ranking.",
      );
    } catch (err) {
      showAlert("AI analyze failed", parseApiErrorMessage(err));
    } finally {
      setAiAnalyzingPositionId(null);
    }
  };

  const handleRegenerate = async (positionId: number) => {
    if (!campaign) return;
    setAiAnalyzingPositionId(positionId);
    setRegenerateModalPositionId(null);
    try {
      const data = await regenerateRecruitmentApplicants(campaign.id, positionId, {
        excludeStudentIds: rejectedStudentIdsByPosition[positionId] ?? [],
        preferSkills: parseCommaList(regenerateSkills),
        preferMajors: parseCommaList(regenerateMajors),
        minMatch: regenerateMinMatch,
        excludeRejectedApplicants: regenerateExcludeRejected,
      });
      setAiAnalysisByPosition((prev) => ({ ...prev, [positionId]: data }));
      showAlert(
        "Shortlist regenerated",
        data.results.length > 0
          ? `Found ${data.results.length} new applicant${data.results.length === 1 ? "" : "s"}.`
          : "No additional applicants matched your filters.",
      );
    } catch (err) {
      showAlert("Regenerate failed", parseApiErrorMessage(err));
    } finally {
      setAiAnalyzingPositionId(null);
    }
  };

  const handleAcceptCandidate = async (
    result: RecruitmentApplicantAnalysisResult,
    positionId: number,
  ) => {
    setDecisionBusyApplicationId(result.applicationId);
    try {
      const res = await acceptRecruitmentApplication(result.applicationId);
      const acceptedRow: RecruitmentApplicantAnalysisResult = {
        ...result,
        status: "Accepted",
        studentName: res.application.studentName,
      };
      setAcceptedByPosition((prev) => ({
        ...prev,
        [positionId]: [
          ...(prev[positionId] ?? []).filter((x) => x.applicationId !== result.applicationId),
          acceptedRow,
        ],
      }));
      setAiAnalysisByPosition((prev) => {
        const current = prev[positionId];
        if (!current) return prev;
        return {
          ...prev,
          [positionId]: {
            ...current,
            results: current.results.filter((x) => x.applicationId !== result.applicationId),
          },
        };
      });
      showAlert("Accepted", "Applicant accepted and added to your organization.");
    } catch (err) {
      showAlert("Accept failed", parseApiErrorMessage(err));
    } finally {
      setDecisionBusyApplicationId(null);
    }
  };

  const handleRejectCandidate = async (
    result: RecruitmentApplicantAnalysisResult,
    positionId: number,
  ) => {
    setDecisionBusyApplicationId(result.applicationId);
    try {
      await rejectRecruitmentApplication(result.applicationId);
      setRejectedStudentIdsByPosition((prev) => ({
        ...prev,
        [positionId]: [...(prev[positionId] ?? []), result.studentId],
      }));
      setAiAnalysisByPosition((prev) => {
        const current = prev[positionId];
        if (!current) return prev;
        return {
          ...prev,
          [positionId]: {
            ...current,
            results: current.results.filter((x) => x.applicationId !== result.applicationId),
          },
        };
      });
      showAlert("Rejected", "Application rejected.");
    } catch (err) {
      showAlert("Reject failed", parseApiErrorMessage(err));
    } finally {
      setDecisionBusyApplicationId(null);
    }
  };

  if (loading && !campaign) {
    return (
      <AssociationWorkspaceScreen showBack fallbackHref={ASSOCIATION_ROUTES.recruitment} navTitle="Campaign">
        <AssociationLoadingState message="Loading campaign…" />
      </AssociationWorkspaceScreen>
    );
  }

  if (error && !campaign) {
    return (
      <AssociationWorkspaceScreen showBack fallbackHref={ASSOCIATION_ROUTES.recruitment} navTitle="Campaign">
        <AssociationErrorState
          message={error}
          onRetry={() => void load()}
          backLabel="Back to campaigns"
          onBack={() => router.replace(ASSOCIATION_ROUTES.recruitment as Href)}
        />
      </AssociationWorkspaceScreen>
    );
  }

  if (!campaign) {
    return (
      <AssociationWorkspaceScreen showBack fallbackHref={ASSOCIATION_ROUTES.recruitment} navTitle="Campaign">
        <AssociationErrorState message="Campaign not found." />
      </AssociationWorkspaceScreen>
    );
  }

  const coverUrl = campaign.coverImageUrl
    ? resolveApiFileUrl(campaign.coverImageUrl) ?? campaign.coverImageUrl
    : null;
  const deadlineStatus = getRegistrationDeadlineStatus(campaign.applicationDeadline);

  return (
    <AssociationWorkspaceScreen
      showBack
      fallbackHref={ASSOCIATION_ROUTES.recruitment}
      navTitle="Campaign"
      refreshing={loading}
      onRefresh={() => void load()}
    >
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={styles.cover} resizeMode="cover" />
      ) : null}

      <AssociationCard compact>
        <Text style={styles.title}>{campaign.title}</Text>
        <Text style={styles.meta}>
          Deadline: {formatEventDate(campaign.applicationDeadline)}
          {formatRegistrationCloseDate(campaign.applicationDeadline)
            ? ` · Closes ${formatRegistrationCloseDate(campaign.applicationDeadline)}`
            : ""}
        </Text>
        {deadlineStatus === "closed" ? (
          <Text style={styles.closedBadge}>Applications closed</Text>
        ) : null}
        <Text style={styles.body}>{campaign.description}</Text>
        <Text style={styles.meta}>
          {campaign.isPublished ? "Published" : "Draft"}
          {applicationsCount != null ? ` · ${applicationsCount} application(s)` : ""}
        </Text>
      </AssociationCard>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: layout.space("sm") }}>
        <AssociationActionButton
          label="Edit"
          variant="outline"
          onPress={() => router.push(associationRecruitmentCampaignEditPath(campaign.id) as Href)}
        />
        {!campaign.isPublished ? (
          <AssociationActionButton label="Publish" loading={busy} onPress={() => void handlePublish()} />
        ) : null}
        <AssociationActionButton label="Delete" variant="danger" loading={busy} onPress={handleDelete} />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: layout.space("lg") }]}>Positions</Text>
      {campaign.positions.map((position) => {
        const skills = parseSkillsList(position.requiredSkills);
        const aiResults = aiAnalysisByPosition[position.id]?.results ?? [];
        const acceptedRows = acceptedByPosition[position.id] ?? [];

        return (
          <AssociationCard key={position.id} compact style={{ marginBottom: 12 }}>
            <Text style={styles.positionTitle}>{position.roleTitle}</Text>
            <Text style={styles.meta}>
              {position.neededCount} needed
              {position.description?.trim() ? ` · ${position.description.trim()}` : ""}
            </Text>
            {position.requirements?.trim() ? (
              <View style={styles.requirementsBox}>
                <Text style={styles.requirementsLabel}>Requirements</Text>
                <Text style={styles.requirementsText}>{position.requirements.trim()}</Text>
              </View>
            ) : null}
            {skills.length > 0 ? (
              <View style={styles.skillsRow}>
                {skills.map((skill) => (
                  <Text key={skill} style={styles.skillTag}>
                    {skill}
                  </Text>
                ))}
              </View>
            ) : null}

            <View style={[styles.positionActions, { gap: layout.space("sm"), marginTop: 10 }]}>
              <AssociationActionButton
                label="Manage form"
                variant="outline"
                compact
                onPress={() =>
                  router.push(
                    associationRecruitmentPositionFormPath(campaign.id, position.id) as Href,
                  )
                }
              />
              <AssociationActionButton
                label={aiAnalyzingPositionId === position.id ? "Analyzing…" : "AI Analyze"}
                compact
                loading={aiAnalyzingPositionId === position.id}
                icon={<Sparkles size={14} color="#fff" strokeWidth={2.25} />}
                onPress={() => void handleAiAnalyze(position.id)}
              />
              {aiResults.length > 0 ? (
                <AssociationActionButton
                  label="Regenerate"
                  variant="outline"
                  compact
                  onPress={() => setRegenerateModalPositionId(position.id)}
                />
              ) : null}
            </View>

            {acceptedRows.map((row) => (
              <View key={`accepted-${row.applicationId}`} style={{ marginTop: 10 }}>
                <AiRecruitmentCandidateCard
                  campaignId={campaign.id}
                  result={row}
                  variant="accepted"
                />
              </View>
            ))}

            {aiResults.map((result, index) => (
              <View key={result.applicationId} style={{ marginTop: 10 }}>
                <AiRecruitmentCandidateCard
                  campaignId={campaign.id}
                  result={result}
                  variant="suggested"
                  showBestPick={index === 0 && (acceptedByPosition[position.id]?.length ?? 0) === 0}
                  busy={decisionBusyApplicationId === result.applicationId}
                  onAccept={() => void handleAcceptCandidate(result, position.id)}
                  onReject={() => void handleRejectCandidate(result, position.id)}
                />
              </View>
            ))}
          </AssociationCard>
        );
      })}

      <CampaignApplicationsSection
        campaignId={campaign.id}
        positions={campaign.positions}
        onCountChange={setApplicationsCount}
      />

      <RecruitmentRegenerateModal
        visible={regenerateModalPositionId != null}
        skills={regenerateSkills}
        majors={regenerateMajors}
        minMatch={regenerateMinMatch}
        excludeRejected={regenerateExcludeRejected}
        busy={aiAnalyzingPositionId != null}
        onSkillsChange={setRegenerateSkills}
        onMajorsChange={setRegenerateMajors}
        onMinMatchChange={setRegenerateMinMatch}
        onExcludeRejectedChange={setRegenerateExcludeRejected}
        onConfirm={() => {
          if (regenerateModalPositionId != null) void handleRegenerate(regenerateModalPositionId);
        }}
        onClose={() => setRegenerateModalPositionId(null)}
      />
    </AssociationWorkspaceScreen>
  );
}

const styles = StyleSheet.create({
  cover: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: ASSOC_COLORS.accentSoft,
  },
  title: { fontWeight: "800", fontSize: 20, color: ASSOC_COLORS.foreground },
  meta: { color: ASSOC_COLORS.muted, fontSize: 13 },
  body: { color: ASSOC_COLORS.foreground, lineHeight: 22, marginTop: 4 },
  closedBadge: {
    alignSelf: "flex-start",
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: ASSOC_COLORS.muted,
    backgroundColor: ASSOC_COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  sectionTitle: { fontWeight: "800", color: ASSOC_COLORS.foreground, fontSize: 16, marginBottom: 8 },
  positionTitle: { fontWeight: "800", fontSize: 16, color: ASSOC_COLORS.foreground },
  requirementsBox: { marginTop: 8 },
  requirementsLabel: { fontSize: 11, fontWeight: "700", color: ASSOC_COLORS.muted },
  requirementsText: { fontSize: 13, color: ASSOC_COLORS.foreground, lineHeight: 18, marginTop: 2 },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  skillTag: {
    fontSize: 11,
    fontWeight: "600",
    color: ASSOC_COLORS.accentDark,
    backgroundColor: ASSOC_COLORS.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  positionActions: { flexDirection: "row", flexWrap: "wrap" },
});
