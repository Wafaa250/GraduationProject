import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Sparkles, Eye, EyeOff, Mail, Lock, User, Building2, Link2, Briefcase } from 'lucide-react'
import { applyRoleTheme } from '@/lib/roleTheme'
import {
  analyzeCompany,
  registerCompany,
  parseApiErrorMessage,
} from '@/api/companyApi'
import { RegistrationLayout } from '@/components/registration/RegistrationLayout'
import { FormSection, FieldGrid, RegField } from '@/components/registration/FormSection'
import { TextInput, Textarea } from '@/components/registration/Inputs'
import { AlertError, GhostButton, PrimaryButton } from '@/components/registration/States'
import { RegistrationStepFooter } from '@/components/registration/RegistrationStepFooter'
import { RegistrationSuccess } from '@/components/registration/RegistrationSuccess'
import type { RegistrationStep } from '@/components/registration/types'
import './company-register-mobile.css'

const STEPS: RegistrationStep[] = [
  { id: 'account', label: 'Account', hint: 'Contact credentials' },
  { id: 'links', label: 'Company links', hint: 'AI profile import' },
  { id: 'profile', label: 'Company profile', hint: 'Review and finish' },
]

const COMPANY_HIGHLIGHTS = [
  { icon: <Building2 className="h-4 w-4" />, label: 'Graduation projects', sub: 'Publish real-world project ideas' },
  { icon: <Sparkles className="h-4 w-4" />, label: 'AI profile import', sub: 'From website or LinkedIn' },
  { icon: <Briefcase className="h-4 w-4" />, label: 'Talent matching', sub: 'Connect with skilled students' },
]

const FORM_TITLES = ['Create your company account', 'Company links', 'Company profile']
const FORM_SUBTITLES = [
  'Represent your organization on SkillSwap.',
  'We use AI to read your website or LinkedIn and fill your company profile.',
  'Review and edit your company details before creating your account.',
]

type FormState = {
  contactName: string
  email: string
  password: string
  confirmPassword: string
  websiteUrl: string
  linkedInUrl: string
  companyName: string
  industry: string
  description: string
  location: string
}

