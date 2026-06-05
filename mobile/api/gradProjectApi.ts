import api from "@/api/axiosInstance";

export type GradProject = {
  id: number;
  ownerId: number;
  ownerName?: string;
  name: string;
  abstract?: string | null;
  description?: string | null;
  projectType?: "GP1" | "GP2" | "GP";
  projectTypeLabel?: string;
  ownerFaculty?: string | null;
  ownerMajor?: string | null;
  partnersCount: number;
  currentMembers: number;
  requiredSkills?: string[];
};

function parseGraduationProjectsMyPayload(raw: unknown): {
  role: "owner" | "member" | null;
  project: GradProject | null;
} {
  const root =
    raw !== null &&
    typeof raw === "object" &&
    "data" in raw &&
    (raw as { data?: unknown }).data !== undefined
      ? (raw as { data: unknown }).data
      : raw;

  if (root === null || typeof root !== "object") {
    return { role: null, project: null };
  }

  const d = root as {
    project?: GradProject | null;
    Project?: GradProject | null;
    role?: string | null;
    Role?: string | null;
  };

  const project = d.project ?? d.Project ?? null;
  const roleRaw = d.role ?? d.Role;
  const role = roleRaw === "owner" || roleRaw === "member" ? roleRaw : null;

  return { role, project };
}

export async function getGraduationProjectsMyEnvelope(): Promise<{
  role: "owner" | "member" | null;
  project: GradProject | null;
}> {
  const { data } = await api.get("/graduation-projects/my");
  return parseGraduationProjectsMyPayload(data);
}
