import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, AlertCircle, MailCheck, ArrowLeft } from 'lucide-react'
import { forgotPassword } from '../../../api/authApi'
import { parseApiErrorMessage } from '../../../api/axiosInstance'
import AuthPageLayout, { AuthFormCard } from './AuthPageLayout'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { cn } from '../../components/ui/utils'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setApiError(null)

    try {
      const result = await forgotPassword({ email })
      setConfirmationMessage(
        result.message ||
          'If an account exists for that email, you will receive password reset instructions shortly.'
      )
      setSubmitted(true)
    } catch (err) {
      setApiError(parseApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthPageLayout>
      <AuthFormCard>
        {submitted ? (
          <div className="space-y-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
              <MailCheck className="h-7 w-7" />
            </div>
            <header className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Check your email</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{confirmationMessage}</p>
            </header>
            <Button
              asChild
              className={cn(
                'h-11 w-full rounded-lg text-sm font-semibold',
                'bg-gradient-brand text-primary-foreground hover:opacity-95'
              )}
            >
              <Link to="/login">Back to sign in</Link>
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
                Forgot your password?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Enter the email address associated with your account and we&apos;ll send you a link to
                reset your password.
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

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-foreground/90">
                  Email Address
                </Label>
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
              </div>

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
                    Sending...
                  </span>
                ) : (
                  'Send reset link'
                )}
              </Button>
            </form>
          </>
        )}
      </AuthFormCard>
    </AuthPageLayout>
  )
}
