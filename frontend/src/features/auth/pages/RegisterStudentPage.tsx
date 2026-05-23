import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { authApi } from '@/shared/api/authApi'
import { AuthBackLink } from '../components/AuthBackLink'
import { AuthCard } from '../components/AuthCard'
import { AuthField } from '../components/AuthField'
import { AuthAlert } from '../components/AuthAlert'
import { MajorSkillPicker } from '../components/MajorSkillPicker'
import { StepIndicator } from '../components/StepIndicator'
import { Button } from '@/shared/components/ui/Button'
import { SearchableSelect } from '@/shared/components/ui/SearchableSelect'
import { ACADEMIC_YEAR_OPTIONS } from '@/shared/constants/academicYears'
import {
  AN_NAJAH_UNIVERSITY,
  getFacultyOptions,
  getMajorOptions,
  UNIVERSITY_OPTIONS,
} from '@/shared/constants/anNajahUniversity'
import { ROUTES, getHomeForRole } from '@/shared/constants/routes'
import { getApiErrorMessage } from '@/shared/lib/errors'
import { getStudentStepShellClass } from '../studentRegistrationLayout'
import { cn } from '@/shared/lib/cn'

const STEPS = ['Account', 'Academic profile', 'Skills'] as const

const STEP_PAGE_TITLES: Record<number, string | undefined> = {
  0: 'Create your account',
  1: 'Academic profile',
  2: undefined,
}

