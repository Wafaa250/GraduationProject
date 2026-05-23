import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, ArrowRight, ExternalLink, Loader2 } from 'lucide-react'
import { authApi } from '@/shared/api/authApi'
import { AuthCard } from '../components/AuthCard'
import { AuthField } from '../components/AuthField'
import { AuthAlert } from '../components/AuthAlert'
import { Button } from '@/shared/components/ui/Button'
import { authFormStackClass } from '@/shared/styles/layout'
import { ROUTES } from '@/shared/constants/routes'
import { getApiErrorMessage } from '@/shared/lib/errors'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

type FormValues = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<Awaited<ReturnType<typeof authApi.forgotPassword>> | null>(
    null,
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setError(null)
    setSuccess(null)
    try {
      const res = await authApi.forgotPassword({ email: values.email.trim() })
      setSuccess(res)
    } catch (e) {
      setError(getApiErrorMessage(e))
    }
  }

  return (
    <AuthCard
      title="Reset your password"
      description="We'll email you a link to choose a new password."
      footer={
        <Link
          to={ROUTES.login}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      }
    >
      {success ? (
        <div className="space-y-4">
          <AuthAlert variant={success.emailSent ? 'success' : 'info'}>{success.message}</AuthAlert>

          {success.emailSent && (
            <p className="text-sm text-muted-foreground">
              Check your inbox and spam folder. The link expires after a limited time.
            </p>
          )}

          {success.resetUrl && (
            <div className="rounded-xl border border-primary/25 bg-accent/60 p-4">
              <p className="text-sm font-medium text-foreground">Reset link</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Open this link to set a new password. It works once and expires soon.
              </p>
              <Button className="mt-4 w-full" asChild>
                <a href={success.resetUrl}>
                  Open password reset
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <p className="mt-3 break-all text-[11px] text-muted-foreground">{success.resetUrl}</p>
            </div>
          )}

          {!success.emailSent && !success.resetUrl && (
            <p className="text-sm text-muted-foreground">
              If you do not receive an email, confirm you used the same address as your account, or
              contact support.
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className={authFormStackClass}>
          {error && <AuthAlert variant="error">{error}</AuthAlert>}
          <AuthField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            error={errors.email?.message}
            {...register('email')}
          />
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Send reset link
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
