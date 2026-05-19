import { useQuery } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'

import {
  fetchLandingInsights,
  type LandingInsightOpportunity,
  type LandingInsightProject,
  type LandingInsights,
} from '../../../api/landingInsightsApi'
import { Skeleton } from '../ui/skeleton'

type PreviewMatchCard = {
  id: string
  score: number
  name: string
  role: string
  reason: string
}

const FALLBACK_MATCHES: PreviewMatchCard[] = [
  { id: 'fb-1', score: 96, name: 'Layla Hassan', role: 'Frontend', reason: 'Covers UI/UX gap' },
  { id: 'fb-2', score: 92, name: 'Omar Khalid', role: 'NLP Engineer', reason: 'Published NLP paper' },
  {
    id: 'fb-3',
    score: 88,
    name: 'Dr. Reem Al-Saadi',
    role: 'Supervisor',
    reason: 'EdTech research overlap',
  },
]

function useHasSession() {
  return Boolean(localStorage.getItem('token')?.trim())
}

function initials(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function truncate(text: string, max: number) {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1).trim()}…`
}

function stableScore(seed: number, base = 86) {
  return Math.min(97, base + (Math.abs(seed) % 11))
}

function projectCard(project: LandingInsightProject): PreviewMatchCard {
  const skill = project.skills[0]?.trim()
  const reason = skill
    ? `Strong fit for ${skill}`
    : `${project.openSeats} open seat${project.openSeats === 1 ? '' : 's'} on campus`

  return {
    id: `project-${project.id}`,
    score: stableScore(project.id, 88),
    name: truncate(project.name, 42),
    role: project.projectType?.trim() || skill || 'Recruiting project',
    reason,
  }
}

function opportunityCard(opportunity: LandingInsightOpportunity): PreviewMatchCard {
  const reason =
    opportunity.openPositionsCount > 0
      ? 'Roles align with campus talent pool'
      : 'Recommended campus opportunity'

  return {
    id: `opp-${opportunity.id}`,
    score: stableScore(opportunity.id, 87),
    name: truncate(opportunity.title, 42),
    role: truncate(opportunity.organizationName, 36),
    reason,
  }
}

function insightsToCards(data: LandingInsights): PreviewMatchCard[] {
  const cards: PreviewMatchCard[] = []

  for (const project of data.projects) {
    if (cards.length >= 3) break
    cards.push(projectCard(project))
  }

  for (const opportunity of data.opportunities) {
    if (cards.length >= 3) break
    cards.push(opportunityCard(opportunity))
  }

  for (const fallback of FALLBACK_MATCHES) {
    if (cards.length >= 3) break
    cards.push(fallback)
  }

  return cards.slice(0, 3)
}

function resolveCards(data: LandingInsights | null | undefined): PreviewMatchCard[] {
  if (data && (data.projects.length > 0 || data.opportunities.length > 0)) {
    return insightsToCards(data)
  }
  return FALLBACK_MATCHES
}

function MatchPreviewCard({ card }: { card: PreviewMatchCard }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
          {initials(card.name)}
        </div>
        <span className="shrink-0 rounded-full bg-ai-soft px-2 py-0.5 text-[11px] font-bold text-ai">
          {card.score}%
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold leading-snug">{card.name}</p>
      <p className="text-xs text-muted-foreground">{card.role}</p>
      <p className="mt-2 border-t border-border pt-2 text-[11px] leading-snug text-ai">
        <Sparkles className="mr-1 inline h-3 w-3" aria-hidden />
        {card.reason}
      </p>
    </article>
  )
}

function PreviewSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
          <Skeleton className="mt-3 h-8 w-full rounded-md" />
        </div>
      ))}
    </div>
  )
}

/** Lovable-style AI match preview — 3 compact cards; live data mapped when signed in. */
export function LandingInsightsPreview() {
  const hasSession = useHasSession()

  const { data, isLoading, isFetched } = useQuery({
    queryKey: ['landing-insights'],
    queryFn: fetchLandingInsights,
    enabled: hasSession,
    staleTime: 60_000,
    retry: false,
  })

  if (hasSession && (isLoading || !isFetched)) {
    return <PreviewSkeleton />
  }

  const cards = resolveCards(data ?? null)

  return (
    <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
      {cards.map((card) => (
        <MatchPreviewCard key={card.id} card={card} />
      ))}
    </div>
  )
}
