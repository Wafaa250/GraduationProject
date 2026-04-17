const STORAGE_KEY = "doctorDashboard.deletedProjects.v1";

export type DeletedProjectRecord = {
  projectId: number;
  name: string;
  removedAt: string;
  /** How it was recorded (UI simulation only; stored on device). */
  source?: "resign" | "remove";
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
        typeof (x as DeletedProjectRecord).removedAt === "string" &&
        ((x as DeletedProjectRecord).source === undefined ||
          (x as DeletedProjectRecord).source === "resign" ||
          (x as DeletedProjectRecord).source === "remove"),
    );
  } catch {
    return [];
  }
}

export function loadDeletedProjects(): DeletedProjectRecord[] {
  if (typeof localStorage === "undefined") return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

/** IDs the doctor removed locally — used to reconcile stale supervised-project API responses. */
export function getDeletedProjectIdsSet(): Set<number> {
  return new Set(loadDeletedProjects().map((p) => p.projectId));
}

export function saveDeletedProjects(records: DeletedProjectRecord[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

/**
 * Persists a removed project. If the same projectId already exists, returns the previous list unchanged (no duplicates).
 */
export function appendDeletedProject(record: DeletedProjectRecord): DeletedProjectRecord[] {
  const prev = loadDeletedProjects();
  if (prev.some((p) => p.projectId === record.projectId)) {
    return prev;
  }
  const entry: DeletedProjectRecord = {
    ...record,
    removedAt: record.removedAt || new Date().toISOString(),
  };
  const next = [entry, ...prev];
  saveDeletedProjects(next);
  return next;
}
