import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { authApi } from '@/shared/api/authApi'
import { AuthBackLink } from '../components/AuthBackLink'
import { AuthCard } from '../components/AuthCard'
import { AuthField } from '../components/AuthField'
import { AuthAlert } from '../components/AuthAlert'
import { Button } from '@/shared/components/ui/Button'
import { TextArea } from '@/shared/components/ui/TextArea'
import { authFormStackClass, calloutClass } from '@/shared/styles/layout'
import { ROUTES, getHomeForRole } from '@/shared/constants/routes'
import { getApiErrorMessage } from '@/shared/lib/errors'

const schema = z
  .object({
    contactName: z.string().min(2, 'Contact name is required'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string(),
    companyName: z.string().min(2, 'Company name is required'),
    industry: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    websiteUrl: z.string().optional(),
    linkedInUrl: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function RegisterCompanyPage() {
  const { setSession } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeNote, setAnalyzeNote] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const runAnalyze = async () => {
    setError(null)
    setAnalyzeNote(null)
    const websiteUrl = getValues('websiteUrl')?.trim()
    const linkedInUrl = getValues('linkedInUrl')?.trim()
    if (!websiteUrl && !linkedInUrl) {
      setError('Add a website or LinkedIn URL to analyze your company profile.')
      return
    }
    setAnalyzing(true)
    try {
      const result = await authApi.analyzeCompany({ websiteUrl, linkedInUrl })
      if (result.companyName) setValue('companyName', result.companyName)
      if (result.industry) setValue('industry', result.industry)
      if (result.description) setValue('description', result.description)
      if (result.location) setValue('location', result.location)
      setAnalyzeNote(
        result.usedAi
          ? 'Profile fields prefilled using AI analysis. Review before submitting.'
          : result.message ?? 'Analysis complete. Review the prefilled fields.',
      )
    } catch (e) {
      setError(getApiErrorMessage(e))
    } finally {
      setAnalyzing(false)
    }
  }

  const onSubmit = async (values: FormValues) => {
    setError(null)
    try {
      const session = await authApi.registerCompany(values)
      setSession(session)
      navigate(getHomeForRole(session.role), { replace: true })
    } catch (e) {
      setError(getApiErrorMessage(e))
    }
  }

  return (
    <AuthCard
      title="Company account"
    >
      <AuthBackLink to={ROUTES.register} />

      <form onSubmit={handleSubmit(onSubmit)} className={authFormStackClass}>
        {error && <AuthAlert variant="error">{error}</AuthAlert>}
        {analyzeNote && <AuthAlert variant="info">{analyzeNote}</AuthAlert>}

        <div className={calloutClass}>
          <p className="text-sm font-medium text-foreground">Optional: AI company profile</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste your website or LinkedIn — we&apos;ll prefill company details when AI is available.
          </p>
          <div className="mt-3 space-y-3">
            <AuthField
              label="Website"
              placeholder="https://company.com"
              {...register('websiteUrl')}
            />
            <AuthField
              label="LinkedIn"
              placeholder="https://linkedin.com/company/..."
              {...register('linkedInUrl')}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={analyzing}
              onClick={runAnalyze}
            >
              {analyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze company
                </>
              )}
            </Button>
          </div>
        </div>

        <AuthField label="Contact name" error={errors.contactName?.message} {...register('contactName')} />
        <AuthField label="Work email" type="email" error={errors.email?.message} {...register('email')} />
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
        <AuthField label="Company name" error={errors.companyName?.message} {...register('companyName')} />
        <AuthField label="Industry" {...register('industry')} />
        <AuthField label="Location" {...register('location')} />
        <TextArea
          label="Description"
          rows={3}
          placeholder="At least 40 characters if no website/LinkedIn provided"
          {...register('description')}
        />

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Create company account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </AuthCard>
  )
}
