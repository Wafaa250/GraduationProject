import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BrandLogo } from '../brand/BrandLogo'
import { BrandPanel } from './BrandPanel'
import { ProgressStepper } from './ProgressStepper'
import type { RegistrationStep } from './types'
import '../../pages/auth/login-page.css'
import './registration-page.css'

export type RegistrationLayoutProps = {
  steps: RegistrationStep[]
  current: number
  onJump?: (index: number) => void
  brandEyebrow: string
  brandTitle: ReactNode
  brandDescription: string
  highlights?: { icon: ReactNode; label: string; sub: string }[]
  children: ReactNode
  /** Header above form card */
  formTitle: ReactNode
  formSubtitle?: string
  topRight?: ReactNode
  changeRole?: ReactNode
  footer?: ReactNode
}

export function RegistrationLayout({
  steps,
  current,
  onJump,
  brandEyebrow,
  brandTitle,
  brandDescription,
  highlights,
  children,
  formTitle,
  formSubtitle,
  topRight,
  changeRole,
  footer,
}: RegistrationLayoutProps) {
  return (
    <div className="login-page reg-page min-h-screen bg-background">
      <div className="lg:grid lg:grid-cols-[minmax(380px,480px)_1fr] min-h-screen">
        <BrandPanel
          eyebrow={brandEyebrow}
          title={brandTitle}
          description={brandDescription}
          steps={steps}
          current={current}
          onJump={onJump}
          highlights={highlights}
        />

        <main className="relative flex flex-col min-h-screen">
          <header className="lg:hidden sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border">
            <div className="flex items-center justify-between px-4 h-14">
              <BrandLogo to="/" size="sm" />
              <Link to="/login" className="text-xs font-medium text-primary">
                Sign in
              </Link>
            </div>
            <div className="px-4 pb-3">
              <ProgressStepper steps={steps} current={current} onJump={onJump} />
            </div>
          </header>

          <div className="relative flex-1">
            <div className="absolute inset-0 bg-mesh pointer-events-none" aria-hidden />
            <div className="relative mx-auto w-full max-w-2xl px-4 sm:px-8 py-6 sm:py-10 lg:py-12">
              <div className="hidden lg:flex items-center justify-between gap-4 mb-4">
                {changeRole ?? <span />}
                {topRight ?? (
                  <span className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary font-medium hover:text-primary-deep">
                      Sign in
                    </Link>
                  </span>
                )}
              </div>

              {changeRole && <div className="lg:hidden mb-4">{changeRole}</div>}

              <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{formTitle}</h2>
                {formSubtitle ? (
                  <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">{formSubtitle}</p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-7 lg:p-8 shadow-card">{children}</div>

              {footer ? <div className="mt-6">{footer}</div> : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
