import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Eye } from "lucide-react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  createRecruitmentCampaignQuestion,
  deleteRecruitmentCampaignQuestion,
  getOrganizationRecruitmentCampaign,
  listRecruitmentCampaignQuestions,
  updateRecruitmentCampaignQuestion,
  type RecruitmentQuestion,
} from "@/api/recruitmentCampaignsApi";
import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { AssociationErrorState } from "@/components/association/AssociationErrorState";
import { AssociationLoadingState } from "@/components/association/AssociationLoadingState";
import { AssociationPageHeader } from "@/components/association/AssociationPageHeader";
import { AssociationWorkspaceScreen } from "@/components/association/AssociationWorkspaceScreen";
import {
  FormFieldBuilderList,
  type BuilderFieldDraft,
} from "@/components/association/FormFieldBuilderList";
import { RegistrationFormPreviewModal } from "@/components/association/RegistrationFormPreviewModal";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { associationRecruitmentCampaignPath } from "@/lib/associationRoutes";
import { showAlert } from "@/lib/confirmAlert";
import {
  EDITOR_FIELD_TYPES,
  draftToPayload,
  fieldToDraft,
  fieldTypeLabel,
  fieldUsesOptions,
  filterQuestionsForPosition,
  validateFieldDraft,
} from "@/lib/recruitmentFormFields";
import type { EventRegistrationForm } from "@/api/eventRegistrationFormApi";

type Selection = number | "new" | null;

function questionsToPreviewForm(
  questions: RecruitmentQuestion[],
  roleTitle: string,
): EventRegistrationForm {
  return {
    id: 0,
    eventId: 0,
    title: `${roleTitle} Application Form`,
    description: "Complete all required fields to apply for this position.",
    createdAt: new Date().toISOString(),
    fields: questions.map((q) => ({
      id: q.id,
      formId: 0,
      label: q.questionTitle,
      fieldType: q.questionType,
      placeholder: q.placeholder,
      helpText: q.helpText,
      isRequired: q.isRequired,
      options: q.options,
      displayOrder: q.displayOrder,
      createdAt: q.createdAt,
    })),
  };
}