export function RegisterStudentPage() {
  const { setSession } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [studentId, setStudentId] = useState('')
  const [university, setUniversity] = useState(AN_NAJAH_UNIVERSITY)
  const [faculty, setFaculty] = useState('')
  const [major, setMajor] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [gpa, setGpa] = useState('')

  const [roles, setRoles] = useState<string[]>([])
  const [technicalSkills, setTechnicalSkills] = useState<string[]>([])
  const [tools, setTools] = useState<string[]>([])

  const facultyOptions = useMemo(() => getFacultyOptions(), [])
  const majorOptions = useMemo(() => getMajorOptions(faculty), [faculty])
  useEffect(() => {
    if (!faculty) return
    const valid = majorOptions.some((o) => o.value === major)
    if (major && !valid) setMajor('')
  }, [faculty, major, majorOptions])

  useEffect(() => {
    setRoles([])
    setTechnicalSkills([])
    setTools([])
    setFieldErrors({})
  }, [major])

  const handleFacultyChange = (next: string) => {
    setFaculty(next)
    setMajor('')
    setFieldErrors((prev) => {
      const nextErrors = { ...prev }
      delete nextErrors.faculty
      delete nextErrors.major
      return nextErrors
    })
  }

  const validateStep = (): boolean => {
    setError(null)
    const errors: Record<string, string> = {}

    if (step === 0) {
      if (!fullName.trim()) setError('Full name is required.')
      else if (!email.includes('@')) setError('Enter a valid email.')
      else if (password.length < 8) setError('Password must be at least 8 characters.')
      else if (password !== confirmPassword) setError('Passwords do not match.')
      else return true
      return false
    }

    if (step === 1) {
      if (!studentId.trim()) errors.studentId = 'Required'
      if (!university) errors.university = 'Required'
      if (!faculty) errors.faculty = 'Required'
      if (!major) errors.major = 'Required'
      if (!academicYear) errors.academicYear = 'Required'

      if (gpa && (Number(gpa) < 0 || Number(gpa) > 4)) {
        setError('GPA must be between 0.0 and 4.0.')
        setFieldErrors(errors)
        return false
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        setError('Complete the required fields.')
        return false
      }
      setFieldErrors({})
      return true
    }

    if (step === 2) {
      if (!major) {
        setError('Add your major on the previous step.')
        return false
      }
      if (technicalSkills.length < 1) {
        errors.technicalSkills = 'Select at least one.'
      }
      if (roles.length < 1) {
        errors.roles = 'Select at least one.'
      }
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        setError('Select at least one technical skill and one role.')
        return false
      }
      setFieldErrors({})
    }
    return true
  }

  const next = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const back = () => {
    setError(null)
    setFieldErrors({})
    setStep((s) => Math.max(s - 1, 0))
  }

  const submit = async () => {
    if (!validateStep()) return
    setSubmitting(true)
    setError(null)
    try {
      const session = await authApi.registerStudent({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        studentId: studentId.trim(),
        university,
        faculty,
        major,
        academicYear,
        gpa: gpa ? Number(gpa) : null,
        roles,
        technicalSkills,
        tools,
        generalSkills: tools.length > 0 ? tools : roles,
        majorSkills: technicalSkills,
      })
      setSession(session)
      navigate(getHomeForRole(session.role), { replace: true })
    } catch (e) {
      setError(getApiErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className={cn(
        getStudentStepShellClass(step),
        'transition-[max-width] duration-300 ease-out',
      )}
    >
      <AuthCard title={STEP_PAGE_TITLES[step]}>
        <AuthBackLink to={ROUTES.register} />

        <StepIndicator steps={[...STEPS]} current={step} compact />

        {error && (
          <div className="mb-4">
            <AuthAlert variant="error">{error}</AuthAlert>
          </div>
        )}

        {step === 0 && (
          <div className="flex flex-col gap-4">
            <AuthField
              label="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <AuthField
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <AuthField
              label="Password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <AuthField
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <AuthField
              label="University ID"
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value)
                setFieldErrors((p) => ({ ...p, studentId: '' }))
              }}
              error={fieldErrors.studentId}
              placeholder="Student number"
            />

            <SearchableSelect
              label="University"
              placeholder="An-Najah National University"
              options={[...UNIVERSITY_OPTIONS]}
              value={university}
              onChange={setUniversity}
              disableSearch
              error={fieldErrors.university}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SearchableSelect
                label="Faculty"
                placeholder="Select faculty"
                searchPlaceholder="Search faculties…"
                options={facultyOptions}
                value={faculty}
                onChange={handleFacultyChange}
                error={fieldErrors.faculty}
              />

              <SearchableSelect
                label="Major"
                placeholder={faculty ? 'Select major' : 'Select faculty first'}
                searchPlaceholder="Search majors…"
                options={majorOptions}
                value={major}
                onChange={(v) => {
                  setMajor(v)
                  setFieldErrors((p) => ({ ...p, major: '' }))
                }}
                disabled={!faculty}
                error={fieldErrors.major}
                emptyMessage="No majors found."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SearchableSelect
                label="Academic year"
                placeholder="Select year"
                options={[...ACADEMIC_YEAR_OPTIONS]}
                value={academicYear}
                onChange={(v) => {
                  setAcademicYear(v)
                  setFieldErrors((p) => ({ ...p, academicYear: '' }))
                }}
                disableSearch
                error={fieldErrors.academicYear}
              />
              <AuthField
                label="GPA (optional)"
                type="number"
                step="0.01"
                min="0"
                max="4"
                placeholder="3.5"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 2 && major && (
          <MajorSkillPicker
            major={major}
            roles={roles}
            technicalSkills={technicalSkills}
            tools={tools}
            onRolesChange={(next) => {
              setRoles(next)
              setFieldErrors((p) => ({ ...p, roles: '' }))
            }}
            onTechnicalChange={(next) => {
              setTechnicalSkills(next)
              setFieldErrors((p) => ({ ...p, technicalSkills: '' }))
            }}
            onToolsChange={setTools}
            roleError={fieldErrors.roles}
            technicalError={fieldErrors.technicalSkills}
          />
        )}

        {step === 2 && !major && (
          <p className="text-center text-sm text-muted-foreground">
            Complete your academic profile first.
          </p>
        )}

        <div className="mt-6 flex gap-3 sm:mt-8">
          {step > 0 && (
            <Button type="button" variant="outline" className="flex-1" onClick={back}>
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" className="flex-1" onClick={next}>
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" className="flex-1" disabled={submitting} onClick={submit}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </AuthCard>
    </div>
  )
}
