import type { GradProject, GradProjectMember, GraduationProjectType } from './gradProjectApi'

function asRecord(raw: unknown): Record<string, unknown> | null {
  if (raw == null || typeof raw !== 'object') return null
  return raw as Record<string, unknown>
}

function pickNum(r: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const v = r[k]
    if (v != null && v !== '') {
      const n = Number(v)
      if (Number.isFinite(n)) return n
    }
  }
  return 0
}

function pickStr(r: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = r[k]
    if (v != null && String(v).trim()) return String(v).trim()
  }
  return ''
}

function pickBool(r: Record<string, unknown>, ...keys: string[]): boolean {
  for (const k of keys) {
    const v = r[k]
    if (typeof v === 'boolean') return v
  }
  return false
}

function parseStringList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean)
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        return parsed.map((x) => String(x).trim()).filter(Boolean)
      }
    } catch {
      return raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }
  return []
}

function normalizeMember(raw: unknown): GradProjectMember | null {
  const r = asRecord(raw)
  if (!r) return null
  const studentId = pickNum(r, 'studentId', 'StudentId')
  if (studentId <= 0) return null
  const roleRaw = pickStr(r, 'role', 'Role').toLowerCase()
  return {
    studentId,
    userId: pickNum(r, 'userId', 'UserId'),
    name: pickStr(r, 'name', 'Name') || `Student #${studentId}`,
    email: pickStr(r, 'email', 'Email') || undefined,
    university: pickStr(r, 'university', 'University') || undefined,
    major: pickStr(r, 'major', 'Major') || undefined,
    profilePicture:
      (r.profilePicture ?? r.ProfilePicture ?? null) as string | null | undefined,
    role: roleRaw === 'leader' ? 'leader' : 'member',
    joinedAt: pickStr(r, 'joinedAt', 'JoinedAt') || undefined,
  }
}

/** Maps API JSON (camelCase or PascalCase) to {@link GradProject}. */
export function normalizeGradProject(raw: unknown): GradProject {
  const r = asRecord(raw)
  if (!r) {
    return {
      id: 0,
      ownerId: 0,
      name: '',
      partnersCount: 0,
      currentMembers: 0,
      isFull: false,
      members: [],
    }
  }

  const projectTypeRaw = pickStr(r, 'projectType', 'ProjectType')
  const projectType = (['GP1', 'GP2', 'GP'] as const).includes(
    projectTypeRaw as GraduationProjectType,
  )
    ? (projectTypeRaw as GraduationProjectType)
    : undefined

  const supRaw = asRecord(r.supervisor ?? r.Supervisor)
  const supervisor = supRaw
    ? {
        doctorId: pickNum(supRaw, 'doctorId', 'DoctorId'),
        userId: pickNum(supRaw, 'userId', 'UserId'),
        name: pickStr(supRaw, 'name', 'Name'),
        specialization: pickStr(supRaw, 'specialization', 'Specialization'),
        department:
          (supRaw.department ?? supRaw.Department ?? null) as string | null | undefined,
      }
    : null

  const membersRaw = r.members ?? r.Members
  const members = Array.isArray(membersRaw)
    ? membersRaw
        .map(normalizeMember)
        .filter((m): m is GradProjectMember => m != null)
    : []

  const id = pickNum(r, 'id', 'Id')
  const partnersCount = pickNum(r, 'partnersCount', 'PartnersCount')
  const currentMembers = pickNum(r, 'currentMembers', 'CurrentMembers') || members.length

  return {
    id,
    ownerId: pickNum(r, 'ownerId', 'OwnerId'),
    ownerUserId: pickNum(r, 'ownerUserId', 'OwnerUserId') || undefined,
    ownerName: pickStr(r, 'ownerName', 'OwnerName') || undefined,
    name: pickStr(r, 'name', 'Name'),
    abstract: (r.abstract ?? r.Abstract ?? null) as string | null | undefined,
    description: (r.description ?? r.Description ?? null) as string | null | undefined,
    projectType,
    partnersCount,
    currentMembers,
    isFull: pickBool(r, 'isFull', 'IsFull') || currentMembers >= partnersCount,
    isOwner: pickBool(r, 'isOwner', 'IsOwner') || undefined,
    remainingSeats:
      pickNum(r, 'remainingSeats', 'RemainingSeats') ||
      Math.max(0, partnersCount - currentMembers),
    requiredSkills: parseStringList(r.requiredSkills ?? r.RequiredSkills),
    members,
    createdAt: pickStr(r, 'createdAt', 'CreatedAt') || undefined,
    updatedAt: pickStr(r, 'updatedAt', 'UpdatedAt') || undefined,
    supervisor,
  }
}