export default function AssociationRecruitmentPositionFormScreen() {
  const layout = useResponsiveLayout();
  const { campaignId, positionId } = useLocalSearchParams<{ campaignId: string; positionId: string }>();
  const campaignNumericId = Number(campaignId);
  const positionNumericId = Number(positionId);
  const [questions, setQuestions] = useState<RecruitmentQuestion[]>([]);
  const [roleTitle, setRoleTitle] = useState("Position");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selection, setSelection] = useState<Selection>(null);
  const [draft, setDraft] = useState<BuilderFieldDraft | null>(null);

  const sortedQuestions = useMemo(
    () => filterQuestionsForPosition(questions, positionNumericId),
    [questions, positionNumericId],
  );

  const load = useCallback(async () => {
    if (!Number.isFinite(campaignNumericId)) return;
    setLoading(true);
    setError(null);
    try {
      const [all, campaign] = await Promise.all([
        listRecruitmentCampaignQuestions(campaignNumericId),
        getOrganizationRecruitmentCampaign(campaignNumericId),
      ]);
      setQuestions(all);
      const position = campaign.positions.find((p) => p.id === positionNumericId);
      setRoleTitle(position?.roleTitle ?? "Position");
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [campaignNumericId, positionNumericId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selection === "new") {
      setDraft({
        label: "",
        fieldType: "ShortText",
        placeholder: "",
        helpText: "",
        isRequired: true,
        options: ["", ""],
        displayOrder: sortedQuestions.length,
      });
      return;
    }
    if (typeof selection === "number") {
      const question = sortedQuestions.find((q) => q.id === selection);
      if (question) {
        const d = fieldToDraft(question);
        setDraft({
          label: d.questionTitle,
          fieldType: d.questionType,
          placeholder: d.placeholder,
          helpText: d.helpText,
          isRequired: d.isRequired,
          options: d.options,
          displayOrder: d.displayOrder,
        });
      } else {
        setDraft(null);
      }
      return;
    }
    setDraft(null);
  }, [selection, sortedQuestions]);

  const saveField = async () => {
    if (!draft) return;
    const formDraft = {
      questionTitle: draft.label,
      questionType: draft.fieldType,
      placeholder: draft.placeholder,
      helpText: draft.helpText,
      isRequired: draft.isRequired,
      options: draft.options,
      displayOrder: draft.displayOrder,
      positionId: positionNumericId,
    };
    const err = validateFieldDraft(formDraft);
    if (err) {
      showAlert("Check field", err);
      return;
    }
    setSaving(true);
    try {
      const payload = draftToPayload(formDraft, positionNumericId);
      if (selection === "new") {
        await createRecruitmentCampaignQuestion(campaignNumericId, payload);
      } else if (typeof selection === "number") {
        await updateRecruitmentCampaignQuestion(campaignNumericId, selection, payload);
      }
      setSelection(null);
      await load();
    } catch (err) {
      showAlert("Save failed", parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = async (question: RecruitmentQuestion) => {
    setSaving(true);
    try {
      await deleteRecruitmentCampaignQuestion(campaignNumericId, question.id);
      if (selection === question.id) setSelection(null);
      await load();
    } catch (err) {
      showAlert("Delete failed", parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const moveQuestion = async (question: RecruitmentQuestion, direction: "up" | "down") => {
    const index = sortedQuestions.findIndex((q) => q.id === question.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const swapQuestion = sortedQuestions[swapIndex];
    if (!swapQuestion) return;
    setSaving(true);
    try {
      await Promise.all([
        updateRecruitmentCampaignQuestion(campaignNumericId, question.id, {
          displayOrder: swapQuestion.displayOrder,
        }),
        updateRecruitmentCampaignQuestion(campaignNumericId, swapQuestion.id, {
          displayOrder: question.displayOrder,
        }),
      ]);
      await load();
    } catch (err) {
      showAlert("Reorder failed", parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading && questions.length === 0 && !error) {
    return (
      <AssociationWorkspaceScreen
        showBack
        fallbackHref={associationRecruitmentCampaignPath(Number(campaignId))}
        navTitle="Position form"
      >
        <AssociationLoadingState message="Loading application form…" />
      </AssociationWorkspaceScreen>
    );
  }

  if (error && questions.length === 0) {
    return (
      <AssociationWorkspaceScreen
        showBack
        fallbackHref={associationRecruitmentCampaignPath(Number(campaignId))}
        navTitle="Position form"
      >
        <AssociationErrorState message={error} onRetry={() => void load()} />
      </AssociationWorkspaceScreen>
    );
  }

  const previewForm = questionsToPreviewForm(sortedQuestions, roleTitle);

  return (
    <AssociationWorkspaceScreen
      showBack
      fallbackHref={associationRecruitmentCampaignPath(Number(campaignId))}
      navTitle="Position form"
      refreshing={loading}
      onRefresh={() => void load()}
    >
      <View style={[styles.headerRow, { gap: layout.space("sm") }]}>
        <View style={{ flex: 1 }}>
          <AssociationPageHeader
            title={`${roleTitle} form`}
            subtitle="Manage questions for this position."
          />
        </View>
        <AssociationActionButton
          label="Preview"
          variant="outline"
          compact
          onPress={() => setPreviewOpen(true)}
          icon={<Eye size={15} color={ASSOC_COLORS.accentDark} strokeWidth={2.25} />}
        />
      </View>

      <FormFieldBuilderList
        fields={sortedQuestions.map((q) => ({
          id: q.id,
          label: q.questionTitle,
          fieldType: q.questionType,
          placeholder: q.placeholder,
          helpText: q.helpText,
          isRequired: q.isRequired,
          options: q.options,
          displayOrder: q.displayOrder,
        }))}
        fieldTypes={EDITOR_FIELD_TYPES}
        fieldTypeLabel={fieldTypeLabel}
        fieldUsesOptions={fieldUsesOptions}
        selection={selection}
        draft={draft}
        saving={saving}
        onSelect={setSelection}
        onDraftChange={setDraft}
        onSaveField={() => void saveField()}
        onDeleteField={(field) => {
          const question = sortedQuestions.find((q) => q.id === field.id);
          if (question) void removeQuestion(question);
        }}
        onMoveField={(field, direction) => {
          const question = sortedQuestions.find((q) => q.id === field.id);
          if (question) void moveQuestion(question, direction);
        }}
        onCancelEdit={() => setSelection(null)}
      />

      <RegistrationFormPreviewModal
        visible={previewOpen}
        form={previewForm}
        eventTitle={roleTitle}
        onClose={() => setPreviewOpen(false)}
      />
    </AssociationWorkspaceScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },
});
