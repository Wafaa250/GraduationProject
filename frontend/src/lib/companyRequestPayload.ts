import type {
  CompanyProjectRequestDetail,
  CompanyRequestRoleInput,
  SaveCompanyRequestDraftPayload,
} from "@/api/companyApi";
import type { DurationUnit } from "@/constants/companyRequestCatalog";

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
    durationOngoing: detail.durationOngoing,
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
