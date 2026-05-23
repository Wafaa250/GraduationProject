import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, User, Building2, Users, Megaphone } from 'lucide-react'
import { AssociationLogoUpload } from '../../components/association/AssociationLogoUpload'
import {
  ASSOCIATION_CATEGORIES,
  registerStudentAssociation,
  uploadAssociationLogo,
  parseApiErrorMessage,
} from '../../../api/associationApi'
import { RegistrationLayout } from '../../components/registration/RegistrationLayout'
import { FormSection, FieldGrid, RegField } from '../../components/registration/FormSection'
import { TextInput, Textarea, RegSelect } from '../../components/registration/Inputs'
import { AlertError } from '../../components/registration/States'
import { RegistrationStepFooter } from '../../components/registration/RegistrationStepFooter'
import { RegistrationSuccess } from '../../components/registration/RegistrationSuccess'
import type { RegistrationStep } from '../../components/registration/types'

const FACULTIES = [
  'Engineering and Information Technology',
  'Information Technology',
  'Science',
  'Medicine and Health Sciences',
  'Pharmacy',
  'Nursing',
  'Agriculture and Veterinary Medicine',
]

const STEPS: RegistrationStep[] = [
  { id: 'account', label: 'Account', hint: 'Credentials' },
  { id: 'details', label: 'Details', hint: 'Profile & links' },
]

const ORG_HIGHLIGHTS = [
  { icon: <Users className="h-4 w-4" />, label: 'Reach students', sub: 'Promote events and initiatives' },
  { icon: <Megaphone className="h-4 w-4" />, label: 'Campus visibility', sub: 'Showcase your organization' },
  { icon: <Building2 className="h-4 w-4" />, label: 'Faculty alignment', sub: 'Connect with the right audience' },
]

const FORM_TITLES = ['Create your organization account', 'Organization details']
const FORM_SUBTITLES = [
  'Register your student organization on SkillSwap.',
  'Tell students about your organization and how to find you.',
]

type FormState = {
  associationName: string
  username: string
  email: string
  password: string
  confirmPassword: string
  description: string
  faculty: string
  category: string
  logoUrl: string
  instagramUrl: string
  facebookUrl: string
  linkedInUrl: string
}

