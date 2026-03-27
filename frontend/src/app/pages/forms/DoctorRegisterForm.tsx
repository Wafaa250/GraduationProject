import { useState, useRef, ChangeEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../../api/axiosInstance'

// ─── Constants ────────────────────────────────────────────────────────────────

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

const STEPS = [
  { id: 'account', label: 'Account',     icon: '👤' },
  { id: 'academic', label: 'Academic',   icon: '🎓' },
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
  specialization: string
  bio: string
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DoctorRegisterForm({ onBack = null }: { onBack?: (() => void) | null }) {
  const navigate  = useNavigate()
  const fileRef   = useRef<HTMLInputElement>(null)
  const [step, setStep]         = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError]   = useState<string | null>(null)
  const [showPass, setShowPass]   = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [form, setForm] = useState<FormState>({
    fullName: '', email: '', password: '', confirmPassword: '',
    profilePic: null, profilePicPreview: null,
    university: '', faculty: '', specialization: '', bio: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const handlePic = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { if (ev.target?.result) set('profilePicPreview', ev.target.result as string) }
    reader.readAsDataURL(file); set('profilePic', file)
  }

  const handleUniversity = (val: string) => setForm(f => ({ ...f, university: val, faculty: '' }))

  const availableFaculties = form.university ? (FACULTIES[form.university] ?? []) : []

  const validate = () => {
    const e: Record<string, string> = {}
    if (step === 0) {
      if (!form.fullName.trim())   e.fullName = 'Full name is required'
      if (!form.email.trim())      e.email    = 'Email is required'
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
      if (!form.password)          e.password = 'Password is required'
      else if (form.password.length < 8) e.password = 'Min. 8 characters'
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    }
    if (step === 1) {
      if (!form.university)     e.university     = 'Please select university'
      if (!form.faculty)        e.faculty        = 'Please select faculty'
      if (!form.specialization) e.specialization = 'Please select specialization'
    }
    setErrors(e); return Object.keys(e).length === 0
  }

  const next   = () => { if (validate()) setStep(s => s + 1) }
  const back   = () => setStep(s => s - 1)

  const submit = async () => {
    if (!validate()) return
    setIsLoading(true); setApiError(null)
    try {
      const payload = {
        fullName:        form.fullName,
        email:           form.email,
        password:        form.password,
        confirmPassword: form.confirmPassword,
        university:      form.university,
        faculty:         form.faculty,
        specialization:  form.specialization,
        bio:             form.bio,
        profilePictureBase64: form.profilePicPreview,
        role: 'doctor',
      }

      const { data } = await api.post('/auth/register/doctor', payload)

      localStorage.setItem('token', data.token)
      localStorage.setItem('userId', data.userId.toString())
      localStorage.setItem('role', 'doctor')
      localStorage.setItem('name', data.name)

      setSubmitted(true)
    } catch (err: any) {
      setApiError(err.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  // Password strength
  const passChecks = [form.password.length >= 8, /[A-Z]/.test(form.password), /[0-9]/.test(form.password), /[^A-Za-z0-9]/.test(form.password)]
  const passScore  = passChecks.filter(Boolean).length
  const passColors = ['', '#ef4444', '#f59e0b', '#10b981', '#6366f1']
  const passLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) return (
    <div style={S.page}><Blobs />
      <div style={S.successWrap}>
        <div style={S.successIcon}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" stroke="#3b82f6" strokeWidth="2"/>
            <path d="M9 16l5 5 9-9" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 style={S.successH2}>Welcome, Dr. {form.fullName.split(' ')[0]}! 🎓</h2>
        <p style={S.successP}>Your account is ready. Start creating channels for your courses.</p>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
          <button style={S.btnPrimary} onClick={() => navigate('/doctor/dashboard')}>
            Go to Dashboard →
          </button>
          <button style={S.btnOutline} onClick={() => navigate('/login')}>
            Sign In Instead
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={S.page}><Blobs />
      <div style={S.wrap}>

        {/* Logo */}
        <div style={S.logoRow}>
          <div style={S.logoIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={S.logoText}>Skill<span style={S.logoAccent}>Swap</span></span>
        </div>

        {/* Back + role badge */}
        {onBack && (
          <div style={{ textAlign: 'center' as const, marginBottom: 16 }}>
            <button onClick={onBack} style={S.changeRoleBtn}>← Change role</button>
            <span style={{ ...S.roleBadge, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb' }}>
              Doctor / Supervisor
            </span>
          </div>
        )}

        {/* Stepper */}
        <div style={S.stepper}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ ...S.stepDot, ...(i === step ? S.stepDotActive : i < step ? S.stepDotDone : S.stepDotIdle) }}>
                  {i < step
                    ? <span style={{ fontSize: 12, color: 'white', fontWeight: 900 }}>✓</span>
                    : <span style={{ fontSize: 11, fontWeight: 700, color: i === step ? 'white' : '#94a3b8' }}>{i + 1}</span>
                  }
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: i === step ? '#1e293b' : i < step ? '#3b82f6' : '#94a3b8', whiteSpace: 'nowrap' as const }}>
                  {s.icon} {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 40, height: 2, margin: '0 8px', background: i < step ? 'linear-gradient(90deg,#3b82f6,#06b6d4)' : '#e2e8f0', borderRadius: 2 }} />
              )}
            </div>
          ))}
        </div>

        <div style={S.card}>

          {/* STEP 0 — Account */}
          {step === 0 && (
            <Section title="Account Information" sub="Create your SkillSwap doctor account">
              {/* Profile pic */}
              <div style={S.picRow}>
                <div style={S.picCircle} onClick={() => fileRef.current?.click()}>
                  {form.profilePicPreview
                    ? <img src={form.profilePicPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} alt="" />
                    : <span style={{ fontSize: 26, color: '#cbd5e1' }}>+</span>
                  }
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', margin: '0 0 8px' }}>
                    Profile Picture <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
                  </p>
                  <button style={{ ...S.picBtn, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb' }} onClick={() => fileRef.current?.click()}>
                    Upload Photo
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePic} />
                </div>
              </div>

              <Field label="Full Name" placeholder="Dr. Mohammad Khalil" value={form.fullName} onChange={v => set('fullName', v)} error={errors.fullName} required />
              <Field label="Email" placeholder="doctor@najah.edu" value={form.email} onChange={v => set('email', v)} error={errors.email} required type="email" />

              <div style={S.row2}>
                <Field label="Password" placeholder="Min. 8 characters" value={form.password} onChange={v => set('password', v)} error={errors.password} required
                  type={showPass ? 'text' : 'password'} suffix={<EyeBtn show={showPass} toggle={() => setShowPass(x => !x)} />} />
                <Field label="Confirm Password" placeholder="Re-enter password" value={form.confirmPassword} onChange={v => set('confirmPassword', v)} error={errors.confirmPassword} required
                  type={showConfirm ? 'text' : 'password'} suffix={<EyeBtn show={showConfirm} toggle={() => setShowConfirm(x => !x)} />} />
              </div>

              {/* Password strength */}
              {form.password && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < passScore ? passColors[passScore] : '#e2e8f0', transition: 'background 0.3s' }} />
                    ))}
                    <span style={{ fontSize: 12, fontWeight: 700, minWidth: 44, color: passColors[passScore] }}>{passLabels[passScore]}</span>
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* STEP 1 — Academic */}
          {step === 1 && (
            <Section title="Academic Information" sub="Tell us about your position">
              <SelectField label="University" value={form.university} onChange={handleUniversity} error={errors.university} required
                options={UNIVERSITIES} placeholder="Select your university" />
              <SelectField label="Faculty / College" value={form.faculty} onChange={v => set('faculty', v)} error={errors.faculty} required
                options={availableFaculties} placeholder={form.university ? 'Select your faculty' : 'Select a university first'} disabled={!form.university} />
              <SelectField label="Specialization" value={form.specialization} onChange={v => set('specialization', v)} error={errors.specialization} required
                options={SPECIALIZATIONS} placeholder="Select your specialization" />

              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>Bio <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: 12 }}>(Optional)</span></label>
                <textarea
                  style={{ ...S.input, height: 90, resize: 'vertical' as const, paddingTop: 10 }}
                  placeholder="Brief description about your research interests and teaching areas..."
                  value={form.bio}
                  onChange={e => set('bio', e.target.value)}
                />
              </div>
            </Section>
          )}

          {/* API Error */}
          {apiError && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, color: '#dc2626', fontSize: 13, fontWeight: 500 }}>
              ❌ {apiError}
            </div>
          )}

          {/* Nav Buttons */}
          <div style={S.navRow}>
            {step > 0
              ? <button style={S.btnBack} onClick={back}>← Back</button>
              : <div />
            }
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{step + 1} / {STEPS.length}</span>
              {step < STEPS.length - 1
                ? <button style={{ ...S.btnPrimary, background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }} onClick={next}>Continue →</button>
                : <button style={{ ...S.btnPrimary, background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', opacity: isLoading ? 0.7 : 1 }} onClick={submit} disabled={isLoading}>
                    {isLoading ? '⏳ Creating...' : '✦ Create Account'}
                  </button>
              }
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center' as const, color: '#cbd5e1', fontSize: 12, marginTop: 24 }}>
          SkillSwap · Academic Collaboration Platform
        </p>
      </div>

      <style>{`
        input::placeholder, textarea::placeholder { color: #94a3b8; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        button:hover { opacity: 0.92; }
      `}</style>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', fontFamily: 'Syne, sans-serif' }}>{title}</h3>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{sub}</p>
      </div>
      {children}
    </div>
  )
}

