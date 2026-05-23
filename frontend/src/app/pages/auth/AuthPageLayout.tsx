import type { ReactNode } from 'react'
import { Sparkles, Users, Network, GraduationCap } from 'lucide-react'
import { BrandLogo } from '../../components/brand/BrandLogo'
import { cn } from '../../components/ui/utils'
import './login-page.css'

type AuthPageLayoutProps = {
  children: ReactNode
  /** Hide marketing panel (e.g. narrow embedded layouts). */
  compact?: boolean
}

export default function AuthPageLayout({ children, compact = false }: AuthPageLayoutProps) {
  return (
    <main className="login-page relative min-h-screen bg-gradient-soft overflow-hidden">
      {!compact && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-primary/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary-glow/20 blur-3xl"
          />
        </>
      )}

      <div className={cn('relative grid min-h-screen', !compact && 'lg:grid-cols-2')}>
        {!compact && (
          <aside className="hidden lg:flex relative flex-col justify-between p-12 xl:p-16 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-brand opacity-[0.97]" />
            <div
              aria-hidden
              className="absolute inset-0 opacity-30 bg-gradient-mesh mix-blend-overlay"
            />
            <div
              aria-hidden
              className="absolute inset-0 [background-image:linear-gradient(hsl(0_0%_100%/0.08)_1px,transparent_1px),linear-gradient(90deg,hsl(0_0%_100%/0.08)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
            />

            <BrandLogo to="/" size="lg" onDark className="relative" />

            <div className="relative space-y-10 text-primary-foreground">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                AI-powered university collaboration
              </div>
              <h1 className="text-4xl xl:text-5xl font-semibold leading-[1.05] tracking-tight">
                Build the team
                <br />
                behind your next
                <br />
                <span className="italic font-serif">great project.</span>
              </h1>
              <p className="max-w-md text-base xl:text-lg text-primary-foreground/85 leading-relaxed">
                Discover compatible teammates, form balanced AI-assisted teams, find graduation
                projects, and connect with supervisors and partner organizations.
              </p>

              <ul className="grid gap-3 text-sm text-primary-foreground/90">
                <FeatureRow
                  icon={<Network className="h-4 w-4" />}
                  label="Smart skill-matching across your campus"
                />
                <FeatureRow
                  icon={<Users className="h-4 w-4" />}
                  label="Balanced team formation with AI insights"
                />
                <FeatureRow
                  icon={<GraduationCap className="h-4 w-4" />}
                  label="Request supervisors & collaborate with partners"
                />
              </ul>
            </div>

            <p className="relative text-xs text-primary-foreground/70">
              Trusted by student teams at universities building research, startups, and capstone
              projects.
            </p>
          </aside>
        )}

        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            {!compact && (
              <div className="lg:hidden mb-8 flex items-center justify-center gap-2.5">
                <BrandLogo to="/" size="sm" className="justify-center w-full" />
              </div>
            )}
            {children}
          </div>
        </section>
      </div>
    </main>
  )
}

export function AuthFormCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/70 bg-card/90 backdrop-blur-xl p-7 sm:p-9 shadow-card',
        className
      )}
    >
      {children}
    </div>
  )
}

const FeatureRow = ({ icon, label }: { icon: ReactNode; label: string }) => (
  <li className="flex items-center gap-3">
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 border border-white/20 backdrop-blur">
      {icon}
    </span>
    {label}
  </li>
)
