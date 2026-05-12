/** Ported from web `AiSupervisorRecommendations` (logic only, no DOM). */

export type AiSupervisorRecommendUiState = "idle" | "loading" | "success" | "empty" | "error";

export interface EnrichedAiSupervisorRow {
  doctorId: number;
  matchScore: number;
  reason: string;
  name: string | null;
  specialization: string | null;
}

export type AiSupervisorCardRequestPhase =
  | "idle"
  | "sending"
  | "requested"
  | "error"
  | "unavailable";

export interface AiSupervisorCardRequestState {
  phase: AiSupervisorCardRequestPhase;
  detail?: string;
}

export interface AiSupervisionSnapshot {
  hasAssignedSupervisor: boolean;
  requestStatusNorm: string;
  pendingDoctorId: number | null;
}

export function mergeAiSupervisorCardRequestState(
  doctorId: number,
  snapshot: AiSupervisionSnapshot,
  local: AiSupervisorCardRequestState | undefined,
): AiSupervisorCardRequestState {
  if (snapshot.hasAssignedSupervisor) {
    return {
      phase: "unavailable",
      detail: "A supervisor is already assigned to this project.",
    };
  }

  if (snapshot.requestStatusNorm === "pending" && snapshot.pendingDoctorId != null) {
    if (snapshot.pendingDoctorId === doctorId) {
      return {
        phase: "requested",
        detail: "Request pending — awaiting supervisor approval.",
      };
    }
    return {
      phase: "unavailable",
      detail: "Another supervisor request is already pending.",
    };
  }

  if (local?.phase === "sending") {
    return { phase: "sending", detail: local.detail };
  }
  if (local?.phase === "error") {
    return { phase: "error", detail: local.detail };
  }
  if (local?.phase === "requested") {
    return { phase: "requested", detail: local.detail };
  }

  return { phase: "idle" };
}

function normalizeMatchScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  if (score > 0 && score <= 1) return Math.round(score * 100);
  return Math.round(Math.min(100, Math.max(0, score)));
}

export function enrichAiSupervisorsWithRecommended(
  aiRows: { doctorId: number; matchScore: number; reason: string }[],
  recommended: { doctorId: number; name: string; specialization: string | null }[],
): EnrichedAiSupervisorRow[] {
  const map = new Map(recommended.map((s) => [s.doctorId, s]));
  const sorted = [...aiRows].sort((a, b) => b.matchScore - a.matchScore);
  return sorted.map((row) => {
    const r = map.get(row.doctorId);
    return {
      doctorId: row.doctorId,
      matchScore: normalizeMatchScore(row.matchScore),
      reason: row.reason ?? "",
      name: r?.name?.trim() ? r.name.trim() : null,
      specialization: r?.specialization?.trim() ? r.specialization.trim() : null,
    };
  });
}