export default function StudentAssociationRegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  const [form, setForm] = useState<FormState>({
    associationName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    description: '',
    faculty: '',
    category: '',
    logoUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    linkedInUrl: '',
  })

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (step === 0) {
      if (!form.associationName.trim()) e.associationName = 'Organization name is required'
      if (!form.username.trim()) e.username = 'Username is required'
      else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = 'Letters, numbers, underscores only'
      if (!form.email.trim()) e.email = 'Email is required'
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
      if (!form.password) e.password = 'Password is required'
      else if (form.password.length < 8) e.password = 'Min. 8 characters'
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    }
    if (step === 1) {
      if (!form.faculty) e.faculty = 'Faculty is required'
      if (!form.category) e.category = 'Category is required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (step < STEPS.length - 1) {
      if (validate()) setStep((s) => s + 1)
    } else {
      submit()
    }
  }

  const back = () => setStep((s) => Math.max(0, s - 1))

  const submit = async () => {
    if (!validate()) return
    setIsLoading(true)
    setApiError(null)
    try {
      const data = await registerStudentAssociation({
        associationName: form.associationName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        description: form.description.trim() || undefined,
        faculty: form.faculty,
        category: form.category,
        logoUrl: logoUrl ?? undefined,
        instagramUrl: form.instagramUrl.trim() || undefined,
        facebookUrl: form.facebookUrl.trim() || undefined,
        linkedInUrl: form.linkedInUrl.trim() || undefined,
      })

      localStorage.setItem('token', data.token)
      localStorage.setItem('userId', data.userId.toString())
      localStorage.setItem('role', data.role)
      localStorage.setItem('name', data.name)
      localStorage.setItem('email', data.email)

      if (pendingLogoFile) {
        const uploadedUrl = await uploadAssociationLogo(pendingLogoFile)
        setLogoUrl(uploadedUrl)
        setPendingLogoFile(null)
        toast.success('Logo uploaded')
      }

      toast.success('Organization account created!')
      setSubmitted(true)
    } catch (err) {
      const msg = parseApiErrorMessage(err)
      setApiError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <RegistrationSuccess
        title={`Welcome, ${form.associationName}!`}
        description="Your student organization account is ready on SkillSwap."
        primaryAction={{ label: 'Go to dashboard', onClick: () => navigate('/association/dashboard') }}
        secondaryAction={{ label: 'Sign in', onClick: () => navigate('/login') }}
      />
    )
  }

  return (
    <RegistrationLayout
      steps={STEPS}
      current={step}
      brandEyebrow="Organization onboarding"
      brandTitle={
        <>
          Grow your community.
          <br />
          Reach the right students.
        </>
      }
      brandDescription="Register your student organization to promote events, recruit members, and connect with students on SkillSwap."
      highlights={ORG_HIGHLIGHTS}
      formTitle={FORM_TITLES[step]}
      formSubtitle={FORM_SUBTITLES[step]}
      changeRole={
        <Link to="/register" className="text-sm font-medium text-primary hover:text-primary-deep">
          ← Change account type
        </Link>
      }
      footer={
        <RegistrationStepFooter
          step={step}
          totalSteps={STEPS.length}
          onBack={back}
          onNext={next}
          loading={isLoading}
          isLastStep={step === STEPS.length - 1}
          backLabel={step === 0 ? '← Back to account types' : 'Back'}
          nextLabel={step === STEPS.length - 1 ? 'Create account' : 'Continue'}
        />
      }
    >
      {step === 0 && (
        <FormSection title="Account" description="Create your organization account.">
          <RegField label="Organization name" htmlFor="org-name" required error={errors.associationName}>
            <TextInput
              id="org-name"
              invalid={!!errors.associationName}
              leading={<Building2 className="h-4 w-4" />}
              placeholder="e.g. NNU Developers Club"
              value={form.associationName}
              onChange={(e) => set('associationName', e.target.value)}
            />
          </RegField>
          <RegField label="Username" htmlFor="org-user" required error={errors.username}>
            <TextInput
              id="org-user"
              invalid={!!errors.username}
              leading={<User className="h-4 w-4" />}
              placeholder="e.g. nnu_devclub"
              value={form.username}
              onChange={(e) => set('username', e.target.value)}
            />
          </RegField>
          <RegField label="Email" htmlFor="org-email" required error={errors.email}>
            <TextInput
              id="org-email"
              type="email"
              invalid={!!errors.email}
              leading={<Mail className="h-4 w-4" />}
              placeholder="contact@organization.edu"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </RegField>
          <FieldGrid>
            <RegField label="Password" htmlFor="org-pass" required error={errors.password}>
              <TextInput
                id="org-pass"
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
            <RegField label="Confirm password" htmlFor="org-confirm" required error={errors.confirmPassword}>
              <TextInput
                id="org-confirm"
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
        <FormSection title="Organization details" description="Tell students about your organization.">
          <RegField label="Description" htmlFor="org-desc">
            <Textarea
              id="org-desc"
              placeholder="What does your organization do?"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </RegField>
          <RegField label="Faculty" htmlFor="org-faculty" required error={errors.faculty}>
            <RegSelect
              id="org-faculty"
              invalid={!!errors.faculty}
              value={form.faculty}
              onChange={(e) => set('faculty', e.target.value)}
            >
              <option value="">Select faculty</option>
              {FACULTIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </RegSelect>
          </RegField>
          <RegField label="Category" htmlFor="org-cat" required error={errors.category}>
            <RegSelect
              id="org-cat"
              invalid={!!errors.category}
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            >
              <option value="">Select category</option>
              {ASSOCIATION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </RegSelect>
          </RegField>
          <AssociationLogoUpload
            logoUrl={logoUrl}
            onLogoUrlChange={setLogoUrl}
            canUpload={false}
            onPendingFile={setPendingLogoFile}
            disabled={isLoading}
          />
          <p className="text-sm font-medium text-foreground pt-2">Social links</p>
          <p className="text-xs text-muted-foreground -mt-2 mb-2">Optional</p>
          <RegField label="Instagram" htmlFor="org-ig">
            <TextInput
              id="org-ig"
              value={form.instagramUrl}
              onChange={(e) => set('instagramUrl', e.target.value)}
            />
          </RegField>
          <RegField label="Facebook" htmlFor="org-fb">
            <TextInput
              id="org-fb"
              value={form.facebookUrl}
              onChange={(e) => set('facebookUrl', e.target.value)}
            />
          </RegField>
          <RegField label="LinkedIn" htmlFor="org-li">
            <TextInput
              id="org-li"
              value={form.linkedInUrl}
              onChange={(e) => set('linkedInUrl', e.target.value)}
            />
          </RegField>
        </FormSection>
      )}

      {apiError ? <AlertError title="Registration failed">{apiError}</AlertError> : null}
    </RegistrationLayout>
  )
}