function Field({ label, placeholder, value, onChange, error, required = false, type = 'text', suffix }: {
  label: ReactNode; placeholder: string; value: string; onChange: (v: string) => void
  error?: string; required?: boolean; type?: string; suffix?: ReactNode
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={S.label}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
      <div style={{ position: 'relative' as const }}>
        <input type={type} style={{ ...S.input, borderColor: error ? '#fca5a5' : '#e2e8f0', paddingRight: suffix ? 40 : 14 }}
          placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
        {suffix && <div style={{ position: 'absolute' as const, right: 12, top: '50%', transform: 'translateY(-50%)' }}>{suffix}</div>}
      </div>
      {error && <span style={S.error}>{error}</span>}
    </div>
  )
}

function SelectField({ label, value, onChange, error, required = false, options, placeholder, disabled = false }: {
  label: string; value: string; onChange: (v: string) => void; error?: string
  required?: boolean; options: string[]; placeholder: string; disabled?: boolean
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={S.label}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
      <select style={{ ...S.input, borderColor: error ? '#fca5a5' : '#e2e8f0', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
        value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <span style={S.error}>{error}</span>}
    </div>
  )
}

function EyeBtn({ show, toggle }: { show: boolean; toggle: () => void }) {
  return <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: 0, color: '#94a3b8' }} onClick={toggle} type="button">{show ? '🙈' : '👁️'}</button>
}