export default function CompanyRegisterForm({ onBack = null }: { onBack?: (() => void) | null }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [analysisNote, setAnalysisNote] = useState<string | null>(null)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [skippedAi, setSkippedAi] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState<FormState>({
    contactName: '',
    email: '',
    password: '',
    confirmPassword: '',
    websiteUrl: '',
    linkedInUrl: '',
    companyName: '',
    industry: '',
    description: '',
    location: '',
  })

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: '' }))
  }

  const hasLink = () => Boolean(form.websiteUrl.trim() || form.linkedInUrl.trim())

  const validate = () => {
    const e: Record<string, string> = {}
    if (step === 0) {
      if (!form.contactName.trim()) e.contactName = 'Contact name is required'
      if (!form.email.trim()) e.email = 'Email is required'
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
      if (!form.password) e.password = 'Password is required'
      else if (form.password.length < 8) e.password = 'Min. 8 characters'
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    }
    if (step === 2) {
      if (!form.companyName.trim()) e.companyName = 'Company name is required'
      if (!hasLink() && form.description.trim().length < 40) {
        e.description =
          'Add a website or LinkedIn on the previous step, or write at least 40 characters about your company here.'
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (validate()) setStep((s) => s + 1)
  }

  const back = () => {
    if (step === 0 && onBack) onBack()
    else {
      if (step === 2) setSkippedAi(false)
      setStep((s) => Math.max(0, s - 1))
    }
  }

  const skipAiAndGoManual = () => {
    setErrors((e) => ({ ...e, websiteUrl: '' }))
    setAnalysisNote(null)
    setSkippedAi(true)
    setStep(2)
  }

  const runAnalysis = async () => {
    if (!hasLink()) {
      setErrors({ websiteUrl: 'Add your website or LinkedIn URL' })
      return
    }
    setIsAnalyzing(true)
    setApiError(null)
    setAnalysisNote(null)
    try {
      const result = await analyzeCompany({
        websiteUrl: form.websiteUrl.trim() || undefined,
        linkedInUrl: form.linkedInUrl.trim() || undefined,
      })
      setForm((f) => ({
        ...f,
        companyName: result.companyName || f.companyName,
        industry: result.industry ?? '',
        description: result.description ?? '',
        location: result.location ?? '',
      }))
      if (result.message) setAnalysisNote(result.message)
      toast.success(result.usedAi ? 'Company profile analyzed with AI' : 'Profile draft ready — please review')
      setSkippedAi(false)
      setStep(2)
    } catch (err) {
      const msg = parseApiErrorMessage(err)
      setApiError(msg)
      toast.error(msg)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const submit = async () => {
    if (!validate()) return
    setIsLoading(true)
    setApiError(null)
    try {
      const data = await registerCompany({
        contactName: form.contactName.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        companyName: form.companyName.trim(),
        industry: form.industry.trim() || undefined,
        description: form.description.trim() || undefined,
        location: form.location.trim() || undefined,
        websiteUrl: form.websiteUrl.trim() || undefined,
        linkedInUrl: form.linkedInUrl.trim() || undefined,
      })

      localStorage.setItem('token', data.token)
      localStorage.setItem('userId', data.userId.toString())
      localStorage.setItem('role', data.role)
      localStorage.setItem('name', data.name)
      localStorage.setItem('email', data.email)
      applyRoleTheme(data.role)

      toast.success('Company account created!')
      setSubmitted(true)
    } catch (err) {
      const msg = parseApiErrorMessage(err)
      setApiError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = () => {
    if (step === STEPS.length - 1) submit()
    else next()
  }

  if (submitted) {
    return (
      <div className="co-company-register">
        <RegistrationSuccess
          title={`Welcome, ${form.companyName}!`}
          description="Your company account is ready on SkillSwap."
          primaryAction={{ label: 'Sign in', onClick: () => navigate('/login') }}
        />
      </div>
    )
  }

  const profileSubtitle = skippedAi
    ? 'Enter your company details manually. Add a website or LinkedIn on the previous step anytime if you have one.'
    : 'Review and edit what AI suggested before creating your account'

  return (
    <div className="co-company-register">
      <RegistrationLayout
        steps={STEPS}
        current={step}
        brandEyebrow="Company onboarding"
        brandTitle={
          <>
            Hire talent.
            <br />
            Sponsor graduation projects.
          </>
        }
        brandDescription="Register your company to publish projects, mentor teams, and connect with skilled students on SkillSwap."
        highlights={COMPANY_HIGHLIGHTS}
        formTitle={FORM_TITLES[step]}
        formSubtitle={step === 2 ? profileSubtitle : FORM_SUBTITLES[step]}
        changeRole={
          onBack ? (
            <button type="button" onClick={onBack} className="text-sm font-medium text-primary hover:text-primary-deep">
              ← Change account type
            </button>
          ) : (
            <Link to="/register" className="text-sm font-medium text-primary hover:text-primary-deep">
              ← Change account type
            </Link>
          )
        }
        footer={
          step === 1 ? (
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 mt-6 border-t border-border">
              <GhostButton type="button" onClick={back} className="w-full sm:w-auto">
                Back
              </GhostButton>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <GhostButton type="button" onClick={skipAiAndGoManual} className="w-full sm:w-auto">
                  Skip AI — fill manually
                </GhostButton>
                <PrimaryButton
                  type="button"
                  onClick={runAnalysis}
                  loading={isAnalyzing}
                  className="co-reg-analyze w-full sm:w-auto min-w-[200px]"
                >
                  {!isAnalyzing ? <Sparkles className="h-4 w-4" /> : null}
                  {isAnalyzing ? 'Analyzing with AI…' : 'Analyze company with AI'}
                </PrimaryButton>
              </div>
            </div>
          ) : (
            <RegistrationStepFooter
              step={step}
              totalSteps={STEPS.length}
              onBack={back}
              onNext={handleNext}
              loading={isLoading}
              isLastStep={step === STEPS.length - 1}
              backLabel={step === 0 && onBack ? '← Back to account types' : 'Back'}
              nextLabel={step === STEPS.length - 1 ? 'Create company account' : 'Continue'}
            />
          )
        }
      >
        {apiError ? <AlertError title="Something went wrong">{apiError}</AlertError> : null}

        {step === 0 && (
          <FormSection title="Account" description="Create the account for your company representative.">
            <RegField label="Your name (contact person)" htmlFor="co-contact" required error={errors.contactName}>
              <TextInput
                id="co-contact"
                invalid={!!errors.contactName}
                leading={<User className="h-4 w-4" />}
                placeholder="e.g. Sara Ahmad"
                value={form.contactName}
                onChange={(e) => set('contactName', e.target.value)}
              />
            </RegField>
            <RegField label="Work email" htmlFor="co-email" required error={errors.email}>
              <TextInput
                id="co-email"
                type="email"
                invalid={!!errors.email}
                leading={<Mail className="h-4 w-4" />}
                placeholder="hr@company.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </RegField>
            <FieldGrid>
              <RegField label="Password" htmlFor="co-pass" required error={errors.password}>
                <TextInput
                  id="co-pass"
                  type={showPass ? 'text' : 'password'}
                  invalid={!!errors.password}
                  leading={<Lock className="h-4 w-4" />}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  trailing={
                    <button type="button" className="text-muted-foreground" onClick={() => setShowPass((x) => !x)}>
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
              </RegField>
              <RegField label="Confirm password" htmlFor="co-confirm" required error={errors.confirmPassword}>
                <TextInput
                  id="co-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  invalid={!!errors.confirmPassword}
                  leading={<Lock className="h-4 w-4" />}
                  value={form.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  trailing={
                    <button type="button" className="text-muted-foreground" onClick={() => setShowConfirm((x) => !x)}>
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
              </RegField>
            </FieldGrid>
          </FormSection>
        )}

        {step === 1 && (
          <FormSection
            title="Company links"
            description="Provide at least one link. If you only have LinkedIn, that works too."
          >
            <RegField label="Company website" htmlFor="co-web" error={errors.websiteUrl}>
              <TextInput
                id="co-web"
                invalid={!!errors.websiteUrl}
                leading={<Link2 className="h-4 w-4" />}
                placeholder="https://yourcompany.com"
                value={form.websiteUrl}
                onChange={(e) => set('websiteUrl', e.target.value)}
              />
            </RegField>
            <RegField label="LinkedIn company page" htmlFor="co-li">
              <TextInput
                id="co-li"
                leading={<Link2 className="h-4 w-4" />}
                placeholder="https://linkedin.com/company/..."
                value={form.linkedInUrl}
                onChange={(e) => set('linkedInUrl', e.target.value)}
              />
            </RegField>
          </FormSection>
        )}

        {step === 2 && (
          <FormSection title="Company profile" description={profileSubtitle}>
            {skippedAi ? (
              <p className="text-xs text-muted-foreground -mt-2 mb-2">
                No website yet? Describe your company clearly below (at least 40 characters), or go back and add a
                link.
              </p>
            ) : null}
            {analysisNote ? (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                {analysisNote}
              </p>
            ) : null}
            <RegField label="Company name" htmlFor="co-name" required error={errors.companyName}>
              <TextInput
                id="co-name"
                invalid={!!errors.companyName}
                leading={<Building2 className="h-4 w-4" />}
                value={form.companyName}
                onChange={(e) => set('companyName', e.target.value)}
              />
            </RegField>
            <FieldGrid>
              <RegField label="Industry" htmlFor="co-industry">
                <TextInput
                  id="co-industry"
                  placeholder="e.g. Software, FinTech"
                  value={form.industry}
                  onChange={(e) => set('industry', e.target.value)}
                />
              </RegField>
              <RegField label="Location" htmlFor="co-loc">
                <TextInput
                  id="co-loc"
                  placeholder="e.g. Nablus, Palestine"
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                />
              </RegField>
            </FieldGrid>
            <RegField label="About the company" htmlFor="co-desc" error={errors.description}>
              <Textarea
                id="co-desc"
                placeholder="What does your company do?"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </RegField>
            {(form.websiteUrl || form.linkedInUrl) && (
              <div className="text-xs text-muted-foreground space-y-1 pt-1">
                {form.websiteUrl ? <p>🌐 {form.websiteUrl}</p> : null}
                {form.linkedInUrl ? <p>in {form.linkedInUrl}</p> : null}
              </div>
            )}
          </FormSection>
        )}
      </RegistrationLayout>
    </div>
  )
}
