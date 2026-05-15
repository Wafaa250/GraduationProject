import { useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AssociationLogoUpload } from '../../components/association/AssociationLogoUpload'
import {
  ASSOCIATION_CATEGORIES,
  registerStudentAssociation,
  uploadAssociationLogo,
  parseApiErrorMessage,
} from '../../../api/associationApi'

const FACULTIES = [
  'Engineering and Information Technology',
  'Information Technology',
  'Science',
  'Medicine and Health Sciences',
  'Pharmacy',
  'Nursing',
  'Agriculture and Veterinary Medicine',
]

const STEPS = [
  { id: 'account', label: 'Account', icon: '👤' },
  { id: 'details', label: 'Details', icon: '🏛️' },
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
    if (validate()) setStep((s) => s + 1)
  }
  const back = () => setStep((s) => s - 1)

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
      <div style={S.page}>
        <Blobs />
        <div style={S.successWrap}>
          <div style={S.successIcon}>✓</div>
          <h2 style={S.successH2}>Welcome, {form.associationName}!</h2>
          <p style={S.successP}>Your student organization account is ready on SkillSwap.</p>
          <button type="button" style={S.btnPrimary} onClick={() => navigate('/association/dashboard')}>
            Go to Dashboard →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <Blobs />
      <div style={S.wrap}>
        <div style={S.logoRow}>
          <div style={S.logoIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span style={S.logoText}>
            Skill<span style={S.logoAccent}>Swap</span>
          </span>
        </div>

        <Link to="/register" style={S.changeRoleBtn}>
          ← Change role
        </Link>
        <span style={S.roleBadge}>Student Organization</span>

        <div style={S.stepper}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    ...S.stepDot,
                    ...(i === step ? S.stepDotActive : i < step ? S.stepDotDone : S.stepDotIdle),
                  }}
                >
                  {i < step ? (
                    <span style={{ fontSize: 12, color: 'white', fontWeight: 900 }}>✓</span>
                  ) : (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: i === step ? 'white' : '#94a3b8',
                      }}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: i === step ? '#1e293b' : i < step ? '#d97706' : '#94a3b8',
                  }}
                >
                  {s.icon} {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    width: 40,
                    height: 2,
                    margin: '0 8px',
                    background: i < step ? 'linear-gradient(90deg,#f59e0b,#ea580c)' : '#e2e8f0',
                    borderRadius: 2,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <div style={S.card}>
          {step === 0 && (
            <Section title="Account" sub="Create your organization account">
              <Field
                label="Organization name"
                value={form.associationName}
                onChange={(v) => set('associationName', v)}
                error={errors.associationName}
                required
                placeholder="e.g. NNU Developers Club"
              />
              <Field
                label="Username"
                value={form.username}
                onChange={(v) => set('username', v)}
                error={errors.username}
                required
                placeholder="e.g. nnu_devclub"
              />
              <Field
                label="Email"
                value={form.email}
                onChange={(v) => set('email', v)}
                error={errors.email}
                required
                type="email"
                placeholder="contact@organization.edu"
              />
              <div style={S.row2}>
                <Field
                  label="Password"
                  value={form.password}
                  onChange={(v) => set('password', v)}
                  error={errors.password}
                  required
                  type={showPass ? 'text' : 'password'}
                  suffix={<EyeBtn show={showPass} toggle={() => setShowPass((x) => !x)} />}
                />
                <Field
                  label="Confirm Password"
                  value={form.confirmPassword}
                  onChange={(v) => set('confirmPassword', v)}
                  error={errors.confirmPassword}
                  required
                  type={showConfirm ? 'text' : 'password'}
                  suffix={<EyeBtn show={showConfirm} toggle={() => setShowConfirm((x) => !x)} />}
                />
              </div>
            </Section>
          )}

          {step === 1 && (
            <Section title="Organization details" sub="Tell students about your organization">
              <Field
                label="Description"
                value={form.description}
                onChange={(v) => set('description', v)}
                multiline
                placeholder="What does your organization do?"
              />
              <SelectField
                label="Faculty"
                value={form.faculty}
                onChange={(v) => set('faculty', v)}
                error={errors.faculty}
                required
                options={FACULTIES}
                placeholder="Select faculty"
              />
              <SelectField
                label="Category"
                value={form.category}
                onChange={(v) => set('category', v)}
                error={errors.category}
                required
                options={[...ASSOCIATION_CATEGORIES]}
                placeholder="Select category"
              />
              <AssociationLogoUpload
                logoUrl={logoUrl}
                onLogoUrlChange={setLogoUrl}
                canUpload={false}
                onPendingFile={setPendingLogoFile}
                disabled={isLoading}
              />
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>
                Social links <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span>
              </p>
              <Field label="Instagram" value={form.instagramUrl} onChange={(v) => set('instagramUrl', v)} />
              <Field label="Facebook" value={form.facebookUrl} onChange={(v) => set('facebookUrl', v)} />
              <Field label="LinkedIn" value={form.linkedInUrl} onChange={(v) => set('linkedInUrl', v)} />
            </Section>
          )}

          {apiError && (
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 10,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: 13,
              }}
            >
              {apiError}
            </div>
          )}

          <div style={S.navRow}>
            {step > 0 ? (
              <button type="button" style={S.btnBack} onClick={back}>
                ← Back
              </button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" style={S.btnPrimary} onClick={next}>
                Continue →
              </button>
            ) : (
              <button type="button" style={S.btnPrimary} onClick={submit} disabled={isLoading}>
                {isLoading ? 'Creating account…' : 'Create account'}
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`
        input::placeholder, textarea::placeholder { color: #94a3b8; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #f59e0b !important; box-shadow: 0 0 0 3px rgba(245,158,11,0.15); }
      `}</style>
    </div>
  )
}