function Blobs() {
  return (
    <>
      <div style={{ position: 'fixed' as const, top: -150, right: -150, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(59,130,246,0.08) 0%,transparent 70%)', pointerEvents: 'none' as const }} />
      <div style={{ position: 'fixed' as const, bottom: -150, left: -150, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(6,182,212,0.06) 0%,transparent 70%)', pointerEvents: 'none' as const }} />
    </>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:       { minHeight: '100vh', background: 'linear-gradient(155deg,#f0f9ff 0%,#e0f2fe 40%,#f0fdfa 100%)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 20px 60px', fontFamily: 'DM Sans, sans-serif', position: 'relative', overflow: 'hidden' },
  wrap:       { width: '100%', maxWidth: 600, position: 'relative', zIndex: 1 },
  logoRow:    { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 },
  logoIcon:   { width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' },
  logoText:   { fontSize: 22, fontWeight: 800, color: '#0f172a', fontFamily: 'Syne, sans-serif' },
  logoAccent: { background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  stepper:    { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 4 },
  stepDot:    { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.3s' },
  stepDotActive: { background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', boxShadow: '0 2px 8px rgba(59,130,246,0.4)' },
  stepDotDone:   { background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' },
  stepDotIdle:   { background: 'white', border: '2px solid #e2e8f0' },
  card:       { background: 'white', border: '1px solid #e2e8f0', borderRadius: 20, padding: '36px 40px', boxShadow: '0 8px 32px rgba(59,130,246,0.08)' },
  row2:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  label:      { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input:      { width: '100%', padding: '11px 14px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, color: '#1e293b', fontSize: 14, boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  error:      { display: 'block', fontSize: 12, color: '#ef4444', marginTop: 4, fontWeight: 500 },
  picRow:     { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: 16, background: '#f0f9ff', borderRadius: 12, border: '1px solid #e0f2fe' },
  picCircle:  { width: 68, height: 68, borderRadius: '50%', background: '#e0f2fe', border: '2px dashed #93c5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, overflow: 'hidden' },
  picBtn:     { padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  navRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 22, borderTop: '1px solid #f1f5f9' },
  btnBack:    { padding: '10px 20px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimary: { padding: '11px 26px', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' },
  changeRoleBtn: { background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginRight: 8 },
  roleBadge:  { display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  successWrap:{ margin: '60px auto', maxWidth: 440, background: 'white', border: '1px solid #e0f2fe', borderRadius: 24, padding: '48px 40px', textAlign: 'center' as const, boxShadow: '0 8px 40px rgba(59,130,246,0.1)' },
  successIcon:{ width: 68, height: 68, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eff6ff', borderRadius: '50%', border: '1px solid #bfdbfe' },
  successH2:  { fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 10px', fontFamily: 'Syne, sans-serif' },
  successP:   { color: '#64748b', fontSize: 14, lineHeight: 1.7, margin: '0 0 28px' },
  btnOutline: { padding: '11px 24px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', width: '100%' },
}