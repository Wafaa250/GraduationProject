import api from './axiosInstance'
import type { GradProject } from './gradProjectApi'
import { listPublicOrganizations, type PublicOrganizationListItem } from './organizationsApi'
import {
  listPublicRecruitmentCampaigns,
  type PublicRecruitmentCampaignSummary,
} from './recruitmentCampaignsApi'

export type LandingInsightProject = {
  id: number
  name: string
  openSeats: number
  skills: string[]
  projectType?: string
}

export type LandingInsightOpportunity = {
  id: number
  organizationId: number
  title: string
  organizationName: string
  openPositionsCount: number
}

export type LandingInsights = {
  projects: LandingInsightProject[]
  opportunities: LandingInsightOpportunity[]
  trendingSkills: string[]
  stats: {
    recruitingProjects: number
    campusOrganizations: number
    liveCampaigns: number
  }
}

const MAX_ORGS_FOR_CAMPAIGNS = 6
const MAX_CAMPAIGNS = 4
const MAX_PROJECTS = 3
const MAX_SKILLS = 6

function hasAuthToken(): boolean {
  return Boolean(localStorage.getItem('token')?.trim())
}

function openSeats(project: GradProject): number {
  if (typeof project.remainingSeats === 'number') return Math.max(0, project.remainingSeats)
  return Math.max(0, project.partnersCount - project.currentMembers)
}

function collectTrendingSkills(projects: GradProject[], opportunities: LandingInsightOpportunity[]): string[] {
  const counts = new Map<string, number>()

  for (const project of projects) {
    for (const skill of project.requiredSkills ?? []) {
      const key = skill.trim()
      if (!key) continue
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_SKILLS)
    .map(([skill]) => skill)
}

async function loadOpportunities(organizations: PublicOrganizationListItem[]): Promise<{
  opportunities: LandingInsightOpportunity[]
  totalCampaigns: number
}> {
  const slice = organizations.slice(0, MAX_ORGS_FOR_CAMPAIGNS)
  const batches = await Promise.all(
    slice.map(async (org) => {
      try {
        const campaigns = await listPublicRecruitmentCampaigns(org.id)
        return campaigns.map((c) => ({ campaign: c, org }))
      } catch {
        return [] as { campaign: PublicRecruitmentCampaignSummary; org: PublicOrganizationListItem }[]
      }
    }),
  )

  const sorted = batches
    .flat()
    .sort((a, b) => {
      const da = new Date(a.campaign.applicationDeadline).getTime()
      const db = new Date(b.campaign.applicationDeadline).getTime()
      return (Number.isNaN(db) ? 0 : db) - (Number.isNaN(da) ? 0 : da)
    })

  return {
    totalCampaigns: sorted.length,
    opportunities: sorted.slice(0, MAX_CAMPAIGNS).map(({ campaign, org }) => ({
      id: campaign.id,
      organizationId: org.id,
      title: campaign.title,
      organizationName: org.name,
      openPositionsCount: campaign.openPositionsCount,
    })),
  }
}

/**
 * Loads lightweight campus insights from existing APIs when the user has a session.
 * Returns null for guests or on failure — UI should show an abstract preview instead.
 */
export async function fetchLandingInsights(): Promise<LandingInsights | null> {
  if (!hasAuthToken()) return null

  try {
    const [projectsRes, organizations] = await Promise.all([
      api.get<GradProject[]>('/graduation-projects'),
      listPublicOrganizations().catch(() => [] as PublicOrganizationListItem[]),
    ])

    const allProjects = Array.isArray(projectsRes.data) ? projectsRes.data : []
    const recruiting = allProjects.filter((p) => !p.isFull && openSeats(p) > 0)

    const projects: LandingInsightProject[] = recruiting.slice(0, MAX_PROJECTS).map((p) => ({
      id: p.id,
      name: p.name,
      openSeats: openSeats(p),
      skills: (p.requiredSkills ?? []).slice(0, 4),
      projectType: p.projectType,
    }))

    const { opportunities, totalCampaigns } = await loadOpportunities(organizations)
    const trendingSkills = collectTrendingSkills(allProjects, opportunities)

    return {
      projects,
      opportunities,
      trendingSkills,
      stats: {
        recruitingProjects: recruiting.length,
        campusOrganizations: organizations.length,
        liveCampaigns: totalCampaigns,
      },
    }
  } catch {
    return null
  }
}
