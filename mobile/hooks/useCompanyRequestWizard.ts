import { router, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

import {
  createCompanyProjectRequest,
  getCompanyProjectRequest,
  getCompanyRequestDraft,
  saveCompanyRequestDraft,
  updateCompanyProjectRequest,
  type CompanyRequestType,
} from "@/api/companyApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  applyDetailToWizardState,
  buildSaveDraftPayload,
  canContinueWizard,
  emptyTeamRole,
  wizardStepValidationMessage,
  type WizardFormState,
  type WizardTeamRole,
} from "@/lib/companyRequestPayload";
import {
  getRequestLifecycleStatus,
  isRequestViewOnly,
} from "@/lib/companyRequestDisplay";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";

const INITIAL_TEAM_ROLES = [emptyTeamRole(), emptyTeamRole()];

type Options = {
  editRequestId?: number | null;
};

export function useCompanyRequestWizard(options: Options = {}) {
  const editRequestId = options.editRequestId ?? null;
  const isEdit = editRequestId != null && editRequestId > 0;

  const [step, setStep] = useState(0);
  const [type, setType] = useState<CompanyRequestType | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryChoice, setCategoryChoice] = useState("");
  const [categoryOther, setCategoryOther] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [individualSkills, setIndividualSkills] = useState<string[]>([]);
  const [teamRoles, setTeamRoles] = useState<WizardTeamRole[]>(INITIAL_TEAM_ROLES);
  const [durationOngoing, setDurationOngoing] = useState(false);
  const [durationValue, setDurationValue] = useState<number | "">("");
  const [durationUnit, setDurationUnit] = useState<WizardFormState["durationUnit"]>("");
  const [collaborationType, setCollaborationType] = useState("");
  const [scopeNotes, setScopeNotes] = useState("");

  const [draftLoading, setDraftLoading] = useState(true);
  const [draftUpdatedAt, setDraftUpdatedAt] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(false);
  const [savedRequestId, setSavedRequestId] = useState<number | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const formState = useCallback(
    (): WizardFormState => ({
      step,
      type,
      title,
      description,
      categoryChoice,
      categoryOther,
      targetRole,
      individualSkills,
      teamRoles,
      durationOngoing,
      durationValue,
      durationUnit,
      collaborationType,
      scopeNotes,
    }),
    [
      step,
      type,
      title,
      description,
      categoryChoice,
      categoryOther,
      targetRole,
      individualSkills,
      teamRoles,
      durationOngoing,
      durationValue,
      durationUnit,
      collaborationType,
      scopeNotes,
    ],
  );

  const applyWizardState = useCallback((partial: Partial<WizardFormState>) => {
    if (partial.step !== undefined) setStep(partial.step);
    if (partial.type !== undefined) setType(partial.type);
    if (partial.title !== undefined) setTitle(partial.title);
    if (partial.description !== undefined) setDescription(partial.description);
    if (partial.categoryChoice !== undefined) setCategoryChoice(partial.categoryChoice);
    if (partial.categoryOther !== undefined) setCategoryOther(partial.categoryOther);
    if (partial.targetRole !== undefined) setTargetRole(partial.targetRole);
    if (partial.individualSkills !== undefined) setIndividualSkills(partial.individualSkills);
    if (partial.teamRoles !== undefined) setTeamRoles(partial.teamRoles);
    if (partial.durationOngoing !== undefined) setDurationOngoing(partial.durationOngoing);
    if (partial.durationValue !== undefined) setDurationValue(partial.durationValue);
    if (partial.durationUnit !== undefined) setDurationUnit(partial.durationUnit);
    if (partial.collaborationType !== undefined) setCollaborationType(partial.collaborationType);
    if (partial.scopeNotes !== undefined) setScopeNotes(partial.scopeNotes);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      if (!cancelled) setDraftLoading(false);
    };

    setDraftLoading(true);
    setLoadError(null);

    if (isEdit && editRequestId) {
      getCompanyProjectRequest(editRequestId)
        .then((detail) => {
          if (cancelled) return;
          if (detail.status === "draft") {
            Alert.alert(
              "Draft request",
              "This request is still a draft. Continue from Create Request.",
            );
            router.replace(COMPANY_ROUTES.newRequest as Href);
            return;
          }
          if (isRequestViewOnly(getRequestLifecycleStatus(detail))) {
            Alert.alert(
              "Read-only request",
              "This request is read-only. Reactivate it before editing.",
            );
            router.replace(COMPANY_ROUTES.requestDetail(detail.id) as Href);
            return;
          }
          applyWizardState(applyDetailToWizardState(detail));
        })
        .catch((err) => {
          if (!cancelled) setLoadError(parseApiErrorMessage(err));
        })
        .finally(finish);
      return () => {
        cancelled = true;
      };
    }

    getCompanyRequestDraft()
      .then((draft) => {
        if (cancelled || !draft) return;
        applyWizardState(applyDetailToWizardState(draft));
        if (draft.updatedAt) setDraftUpdatedAt(draft.updatedAt);
        setDraftRestored(true);
      })
      .catch(() => {
        /* non-blocking */
      })
      .finally(finish);

    return () => {
      cancelled = true;
    };
  }, [applyWizardState, editRequestId, isEdit]);

  const canContinue = useMemo(() => canContinueWizard(formState()), [formState]);

  const goBack = useCallback(() => {
    setStepError(null);
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const goNext = useCallback(() => {
    const state = formState();
    if (!canContinueWizard(state)) {
      setStepError(wizardStepValidationMessage(state));
      return;
    }
    setStepError(null);
    setStep((s) => Math.min(4, s + 1));
  }, [formState]);

  const saveDraft = useCallback(async () => {
    if (isEdit) return;
    setSavingDraft(true);
    try {
      const saved = await saveCompanyRequestDraft(buildSaveDraftPayload(formState()));
      if (saved.updatedAt) setDraftUpdatedAt(saved.updatedAt);
      Alert.alert("Draft saved", "You can leave and continue later from Create Request.");
    } catch (err) {
      Alert.alert("Could not save draft", parseApiErrorMessage(err));
    } finally {
      setSavingDraft(false);
    }
  }, [formState, isEdit]);

  const submit = useCallback(async () => {
    if (!type) return;
    setSubmitting(true);
    try {
      const payload = buildSaveDraftPayload(formState());
      if (isEdit && editRequestId) {
        await updateCompanyProjectRequest(editRequestId, {
          ...payload,
          requestType: type,
        });
        setSavedRequestId(editRequestId);
        setCreated(true);
      } else {
        const createdRequest = await createCompanyProjectRequest({
          ...payload,
          requestType: type,
        });
        setSavedRequestId(createdRequest.id);
        setCreated(true);
      }
    } catch (err) {
      Alert.alert(
        isEdit ? "Could not update request" : "Could not create request",
        parseApiErrorMessage(err),
      );
    } finally {
      setSubmitting(false);
    }
  }, [editRequestId, formState, isEdit, type]);

  const rolesTakenByOthers = useCallback(
    (excludeId: string) =>
      teamRoles.filter((r) => r.id !== excludeId && r.roleName).map((r) => r.roleName),
    [teamRoles],
  );

  const addTeamRole = useCallback(() => {
    setTeamRoles((prev) => [...prev, emptyTeamRole()]);
  }, []);

  const removeTeamRole = useCallback((id: string) => {
    setTeamRoles((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }, []);

  const updateTeamRole = useCallback((id: string, patch: Partial<WizardTeamRole>) => {
    setTeamRoles((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  return {
    step,
    type,
    setType,
    title,
    setTitle,
    description,
    setDescription,
    categoryChoice,
    setCategoryChoice,
    categoryOther,
    setCategoryOther,
    targetRole,
    setTargetRole,
    individualSkills,
    setIndividualSkills,
    teamRoles,
    addTeamRole,
    removeTeamRole,
    updateTeamRole,
    rolesTakenByOthers,
    durationOngoing,
    setDurationOngoing,
    durationValue,
    setDurationValue,
    durationUnit,
    setDurationUnit,
    collaborationType,
    setCollaborationType,
    scopeNotes,
    setScopeNotes,
    draftLoading,
    draftUpdatedAt,
    draftRestored,
    savingDraft,
    submitting,
    created,
    savedRequestId,
    stepError,
    setStepError,
    canContinue,
    goBack,
    goNext,
    saveDraft,
    submit,
    isEdit,
    loadError,
  };
}
