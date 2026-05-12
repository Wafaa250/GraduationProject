import type { CourseStudent } from "@/api/studentCoursesApi";
import type { PartnerRequest, PartnerRequestsResponse } from "@/api/studentCoursesApi";
import type { TeamMember } from "@/api/studentCoursesApi";

export function normApiStatus(s?: string | null): string {
  return s?.toString().trim().toLowerCase() ?? "";
}

export function ctAsRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function ctReadTextField(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const raw = obj[key];
    if (typeof raw === "string" && raw.trim() !== "") return raw;
  }
  return "—";
}

export function ctReadNumberField(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const raw = obj[key];
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string" && raw.trim() !== "") {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

export function ctReadOptionalLink(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const raw = obj[key];
    if (typeof raw === "string" && raw.trim() !== "") return raw;
  }
  return null;
}

export function ctMemberDisplayName(member: TeamMember): string {
  if (member.name && member.name.trim() !== "") return member.name;
  return member.universityId;
}

export function ctCourseStudentDbId(s: CourseStudent): number | null {
  const v = s.studentId ?? s.StudentId;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function ctCourseStudentUserId(s: CourseStudent): number | null {
  const v = s.userId ?? s.UserId;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function ctPartnerRequestReceiverDbId(r: PartnerRequest): number | null {
  if (typeof r.receiverStudentId === "number" && Number.isFinite(r.receiverStudentId)) {
    return r.receiverStudentId;
  }
  if (r.receiver) return ctCourseStudentDbId(r.receiver);
  return null;
}

export function ctIsOutgoingPendingPartnerRequest(r: PartnerRequest): boolean {
  const st = normApiStatus(r.status);
  return st === "pending" || st === "";
}

export function ctPartnerRequestStatusRaw(req: PartnerRequest): string {
  const raw = req.status ?? (req as PartnerRequest & { Status?: string }).Status;
  return typeof raw === "string" ? raw : "";
}

export function ctIsIncomingPartnerRequestPending(req: PartnerRequest): boolean {
  return normApiStatus(ctPartnerRequestStatusRaw(req)) === "pending";
}

export function ctPartnerRequestRowId(req: PartnerRequest): number | null {
  const id = req.requestId ?? (req as PartnerRequest & { RequestId?: number }).RequestId;
  return typeof id === "number" && Number.isFinite(id) ? id : null;
}

export function ctStripIncomingPartnerRequestById(
  prev: PartnerRequestsResponse | null,
  requestId: number,
): PartnerRequestsResponse | null {
  if (!prev) return prev;
  return {
    ...prev,
    incoming: prev.incoming.filter((r) => ctPartnerRequestRowId(r) !== requestId),
  };
}

export function ctIncomingSenderRow(sender: CourseStudent | undefined): {
  name: string;
  university: string;
  major: string | null;
  pic: string | null;
} {
  if (!sender) {
    return { name: "—", university: "—", major: null, pic: null };
  }
  const majRaw = (sender.major ?? sender.Major ?? "").trim();
  return {
    name: sender.name ?? sender.Name ?? "—",
    university: sender.university ?? sender.University ?? "—",
    major: majRaw === "" ? null : majRaw,
    pic: sender.profilePicture ?? sender.ProfilePictureBase64 ?? null,
  };
}
