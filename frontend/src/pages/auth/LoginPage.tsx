import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandLogo } from '@/components/brand/BrandLogo'
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Sparkles,
  Users,
  Network,
  GraduationCap,
} from 'lucide-react'
import api from '@/api/axiosInstance'
import { navigateHome } from '@/utils/homeNavigation'
import { persistAuthSession } from '@/lib/authSession'
import { setStoredCompanyRole } from '@/lib/companyWorkspace'
import { ROUTES } from '@/routes/paths'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/components/ui/utils'
import './login-page.css'

export type LoginPageProps = {
  /** When true, successful login does not navigate — caller refreshes in-place (e.g. embedded doctor dashboard). */
  embedded?: boolean
  /** Called after tokens are written to localStorage. */
  onLoginSuccess?: () => void
}

export default function LoginPage({ embedded = false, onLoginSuccess }: LoginPageProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setApiError(null)

    try {
      const response = await api.post('/auth/login', { email, password })
      const result = response.data

      persistAuthSession(result)
      setStoredCompanyRole(result.companyRole)

      onLoginSuccess?.()

      if (embedded) {
        return
      }

      if (result.mustChangePassword) {
        navigate(ROUTES.changePassword, { replace: true })
        return
      }

      navigateHome(navigate)
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        'Invalid email or password. Please try again.'
      setApiError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main
      className={cn(
        'login-page relative min-h-screen bg-gradient-soft overflow-hidden',
        embedded && 'min-h-0 bg-transparent'
      )}
    >
      {!embedded && (
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

      <div
        className={cn(
          'relative grid min-h-screen',
          !embedded && 'lg:grid-cols-2',
          embedded && 'min-h-0'
        )}
      >
        {!embedded && (
          <aside className="hidden lg:flex relative flex-col p-12 xl:p-16 overflow-hidden">
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

            <div className="relative flex-1 flex flex-col justify-center space-y-10 text-primary-foreground -translate-y-7">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
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
          </aside>
        )}

        <section
          className={cn(
            'flex items-center justify-center px-5 py-10 sm:px-8',
            embedded ? 'py-6' : 'lg:px-12'
          )}
        >
          <div className="w-full max-w-md">
            {!embedded && (
              <div className="lg:hidden mb-8 flex items-center justify-center gap-2.5">
                <BrandLogo to="/" size="sm" className="justify-center w-full" />
              </div>
            )}

            <div className="rounded-2xl border border-border/70 bg-card/90 backdrop-blur-xl p-7 sm:p-9 shadow-card">
              <header className="mb-7">
                <h2 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-foreground">
                  Sign in to <span className="text-gradient-brand">SkillSwap</span>
                </h2>
              </header>

              {apiError && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/30 bg-red-50 px-3.5 py-3 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">Sign in failed</p>
                    <p className="text-destructive/85">{apiError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Field id="email" label="Email Address">
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (apiError) setApiError(null)
                    }}
                    required
                    className={cn(
                      'h-11 rounded-lg bg-background transition-shadow',
                      'focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary'
                    )}
                  />
                </Field>

                <Field
                  id="password"
                  label="Password"
                  rightSlot={
                    <Link
                      to="/forgot-password"
                      className="text-xs font-medium text-primary hover:text-primary-deep transition-colors"
                    >
                      Forgot password?
                    </Link>
                  }
                >
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (apiError) setApiError(null)
                      }}
                      required
                      className={cn(
                        'h-11 pr-11 rounded-lg bg-background transition-shadow',
                        'focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted-foreground hover:text-foreground focus:outline-none focus-visible:text-primary"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </Field>

                <label className="flex items-center gap-2.5 text-sm text-foreground/85 cursor-pointer select-none">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(v) => setRemember(!!v)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  Keep me signed in on this device
                </label>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    'h-11 w-full rounded-lg text-sm font-semibold tracking-tight',
                    'bg-gradient-brand text-primary-foreground hover:opacity-95 hover:shadow-glow',
                    'transition-all duration-200',
                    'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none'
                  )}
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>

              <div className="my-7 flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>

              <p className="text-center text-sm text-muted-foreground">
                New to SkillSwap?{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary hover:text-primary-deep transition-colors"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

const Field = ({
  id,
  label,
  rightSlot,
  children,
}: {
  id: string
  label: string
  rightSlot?: ReactNode
  children: ReactNode
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <Label htmlFor={id} className="text-sm font-medium text-foreground/90">
        {label}
      </Label>
      {rightSlot}
    </div>
    {children}
  </div>
)

const FeatureRow = ({ icon, label }: { icon: ReactNode; label: string }) => (
  <li className="flex items-center gap-3">
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 border border-white/20 backdrop-blur">
      {icon}
    </span>
    {label}
  </li>
)
