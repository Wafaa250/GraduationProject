import { FolderKanban, Users } from 'lucide-react'
import type { DashboardProject } from '@/shared/api/types/dashboard'
import { cn } from '@/shared/lib/cn'
import { sectionTitleLgClass } from '@/shared/styles/typography'
import { surfaceCardClass } from '@/shared/styles/layout'

interface ProjectStatusPanelProps {
  project: DashboardProject | null
  matchedProjectsCount: number
}

export function ProjectStatusPanel({
  project,
  matchedProjectsCount,
}: ProjectStatusPanelProps) {
  return (
    <section className={cn(surfaceCardClass, 'flex h-full flex-col p-5 sm:p-6')}>
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
          <FolderKanban className="size-5" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className={sectionTitleLgClass}>Graduation project</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your current team affiliation</p>
        </div>
      </div>

      {project ? (
        <div className="mt-6 flex flex-1 flex-col">
          <p className="text-lg font-semibold tracking-tight text-foreground">
            {project.projectName}
          </p>
          <p className="mt-1 text-sm capitalize text-muted-foreground">
            You are the {project.role === 'owner' ? 'project owner' : 'team member'}
          </p>

          <div className="mt-5 flex items-center gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <Users className="size-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {project.memberCount} / {project.maxTeamSize} members
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (project.memberCount / Math.max(project.maxTeamSize, 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
            {project.isFull ? (
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                Full
              </span>
            ) : (
              <span className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
                Open spots
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-1 flex-col justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">No project yet</p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            You are not on a graduation project team. When you create or join one, it will appear
            here.
          </p>
          {matchedProjectsCount > 0 ? (
            <p className="mt-4 text-sm text-accent-foreground">
              <span className="font-semibold text-foreground">{matchedProjectsCount}</span>{' '}
              open {matchedProjectsCount === 1 ? 'project matches' : 'projects match'} your skills
            </p>
          ) : null}
        </div>
      )}
    </section>
  )
}
