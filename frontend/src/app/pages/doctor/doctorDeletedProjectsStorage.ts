const STORAGE_KEY = "doctorDashboard.deletedProjects.v1";

export type DeletedProjectRecord = {
  projectId: number;
  name: string;
  removedAt: string;
  /** How it was recorded (local-only; not from any API). */
  source?: "resign" | "remove_supervision";
};

function safeParse(raw: string | null): DeletedProjectRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is DeletedProjectRecord => {
      if (x == null || typeof x !== "object") return false;
      const r = x as DeletedProjectRecord;
      if (typeof r.projectId !== "number" || typeof r.name !== "string" || typeof r.removedAt !== "string") {
        return false;
      }
      if (r.source != null && r.source !== "resign" && r.source !== "remove_supervision") return false;
      return true;
    });
  } catch {
    return [];
  }
}

export function loadDeletedProjects(): DeletedProjectRecord[] {
  if (typeof localStorage === "undefined") return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function saveDeletedProjects(records: DeletedProjectRecord[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function appendDeletedProject(record: DeletedProjectRecord): DeletedProjectRecord[] {
  const prev = loadDeletedProjects();
  const withoutDup = prev.filter((p) => p.projectId !== record.projectId);
  const next = [record, ...withoutDup];
  saveDeletedProjects(next);
  return next;
}
