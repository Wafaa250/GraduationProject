import type { ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { RegistrationLayout } from './RegistrationLayout'
import type { RegistrationStep } from './types'
import { PrimaryButton, GhostButton } from './States'

type Props = {
  title: string
  description: ReactNode
  primaryAction: { label: string; onClick: () => void }
  secondaryAction?: { label: string; onClick: () => void }
  stats?: { label: string; value: number | string; color?: string }[]
}

const PLACEHOLDER_STEPS: RegistrationStep[] = [{ id: 'done', label: 'Complete', hint: 'All set' }]

export function RegistrationSuccess({
  title,
  description,
  primaryAction,
  secondaryAction,
  stats,
}: Props) {
  return (
    <RegistrationLayout
      steps={PLACEHOLDER_STEPS}
      current={0}
      brandEyebrow="Welcome"
      brandTitle="You're all set"
      brandDescription="Your SkillSwap account is ready."
      formTitle={title}
      formSubtitle=""
      footer={null}
    >
      <div className="text-center py-4 sm:py-8">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto mb-6">{description}</p>
        {stats && stats.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center px-4">
                <div className="text-xl font-bold" style={{ color: s.color ?? '#7c3aed' }}>
                  {s.value}
                </div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <PrimaryButton type="button" onClick={primaryAction.onClick} className="w-full">
            {primaryAction.label}
          </PrimaryButton>
          {secondaryAction ? (
            <GhostButton type="button" onClick={secondaryAction.onClick} className="w-full">
              {secondaryAction.label}
            </GhostButton>
          ) : null}
        </div>
      </div>
    </RegistrationLayout>
  )
}
