import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { AuthCard } from '../components/AuthCard'
import { AuthField } from '../components/AuthField'
import { AuthAlert } from '../components/AuthAlert'
import { Button } from '@/shared/components/ui/Button'
import { ROUTES, getHomeForRole } from '@/shared/constants/routes'
import { authFormStackClass } from '@/shared/styles/layout'
import { getApiErrorMessage } from '@/shared/lib/errors'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const resetSuccess = (location.state as { resetSuccess?: boolean } | null)?.resetSuccess
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setError(null)
    try {
      const session = await login(values.email, values.password)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? getHomeForRole(session.role), { replace: true })
    } catch (e) {
      setError(getApiErrorMessage(e))
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      footer={
        <p className="text-center text-sm text-muted-foreground">
          New to SkillSwap?{' '}
          <Link to={ROUTES.register} className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className={authFormStackClass}>
        {resetSuccess && (
          <AuthAlert variant="success">Password updated. Sign in with your new password.</AuthAlert>
        )}
        {error && <AuthAlert variant="error">{error}</AuthAlert>}

        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@university.edu"
          error={errors.email?.message}
          {...register('email')}
        />

        <AuthField
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          labelAction={
            <Link
              to={ROUTES.forgotPassword}
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          }
          {...register('password')}
        />

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </AuthCard>
  )
}
