import { Check, Circle } from 'lucide-react'
import type { ProfileStrength } from '@/shared/api/types/dashboard'
import { cn } from '@/shared/lib/cn'
import { sectionTitleLgClass } from '@/shared/styles/typography'
import { surfaceCardClass } from '@/shared/styles/layout'

interface ProfileStrengthPanelProps {
  strength: ProfileStrength
  totalSkills: number
}

const checklist: {
  key: keyof Pick<
    ProfileStrength,
    'hasProfilePicture' | 'hasGeneralSkills' | 'hasMajorSkills' | 'hasBio' | 'hasGpa'
  >
  label: string
}[] = [
  { key: 'hasProfilePicture', label: 'Profile photo' },
  { key: 'hasGeneralSkills', label: 'Roles on your profile' },
  { key: 'hasMajorSkills', label: 'Technical skills' },
  { key: 'hasBio', label: 'Bio' },
  { key: 'hasGpa', label: 'GPA' },
]

export function ProfileStrengthPanel({ strength, totalSkills }: ProfileStrengthPanelProps) {
  const completed = checklist.filter((c) => strength[c.key]).length
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (strength.score / 100) * circumference

  return (
    <section className={cn(surfaceCardClass, 'p-5 sm:p-6')}>
      <h2 className={sectionTitleLgClass}>Profile strength</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A stronger profile improves teammate and project matches.
      </p>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative mx-auto flex size-[132px] shrink-0 items-center justify-center sm:mx-0">
          <svg className="-rotate-90" width="132" height="132" aria-hidden>
            <circle
              cx="66"
              cy="66"
              r={radius}
              fill="none"
              stroke="hsl(240 8% 94%)"
              strokeWidth="10"
            />
            <circle
              cx="66"
              cy="66"
              r={radius}
              fill="none"
              stroke="hsl(245 72% 56%)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-semibold tabular-nums text-foreground">
              {strength.score}
            </span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{completed}</span> of{' '}
            {checklist.length} profile signals complete ·{' '}
            <span className="font-medium text-foreground">{totalSkills}</span> skills tracked
          </p>
          <ul className="space-y-2">
            {checklist.map((item) => {
              const done = strength[item.key]
              return (
                <li key={item.key} className="flex items-center gap-2.5 text-sm">
                  {done ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Check className="size-3" strokeWidth={2.5} />
                    </span>
                  ) : (
                    <Circle className="size-5 text-muted-foreground/40" strokeWidth={1.5} />
                  )}
                  <span className={done ? 'text-foreground' : 'text-muted-foreground'}>
                    {item.label}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
