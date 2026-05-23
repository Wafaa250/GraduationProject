import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { authApi } from '@/shared/api/authApi'
import { AuthBackLink } from '../components/AuthBackLink'
import { AuthCard } from '../components/AuthCard'
import { AuthField } from '../components/AuthField'
import { AuthAlert } from '../components/AuthAlert'
import { Button } from '@/shared/components/ui/Button'
import { TextArea } from '@/shared/components/ui/TextArea'
import { authFormStackClass } from '@/shared/styles/layout'
import { ROUTES, getHomeForRole } from '@/shared/constants/routes'
import { getApiErrorMessage } from '@/shared/lib/errors'

const schema = z
  .object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string(),
    university: z.string().min(1, 'University is required'),
    faculty: z.string().min(1, 'Faculty is required'),
    department: z.string().min(1, 'Department is required'),
    specialization: z.string().min(1, 'Specialization is required'),
    bio: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function RegisterDoctorPage() {
  const { setSession } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setError(null)
    try {
      const session = await authApi.registerDoctor(values)
      setSession(session)
      navigate(getHomeForRole(session.role), { replace: true })
    } catch (e) {
      setError(getApiErrorMessage(e))
    }
  }

  return (
    <AuthCard
      title="Faculty account"
    >
      <AuthBackLink to={ROUTES.register} />

      <form onSubmit={handleSubmit(onSubmit)} className={authFormStackClass}>
        {error && <AuthAlert variant="error">{error}</AuthAlert>}

        <AuthField label="Full name" error={errors.fullName?.message} {...register('fullName')} />
        <AuthField
          label="Email"
          type="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <AuthField
          label="Password"
          type="password"
          error={errors.password?.message}
          {...register('password')}
        />
        <AuthField
          label="Confirm password"
          type="password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <AuthField label="University" error={errors.university?.message} {...register('university')} />
        <AuthField label="Faculty" error={errors.faculty?.message} {...register('faculty')} />
        <AuthField label="Department" error={errors.department?.message} {...register('department')} />
        <AuthField
          label="Specialization"
          error={errors.specialization?.message}
          {...register('specialization')}
        />
        <TextArea label="Bio (optional)" rows={3} {...register('bio')} />

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Create faculty account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </AuthCard>
  )
}
