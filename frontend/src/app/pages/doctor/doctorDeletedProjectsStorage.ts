const STORAGE_KEY = "doctorDashboard.deletedProjects.v1";

export type DeletedProjectRecord = {
  projectId: number;
  name: string;
  removedAt: string;
};

function safeParse(raw: string | null): DeletedProjectRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is DeletedProjectRecord =>
        x != null &&
        typeof x === "object" &&
        typeof (x as DeletedProjectRecord).projectId === "number" &&
        typeof (x as DeletedProjectRecord).name === "string" &&
        typeof (x as DeletedProjectRecord).removedAt === "string",
    );
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
