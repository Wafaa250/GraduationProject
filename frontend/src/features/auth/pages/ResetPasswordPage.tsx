import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, Loader2 } from 'lucide-react'
import { authApi } from '@/shared/api/authApi'
import { AuthCard } from '../components/AuthCard'
import { AuthField } from '../components/AuthField'
import { AuthAlert } from '../components/AuthAlert'
import { Button } from '@/shared/components/ui/Button'
import { ROUTES } from '@/shared/constants/routes'
import { getApiErrorMessage } from '@/shared/lib/errors'

const schema = z
  .object({
    email: z.string().email('Enter a valid email'),
    token: z.string().min(1, 'Reset token is missing'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const tokenFromUrl = searchParams.get('token') ?? ''
  const emailFromUrl = searchParams.get('email') ?? ''

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: emailFromUrl,
      token: tokenFromUrl,
    },
  })

  const onSubmit = async (values: FormValues) => {
    setError(null)
    try {
      await authApi.resetPassword(values)
      navigate(ROUTES.login, { replace: true, state: { resetSuccess: true } })
    } catch (e) {
      setError(getApiErrorMessage(e))
    }
  }

  if (!tokenFromUrl) {
    return (
      <AuthCard title="Invalid link" description="This password reset link is missing a token.">
        <AuthAlert variant="error">Request a new reset link to continue.</AuthAlert>
        <Button className="mt-6 w-full" asChild>
          <Link to={ROUTES.forgotPassword}>Request new link</Link>
        </Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Choose a new password"
      description="Use at least 8 characters. You'll sign in with this password afterward."
      footer={
        <Link to={ROUTES.login} className="text-sm font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && <AuthAlert variant="error">{error}</AuthAlert>}
        <input type="hidden" {...register('token')} />
        <AuthField
          label="Email"
          type="email"
          readOnly
          error={errors.email?.message}
          {...register('email')}
        />
        <AuthField
          label="New password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <AuthField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Update password
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </AuthCard>
  )
}
