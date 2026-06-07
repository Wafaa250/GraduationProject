import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import type { MobileUploadFile } from "@/api/mobileUpload";
import {
  getMyRecruitmentApplication,
  submitRecruitmentApplication,
  uploadRecruitmentApplicationFile,
} from "@/api/recruitmentApplicationsApi";
import {
  getPublicRecruitmentCampaign,
  type PublicRecruitmentCampaignDetail,
  type RecruitmentPosition,
} from "@/api/recruitmentCampaignsApi";
import {
  DynamicFormFields,
  type FormFieldsValueMap,
} from "@/components/forms/DynamicFormFields";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { PublicProfileShell } from "@/components/student/PublicProfileShell";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { formatEventDate, getRegistrationDeadlineStatus } from "@/lib/eventFormUtils";
import {
  buildEmptyAnswerDrafts,
  draftsToSubmissionPayload,
  fieldUsesOptions,
  getStudentApplicationQuestions,
  normalizeFieldType,
  parseSkillsList,
  recruitmentQuestionToFormField,
  validateApplicationAnswers,
} from "@/lib/recruitmentFormFields";

export default function StudentRecruitmentCampaignDetailScreen() {
  const { campaignId, orgId, positionId } = useLocalSearchParams<{
    campaignId: string;
    orgId?: string;
    positionId?: string;
  }>();
  const numericCampaignId = Number(campaignId);
  const orgIdFromQuery = Number(orgId ?? 0);
  const initialPositionId = Number(positionId ?? 0) || null;

  const [campaign, setCampaign] = useState<PublicRecruitmentCampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(initialPositionId);
  const [applicationStatusLoading, setApplicationStatusLoading] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [answerDrafts, setAnswerDrafts] = useState<FormFieldsValueMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [fileUploadingId, setFileUploadingId] = useState<number | null>(null);

  useEffect(() => {
    if (!Number.isFinite(numericCampaignId) || orgIdFromQuery <= 0) {
      setError("Invalid recruitment link.");
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        setCampaign(await getPublicRecruitmentCampaign(orgIdFromQuery, numericCampaignId));
      } catch (err) {
        setError(parseApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [numericCampaignId, orgIdFromQuery]);

  useEffect(() => {
    if (!selectedPositionId || orgIdFromQuery <= 0) {
      setHasApplied(false);
      return;
    }
    setApplicationStatusLoading(true);
    void getMyRecruitmentApplication(orgIdFromQuery, numericCampaignId, selectedPositionId)
      .then((status) => setHasApplied(!!status.hasSubmitted))
      .catch(() => setHasApplied(false))
      .finally(() => setApplicationStatusLoading(false));
  }, [numericCampaignId, orgIdFromQuery, selectedPositionId]);

  const applicationClosed = useMemo(
    () => getRegistrationDeadlineStatus(campaign?.applicationDeadline ?? null) === "closed",
    [campaign?.applicationDeadline],
  );

  const studentQuestions = useMemo(() => {
    if (!campaign?.questions || !selectedPositionId) return [];
    return getStudentApplicationQuestions(campaign.questions, selectedPositionId);
  }, [campaign?.questions, selectedPositionId]);

  const formFieldDefs = useMemo(
    () => studentQuestions.map(recruitmentQuestionToFormField),
    [studentQuestions],
  );

  useEffect(() => {
    if (studentQuestions.length === 0) {
      setAnswerDrafts({});
      return;
    }
    const drafts = buildEmptyAnswerDrafts(studentQuestions);
    const map: FormFieldsValueMap = {};
    for (const q of studentQuestions) {
      const draft = drafts[q.id];
      map[q.id] = { value: draft.value, values: draft.values };
    }
    setAnswerDrafts(map);
  }, [studentQuestions]);

  const handleFieldChange = (fieldId: number, patch: Partial<FormFieldsValueMap[number]>) => {
    setAnswerDrafts((prev) => ({
      ...prev,
      [fieldId]: { ...(prev[fieldId] ?? { value: "", values: [] }), ...patch },
    }));
  };

  const handleFileUpload = async (fieldId: number, file: MobileUploadFile): Promise<string> => {
    if (orgIdFromQuery <= 0) throw new Error("Invalid organization.");
    setFileUploadingId(fieldId);
    try {
      return await uploadRecruitmentApplicationFile(orgIdFromQuery, numericCampaignId, file);
    } catch (err) {
      Alert.alert("Upload failed", parseApiErrorMessage(err));
      throw err;
    } finally {
      setFileUploadingId(null);
    }
  };

  const handleApply = async () => {
    if (!campaign || !selectedPositionId || orgIdFromQuery <= 0) return;
    const draftRecord = Object.fromEntries(
      Object.entries(answerDrafts).map(([id, value]) => [
        Number(id),
        { questionId: Number(id), value: value.value, values: value.values },
      ]),
    );
    const validationError = validateApplicationAnswers(studentQuestions, draftRecord);
    if (validationError) {
      Alert.alert("Application incomplete", validationError);
      return;
    }
    setSubmitting(true);
    try {
      const payload = draftsToSubmissionPayload(studentQuestions, draftRecord);
      await submitRecruitmentApplication(
        orgIdFromQuery,
        numericCampaignId,
        selectedPositionId,
        payload,
      );
      setHasApplied(true);
      setShowForm(false);
      Alert.alert("Application submitted", "Your application was sent successfully.");
    } catch (err) {
      Alert.alert("Application failed", parseApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PublicProfileShell title="Recruitment" fallbackHref="/feed">
        <ActivityIndicator color={HUB_COLORS.primary} />
      </PublicProfileShell>
    );
  }

  if (error || !campaign) {
    return (
      <PublicProfileShell title="Recruitment" fallbackHref="/feed">
        <Text style={styles.error}>{error ?? "Campaign not found."}</Text>
      </PublicProfileShell>
    );
  }

  const cover = campaign.coverImageUrl ? resolveApiFileUrl(campaign.coverImageUrl) : null;

  return (
    <PublicProfileShell title={campaign.title} fallbackHref="/feed">
      <ScrollView contentContainerStyle={styles.scroll}>
        {cover ? <Image source={{ uri: cover }} style={styles.cover} /> : null}
        <Text style={styles.org}>{campaign.organizationName}</Text>
        <Text style={styles.meta}>Apply by {formatEventDate(campaign.applicationDeadline)}</Text>
        <Text style={styles.description}>{campaign.description}</Text>

        <HubSectionCard title="Open positions">
          {campaign.positions.map((position: RecruitmentPosition) => {
            const selected = selectedPositionId === position.id;
            const skills = parseSkillsList(position.requiredSkills).slice(0, 4);
            return (
              <Pressable
                key={position.id}
                style={[styles.positionCard, selected && styles.positionCardSelected]}
                onPress={() => {
                  setSelectedPositionId(position.id);
                  setShowForm(false);
                }}
                disabled={applicationClosed}
              >
                <Text style={styles.positionTitle}>{position.roleTitle}</Text>
                <Text style={styles.positionMeta}>
                  {position.neededCount} opening{position.neededCount === 1 ? "" : "s"}
                </Text>
                {position.description ? (
                  <Text style={styles.positionDesc}>{position.description}</Text>
                ) : null}
                {skills.length > 0 ? (
                  <View style={styles.skillRow}>
                    {skills.map((skill) => (
                      <Text key={skill} style={styles.skillTag}>
                        {skill}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </HubSectionCard>

        <HubSectionCard title="Apply">
          {applicationClosed ? (
            <Text style={styles.muted}>
              This recruitment campaign is no longer accepting applications.
            </Text>
          ) : !selectedPositionId ? (
            <Text style={styles.muted}>Pick an open position to continue with your application.</Text>
          ) : applicationStatusLoading ? (
            <View style={styles.inlineLoading}>
              <ActivityIndicator color={HUB_COLORS.primary} size="small" />
              <Text style={styles.muted}>Checking your application status…</Text>
            </View>
          ) : hasApplied ? (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>You have applied to this campaign</Text>
            </View>
          ) : studentQuestions.length === 0 ? (
            <Text style={styles.muted}>
              The application form for this position is not available yet.
            </Text>
          ) : !showForm ? (
            <Pressable style={styles.primaryBtn} onPress={() => setShowForm(true)}>
              <Text style={styles.primaryBtnText}>Apply now</Text>
            </Pressable>
          ) : (
            <>
              <DynamicFormFields
                fields={formFieldDefs}
                values={answerDrafts}
                onChange={handleFieldChange}
                normalizeType={normalizeFieldType}
                fieldUsesOptions={fieldUsesOptions}
                multipleChoiceStyle="radio"
                onFileUpload={handleFileUpload}
                fileUploadingId={fileUploadingId}
                disabled={submitting}
              />
              <Pressable
                style={[styles.primaryBtn, submitting && styles.btnDisabled]}
                onPress={() => void handleApply()}
                disabled={submitting}
              >
                <Text style={styles.primaryBtnText}>
                  {submitting ? "Submitting…" : "Submit application"}
                </Text>
              </Pressable>
            </>
          )}
        </HubSectionCard>
      </ScrollView>
    </PublicProfileShell>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 14, paddingBottom: 24 },
  error: { color: "#DC2626", lineHeight: 22 },
  cover: { width: "100%", height: 180, borderRadius: 12, backgroundColor: HUB_COLORS.primarySoft },
  org: { fontWeight: "700", color: HUB_COLORS.primary, fontSize: 13 },
  meta: { color: HUB_COLORS.muted, fontSize: 14 },
  description: { color: HUB_COLORS.foreground, lineHeight: 22, fontSize: 15 },
  muted: { color: HUB_COLORS.muted, fontSize: 14, lineHeight: 20 },
  inlineLoading: { flexDirection: "row", alignItems: "center", gap: 10 },
  positionCard: {
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  positionCardSelected: {
    borderColor: HUB_COLORS.primary,
    backgroundColor: HUB_COLORS.primarySoft,
  },
  positionTitle: { fontWeight: "700", color: HUB_COLORS.foreground },
  positionMeta: { color: HUB_COLORS.muted, fontSize: 12, marginTop: 4 },
  positionDesc: { color: HUB_COLORS.muted, marginTop: 4, fontSize: 13 },
  skillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  skillTag: {
    fontSize: 11,
    color: HUB_COLORS.foreground,
    backgroundColor: HUB_COLORS.inputBg,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadge: {
    backgroundColor: HUB_COLORS.primarySoft,
    padding: 12,
    borderRadius: 10,
  },
  statusText: { color: HUB_COLORS.primary, fontWeight: "600" },
  primaryBtn: {
    backgroundColor: HUB_COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },
});
