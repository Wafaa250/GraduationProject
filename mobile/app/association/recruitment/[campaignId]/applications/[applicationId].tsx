import { router, useLocalSearchParams, type Href } from "expo-router";
import { User } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  acceptRecruitmentApplication,
  getOrganizationRecruitmentApplication,
  rejectRecruitmentApplication,
  updateRecruitmentApplicationStatus,
  type RecruitmentApplicationDetail,
  type RecruitmentApplicationStatus,
} from "@/api/recruitmentApplicationsApi";
import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { AssociationCard } from "@/components/association/AssociationCard";
import { AssociationErrorState } from "@/components/association/AssociationErrorState";
import { AssociationLoadingState } from "@/components/association/AssociationLoadingState";
import { AssociationPageHeader } from "@/components/association/AssociationPageHeader";
import { AssociationWorkspaceScreen } from "@/components/association/AssociationWorkspaceScreen";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import {
  associationRecruitmentCampaignPath,
} from "@/lib/associationRoutes";
import { studentDirectoryProfilePath } from "@/lib/studentRoutes";
import { confirmAlert, showAlert } from "@/lib/confirmAlert";
import { fieldTypeLabel, normalizeFieldType } from "@/lib/recruitmentFormFields";
import { formatEventDate } from "@/lib/eventFormUtils";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

const STATUSES: RecruitmentApplicationStatus[] = [
  "Pending",
  "AiSuggested",
  "Accepted",
  "Rejected",
];

const STATUS_LABELS: Record<RecruitmentApplicationStatus, string> = {
  Pending: "Pending",
  AiSuggested: "AI Suggested",
  Accepted: "Accepted",
  Rejected: "Rejected",
};

export default function AssociationRecruitmentApplicationDetailScreen() {
  const layout = useResponsiveLayout();
  const { campaignId, applicationId, studentUserId: studentUserIdParam } = useLocalSearchParams<{
    campaignId: string;
    applicationId: string;
    studentUserId?: string;
  }>();
  const campId = Number(campaignId);
  const appId = Number(applicationId);
  const studentUserId = Number(studentUserIdParam);
  const canViewStudentProfile = Number.isFinite(studentUserId) && studentUserId > 0;
  const [detail, setDetail] = useState<RecruitmentApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(campId) || !Number.isFinite(appId)) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getOrganizationRecruitmentApplication(campId, appId);
      setDetail(data);
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [campId, appId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleStatus = (status: RecruitmentApplicationStatus) => {
    if (!detail || detail.status === status) return;

    const runStatusChange = async () => {
      setBusy(true);
      try {
        if (status === "Accepted") {
          const res = await acceptRecruitmentApplication(detail.id);
          setDetail(res.application);
          showAlert(
            "Accepted",
            res.membershipKind === "Leadership"
              ? "Accepted and added to leadership team."
              : "Accepted and added to organization members.",
          );
        } else if (status === "Rejected") {
          const res = await rejectRecruitmentApplication(detail.id);
          setDetail(res.application);
          showAlert("Rejected", "Application rejected.");
        } else {
          const updated = await updateRecruitmentApplicationStatus(campId, detail.id, status);
          setDetail(updated);
          showAlert("Status updated", `Marked as ${STATUS_LABELS[status]}.`);
        }
      } catch (err) {
        showAlert("Update failed", parseApiErrorMessage(err));
      } finally {
        setBusy(false);
      }
    };

    if (status === "Accepted" || status === "Rejected") {
      confirmAlert({
        title: status === "Accepted" ? "Accept applicant" : "Reject applicant",
        message:
          status === "Accepted"
            ? `Accept ${detail.studentName} for ${detail.positionRoleTitle}?`
            : `Reject ${detail.studentName}'s application?`,
        confirmLabel: status === "Accepted" ? "Accept" : "Reject",
        destructive: status === "Rejected",
        onConfirm: runStatusChange,
      });
      return;
    }

    void runStatusChange();
  };

  if (loading && !detail) {
    return (
      <AssociationWorkspaceScreen
        showBack
        fallbackHref={associationRecruitmentCampaignPath(Number(campaignId))}
        navTitle="Application"
      >
        <AssociationLoadingState message="Loading application…" />
      </AssociationWorkspaceScreen>
    );
  }

  if (error && !detail) {
    return (
      <AssociationWorkspaceScreen
        showBack
        fallbackHref={associationRecruitmentCampaignPath(Number(campaignId))}
        navTitle="Application"
      >
        <AssociationErrorState
          message={error}
          onRetry={() => void load()}
          backLabel="Back to campaign"
          onBack={() => router.replace(`/association/recruitment/${campaignId}` as Href)}
        />
      </AssociationWorkspaceScreen>
    );
  }

  if (!detail) {
    return (
      <AssociationWorkspaceScreen
        showBack
        fallbackHref={associationRecruitmentCampaignPath(Number(campaignId))}
        navTitle="Application"
      >
        <AssociationErrorState message="Application not found." />
      </AssociationWorkspaceScreen>
    );
  }

  return (
    <AssociationWorkspaceScreen
      showBack
      fallbackHref={associationRecruitmentCampaignPath(Number(campaignId))}
      navTitle="Application"
    >
      <AssociationPageHeader title="Application detail" subtitle={detail.campaignTitle} />

      <AssociationCard compact>
        <Text style={styles.name}>{detail.studentName}</Text>
        <Text style={styles.meta}>Applied for {detail.positionRoleTitle}</Text>
        <Text style={styles.meta}>
          Submitted {formatEventDate(detail.submittedAt)}
          {detail.studentEmail ? ` · ${detail.studentEmail}` : ""}
          {detail.studentMajor ? ` · ${detail.studentMajor}` : ""}
        </Text>
        <Text style={styles.currentStatus}>Current: {STATUS_LABELS[detail.status]}</Text>

        {canViewStudentProfile ? (
          <View style={{ marginTop: layout.space("sm") }}>
            <AssociationActionButton
              label="View profile"
              variant="outline"
              compact
              icon={<User size={14} color={ASSOC_COLORS.accentDark} strokeWidth={2.25} />}
              onPress={() => router.push(studentDirectoryProfilePath(studentUserId) as Href)}
            />
          </View>
        ) : null}

        <View style={[styles.statusRow, { marginTop: layout.space("md"), gap: 8 }]}>
          {STATUSES.map((status) => (
            <AssociationActionButton
              key={status}
              label={STATUS_LABELS[status]}
              variant={detail.status === status ? "primary" : "outline"}
              compact
              loading={busy && detail.status !== status}
              disabled={busy || detail.status === status}
              onPress={() => handleStatus(status)}
            />
          ))}
        </View>
      </AssociationCard>

      <Text style={[styles.sectionTitle, { marginTop: layout.space("md") }]}>Submitted answers</Text>
      {detail.answers.map((answer) => (
        <AssociationCard key={answer.questionId} compact style={{ marginBottom: 8 }}>
          <Text style={styles.question}>{answer.questionTitle}</Text>
          <Text style={styles.questionType}>{fieldTypeLabel(normalizeFieldType(answer.questionType))}</Text>
          <AnswerValue answer={answer} />
        </AssociationCard>
      ))}

      <View style={{ marginTop: 16 }}>
        <AssociationActionButton
          label="Back to campaign"
          variant="outline"
          onPress={() => router.replace(`/association/recruitment/${campaignId}` as Href)}
        />
      </View>
    </AssociationWorkspaceScreen>
  );
}

