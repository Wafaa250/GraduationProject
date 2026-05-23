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
import { AuthSelect } from '../components/AuthSelect'
import { AuthAlert } from '../components/AuthAlert'
import { Button } from '@/shared/components/ui/Button'
import { TextArea } from '@/shared/components/ui/TextArea'
import { authFormStackClass } from '@/shared/styles/layout'
import { ROUTES, getHomeForRole } from '@/shared/constants/routes'
import { getApiErrorMessage } from '@/shared/lib/errors'

const CATEGORIES = [
  { value: 'Technical', label: 'Technical' },
  { value: 'Volunteer', label: 'Volunteer' },
  { value: 'Media', label: 'Media' },
  { value: 'Cultural', label: 'Cultural' },
]

const schema = z
  .object({
    associationName: z.string().min(2, 'Association name is required'),
    username: z
      .string()
      .min(2, 'Username is required')
      .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, and underscores only'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string(),
    faculty: z.string().min(1, 'Faculty is required'),
    category: z.string().min(1, 'Category is required'),
    description: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function RegisterOrganizationPage() {
  const { setSession } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'Technical' },
  })

  const onSubmit = async (values: FormValues) => {
    setError(null)
    try {
      const session = await authApi.registerOrganization(values)
      setSession(session)
      navigate(getHomeForRole(session.role), { replace: true })
    } catch (e) {
      setError(getApiErrorMessage(e))
    }
  }

  return (
    <AuthCard
      title="Student organization"
    >
      <AuthBackLink to={ROUTES.register} />

      <form onSubmit={handleSubmit(onSubmit)} className={authFormStackClass}>
        {error && <AuthAlert variant="error">{error}</AuthAlert>}

        <AuthField
          label="Association name"
          error={errors.associationName?.message}
          {...register('associationName')}
        />
        <AuthField
          label="Username"
          hint="Public handle for your organization page"
          error={errors.username?.message}
          {...register('username')}
        />
        <AuthField label="Email" type="email" error={errors.email?.message} {...register('email')} />
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
        <AuthField label="Faculty" error={errors.faculty?.message} {...register('faculty')} />
        <AuthSelect
          label="Category"
          options={CATEGORIES}
          error={errors.category?.message}
          {...register('category')}
        />
        <TextArea label="Description (optional)" rows={3} {...register('description')} />

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Create organization
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </AuthCard>
  )
}
