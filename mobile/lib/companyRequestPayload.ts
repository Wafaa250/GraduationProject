import type {
  CompanyProjectRequestDetail,
  CompanyRequestRoleInput,
  SaveCompanyRequestDraftPayload,
} from "@/api/companyApi";
import type { DurationUnit } from "@/lib/companyRequestCatalog";

export type WizardTeamRole = {
  id: string;
  roleName: string;
  skills: string[];
  notes?: string;
};

export type WizardFormState = {
  step: number;
  type: "individual" | "ai-built-team" | null;
  title: string;
  description: string;
  categoryChoice: string;
  categoryOther: string;
  targetRole: string;
  individualSkills: string[];
  teamRoles: WizardTeamRole[];
  durationOngoing: boolean;
  durationValue: number | "";
  durationUnit: DurationUnit | "";
  collaborationType: string;
  scopeNotes: string;
};

export function buildSaveDraftPayload(state: WizardFormState): SaveCompanyRequestDraftPayload {
  const roles = buildRolesPayload(state);
  return {
    wizardStep: state.step,
    requestType: state.type,
    title: state.title,
    description: state.description,
    categoryChoice: state.categoryChoice,
    categoryOther: state.categoryOther,
    targetRole: state.type === "individual" ? state.targetRole : undefined,
    requiredSkills: state.type === "individual" ? state.individualSkills : [],
    roles,
    durationOngoing: state.durationOngoing,
    durationValue:
      state.durationOngoing || state.durationValue === "" ? null : state.durationValue,
    durationUnit: state.durationOngoing || !state.durationUnit ? null : state.durationUnit,
    collaborationType: state.collaborationType,
    scopeNotes: state.scopeNotes.trim() || null,
  };
}

function buildRolesPayload(state: WizardFormState): CompanyRequestRoleInput[] {
  if (state.type === "ai-built-team") {
    return state.teamRoles.map((r, i) => ({
      clientRoleKey: r.id,
      roleName: r.roleName,
      skills: r.skills,
      notes: r.notes?.trim() || null,
      sortOrder: i,
    }));
  }
  return [];
}

export function applyDetailToWizardState(
  detail: CompanyProjectRequestDetail,
): Partial<WizardFormState> {
  const requestType =
    detail.requestType === "individual" || detail.requestType === "ai-built-team"
      ? detail.requestType
      : null;

  const base: Partial<WizardFormState> = {
    step: detail.wizardStep ?? 0,
    type: requestType,
    title: detail.title,
    description: detail.description,
    categoryChoice: detail.categoryChoice ?? "",
    categoryOther: detail.categoryOther ?? "",
    durationOngoing: detail.durationOngoing ?? false,
    durationValue: detail.durationValue ?? "",
    durationUnit: (detail.durationUnit as DurationUnit) ?? "",
    collaborationType: detail.collaborationType ?? "",
    scopeNotes: detail.scopeNotes ?? "",
  };

  if (requestType === "individual" && detail.roles.length > 0) {
    const role = detail.roles[0];
    return {
      ...base,
      targetRole: role.roleName,
      individualSkills: role.skills.map((s) => s.skillName),
      teamRoles: [emptyTeamRole(), emptyTeamRole()],
    };
  }

  if (requestType === "ai-built-team") {
    const teamRoles =
      detail.roles.length > 0
        ? detail.roles.map((r) => ({
            id: r.clientRoleKey ?? `role-${r.id}`,
            roleName: r.roleName,
            skills: r.skills.map((s) => s.skillName),
            notes: r.notes ?? "",
          }))
        : [emptyTeamRole(), emptyTeamRole()];
    return { ...base, teamRoles };
  }

  return base;
}

export function emptyTeamRole(): WizardTeamRole {
  return {
    id: `role-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    roleName: "",
    skills: [],
    notes: "",
  };
}

export function canContinueWizard(state: WizardFormState): boolean {
  if (state.step === 0) return state.type !== null;
  if (state.step === 1) {
    const hasCategory =
      state.categoryChoice.length > 0 &&
      (state.categoryChoice !== "Other" || state.categoryOther.trim().length > 0);
    return state.title.trim().length > 0 && state.description.trim().length > 0 && hasCategory;
  }
  if (state.step === 2) {
    if (state.type === "individual") {
      return state.targetRole.trim().length > 0 && state.individualSkills.length > 0;
    }
    if (state.type === "ai-built-team") {
      return (
        state.teamRoles.length > 0 &&
        state.teamRoles.every((r) => r.roleName.trim().length > 0 && r.skills.length > 0)
      );
    }
  }
  if (state.step === 3) {
    const durationOk =
      state.durationOngoing ||
      (typeof state.durationValue === "number" && state.durationValue >= 1 && state.durationUnit.length > 0);
    return durationOk && state.collaborationType.length > 0;
  }
  return true;
}

export function wizardStepValidationMessage(state: WizardFormState): string | null {
  if (state.step === 0 && !state.type) return "Select a request type to continue.";
  if (state.step === 1) {
    if (!state.title.trim()) return "Project title is required.";
    if (!state.description.trim()) return "Description is required.";
    if (!state.categoryChoice) return "Category is required.";
    if (state.categoryChoice === "Other" && !state.categoryOther.trim()) {
      return "Custom category is required when Other is selected.";
    }
  }
  if (state.step === 2) {
    if (state.type === "individual") {
      if (!state.targetRole.trim()) return "Role is required.";
      if (state.individualSkills.length === 0) return "Select at least one skill.";
    }
    if (state.type === "ai-built-team") {
      const incomplete = state.teamRoles.find(
        (r) => !r.roleName.trim() || r.skills.length === 0,
      );
      if (incomplete) return "Each role needs a name and at least one skill.";
    }
  }
  if (state.step === 3) {
    if (!state.collaborationType) return "Collaboration format is required.";
    if (
      !state.durationOngoing &&
      (typeof state.durationValue !== "number" || state.durationValue < 1 || !state.durationUnit)
    ) {
      return "Set duration or choose ongoing collaboration.";
    }
  }
  return null;
}