function AnswerValue({
  answer,
}: {
  answer: RecruitmentApplicationDetail["answers"][number];
}) {
  const type = normalizeFieldType(answer.questionType);

  if (type === "FileUpload" && answer.answerValue?.trim()) {
    const url = resolveApiFileUrl(answer.answerValue) ?? answer.answerValue;
    return (
      <AssociationActionButton
        label="Open uploaded file"
        variant="outline"
        compact
        onPress={() => void Linking.openURL(url)}
      />
    );
  }

  if (answer.selectedValues?.length) {
    return (
      <View style={styles.tagRow}>
        {answer.selectedValues.map((v) => (
          <Text key={v} style={styles.tag}>
            {v}
          </Text>
        ))}
      </View>
    );
  }

  return <Text style={styles.answer}>{answer.answerValue?.trim() || "—"}</Text>;
}

const styles = StyleSheet.create({
  name: { fontWeight: "800", fontSize: 18, color: ASSOC_COLORS.foreground },
  meta: { color: ASSOC_COLORS.muted, fontSize: 13, marginTop: 2 },
  currentStatus: {
    marginTop: 8,
    fontWeight: "700",
    color: ASSOC_COLORS.accentDark,
    fontSize: 13,
  },
  statusRow: { flexDirection: "row", flexWrap: "wrap" },
  sectionTitle: { fontWeight: "800", color: ASSOC_COLORS.foreground, fontSize: 16, marginBottom: 8 },
  question: { fontWeight: "700", color: ASSOC_COLORS.foreground },
  questionType: { color: ASSOC_COLORS.muted, fontSize: 11, marginTop: 2, marginBottom: 6 },
  answer: { color: ASSOC_COLORS.foreground, lineHeight: 20 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    fontSize: 12,
    color: ASSOC_COLORS.accentDark,
    backgroundColor: ASSOC_COLORS.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
});
