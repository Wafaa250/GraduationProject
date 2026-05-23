import type { DoctorDashboardSummary, DoctorSupervisedProject } from "../../../../api/doctorDashboardApi";
import type { DashboardSummary, SuggestedTeammate } from "../../../../api/dashboardApi";
import type { DoctorMeResponse } from "../doctorDashboardTypes";

/** Parses GET /api/me for doctors (nested user + doctorProfile). */
export function normalizeDoctorMe(raw: unknown): DoctorMeResponse | null {
  if (raw == null || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const role = String(r.role ?? r.Role ?? "").toLowerCase();
  if (role !== "doctor") return null;

  const profileId = Number(r.profileId ?? r.ProfileId);
  if (!Number.isFinite(profileId)) return null;

  const user =
    r.user != null && typeof r.user === "object"
      ? (r.user as Record<string, unknown>)
      : r;
  const dp =
    r.doctorProfile != null && typeof r.doctorProfile === "object"
      ? (r.doctorProfile as Record<string, unknown>)
      : {};

  return {
    role: "doctor",
    profileId,
    userId: Number(r.userId ?? r.UserId ?? user.userId ?? user.UserId ?? 0),
    name: String(user.name ?? user.Name ?? r.name ?? r.Name ?? ""),
    email: String(user.email ?? user.Email ?? r.email ?? r.Email ?? ""),
    specialization:
      dp.specialization != null
        ? String(dp.specialization)
        : dp.Specialization != null
          ? String(dp.Specialization)
          : null,
    faculty: dp.faculty != null ? String(dp.faculty) : dp.Faculty != null ? String(dp.Faculty) : null,
    department:
      dp.department != null ? String(dp.department) : dp.Department != null ? String(dp.Department) : null,
  };
}

/** Backend supervised-projects use `description`; normalize for UI that prefers `abstract`. */
export function normalizeSupervisedProject(raw: unknown): DoctorSupervisedProject | null {
  if (raw == null || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const projectId = Number(r.projectId ?? r.ProjectId);
  if (!Number.isFinite(projectId)) return null;

  const name = String(r.name ?? r.Name ?? "").trim();
  const description =
    r.abstract != null
      ? String(r.abstract)
      : r.Abstract != null
        ? String(r.Abstract)
        : r.description != null
          ? String(r.description)
          : r.Description != null
            ? String(r.Description)
            : null;

  const ownerRaw = r.owner ?? r.Owner;
  const owner =
    ownerRaw != null && typeof ownerRaw === "object"
      ? {
          studentId: Number((ownerRaw as Record<string, unknown>).studentId ?? (ownerRaw as Record<string, unknown>).StudentId ?? 0),
          userId: Number((ownerRaw as Record<string, unknown>).userId ?? (ownerRaw as Record<string, unknown>).UserId ?? 0),
          name: String((ownerRaw as Record<string, unknown>).name ?? (ownerRaw as Record<string, unknown>).Name ?? ""),
          university: String((ownerRaw as Record<string, unknown>).university ?? (ownerRaw as Record<string, unknown>).University ?? ""),
          major: String((ownerRaw as Record<string, unknown>).major ?? (ownerRaw as Record<string, unknown>).Major ?? ""),
        }
      : { studentId: 0, userId: 0, name: "", university: "", major: "" };

  const skillsRaw = r.requiredSkills ?? r.RequiredSkills;
  const requiredSkills = Array.isArray(skillsRaw)
    ? skillsRaw.map((s) => String(s)).filter(Boolean)
    : [];

  const memberCount = Number(r.memberCount ?? r.MemberCount ?? 0);
  const partnersCount = Number(r.partnersCount ?? r.PartnersCount ?? 0);
  const isFullRaw = r.isFull ?? r.IsFull;
  const isFull =
    typeof isFullRaw === "boolean"
      ? isFullRaw
      : partnersCount > 0 && memberCount >= partnersCount;

  return {
    projectId,
    name: name || "Untitled project",
    abstract: description,
    description,
    requiredSkills,
    partnersCount,
    memberCount,
    isFull,
    owner,
    createdAt: String(r.createdAt ?? r.CreatedAt ?? ""),
  };
}

export function normalizeSupervisedProjectsList(data: unknown): DoctorSupervisedProject[] {
  if (!Array.isArray(data)) return [];
  return data.map(normalizeSupervisedProject).filter((p): p is DoctorSupervisedProject => p != null);
}

export function normalizeDoctorDashboardSummary(raw: unknown): DoctorDashboardSummary | null {
  if (raw == null || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return {
    pendingRequestsCount: Number(r.pendingRequestsCount ?? r.PendingRequestsCount ?? 0),
    supervisedCount: Number(r.supervisedCount ?? r.SupervisedCount ?? 0),
    pendingCancelCount: Number(r.pendingCancelCount ?? r.PendingCancelCount ?? 0),
  };
}

function normalizeSuggestedTeammate(raw: unknown): SuggestedTeammate | null {
  if (raw == null || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const userId = Number(t.userId ?? t.UserId);
  if (!Number.isFinite(userId)) return null;
  const skillsRaw = t.skills ?? t.Skills;
  return {
    userId,
    profileId: Number(t.profileId ?? t.ProfileId ?? 0),
    name: String(t.name ?? t.Name ?? ""),
    major: String(t.major ?? t.Major ?? ""),
    university: String(t.university ?? t.University ?? ""),
    academicYear: String(t.academicYear ?? t.AcademicYear ?? ""),
    profilePicture: (t.profilePicture ?? t.ProfilePicture ?? null) as string | null,
    skills: Array.isArray(skillsRaw) ? skillsRaw.map((s) => String(s)) : [],
    matchScore: Number(t.matchScore ?? t.MatchScore ?? 0),
  };
}

/** Parses GET /api/dashboard/summary for student or doctor (camelCase or PascalCase). */
export function normalizeDashboardSummary(raw: unknown): DashboardSummary | null {
  if (raw == null || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const teammatesRaw = r.suggestedTeammates ?? r.SuggestedTeammates;
  const suggestedTeammates = Array.isArray(teammatesRaw)
    ? teammatesRaw.map(normalizeSuggestedTeammate).filter((t): t is SuggestedTeammate => t != null)
    : [];

  const ps = r.profileStrength ?? r.ProfileStrength;
  const profileStrength =
    ps != null && typeof ps === "object"
      ? {
          score: Number((ps as Record<string, unknown>).score ?? (ps as Record<string, unknown>).Score ?? 0),
          hasProfilePicture: Boolean((ps as Record<string, unknown>).hasProfilePicture ?? (ps as Record<string, unknown>).HasProfilePicture),
          hasGeneralSkills: Boolean((ps as Record<string, unknown>).hasGeneralSkills ?? (ps as Record<string, unknown>).HasGeneralSkills),
          hasMajorSkills: Boolean((ps as Record<string, unknown>).hasMajorSkills ?? (ps as Record<string, unknown>).HasMajorSkills),
          hasBio: Boolean((ps as Record<string, unknown>).hasBio ?? (ps as Record<string, unknown>).HasBio),
          hasGpa: Boolean((ps as Record<string, unknown>).hasGpa ?? (ps as Record<string, unknown>).HasGpa),
        }
      : {
          score: 0,
          hasProfilePicture: false,
          hasGeneralSkills: false,
          hasMajorSkills: false,
          hasBio: false,
          hasGpa: false,
        };

  return {
    name: String(r.name ?? r.Name ?? ""),
    major: String(r.major ?? r.Major ?? ""),
    university: String(r.university ?? r.University ?? ""),
    academicYear: String(r.academicYear ?? r.AcademicYear ?? ""),
    totalSkills: Number(r.totalSkills ?? r.TotalSkills ?? 0),
    profileStrength,
    suggestedTeammates,
    myProject: null,
    suggestedTeammatesCount: Number(r.suggestedTeammatesCount ?? r.SuggestedTeammatesCount ?? suggestedTeammates.length),
    matchedGraduationProjectsCount: Number(
      r.matchedGraduationProjectsCount ?? r.MatchedGraduationProjectsCount ?? 0,
    ),
    bestTeammateMatchPercent:
      r.bestTeammateMatchPercent != null || r.BestTeammateMatchPercent != null
        ? Number(r.bestTeammateMatchPercent ?? r.BestTeammateMatchPercent)
        : null,
    pendingTeamInvitationsCount: Number(
      r.pendingTeamInvitationsCount ?? r.PendingTeamInvitationsCount ?? 0,
    ),
  };
}
