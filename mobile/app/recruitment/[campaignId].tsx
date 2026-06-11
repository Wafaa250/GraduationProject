import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { showAlert } from "@/lib/confirmAlert";
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

  const scrollRef = useRef<ScrollView>(null);
  const applySectionYRef = useRef(0);

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

  const selectedPosition = useMemo(
    () => campaign?.positions.find((p) => p.id === selectedPositionId) ?? null,
    [campaign?.positions, selectedPositionId],
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

  const scrollToApplySection = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, applySectionYRef.current - 12),
        animated: true,
      });
    });
  };

  const handleSelectPosition = (position: RecruitmentPosition) => {
    if (applicationClosed) {
      showAlert(
        "Applications closed",
        "This recruitment campaign is no longer accepting applications. These roles are shown for reference only.",
      );
      return;
    }
    setSelectedPositionId(position.id);
    setShowForm(false);
    scrollToApplySection();
  };

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
      showAlert("Upload failed", parseApiErrorMessage(err));
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
      showAlert("Application incomplete", validationError);
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
      showAlert("Application submitted", "Your application was sent successfully.");
    } catch (err) {
      showAlert("Application failed", parseApiErrorMessage(err));
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
  const positionsSubtitle = applicationClosed
    ? "These roles are shown for reference only. Applications are no longer accepted."
    : "Tap a role below to select it, then complete your application in the next section.";

  const applySubtitle = applicationClosed
    ? "This recruitment campaign is no longer accepting applications."
    : selectedPosition
      ? `Applying for ${selectedPosition.roleTitle}. Complete the form below.`
      : "Select a position above to view and complete the application form.";

  return (
    <PublicProfileShell title={campaign.title} fallbackHref="/feed">
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
        {cover ? <Image source={{ uri: cover }} style={styles.cover} /> : null}
        <Text style={styles.org}>{campaign.organizationName}</Text>
        <Text style={styles.meta}>Apply by {formatEventDate(campaign.applicationDeadline)}</Text>
        <Text style={styles.description}>{campaign.description}</Text>

        <HubSectionCard title="Open positions" description={positionsSubtitle}>
          {applicationClosed ? (
            <View style={styles.closedBanner}>
              <Ionicons name="lock-closed-outline" size={16} color="#B45309" />
              <Text style={styles.closedBannerText}>
                Applications are closed. Position details are read-only.
              </Text>
            </View>
          ) : null}

          {campaign.positions.length === 0 ? (
            <Text style={styles.muted}>No open positions available.</Text>
          ) : (
            campaign.positions.map((position: RecruitmentPosition) => {
              const selected = !applicationClosed && selectedPositionId === position.id;
              const skills = parseSkillsList(position.requiredSkills).slice(0, 4);
              return (
                <Pressable
                  key={position.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${position.roleTitle}`}
                  accessibilityState={{ selected, disabled: applicationClosed }}
                  style={({ pressed }) => [
                    styles.positionCard,
                    selected && styles.positionCardSelected,
                    applicationClosed && styles.positionCardClosed,
                    pressed && !applicationClosed && styles.positionCardPressed,
                  ]}
                  onPress={() => handleSelectPosition(position)}
                >
                  <View style={styles.positionCardHeader}>
                    <View
                      style={[
                        styles.positionRadio,
                        selected && styles.positionRadioSelected,
                        applicationClosed && styles.positionRadioClosed,
                      ]}
                    >
                      {selected ? (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      ) : null}
                    </View>
                    <View style={styles.positionCardBody}>
                      <Text style={styles.positionTitle}>{position.roleTitle}</Text>
                      <Text style={styles.positionMeta}>
                        {position.neededCount} opening{position.neededCount === 1 ? "" : "s"}
                      </Text>
                    </View>
                    {!applicationClosed ? (
                      <Text style={[styles.selectHint, selected && styles.selectHintSelected]}>
                        {selected ? "Selected" : "Tap to select"}
                      </Text>
                    ) : null}
                  </View>
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
            })
          )}
        </HubSectionCard>

        <View
          onLayout={(event) => {
            applySectionYRef.current = event.nativeEvent.layout.y;
          }}
        >
          <HubSectionCard title="Apply" description={applySubtitle}>
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
        </View>
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
  closedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.35)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
  },
  closedBannerText: {
    flex: 1,
    color: "#B45309",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  positionCard: {
    borderWidth: 2,
    borderColor: HUB_COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: HUB_COLORS.cardBg,
  },
  positionCardSelected: {
    borderColor: HUB_COLORS.primary,
    backgroundColor: HUB_COLORS.primarySoft,
  },
  positionCardClosed: {
    opacity: 0.72,
    backgroundColor: HUB_COLORS.inputBg,
  },
  positionCardPressed: {
    opacity: 0.9,
  },
  positionCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  positionCardBody: {
    flex: 1,
    minWidth: 0,
  },
  positionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: HUB_COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  positionRadioSelected: {
    borderColor: HUB_COLORS.primary,
    backgroundColor: HUB_COLORS.primary,
  },
  positionRadioClosed: {
    borderColor: HUB_COLORS.muted,
  },
  positionTitle: { fontWeight: "700", color: HUB_COLORS.foreground, fontSize: 15 },
  positionMeta: { color: HUB_COLORS.muted, fontSize: 12, marginTop: 4 },
  positionDesc: { color: HUB_COLORS.muted, marginTop: 8, fontSize: 13, lineHeight: 18 },
  selectHint: {
    fontSize: 11,
    fontWeight: "700",
    color: HUB_COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginTop: 2,
  },
  selectHintSelected: {
    color: HUB_COLORS.primary,
  },
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
