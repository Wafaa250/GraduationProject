import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import { BrandLogo } from '../brand/BrandLogo'
import { ProgressStepper } from './ProgressStepper'
import type { RegistrationStep } from './types'

type Props = {
  eyebrow: string
  title: ReactNode
  description: string
  steps: RegistrationStep[]
  current: number
  onJump?: (index: number) => void
  highlights?: { icon: ReactNode; label: string; sub: string }[]
}

export function BrandPanel({
  eyebrow,
  title,
  description,
  steps,
  current,
  onJump,
  highlights,
}: Props) {
  return (
    <aside className="reg-brand-panel relative hidden lg:flex flex-col justify-between p-10 xl:p-12 text-primary-foreground overflow-hidden">
      <div aria-hidden className="absolute inset-0 reg-brand-grid pointer-events-none" />
      <div aria-hidden className="absolute inset-0 bg-gradient-mesh opacity-40 mix-blend-overlay pointer-events-none" />

      <div className="relative space-y-10">
        <BrandLogo size="md" onDark variant="full" />

        <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          {eyebrow}
        </div>

        <div className="space-y-4 max-w-md">
          <h1 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight">{title}</h1>
          <p className="text-sm xl:text-base text-primary-foreground/85 leading-relaxed">{description}</p>
        </div>

        <ProgressStepper steps={steps} current={current} onJump={onJump} variant="vertical" />
      </div>

      {highlights && highlights.length > 0 ? (
        <ul className="relative grid gap-3">
          {highlights.map((h) => (
            <li
              key={h.label}
              className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur text-sm"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15">{h.icon}</span>
              <span>
                <span className="block font-semibold">{h.label}</span>
                <span className="block text-xs text-primary-foreground/75">{h.sub}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  )
}
