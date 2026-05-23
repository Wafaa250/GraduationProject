import { useState, useEffect, type ReactNode, type ChangeEvent, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Sparkles, Users, GraduationCap } from 'lucide-react'
import { useUser } from '@/context/UserContext'
import { registerStudent } from '@/api/authApi'
import { navigateHome } from '@/utils/homeNavigation'
import { RegistrationLayout } from '@/components/registration/RegistrationLayout'
import { FormSection, FieldGrid, RegField } from '@/components/registration/FormSection'
import { TextInput, RegSelect } from '@/components/registration/Inputs'
import { AlertError, AlertSuccess } from '@/components/registration/States'
import { RegistrationStepFooter } from '@/components/registration/RegistrationStepFooter'
import { RegistrationSuccess } from '@/components/registration/RegistrationSuccess'
import { ProfilePhotoUpload } from '@/components/registration/ProfilePhotoUpload'
import { ReviewGroup, ReviewItem } from '@/components/registration/Review'
import type { RegistrationStep } from '@/components/registration/types'
import {
  CUSTOM_SKILL_MAX_LENGTH,
  customSelections,
  getSkillsPack,
  normalizeCustomSkill,
} from '@/constants/studentSkillPools'

interface FormState {
  fullName: string; email: string; password: string; confirmPassword: string
  profilePic: File | null; profilePicPreview: string | null
  studentId: string; university: string; faculty: string; major: string
  academicYear: string; gpa: string
  roles: string[]; technicalSkills: string[]; tools: string[]
}

const UNIVERSITIES = ['An-Najah National University (NNU)']
const UNIVERSITY_FACULTIES: Record<string, string[]> = {
  'An-Najah National University (NNU)': [
    'Engineering and Information Technology','Information Technology','Science',
    'Medicine and Health Sciences','Pharmacy','Nursing','Agriculture and Veterinary Medicine',
  ],
}
const MAJORS: Record<string, string[]> = {
  'Engineering and Information Technology': ['Computer Engineering','Electrical Engineering','Mechanical Engineering','Civil Engineering','Industrial Engineering','Architectural Engineering','Mechatronics Engineering','Communication Engineering','Energy and Renewable Energy Engineering'],
  'Information Technology': ['Computer Science','Information Technology','Software Engineering','Artificial Intelligence','Data Science','Cyber Security','Network Systems'],
  'Science': ['Mathematics','Physics','Chemistry','Biology','Biotechnology','Statistics','Environmental Sciences'],
  'Medicine and Health Sciences': ['Medicine','Health Information Management','Medical Imaging','Clinical Nutrition','Physical Therapy','Anesthesia and Resuscitation Technology','Medical Laboratory Sciences','Optometry'],
  'Pharmacy': ['Pharmacy','Doctor of Pharmacy (PharmD)'],
  'Nursing': ['Nursing'],
  'Agriculture and Veterinary Medicine': ['Agriculture','Plant Production and Protection','Animal Production','Food Science and Technology','Veterinary Medicine'],
}
const STEPS: RegistrationStep[] = [
  { id: 'account', label: 'Account', hint: 'Email & password' },
  { id: 'academic', label: 'Academic', hint: 'University & program' },
  { id: 'skills', label: 'Skills & interests', hint: 'AI matching profile' },
  { id: 'review', label: 'Review', hint: 'Confirm and submit' },
]

const ACADEMIC_YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Fifth Year']

const STUDENT_HIGHLIGHTS = [
  { icon: <Sparkles className="h-4 w-4" />, label: 'AI-powered matching', sub: 'Complementary skill suggestions' },
  { icon: <GraduationCap className="h-4 w-4" />, label: 'Graduation project opportunities', sub: 'From faculty supervisors and industry partners' },
  { icon: <Users className="h-4 w-4" />, label: 'Balanced team formation', sub: 'Roles, skills, and expertise' },
]

