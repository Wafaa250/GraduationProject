export type SearchRoleType =
  | "student"
  | "doctor"
  | "company"
  | "association"
  | "project"
  | "projectRequest"
  | "recruitment"
  | "event"
  | "opportunity"
  | string;

export type SearchRoleMeta = {
  label: string;
  badgeClass: string;
  avatarClass: string;
};

const META: Record<string, SearchRoleMeta> = {
  student: {
    label: "Student",
    badgeClass: "global-search__badge--student",
    avatarClass: "global-search__result-avatar--student",
  },
  doctor: {
    label: "Doctor",
    badgeClass: "global-search__badge--doctor",
    avatarClass: "global-search__result-avatar--doctor",
  },
  company: {
    label: "Company",
    badgeClass: "global-search__badge--company",
    avatarClass: "global-search__result-avatar--company",
  },
  association: {
    label: "Association",
    badgeClass: "global-search__badge--association",
    avatarClass: "global-search__result-avatar--association",
  },
  project: {
    label: "Project",
    badgeClass: "global-search__badge--project",
    avatarClass: "global-search__result-avatar--project",
  },
  projectRequest: {
    label: "Request",
    badgeClass: "global-search__badge--project-request",
    avatarClass: "global-search__result-avatar--project-request",
  },
  recruitment: {
    label: "Recruitment",
    badgeClass: "global-search__badge--recruitment",
    avatarClass: "global-search__result-avatar--recruitment",
  },
  event: {
    label: "Event",
    badgeClass: "global-search__badge--event",
    avatarClass: "global-search__result-avatar--event",
  },
  opportunity: {
    label: "Opportunity",
    badgeClass: "global-search__badge--opportunity",
    avatarClass: "global-search__result-avatar--opportunity",
  },
};

const GROUP_FALLBACK: Record<string, SearchRoleType> = {
  students: "student",
  doctors: "doctor",
  companies: "company",
  associations: "association",
  projects: "project",
  events: "event",
  opportunities: "opportunity",
};

const ENTITY_TYPE_ALIASES: Record<string, SearchRoleType> = {
  company_opportunity: "opportunity",
  association_event: "event",
  association_recruitment: "recruitment",
  doctor_project: "project",
  doctor_announcement: "doctor",
  student_collaboration: "project",
};

export function resolveSearchRole(roleType?: string | null, groupKey?: string): SearchRoleType {
  if (roleType && META[roleType]) return roleType;
  if (roleType && ENTITY_TYPE_ALIASES[roleType]) return ENTITY_TYPE_ALIASES[roleType];
  if (groupKey && GROUP_FALLBACK[groupKey]) return GROUP_FALLBACK[groupKey];
  return "student";
}

export function getSearchRoleMeta(roleType?: string | null, groupKey?: string): SearchRoleMeta {
  const role = resolveSearchRole(roleType, groupKey);
  return META[role] ?? META.student;
}
