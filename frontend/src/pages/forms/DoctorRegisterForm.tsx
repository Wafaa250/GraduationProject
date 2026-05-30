import { useState, ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, GraduationCap, Users, BookOpen } from 'lucide-react'
import api, { parseApiErrorMessage } from '@/api/axiosInstance'
import { applyRoleTheme } from '@/lib/roleTheme'
import { navigateHome } from '@/utils/homeNavigation'
import { RegistrationLayout } from '@/components/registration/RegistrationLayout'
import { FormSection, FieldGrid, RegField } from '@/components/registration/FormSection'
import { TextInput, Textarea, RegSelect } from '@/components/registration/Inputs'
import { AlertError } from '@/components/registration/States'
import { RegistrationStepFooter } from '@/components/registration/RegistrationStepFooter'
import { RegistrationSuccess } from '@/components/registration/RegistrationSuccess'
import { ProfilePhotoUpload } from '@/components/registration/ProfilePhotoUpload'
import { GhostButton } from '@/components/registration/States'
import type { RegistrationStep } from '@/components/registration/types'

const UNIVERSITIES = ['An-Najah National University (NNU)']

const FACULTIES: Record<string, string[]> = {
  'An-Najah National University (NNU)': [
    'Engineering and Information Technology',
    'Information Technology',
    'Science',
    'Medicine and Health Sciences',
    'Pharmacy',
    'Nursing',
    'Agriculture and Veterinary Medicine',
  ],
}

const SPECIALIZATIONS = [
  'Computer Science', 'Software Engineering', 'Artificial Intelligence', 'Data Science',
  'Cyber Security', 'Web Development', 'Mobile Development', 'Computer Engineering',
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'Medicine', 'Pharmacy', 'Health Informatics', 'Nursing',
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Statistics',
  'Business Administration', 'Finance', 'Marketing', 'Economics',
  'Law', 'Education', 'Architecture', 'Environmental Science',
]

const STEPS: RegistrationStep[] = [
  { id: 'account', label: 'Account', hint: 'Email & password' },
  { id: 'academic', label: 'Academic', hint: 'University & departments' },
]

const DOCTOR_HIGHLIGHTS = [
  { icon: <GraduationCap className="h-4 w-4" />, label: 'Course channels', sub: 'Organize students by course' },
  { icon: <Users className="h-4 w-4" />, label: 'Team oversight', sub: 'Guide graduation project teams' },
  { icon: <BookOpen className="h-4 w-4" />, label: 'Project curation', sub: 'Publish graduation project ideas' },
]

const FORM_TITLES = ['Create your doctor account', 'Academic profile']
const FORM_SUBTITLES = [
  'Supervise teams and publish graduation projects on SkillSwap.',
  'Tell us about your university position and departments.',
]

interface FormState {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  profilePic: File | null
  profilePicPreview: string | null
  university: string
  faculty: string
  departments: string[]
  specialization: string
  bio: string
}

