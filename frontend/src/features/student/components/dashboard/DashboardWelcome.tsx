import { Sparkles } from 'lucide-react'
import type { DashboardSummary } from '@/shared/api/types/dashboard'
import { eyebrowClass, pageSubtitleClass } from '@/shared/styles/typography'
import { useMe } from '@/app/providers/MeProvider'
import { UserAvatar } from '../UserAvatar'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

interface DashboardWelcomeProps {
  summary: DashboardSummary
}

export function DashboardWelcome({ summary }: DashboardWelcomeProps) {
  const { me } = useMe()
  const academicLine = [summary.major, summary.university, summary.academicYear]
    .filter(Boolean)
    .join(' · ')

  return (
    <header className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 left-1/3 size-40 rounded-full bg-glow/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className={eyebrowClass}>
            <Sparkles className="mr-1.5 inline size-3.5 text-primary" aria-hidden />
            {greeting()}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {summary.name.split(' ')[0] || summary.name}, here&apos;s your overview
          </h1>
          {academicLine ? (
            <p className={pageSubtitleClass}>{academicLine}</p>
          ) : null}
        </div>

        {me ? (
          <UserAvatar
            name={me.name}
            imageSrc={me.profilePictureBase64}
            size="lg"
            className="hidden sm:flex sm:size-14 sm:text-base"
          />
        ) : null}
      </div>
    </header>
  )
}
