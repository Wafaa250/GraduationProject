import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { resetPassword } from '../../../api/authApi'
import { parseApiErrorMessage } from '../../../api/axiosInstance'
import AuthPageLayout, { AuthFormCard } from './AuthPageLayout'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { cn } from '../../components/ui/utils'

const MIN_PASSWORD_LENGTH = 8

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [success, setSuccess] = useState(false)

  const validate = (): boolean => {
    const next: { password?: string; confirmPassword?: string } = {}
    if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    }
    if (password !== confirmPassword) {
      next.confirmPassword = 'Passwords do not match.'
    }
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setApiError(null)
    if (!token.trim()) {
      setApiError('Invalid or missing reset link. Request a new password reset email.')
      return
    }
    if (!validate()) return

    setIsLoading(true)
    try {
      await resetPassword({
        token: token.trim(),
        password,
        confirmPassword,
      })
      setSuccess(true)
    } catch (err) {
      setApiError(parseApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  if (!token.trim() && !success) {
    return (
      <AuthPageLayout>
        <AuthFormCard>
          <header className="mb-6 space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Invalid reset link</h2>
            <p className="text-sm text-muted-foreground">
              This password reset link is missing or invalid. Request a new one from the forgot password
              page.
            </p>
          </header>
          <Button
            asChild
            className={cn(
              'h-11 w-full rounded-lg text-sm font-semibold',
              'bg-gradient-brand text-primary-foreground hover:opacity-95'
            )}
          >
            <Link to="/forgot-password">Request new reset link</Link>
          </Button>
        </AuthFormCard>
      </AuthPageLayout>
    )
  }

  return (
    <AuthPageLayout>
      <AuthFormCard>
        {success ? (
          <div className="space-y-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <header className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Password updated</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your password has been reset successfully. You can sign in with your new password.
              </p>
            </header>
            <Button
              asChild
              className={cn(
                'h-11 w-full rounded-lg text-sm font-semibold',
                'bg-gradient-brand text-primary-foreground hover:opacity-95'
              )}
            >
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        ) : (
          <>
            <header className="mb-7 space-y-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-deep transition-colors mb-3"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </Link>
              <h2 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-foreground">
                Set a new password
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Choose a strong password with at least {MIN_PASSWORD_LENGTH} characters.
              </p>
            </header>

            {apiError && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/30 bg-red-50 px-3.5 py-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{apiError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <PasswordField
                id="password"
                label="New password"
                value={password}
                show={showPassword}
                onToggleShow={() => setShowPassword((s) => !s)}
                onChange={(v) => {
                  setPassword(v)
                  if (apiError) setApiError(null)
                  if (fieldErrors.password) setFieldErrors((e) => ({ ...e, password: undefined }))
                }}
                error={fieldErrors.password}
                placeholder="Enter your new password"
              />

              <PasswordField
                id="confirmPassword"
                label="Confirm password"
                value={confirmPassword}
                show={showConfirm}
                onToggleShow={() => setShowConfirm((s) => !s)}
                onChange={(v) => {
                  setConfirmPassword(v)
                  if (apiError) setApiError(null)
                  if (fieldErrors.confirmPassword)
                    setFieldErrors((e) => ({ ...e, confirmPassword: undefined }))
                }}
                error={fieldErrors.confirmPassword}
                placeholder="Confirm your new password"
              />

              <Button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'h-11 w-full rounded-lg text-sm font-semibold tracking-tight',
                  'bg-gradient-brand text-primary-foreground hover:opacity-95 hover:shadow-glow',
                  'disabled:opacity-60 disabled:cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </span>
                ) : (
                  'Reset password'
                )}
              </Button>
            </form>
          </>
        )}
      </AuthFormCard>
    </AuthPageLayout>
  )
}

function PasswordField({
  id,
  label,
  value,
  show,
  onToggleShow,
  onChange,
  error,
  placeholder,
}: {
  id: string
  label: string
  value: string
  show: boolean
  onToggleShow: () => void
  onChange: (value: string) => void
  error?: string
  placeholder: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-foreground/90">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            'h-11 pr-11 rounded-lg bg-background transition-shadow',
            'focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary',
            error && 'border-destructive focus-visible:ring-destructive/30 focus-visible:border-destructive'
          )}
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted-foreground hover:text-foreground focus:outline-none focus-visible:text-primary"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
