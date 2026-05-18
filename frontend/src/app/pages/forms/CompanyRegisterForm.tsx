import { useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Sparkles, Loader2 } from 'lucide-react'
import './company-register-mobile.css'
import {
  analyzeCompany,
  registerCompany,
  parseApiErrorMessage,
} from '../../../api/companyApi'

const STEPS = [
  { id: 'account', label: 'Account', icon: '👤' },
  { id: 'links', label: 'Company links', icon: '🔗' },
  { id: 'profile', label: 'Company profile', icon: '🏢' },
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

  /** Go to profile step without requiring website/LinkedIn (manual entry). */
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

  if (submitted) {
    return (
      <div className="co-company-register" style={S.page}>
          <Blobs />
          <div style={S.successWrap} className="co-success-card">
            <div style={S.successIcon}>✓</div>
            <h2 style={S.successH2}>Welcome, {form.companyName}!</h2>
            <p style={S.successP}>Your company account is ready on SkillSwap.</p>
            <button type="button" style={S.btnPrimary} onClick={() => navigate('/login')}>
              Sign in →
            </button>
          </div>
      </div>
    )
  }

  return (
    <div className="co-company-register" style={S.page}>
      <Blobs />
      <div className="co-reg-inner" style={S.wrap}>
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

        {onBack ? (
          <button type="button" onClick={onBack} style={S.changeRoleBtn}>
            ← Back to role selection
          </button>
        ) : (
          <Link to="/register" style={S.changeRoleBtn}>
            ← Change role
          </Link>
        )}
        <span style={S.roleBadge}>Company</span>

        <div style={S.stepper} className="co-reg-stepper">
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
                      <span style={{ fontSize: 11, fontWeight: 700, color: i === step ? 'white' : '#94a3b8' }}>
                        {i + 1}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: i === step ? '#1e293b' : i < step ? '#059669' : '#94a3b8',
                    }}
                  >
                    {s.icon} {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      width: 32,
                      height: 2,
                      margin: '0 8px',
                      background: i < step ? 'linear-gradient(90deg,#10b981,#059669)' : '#e2e8f0',
                      borderRadius: 2,
                    }}
                  />
                )}
              </div>
          ))}
        </div>

        <div style={S.card} className="co-reg-card">
          {apiError && <div style={S.apiError}>{apiError}</div>}

          {step === 0 && (
            <Section title="Account" sub="Create the account for your company representative">
              <Field
                label="Your name (contact person)"
                value={form.contactName}
                onChange={(v) => set('contactName', v)}
                error={errors.contactName}
                required
                placeholder="e.g. Sara Ahmad"
              />
              <Field
                label="Work email"
                value={form.email}
                onChange={(v) => set('email', v)}
                error={errors.email}
                required
                type="email"
                placeholder="hr@company.com"
              />
              <Field
                label="Password"
                value={form.password}
                onChange={(v) => set('password', v)}
                error={errors.password}
                required
                type={showPass ? 'text' : 'password'}
                suffix={<EyeBtn show={showPass} toggle={() => setShowPass(!showPass)} />}
              />
              <Field
                label="Confirm password"
                value={form.confirmPassword}
                onChange={(v) => set('confirmPassword', v)}
                error={errors.confirmPassword}
                required
                type={showConfirm ? 'text' : 'password'}
                suffix={<EyeBtn show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />}
              />
            </Section>
          )}

          {step === 1 && (
            <Section
              title="Company links"
              sub="We use AI to read your website or LinkedIn and fill your company profile"
            >
              <Field
                label="Company website"
                value={form.websiteUrl}
                onChange={(v) => set('websiteUrl', v)}
                error={errors.websiteUrl}
                placeholder="https://yourcompany.com"
              />
              <Field
                label="LinkedIn company page"
                value={form.linkedInUrl}
                onChange={(v) => set('linkedInUrl', v)}
                placeholder="https://linkedin.com/company/..."
              />
              <p style={S.hint}>Provide at least one link. If you only have LinkedIn, that works too.</p>
              <button
                type="button"
                className="co-reg-analyze"
                style={{
                  ...S.btnAnalyze,
                  opacity: isAnalyzing ? 0.7 : 1,
                  cursor: isAnalyzing ? 'wait' : 'pointer',
                }}
                disabled={isAnalyzing}
                onClick={runAnalysis}
              >
                {isAnalyzing ? (
                  <span style={S.btnAnalyzeInner}>
                    <Loader2 size={18} className="animate-spin" />
                    Analyzing with AI…
                  </span>
                ) : (
                  <span style={S.btnAnalyzeInner}>
                    <Sparkles size={18} />
                    Analyze company with AI
                  </span>
                )}
              </button>
            </Section>
          )}

          {step === 2 && (
            <Section
              title="Company profile"
              sub={
                skippedAi
                  ? 'Enter your company details manually. Add a website or LinkedIn on the previous step anytime if you have one.'
                  : 'Review and edit what AI suggested before creating your account'
              }
            >
            {skippedAi && (
              <p style={{ ...S.hint, marginTop: -8, marginBottom: 16 }}>
                No website yet? Describe your company clearly below (at least 40 characters), or go back and add a
                link.
              </p>
            )}
              {analysisNote && <p style={S.analysisNote}>{analysisNote}</p>}
              <Field
                label="Company name"
                value={form.companyName}
                onChange={(v) => set('companyName', v)}
                error={errors.companyName}
                required
              />
              <Field
                label="Industry"
                value={form.industry}
                onChange={(v) => set('industry', v)}
                placeholder="e.g. Software, FinTech"
              />
              <Field
                label="Location"
                value={form.location}
                onChange={(v) => set('location', v)}
                placeholder="e.g. Nablus, Palestine"
              />
            <Field
                label="About the company"
                value={form.description}
                onChange={(v) => set('description', v)}
                multiline
                placeholder="What does your company do?"
                error={errors.description}
              />
              <div style={S.linkSummary}>
                {form.websiteUrl && <span>🌐 {form.websiteUrl}</span>}
                {form.linkedInUrl && <span>in {form.linkedInUrl}</span>}
              </div>
            </Section>
          )}

          <div style={S.navRow} className="co-reg-nav">
            <button type="button" style={S.btnBack} onClick={back}>
              ← Back
            </button>
            {step < 2 ? (
              step === 1 ? (
                <button type="button" style={S.btnOutline} onClick={skipAiAndGoManual}>
                  Skip AI — fill manually →
                </button>
              ) : (
                <button type="button" style={S.btnPrimary} onClick={next}>
                  Continue →
                </button>
              )
            ) : (
              <button
                type="button"
                style={{ ...S.btnPrimary, opacity: isLoading ? 0.7 : 1 }}
                onClick={submit}
                disabled={isLoading}
              >
                {isLoading ? 'Creating account…' : 'Create company account'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px', fontFamily: 'Syne, sans-serif' }}>{title}</h2>
      <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>{sub}</p>
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
            style={{ ...S.input, minHeight: 100, borderColor: error ? '#fca5a5' : '#e2e8f0' }}
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
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>{suffix}</div>
        )}
      </div>
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
          background: 'radial-gradient(circle,rgba(16,185,129,0.1) 0%,transparent 70%)',
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
          background: 'radial-gradient(circle,rgba(5,150,105,0.06) 0%,transparent 70%)',
          pointerEvents: 'none',
        }}
      />
    </>
  )
}

