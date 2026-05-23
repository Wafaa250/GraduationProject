import type { SuggestedTeammate } from '@/shared/api/types/dashboard'
import { cn } from '@/shared/lib/cn'
import { UserAvatar } from '../UserAvatar'

interface TeammateSuggestionCardProps {
  teammate: SuggestedTeammate
}

export function TeammateSuggestionCard({ teammate }: TeammateSuggestionCardProps) {
  return (
    <article
      className={cn(
        'flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm',
        'transition-shadow hover:shadow-md',
      )}
    >
      <div className="flex items-start gap-3">
        <UserAvatar
          name={teammate.name}
          imageSrc={teammate.profilePicture}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-medium text-foreground">{teammate.name}</h3>
            <span className="shrink-0 rounded-md bg-accent px-2 py-0.5 text-xs font-semibold tabular-nums text-accent-foreground">
              {teammate.matchScore}%
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {[teammate.major, teammate.academicYear].filter(Boolean).join(' · ')}
          </p>
          {teammate.university ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground/80">
              {teammate.university}
            </p>
          ) : null}
        </div>
      </div>

      {teammate.skills.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {teammate.skills.map((skill) => (
            <li
              key={skill}
              className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {skill}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}
