/** GET /api/dashboard/* DTOs */

export interface ProfileStrength {
  score: number
  hasProfilePicture: boolean
  hasGeneralSkills: boolean
  hasMajorSkills: boolean
  hasBio: boolean
  hasGpa: boolean
}

export interface SuggestedTeammate {
  userId: number
  profileId: number
  name: string
  major: string
  university: string
  academicYear: string
  profilePicture: string | null
  skills: string[]
  matchScore: number
}

export interface DashboardProject {
  projectId: number
  projectName: string
  role: 'owner' | 'member' | string
  memberCount: number
  maxTeamSize: number
  isFull: boolean
}

export interface DashboardSummary {
  name: string
  major: string
  university: string
  academicYear: string
  totalSkills: number
  profileStrength: ProfileStrength
  suggestedTeammates: SuggestedTeammate[]
  myProject: DashboardProject | null
  suggestedTeammatesCount: number
  matchedGraduationProjectsCount: number
  bestTeammateMatchPercent: number | null
  pendingTeamInvitationsCount: number
}