const S: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(155deg,#ecfdf5 0%,#d1fae5 40%,#f0fdf4 100%)',
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
    background: 'linear-gradient(135deg,#10b981,#059669)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 22, fontWeight: 800, color: '#0f172a', fontFamily: 'Syne, sans-serif' },
  logoAccent: { color: '#059669' },
  changeRoleBtn: {
    display: 'block',
    textAlign: 'center',
    marginBottom: 8,
    color: '#059669',
    fontWeight: 600,
    fontSize: 13,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    fontFamily: 'inherit',
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
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#047857',
    width: 'fit-content',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 4 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { background: 'linear-gradient(135deg,#10b981,#059669)' },
  stepDotDone: { background: 'linear-gradient(135deg,#10b981,#059669)' },
  stepDotIdle: { background: 'white', border: '2px solid #e2e8f0' },
  card: {
    background: 'white',
    border: '1px solid #a7f3d0',
    borderRadius: 20,
    padding: '36px 40px',
    boxShadow: '0 8px 32px rgba(16,185,129,0.1)',
  },
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
  hint: { fontSize: 13, color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 },
  analysisNote: {
    fontSize: 13,
    color: '#b45309',
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 10,
    padding: '10px 14px',
    marginBottom: 16,
  },
  apiError: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 16,
  },
  linkSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  btnAnalyze: {
    width: '100%',
    padding: '12px 20px',
    border: 'none',
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 14,
    color: 'white',
    fontFamily: 'inherit',
    background: 'linear-gradient(135deg,#6366f1,#9333ea)',
    marginTop: 8,
  },
  btnAnalyzeInner: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  navRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
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
  btnOutline: {
    padding: '10px 18px',
    background: 'white',
    border: '1.5px solid #a7f3d0',
    borderRadius: 10,
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: '#059669',
    fontWeight: 600,
    fontSize: 13,
  },
  btnPrimary: {
    padding: '11px 26px',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    background: 'linear-gradient(135deg,#10b981,#059669)',
  },
  successWrap: {
    margin: '60px auto',
    maxWidth: 440,
    background: 'white',
    borderRadius: 24,
    padding: 48,
    textAlign: 'center',
    border: '1px solid #a7f3d0',
  },
  successIcon: {
    width: 68,
    height: 68,
    margin: '0 auto 20px',
    borderRadius: '50%',
    background: '#ecfdf5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    color: '#059669',
  },
  successH2: { fontSize: 24, fontWeight: 800, fontFamily: 'Syne, sans-serif', margin: '0 0 10px' },
  successP: { color: '#64748b', margin: '0 0 24px' },
}