const SKILLS_COLLAPSE_MAX_PX = 560

export default function StudentRegisterForm({ onBack = null }: { onBack?: (() => void) | null }) {
  const navigate = useNavigate()
  const { updateProfile } = useUser()
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState<FormState>({
    fullName:'',email:'',password:'',confirmPassword:'',profilePic:null,profilePicPreview:null,
    studentId:'',university:'',faculty:'',major:'',academicYear:'',gpa:'',
    roles:[],technicalSkills:[],tools:[],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [customDraft, setCustomDraft] = useState({ roles: '', technicalSkills: '', tools: '' })
  const [skillsNarrow, setSkillsNarrow] = useState(false)
  const [skillPanelOpen, setSkillPanelOpen] = useState({ roles: true, technicalSkills: true, tools: true })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia(`(max-width: ${SKILLS_COLLAPSE_MAX_PX - 1}px)`)
    const apply = () => setSkillsNarrow(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (step !== 2) return
    if (typeof window === 'undefined') return
    const narrow = window.innerWidth < SKILLS_COLLAPSE_MAX_PX
    setSkillPanelOpen({
      roles: true,
      technicalSkills: !narrow,
      tools: !narrow,
    })
  }, [step])

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }
  const toggle = (field: 'roles' | 'technicalSkills' | 'tools', val: string) => {
    setForm(f => { const arr = f[field] as string[]; return { ...f, [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] } })
  }
  const addCustomSkill = (field: 'roles' | 'technicalSkills' | 'tools') => {
    const v = normalizeCustomSkill(customDraft[field])
    if (!v) return
    setForm(f => {
      const arr = f[field] as string[]
      if (arr.some(x => x.toLowerCase() === v.toLowerCase())) return f
      return { ...f, [field]: [...arr, v] }
    })
    setCustomDraft(d => ({ ...d, [field]: '' }))
    setErrors(e => ({ ...e, [field]: '' }))
  }
  const handlePic = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { if (ev.target?.result) set('profilePicPreview', ev.target.result as string) }
    reader.readAsDataURL(file); set('profilePic', file)
  }
  const handleUniversity = (val: string) => {
    setForm(f => ({ ...f, university: val, faculty: '', major: '', roles: [], technicalSkills: [], tools: [] }))
    setCustomDraft({ roles: '', technicalSkills: '', tools: '' })
  }
  const handleFaculty = (val: string) => {
    setForm(f => ({ ...f, faculty: val, major: '', roles: [], technicalSkills: [], tools: [] }))
    setCustomDraft({ roles: '', technicalSkills: '', tools: '' })
  }
  const handleMajor = (val: string) => {
    setForm(f => ({ ...f, major: val, roles: [], technicalSkills: [], tools: [] }))
    setCustomDraft({ roles: '', technicalSkills: '', tools: '' })
  }

  const availableFaculties = form.university ? (UNIVERSITY_FACULTIES[form.university] ?? []) : []
  const availableMajors = MAJORS[form.faculty] ?? []
  const skillsData = getSkillsPack(form.faculty, form.major)

  const validate = () => {
    const e: Record<string, string> = {}
    if (step === 0) {
      if (!form.fullName.trim()) e.fullName = 'Full name is required'
      if (!form.email.trim()) e.email = 'Email is required'
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Please enter a valid email'
      if (!form.password) e.password = 'Password is required'
      else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    }
    if (step === 1) {
      if (!form.studentId.trim()) e.studentId = 'Student ID is required'
      if (!form.university) e.university = 'Please select your university'
      if (!form.faculty) e.faculty = 'Please select your faculty'
      if (!form.major) e.major = 'Please select your major'
      if (!form.academicYear) e.academicYear = 'Please select your academic year'
      if (form.gpa.trim() && (isNaN(parseFloat(form.gpa)) || parseFloat(form.gpa) < 0 || parseFloat(form.gpa) > 4))
        e.gpa = 'GPA must be between 0.0 and 4.0'
    }
    if (step === 2) {
      if (form.roles.length === 0) e.roles = 'Please select at least one team role'
    }
    setErrors(e); return Object.keys(e).length === 0
  }

  const next = () => {
    if (step === STEPS.length - 1) {
      submit()
      return
    }
    if (validate()) setStep((s) => s + 1)
  }
  const back = () => {
    if (step === 0 && onBack) onBack()
    else setStep((s) => Math.max(0, s - 1))
  }
  const goToStep = (i: number) => {
    if (i < step) setStep(i)
  }
  const submit = async () => {
    if (!validate()) return
    setIsLoading(true); setApiError(null)
    try {
     const payload = {
  fullName: form.fullName,
  email: form.email,
  password: form.password,
  confirmPassword: form.confirmPassword,

  profilePictureBase64: form.profilePicPreview,

  studentId: form.studentId,
  university: form.university,
  faculty: form.faculty,
  major: form.major,
  academicYear: form.academicYear,

  gpa: form.gpa.trim() ? parseFloat(form.gpa) : null,

  roles: form.roles,
  technicalSkills: form.technicalSkills,
  tools: form.tools,

  generalSkills: form.roles,
  majorSkills: form.technicalSkills
}
      const result = await registerStudent(payload)
      localStorage.setItem('token', result.token); localStorage.setItem('userId', result.userId.toString()); localStorage.setItem('role', result.role)
      updateProfile({ fullName:result.name, email:result.email, profilePic:form.profilePicPreview, studentId:form.studentId, university:result.university, faculty:result.faculty, major:result.major, academicYear:result.academicYear, gpa:form.gpa, roles:form.roles, technicalSkills:form.technicalSkills, tools:form.tools })
      sessionStorage.setItem('selectedRole','student'); setSubmitted(true)
    } catch (error: any) {
      setApiError(error.response?.data?.message || error.response?.data?.errors?.[0] || 'Something went wrong. Please try again.')
    } finally { setIsLoading(false) }
  }

  const passChecks = [form.password.length>=8, /[A-Z]/.test(form.password), /[0-9]/.test(form.password), /[^A-Za-z0-9]/.test(form.password)]
  const passScore = passChecks.filter(Boolean).length
  const passLabels = ['','Weak','Fair','Good','Strong']
  const passColors = ['','#ef4444','#f59e0b','#10b981','#6366f1']
  const formTitles = [
    'Create your student account',
    'Academic profile',
    'Skills & interests',
    'Review and confirm',
  ]
  const formSubtitles = [
    'Enter your details as they appear on university records. A university email address is recommended.',
    'Provide your program information so SkillSwap can tailor skills and project recommendations.',
    'Select roles, skills, and tools that reflect how you contribute on graduation projects.',
    'Review your information before submitting your registration.',
  ]

  if (submitted) {
    return (
      <RegistrationSuccess
        title="Registration complete"
        description={
          <>
            Welcome to SkillSwap, <strong className="text-primary">{form.fullName}</strong>. Your profile is
            ready—you can explore teammates and graduation project opportunities from your dashboard.
          </>
        }
        stats={[
          { label: 'Roles', value: form.roles.length },
          { label: 'Technical skills', value: form.technicalSkills.length, color: '#a855f7' },
          { label: 'Tools', value: form.tools.length },
        ]}
        primaryAction={{
          label: 'Go to dashboard',
          onClick: () => {
            sessionStorage.removeItem('selectedRole')
            navigateHome(navigate)
          },
        }}
        secondaryAction={{
          label: 'Sign in',
          onClick: () => {
            sessionStorage.removeItem('selectedRole')
            navigate('/login')
          },
        }}
      />
    )
  }

  return (
    <RegistrationLayout
      steps={STEPS}
      current={step}
      onJump={goToStep}
      brandEyebrow="Student onboarding"
      brandTitle={
        <>
          Find your team.
          <br />
          Complete your graduation project.
        </>
      }
      brandDescription="Build your skill profile and discover compatible teammates, supervisors, and graduation project opportunities through AI-powered matching."
      highlights={STUDENT_HIGHLIGHTS}
      formTitle={formTitles[step]}
      formSubtitle={formSubtitles[step]}
      changeRole={
        onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-primary hover:text-primary-deep"
          >
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
          <FormSection title="Personal information" description="As recorded by your university.">
            <ProfilePhotoUpload
              preview={form.profilePicPreview}
              label="Profile photo"
              hint="Optional · JPG or PNG · You can update this later in your profile"
              onFile={(file) => handlePic({ target: { files: [file] } } as unknown as ChangeEvent<HTMLInputElement>)}
            />
            <RegField label="Full name" htmlFor="fullName" required error={errors.fullName}>
              <TextInput
                id="fullName"
                invalid={!!errors.fullName}
                leading={<User className="h-4 w-4" />}
                placeholder="Mohammad Abdullah"
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
              />
            </RegField>
          </FormSection>
          <FormSection title="Sign-in credentials" description="Used for account access and platform notifications.">
            <RegField label="University email" htmlFor="email" required error={errors.email}>
              <TextInput
                id="email"
                type="email"
                autoComplete="email"
                invalid={!!errors.email}
                leading={<Mail className="h-4 w-4" />}
                placeholder="you@university.edu"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </RegField>
            <FieldGrid>
              <RegField label="Password" htmlFor="password" required error={errors.password} hint="At least 8 characters, including a number and a symbol.">
                <TextInput
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  invalid={!!errors.password}
                  leading={<Lock className="h-4 w-4" />}
                  trailing={
                    <button type="button" onClick={() => setShowPass((x) => !x)} className="text-muted-foreground">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                />
              </RegField>
              <RegField label="Confirm password" htmlFor="confirmPassword" required error={errors.confirmPassword}>
                <TextInput
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  invalid={!!errors.confirmPassword}
                  leading={<Lock className="h-4 w-4" />}
                  trailing={
                    <button type="button" onClick={() => setShowConfirm((x) => !x)} className="text-muted-foreground">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                />
              </RegField>
            </FieldGrid>
            {form.password.length > 0 && (
              <div className="flex items-center gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-colors"
                    style={{ background: i < passScore ? passColors[passScore] : '#e2e8f0' }}
                  />
                ))}
                <span className="text-xs font-semibold min-w-[44px]" style={{ color: passColors[passScore] }}>
                  {passLabels[passScore]}
                </span>
              </div>
            )}
          </FormSection>
        </>
      )}

      {step === 1 && (
        <>
          <FormSection title="Student and program" description="Used to tailor your skills catalog and project recommendations.">
            <FieldGrid>
              <RegField label="Student ID" htmlFor="studentId" required error={errors.studentId}>
                <TextInput
                  id="studentId"
                  invalid={!!errors.studentId}
                  placeholder="2021123456"
                  value={form.studentId}
                  onChange={(e) => set('studentId', e.target.value)}
                />
              </RegField>
              <RegField label="University" htmlFor="university" required error={errors.university}>
                <RegSelect
                  id="university"
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
            </FieldGrid>
            <RegField label="Faculty / college" htmlFor="faculty" required error={errors.faculty}>
              <RegSelect
                id="faculty"
                invalid={!!errors.faculty}
                value={form.faculty}
                disabled={!form.university}
                onChange={(e) => handleFaculty(e.target.value)}
              >
                <option value="">{form.university ? 'Select faculty' : 'Select university first'}</option>
                {availableFaculties.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </RegSelect>
            </RegField>
            <RegField label="Major / department" htmlFor="major" required error={errors.major}>
              <RegSelect
                id="major"
                invalid={!!errors.major}
                value={form.major}
                disabled={!form.faculty}
                onChange={(e) => handleMajor(e.target.value)}
              >
                <option value="">{form.faculty ? 'Select major' : 'Select faculty first'}</option>
                {availableMajors.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </RegSelect>
            </RegField>
          </FormSection>
          <FormSection title="Academic standing">
            <RegField label="Academic year" required error={errors.academicYear}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {ACADEMIC_YEARS.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => set('academicYear', y)}
                    className={`rounded-lg border px-2 py-2.5 text-xs font-semibold transition ${
                      form.academicYear === y
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </RegField>
            <RegField label="GPA (optional)" htmlFor="gpa" hint="Scale 0.0 – 4.0" error={errors.gpa}>
              <TextInput
                id="gpa"
                placeholder="e.g. 3.50"
                value={form.gpa}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '' || (/^\d*\.?\d*$/.test(val) && parseFloat(val) <= 4)) set('gpa', val)
                }}
              />
            </RegField>
          </FormSection>
        </>
      )}

      {step === 2 && (
        <FormSection title="Your skills" description="These selections inform AI teammate and graduation project recommendations.">
          {!skillsData ? (
            <AlertError title="Complete your academic profile first">
              Select your faculty and major to view skills aligned with your program.
            </AlertError>
          ) : (
            <>
              {skillsNarrow && (
                <p className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/30 px-3 py-2">
                  Roles {form.roles.length} · Technical {form.technicalSkills.length} · Tools{' '}
                  {form.tools.length}
                </p>
              )}
              <SkillGroup
                  title="Team roles"
                  badge={`${form.roles.length} selected`}
                  hint="How you typically contribute on graduation projects (independent of your major)"
                  required
                  error={errors.roles}
                  collapsible={skillsNarrow}
                  expanded={skillPanelOpen.roles}
                  onToggle={() => setSkillPanelOpen(p => ({ ...p, roles: !p.roles }))}
                >
                  <div style={S.chipGrid}>
                    {skillsData.roles.map(r => (
                      <ChipBtn key={r} label={r} active={form.roles.includes(r)} onClick={() => toggle('roles', r)} color="indigo" />
                    ))}
                    {customSelections(form.roles, skillsData.roles).map(r => (
                      <ChipBtn key={`custom-${r}`} label={r} active onClick={() => toggle('roles', r)} color="indigo" />
                    ))}
                  </div>
                  <CustomSkillAddRow
                    value={customDraft.roles}
                    onChange={v => setCustomDraft(d => ({ ...d, roles: v }))}
                    onAdd={() => addCustomSkill('roles')}
                    maxLen={CUSTOM_SKILL_MAX_LENGTH}
                  />
                </SkillGroup>

                {/* Technical Skills */}
                <SkillGroup
                  title="Technical skills"
                  badge={`${form.technicalSkills.length} selected`}
                  hint="Areas where you have practical experience"
                  collapsible={skillsNarrow}
                  expanded={skillPanelOpen.technicalSkills}
                  onToggle={() => setSkillPanelOpen(p => ({ ...p, technicalSkills: !p.technicalSkills }))}
                >
                  <div style={S.chipGrid}>
                    {skillsData.technicalSkills.map(s => (
                      <ChipBtn
                        key={s}
                        label={s}
                        active={form.technicalSkills.includes(s)}
                        onClick={() => toggle('technicalSkills', s)}
                        color="purple"
                      />
                    ))}
                    {customSelections(form.technicalSkills, skillsData.technicalSkills).map(s => (
                      <ChipBtn key={`custom-${s}`} label={s} active onClick={() => toggle('technicalSkills', s)} color="purple" />
                    ))}
                  </div>
                  <CustomSkillAddRow
                    value={customDraft.technicalSkills}
                    onChange={v => setCustomDraft(d => ({ ...d, technicalSkills: v }))}
                    onAdd={() => addCustomSkill('technicalSkills')}
                    maxLen={CUSTOM_SKILL_MAX_LENGTH}
                  />
                </SkillGroup>

                {/* Technologies & Tools */}
                <SkillGroup
                  title="Technologies and tools"
                  badge={`${form.tools.length} selected`}
                  hint="Languages, frameworks, and software you use in coursework or projects"
                  collapsible={skillsNarrow}
                  expanded={skillPanelOpen.tools}
                  onToggle={() => setSkillPanelOpen(p => ({ ...p, tools: !p.tools }))}
                >
                  <div style={S.chipGrid}>
                    {skillsData.tools.map(t => (
                      <ChipBtn key={t} label={t} active={form.tools.includes(t)} onClick={() => toggle('tools', t)} color="teal" />
                    ))}
                    {customSelections(form.tools, skillsData.tools).map(t => (
                      <ChipBtn key={`custom-${t}`} label={t} active onClick={() => toggle('tools', t)} color="teal" />
                    ))}
                  </div>
                  <CustomSkillAddRow
                    value={customDraft.tools}
                    onChange={v => setCustomDraft(d => ({ ...d, tools: v }))}
                    onAdd={() => addCustomSkill('tools')}
                    maxLen={CUSTOM_SKILL_MAX_LENGTH}
                  />
                </SkillGroup>
              </>
            )}
        </FormSection>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <ReviewGroup title="Account" onEdit={() => setStep(0)}>
            <ReviewItem label="Name" value={form.fullName} />
            <ReviewItem label="Email" value={form.email} />
          </ReviewGroup>
          <ReviewGroup title="Academic" onEdit={() => setStep(1)}>
            <ReviewItem label="Student ID" value={form.studentId} />
            <ReviewItem label="University" value={form.university} />
            <ReviewItem label="Faculty" value={form.faculty} />
            <ReviewItem label="Major" value={form.major} />
            <ReviewItem label="Year" value={form.academicYear} />
            <ReviewItem label="GPA" value={form.gpa || '—'} />
          </ReviewGroup>
          <ReviewGroup title="Skills" onEdit={() => setStep(2)}>
            <ReviewItem label="Team roles" value={form.roles.join(', ') || '—'} />
            <ReviewItem label="Technical" value={form.technicalSkills.join(', ') || '—'} />
            <ReviewItem label="Tools" value={form.tools.join(', ') || '—'} />
          </ReviewGroup>
          <AlertSuccess title="Ready to submit">
            Select Create account to complete registration. You may update your profile at any time after signing in.
          </AlertSuccess>
        </div>
      )}

      {apiError ? (
        <div className="mt-4">
          <AlertError title="Registration failed">{apiError}</AlertError>
        </div>
      ) : null}
    </RegistrationLayout>
  )
}

function SkillGroup({
  title,
  badge,
  hint,
  required = false,
  error,
  children,
  collapsible = false,
  expanded = true,
  onToggle,
}: {
  title: string
  badge: string
  hint: string
  required?: boolean
  error?: string
  children: ReactNode
  collapsible?: boolean
  expanded?: boolean
  onToggle?: () => void
}) {
  const showBody = !collapsible || expanded
  const headInner = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: 0, cursor: collapsible ? 'pointer' : undefined }}>
          {title}
          {required && <span style={{ color: '#ef4444' }}> *</span>}
        </label>
        <span style={{ padding: '2px 8px', background: '#eef2ff', color: '#6366f1', borderRadius: 10, fontSize: 11, fontWeight: 700, border: '1px solid #c7d2fe' }}>{badge}</span>
      </div>
      {collapsible ? (
        <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      ) : null}
    </div>
  )

  return (
    <div style={{ marginBottom: 28 }}>
      {collapsible ? (
        <button type="button" style={S.skillSectionHeadBtn} onClick={onToggle} title={hint}>
          {headInner}
        </button>
      ) : (
        <div style={{ marginBottom: 4 }}>{headInner}</div>
      )}
      {collapsible && !expanded ? (
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '6px 0 0', lineHeight: 1.45 }}>
          Tap the header to open this section — every option is still here; nothing is removed.
        </p>
      ) : null}
      {showBody ? (
        <>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: collapsible ? '10px 0 8px' : '0 0 10px' }}>{hint}</p>
          {children}
        </>
      ) : null}
      {error && <span style={{ display: 'block', fontSize: 12, color: '#ef4444', marginTop: 6, fontWeight: 500 }}>{error}</span>}
    </div>
  )
}

function CustomSkillAddRow({
  value,
  onChange,
  onAdd,
  maxLen,
}: {
  value: string
  onChange: (v: string) => void
  onAdd: () => void
  maxLen: number
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 8px' }}>
        Not listed below? Add a custom entry (up to {maxLen} characters), then select Add or press Enter.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          style={{ ...S.input, flex: '1 1 220px', maxWidth: '100%' }}
          value={value}
          maxLength={maxLen}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onAdd()
            }
          }}
          placeholder="e.g. specific framework or method"
        />
        <button type="button" style={S.btnAddCustom} onClick={onAdd}>
          Add
        </button>
      </div>
    </div>
  )
}

function ChipBtn({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color: 'indigo'|'purple'|'teal' }) {
  const colors = {
    indigo: { bg:'#eef2ff', border:'#6366f1', text:'#6366f1' },
    purple: { bg:'#faf5ff', border:'#a855f7', text:'#a855f7' },
    teal:   { bg:'#f0fdfa', border:'#14b8a6', text:'#0d9488' },
  }
  const c = colors[color]
  return (
    <button onClick={onClick} style={{padding:'7px 14px',borderRadius:20,border:`1.5px solid ${active?c.border:'#e2e8f0'}`,background:active?c.bg:'#f8fafc',color:active?c.text:'#64748b',fontSize:12,fontWeight:active?700:500,cursor:'pointer',fontFamily:'inherit',transition:'all 0.18s',display:'flex',alignItems:'center',gap:5}}>
      {active&&<span style={{fontSize:10,fontWeight:900}}>✓</span>}{label}
    </button>
  )
}

const S: Record<string, CSSProperties> = {
  page:          {minHeight:'100vh',background:'linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)',display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'40px 20px 60px',fontFamily:'DM Sans, sans-serif',position:'relative',overflow:'hidden'},
  wrap:          {width:'100%',maxWidth:680,position:'relative',zIndex:1},
  logoRow:       {display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:24},
  logoIcon:      {width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#6366f1,#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(99,102,241,0.3)'},
  logoText:      {fontSize:22,fontWeight:800,color:'#0f172a',fontFamily:'Syne, sans-serif'},
  logoAccent:    {background:'linear-gradient(135deg,#6366f1,#a855f7)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'},
  stepper:       {display:'flex',alignItems:'center',justifyContent:'center',marginBottom:24,flexWrap:'wrap' as const,gap:4},
  stepDot:       {width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.3s'},
  stepDotActive: {background:'linear-gradient(135deg,#6366f1,#a855f7)',boxShadow:'0 2px 8px rgba(99,102,241,0.4)'},
  stepDotDone:   {background:'linear-gradient(135deg,#6366f1,#a855f7)'},
  stepDotIdle:   {background:'white',border:'2px solid #e2e8f0'},
  card:          {background:'white',border:'1px solid #e2e8f0',borderRadius:20,padding:'36px 40px',boxShadow:'0 8px 32px rgba(99,102,241,0.08),0 1px 3px rgba(0,0,0,0.04)'},
  row2:          {display:'grid',gridTemplateColumns:'1fr 1fr',gap:16},
  label:         {display:'block',fontSize:13,fontWeight:600,color:'#374151',marginBottom:6},
  input:         {width:'100%',padding:'11px 14px',background:'white',border:'1.5px solid #e2e8f0',borderRadius:10,color:'#1e293b',fontSize:14,boxSizing:'border-box' as const,transition:'border-color 0.2s,box-shadow 0.2s',fontFamily:'inherit'},
  error:         {display:'block',fontSize:12,color:'#ef4444',marginTop:4,fontWeight:500},
  picRow:        {display:'flex',alignItems:'center',gap:16,marginBottom:20,padding:16,background:'#f8fafc',borderRadius:12,border:'1px solid #f1f5f9'},
  picCircle:     {width:68,height:68,borderRadius:'50%',background:'#f1f5f9',border:'2px dashed #cbd5e1',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,overflow:'hidden'},
  picBtn:        {padding:'6px 14px',background:'#eef2ff',border:'1px solid #c7d2fe',borderRadius:8,color:'#6366f1',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'},
  chipGrid:      {display:'flex',flexWrap:'wrap' as const,gap:8},
  skillsSummaryBar: { display:'flex',flexDirection:'column' as const,gap:4,marginBottom:18,padding:'12px 14px',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:12,fontSize:12 },
  skillSectionHeadBtn: { display:'block',width:'100%',textAlign:'left' as const,background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:12,padding:'12px 14px',marginBottom:0,cursor:'pointer',fontFamily:'inherit'},
  navRow:        {display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:28,paddingTop:22,borderTop:'1px solid #f1f5f9'},
  btnBack:       {padding:'10px 20px',background:'white',border:'1.5px solid #e2e8f0',borderRadius:10,color:'#64748b',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'},
  btnPrimary:    {padding:'11px 26px',background:'linear-gradient(135deg,#4f46e5,#9333ea)',color:'white',border:'none',borderRadius:10,fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 14px rgba(99,102,241,0.35)'},
  changeRoleBtn: {background:'none',border:'none',color:'#6366f1',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit',marginRight:8},
  roleBadge:     {display:'inline-block',padding:'3px 12px',background:'#eef2ff',border:'1px solid #c7d2fe',borderRadius:20,color:'#6366f1',fontSize:12,fontWeight:700},
  successWrap:   {margin:'60px auto',maxWidth:460,background:'white',border:'1px solid #e2e8f0',borderRadius:24,padding:'48px 40px',textAlign:'center' as const,boxShadow:'0 8px 40px rgba(99,102,241,0.1)'},
  successIcon:   {width:68,height:68,margin:'0 auto 20px',display:'flex',alignItems:'center',justifyContent:'center',background:'#eef2ff',borderRadius:'50%',border:'1px solid #c7d2fe'},
  successH2:     {fontSize:24,fontWeight:800,color:'#0f172a',margin:'0 0 10px',fontFamily:'Syne, sans-serif'},
  successP:      {color:'#64748b',fontSize:14,lineHeight:1.7,margin:'0 0 28px'},
  successStats:  {display:'flex',alignItems:'center',justifyContent:'center',background:'#f8fafc',border:'1px solid #f1f5f9',borderRadius:14,padding:'16px 24px',marginBottom:24},
  successStat:   {flex:1,display:'flex',flexDirection:'column' as const,alignItems:'center',gap:4},
  successNum:    {fontSize:22,fontWeight:800},
  successLabel:  {fontSize:11,color:'#94a3b8',fontWeight:600,textTransform:'uppercase' as const,letterSpacing:'0.05em'},
  successDivider:{width:1,height:36,background:'#e2e8f0',margin:'0 16px'},
  btnOutline:    {padding:'11px 24px',background:'white',border:'1.5px solid #e2e8f0',borderRadius:10,color:'#64748b',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'},
  btnAddCustom:  {padding:'10px 16px',background:'#f8fafc',border:'1.5px solid #c7d2fe',borderRadius:10,color:'#4f46e5',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',flexShrink:0},
}