export default function DoctorRegisterForm({ onBack = null }: { onBack?: (() => void) | null }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [form, setForm] = useState<FormState>({
    fullName: '', email: '', password: '', confirmPassword: '',
    profilePic: null, profilePicPreview: null,
    university: '', faculty: '', departments: [''], specialization: '', bio: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: '' }))
  }

  const handlePic = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (ev.target?.result) set('profilePicPreview', ev.target.result as string)
    }
    reader.readAsDataURL(file)
    set('profilePic', file)
  }

  const handleUniversity = (val: string) => setForm((f) => ({ ...f, university: val, faculty: '' }))
  const availableFaculties = form.university ? (FACULTIES[form.university] ?? []) : []

  const handleDepartmentChange = (index: number, value: string) => {
    const updated = [...form.departments]
    updated[index] = value
    setForm({ ...form, departments: updated })
    setErrors((err) => ({ ...err, departments: '' }))
  }

  const addDepartment = () => setForm({ ...form, departments: [...form.departments, ''] })
  const removeDepartment = (index: number) => {
    setForm({ ...form, departments: form.departments.filter((_, i) => i !== index) })
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (step === 0) {
      if (!form.fullName.trim()) e.fullName = 'Full name is required'
      if (!form.email.trim()) e.email = 'Email is required'
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
      if (!form.password) e.password = 'Password is required'
      else if (form.password.length < 8) e.password = 'Min. 8 characters'
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    }
    if (step === 1) {
      if (!form.university) e.university = 'Please select university'
      if (!form.faculty) e.faculty = 'Please select faculty'
      if (form.departments.some((d) => !d.trim())) e.departments = 'All departments are required'
      if (!form.specialization) e.specialization = 'Please select specialization'
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

  const back = () => {
    if (step === 0 && onBack) onBack()
    else setStep((s) => Math.max(0, s - 1))
  }

  const submit = async () => {
    if (form.departments.some((d) => !d.trim())) {
      setErrors((e) => ({ ...e, departments: 'All departments are required' }))
      return
    }
    if (!validate()) return
    setIsLoading(true)
    setApiError(null)
    try {
      const payload = {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        university: form.university,
        faculty: form.faculty,
        department: form.departments.join(', '),
        specialization: form.specialization,
        bio: form.bio,
        profilePictureBase64: form.profilePicPreview,
        role: 'doctor',
      }
      const { data } = await api.post('/auth/register/doctor', payload)
      localStorage.setItem('token', data.token)
      localStorage.setItem('userId', data.userId.toString())
      localStorage.setItem('role', 'doctor')
      localStorage.setItem('name', data.name)
      applyRoleTheme('doctor')
      setSubmitted(true)
    } catch (err: unknown) {
      setApiError(parseApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const passChecks = [
    form.password.length >= 8,
    /[A-Z]/.test(form.password),
    /[0-9]/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ]
  const passScore = passChecks.filter(Boolean).length
  const passBarColors = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-primary']
  const passLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']

  if (submitted) {
    return (
      <RegistrationSuccess
        title={`Welcome, Dr. ${form.fullName.split(' ')[0]}!`}
        description="Your account is ready. Start creating channels for your courses."
        primaryAction={{ label: 'Sign in', onClick: () => navigate('/login') }}
        secondaryAction={{ label: 'Back to home', onClick: () => navigateHome(navigate) }}
      />
    )
  }

  return (
    <RegistrationLayout
      steps={STEPS}
      current={step}
      brandEyebrow="Doctor onboarding"
      brandTitle={
        <>
          Guide teams.
          <br />
          Shape graduation projects.
        </>
      }
      brandDescription="Create your supervisor profile so students can find your courses, channels, and published project ideas."
      highlights={DOCTOR_HIGHLIGHTS}
      formTitle={FORM_TITLES[step]}
      formSubtitle={FORM_SUBTITLES[step]}
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
        <RegistrationStepFooter
          step={step}
          totalSteps={STEPS.length}
          onBack={back}
          onNext={next}
          loading={isLoading}
          isLastStep={step === STEPS.length - 1}
          backLabel={step === 0 && onBack ? '← Back to account types' : 'Back'}
          nextLabel={step === STEPS.length - 1 ? 'Create account' : 'Continue'}
        />
      }
    >
      {step === 0 && (
        <>
          <FormSection title="Personal info" description="As shown on university records.">
            <ProfilePhotoUpload
              preview={form.profilePicPreview}
              onFile={(file) =>
                handlePic({ target: { files: [file] } } as unknown as ChangeEvent<HTMLInputElement>)
              }
            />
            <RegField label="Full name" htmlFor="doc-fullName" required error={errors.fullName}>
              <TextInput
                id="doc-fullName"
                invalid={!!errors.fullName}
                leading={<User className="h-4 w-4" />}
                placeholder="Dr. Mohammad Khalil"
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
              />
            </RegField>
          </FormSection>
          <FormSection title="Sign-in credentials" description="Use your university email when possible.">
            <RegField label="University email" htmlFor="doc-email" required error={errors.email}>
              <TextInput
                id="doc-email"
                type="email"
                invalid={!!errors.email}
                leading={<Mail className="h-4 w-4" />}
                placeholder="doctor@najah.edu"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </RegField>
            <FieldGrid>
              <RegField label="Password" htmlFor="doc-password" required error={errors.password}>
                <TextInput
                  id="doc-password"
                  type={showPass ? 'text' : 'password'}
                  invalid={!!errors.password}
                  leading={<Lock className="h-4 w-4" />}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  trailing={
                    <button type="button" className="text-muted-foreground" onClick={() => setShowPass((x) => !x)}>
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
              </RegField>
              <RegField label="Confirm password" htmlFor="doc-confirm" required error={errors.confirmPassword}>
                <TextInput
                  id="doc-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  invalid={!!errors.confirmPassword}
                  leading={<Lock className="h-4 w-4" />}
                  placeholder="Re-enter password"
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
            {form.password ? (
              <div className="flex items-center gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i < passScore ? passBarColors[passScore] : 'bg-muted'
                    }`}
                  />
                ))}
                <span className="text-xs font-semibold text-muted-foreground min-w-[44px]">
                  {passLabels[passScore]}
                </span>
              </div>
            ) : null}
          </FormSection>
        </>
      )}

      {step === 1 && (
        <FormSection title="Academic information" description="Tell us about your position.">
          <RegField label="University" htmlFor="doc-university" required error={errors.university}>
            <RegSelect
              id="doc-university"
              invalid={!!errors.university}
              value={form.university}
              onChange={(e) => handleUniversity(e.target.value)}
            >
              <option value="">Select your university</option>
              {UNIVERSITIES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </RegSelect>
          </RegField>
          <RegField label="Faculty / college" htmlFor="doc-faculty" required error={errors.faculty}>
            <RegSelect
              id="doc-faculty"
              invalid={!!errors.faculty}
              value={form.faculty}
              disabled={!form.university}
              onChange={(e) => set('faculty', e.target.value)}
            >
              <option value="">{form.university ? 'Select your faculty' : 'Select a university first'}</option>
              {availableFaculties.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </RegSelect>
          </RegField>
          <RegField label="Departments" required error={errors.departments}>
            <div className="space-y-2">
              {form.departments.map((dep, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <TextInput
                    className="flex-1"
                    invalid={!!errors.departments}
                    placeholder="e.g. Computer Engineering"
                    value={dep}
                    onChange={(e) => handleDepartmentChange(index, e.target.value)}
                  />
                  {form.departments.length > 1 ? (
                    <GhostButton type="button" onClick={() => removeDepartment(index)} className="shrink-0 px-3">
                      −
                    </GhostButton>
                  ) : null}
                </div>
              ))}
              <GhostButton type="button" onClick={addDepartment} className="text-primary">
                + Add department
              </GhostButton>
            </div>
          </RegField>
          <RegField label="Specialization" htmlFor="doc-spec" required error={errors.specialization}>
            <RegSelect
              id="doc-spec"
              invalid={!!errors.specialization}
              value={form.specialization}
              onChange={(e) => set('specialization', e.target.value)}
            >
              <option value="">Select your specialization</option>
              {SPECIALIZATIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </RegSelect>
          </RegField>
          <RegField label="Bio" htmlFor="doc-bio" hint="Optional">
            <Textarea
              id="doc-bio"
              placeholder="Brief description about your research interests and teaching areas..."
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
            />
          </RegField>
        </FormSection>
      )}

      {apiError ? <AlertError title="Registration failed">{apiError}</AlertError> : null}
    </RegistrationLayout>
  )
}