function Section({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', fontFamily: 'Syne, sans-serif' }}>
          {title}
        </h3>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{sub}</p>
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  error,
  required,
  type = 'text',
  placeholder,
  multiline,
  suffix,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  required?: boolean
  type?: string
  placeholder?: string
  multiline?: boolean
  suffix?: ReactNode
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={S.label}>
        {label}
        {required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      <div style={{ position: 'relative' }}>
        {multiline ? (
          <textarea
            style={{ ...S.input, minHeight: 90, borderColor: error ? '#fca5a5' : '#e2e8f0' }}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        ) : (
          <input
            type={type}
            style={{ ...S.input, borderColor: error ? '#fca5a5' : '#e2e8f0', paddingRight: suffix ? 40 : 14 }}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        )}
        {suffix && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
            {suffix}
          </div>
        )}
      </div>
      {error && <span style={S.error}>{error}</span>}
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  error,
  required,
  options,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  required?: boolean
  options: string[]
  placeholder: string
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={S.label}>
        {label}
        {required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      <select
        style={{ ...S.input, borderColor: error ? '#fca5a5' : '#e2e8f0' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error && <span style={S.error}>{error}</span>}
    </div>
  )
}

function EyeBtn({ show, toggle }: { show: boolean; toggle: () => void }) {
  return (
    <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15 }} onClick={toggle}>
      {show ? '🙈' : '👁️'}
    </button>
  )
}

function Blobs() {
  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: -150,
          right: -150,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(245,158,11,0.1) 0%,transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: -150,
          left: -150,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(234,88,12,0.06) 0%,transparent 70%)',
          pointerEvents: 'none',
        }}
      />
    </>
  )
}

const S: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(155deg,#fffbeb 0%,#fef3c7 40%,#fff7ed 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '40px 20px 60px',
    fontFamily: 'DM Sans, sans-serif',
    position: 'relative',
  },
  wrap: { width: '100%', maxWidth: 600, position: 'relative', zIndex: 1 },
  logoRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'linear-gradient(135deg,#f59e0b,#ea580c)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 22, fontWeight: 800, color: '#0f172a', fontFamily: 'Syne, sans-serif' },
  logoAccent: { color: '#d97706' },
  changeRoleBtn: {
    display: 'block',
    textAlign: 'center',
    marginBottom: 8,
    color: '#d97706',
    fontWeight: 600,
    fontSize: 13,
    textDecoration: 'none',
  },
  roleBadge: {
    display: 'block',
    textAlign: 'center',
    marginBottom: 20,
    padding: '3px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    background: '#fffbeb',
    border: '1px solid #fde68a',
    color: '#b45309',
    width: 'fit-content',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { background: 'linear-gradient(135deg,#f59e0b,#ea580c)' },
  stepDotDone: { background: 'linear-gradient(135deg,#f59e0b,#ea580c)' },
  stepDotIdle: { background: 'white', border: '2px solid #e2e8f0' },
  card: {
    background: 'white',
    border: '1px solid #fde68a',
    borderRadius: 20,
    padding: '36px 40px',
    boxShadow: '0 8px 32px rgba(245,158,11,0.1)',
  },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: {
    width: '100%',
    padding: '11px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    fontSize: 14,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  error: { display: 'block', fontSize: 12, color: '#ef4444', marginTop: 4 },
  navRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 28,
    paddingTop: 22,
    borderTop: '1px solid #f1f5f9',
  },
  btnBack: {
    padding: '10px 20px',
    background: 'white',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnPrimary: {
    padding: '11px 26px',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    background: 'linear-gradient(135deg,#f59e0b,#ea580c)',
  },
  successWrap: {
    margin: '60px auto',
    maxWidth: 440,
    background: 'white',
    borderRadius: 24,
    padding: 48,
    textAlign: 'center',
    border: '1px solid #fde68a',
  },
  successIcon: {
    width: 68,
    height: 68,
    margin: '0 auto 20px',
    borderRadius: '50%',
    background: '#fffbeb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    color: '#d97706',
  },
  successH2: { fontSize: 24, fontWeight: 800, fontFamily: 'Syne, sans-serif', margin: '0 0 10px' },
  successP: { color: '#64748b', margin: '0 0 24px' },
}

