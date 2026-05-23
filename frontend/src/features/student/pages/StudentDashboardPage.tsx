import {
  FolderKanban,
  Mail,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { sectionTitleLgClass } from '@/shared/styles/typography'
import { surfaceCardClass } from '@/shared/styles/layout'
import { cn } from '@/shared/lib/cn'
import { useDashboardSummary } from '../hooks/useDashboardSummary'
import { DashboardStatCard } from '../components/dashboard/DashboardStatCard'
import { DashboardWelcome } from '../components/dashboard/DashboardWelcome'
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton'
import { ProfileStrengthPanel } from '../components/dashboard/ProfileStrengthPanel'
import { ProjectStatusPanel } from '../components/dashboard/ProjectStatusPanel'
import { TeammateSuggestionCard } from '../components/dashboard/TeammateSuggestionCard'

export function StudentDashboardPage() {
  const { data, isLoading, error, refresh } = useDashboardSummary()

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error || !data) {
    return (
      <div
        className={cn(
          surfaceCardClass,
          'flex flex-col items-center justify-center px-6 py-16 text-center',
        )}
      >
        <p className="text-sm font-medium text-foreground">Couldn&apos;t load your dashboard</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {error ?? 'Something went wrong. Check your connection and try again.'}
        </p>
        <Button type="button" className="mt-6" onClick={() => void refresh()}>
          Try again
        </Button>
      </div>
    )
  }

  const bestMatch =
    data.bestTeammateMatchPercent != null ? `${data.bestTeammateMatchPercent}%` : '—'

  return (
    <div className="space-y-6 pb-8 sm:space-y-8">
      <DashboardWelcome summary={data} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Profile strength"
          value={`${data.profileStrength.score}%`}
          hint={
            data.profileStrength.score >= 80
              ? 'Looking great'
              : 'Complete your profile to improve matches'
          }
          icon={TrendingUp}
          accent="primary"
        />
        <DashboardStatCard
          label="Pending invitations"
          value={String(data.pendingTeamInvitationsCount)}
          hint={
            data.pendingTeamInvitationsCount > 0
              ? 'Graduation & course invites'
              : 'Nothing waiting on you'
          }
          icon={Mail}
          accent="amber"
        />
        <DashboardStatCard
          label="Matching projects"
          value={String(data.matchedGraduationProjectsCount)}
          hint="Open teams that fit your skills"
          icon={FolderKanban}
          accent="emerald"
        />
        <DashboardStatCard
          label="Best teammate match"
          value={bestMatch}
          hint={
            data.suggestedTeammatesCount > 0
              ? `${data.suggestedTeammatesCount} suggestions ready`
              : 'Add skills to unlock matches'
          }
          icon={Target}
          accent="violet"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProjectStatusPanel
          project={data.myProject}
          matchedProjectsCount={data.matchedGraduationProjectsCount}
        />
        <ProfileStrengthPanel
          strength={data.profileStrength}
          totalSkills={data.totalSkills}
        />
      </div>

      <section>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className={sectionTitleLgClass}>Suggested teammates</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ranked by skill overlap and complementary strengths
            </p>
          </div>
          {data.suggestedTeammates.length > 0 ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="size-3.5" />
              Top {data.suggestedTeammates.length} matches
            </p>
          ) : null}
        </div>

        {data.suggestedTeammates.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.suggestedTeammates.map((teammate) => (
              <TeammateSuggestionCard key={teammate.profileId} teammate={teammate} />
            ))}
          </div>
        ) : (
          <div
            className={cn(
              surfaceCardClass,
              'flex flex-col items-center px-6 py-12 text-center',
            )}
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Sparkles className="size-5" strokeWidth={1.75} />
            </span>
            <p className="mt-4 text-sm font-medium text-foreground">No matches yet</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {data.totalSkills < 3
                ? 'Add more roles and technical skills to your profile so we can find students with complementary strengths.'
                : 'There are no strong skill-overlap matches in the platform right now. Check back as more students join.'}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
