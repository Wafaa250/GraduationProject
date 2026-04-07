import { useState, useRef, ChangeEvent, useEffect, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Camera, Github, Linkedin, Globe, CheckCircle2 } from 'lucide-react'
import { useUser } from "../../../context/UserContext"
import api from '../../../api/axiosInstance'

// ─── Types ────────────────────────────────────────────────────────────────────
interface EditFormState {
  fullName:          string
  bio:               string
  availability:      string
  lookingFor:        string
  github:            string
  linkedin:          string
  portfolio:         string
  languages:         string[]
  roles:             string[]
  technicalSkills:   string[]
  tools:             string[]
  profilePicPreview: string | null
}

type SkillCategory = 'tech' | 'engineering' | 'medical' | 'science'

// ─── Static Data ─────────────────────────────────────────────────────────────
const FACULTY_CATEGORY: Record<string, SkillCategory> = {
  'Engineering and Information Technology': 'engineering',
  'Information Technology':                 'tech',
  'Science':                                'science',
  'Medicine and Health Sciences':           'medical',
  'Pharmacy':                               'medical',
  'Nursing':                                'medical',
  'Agriculture and Veterinary Medicine':    'science',
}

const SKILLS_DATA: Record<SkillCategory, { roles: string[]; technicalSkills: string[]; tools: string[] }> = {
  tech: {
    roles:           ['Frontend Developer','Backend Developer','Full Stack Developer','Mobile App Developer','AI Engineer','Data Scientist','Cybersecurity Specialist','DevOps Engineer','QA Tester','UI/UX Designer','Game Developer'],
    technicalSkills: ['Web Development','API Development','Software Architecture','Machine Learning','Data Analysis','Cloud Systems','Network Security','Software Testing','Database Design','System Integration'],
    tools:           ['JavaScript','TypeScript','Python','Java','C++','C#','PHP','Go','Kotlin','Swift','Dart','R','MATLAB','React','Angular','Vue','Node.js','ASP.NET','Spring Boot','Django','Flutter','TensorFlow','PyTorch','Docker','Git'],
  },
  engineering: {
    roles:           ['Mechanical Engineer','Electrical Engineer','Civil Engineer','Mechatronics Engineer','Energy Engineer','Industrial Engineer'],
    technicalSkills: ['Mechanical Design','Structural Analysis','Control Systems','Power Systems','Manufacturing Processes','Engineering Modeling','Project Engineering','Automation Systems','Robotics Systems','Energy Systems'],
    tools:           ['AutoCAD','SolidWorks','MATLAB','ANSYS','PLC Programming','Arduino','LabVIEW'],
  },
  medical: {
    roles:           ['Medical Doctor','Clinical Specialist','Health Information Specialist','Medical Data Analyst','Clinical Researcher','Healthcare Administrator'],
    technicalSkills: ['Clinical Assessment','Patient Care','Medical Diagnostics','Health Data Analysis','Medical Documentation','Clinical Research','Healthcare Analytics','Medical Statistics','Healthcare Information Systems'],
    tools:           ['Electronic Health Records (EHR)','Hospital Information Systems','Medical Coding Systems','Healthcare Databases','Clinical Data Systems'],
  },
  science: {
    roles:           ['Research Scientist','Data Analyst','Lab Specialist','Biotechnology Researcher','Environmental Scientist','Statistician'],
    technicalSkills: ['Scientific Research','Statistical Analysis','Data Modeling','Laboratory Analysis','Scientific Writing','Experimental Design'],
    tools:           ['SPSS','MATLAB','R','Python','Laboratory Equipment','Data Visualization Tools'],
  },
}

// Flattened fallbacks (used when faculty is unknown)
const ALL_ROLES       = [...new Set(Object.values(SKILLS_DATA).flatMap(d => d.roles))]
const ALL_TECH_SKILLS = [...new Set(Object.values(SKILLS_DATA).flatMap(d => d.technicalSkills))]
const ALL_TOOLS_LIST  = [...new Set(Object.values(SKILLS_DATA).flatMap(d => d.tools))]

const AVAILABILITY_OPTIONS = [
  'Less than 5 hours/week', '5–10 hours/week',
  '10–20 hours/week', '20+ hours/week', 'Full-time',
]

const LOOKING_FOR_OPTIONS = [
  'Graduation Project Team', 'Study Group',
  'Hackathon Team', 'Internship Partner', 'Open to anything',
]

const ALL_LANGUAGES = ['Arabic', 'English', 'French', 'German', 'Spanish', 'Chinese', 'Other']

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EditProfilePage() {
  const navigate = useNavigate()
  const { profile, updateProfile } = useUser()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<EditFormState>({
    fullName:          profile.fullName      || '',
    bio:               profile.bio           || '',
    availability:      profile.availability  || '',
    lookingFor:        profile.lookingFor    || '',
    github:            profile.github        || '',
    linkedin:          profile.linkedin      || '',
    portfolio:         profile.portfolio     || '',
    languages:         profile.languages     || [],
    roles:             (profile as any).roles            || [],
    technicalSkills:   (profile as any).technicalSkills  || [],
    tools:             profile.tools                     || [],
    profilePicPreview: profile.profilePic    || null,
  })

  const [pageLoading,   setPageLoading]   = useState(true)
  const [saved,         setSaved]         = useState(false)
  const [isSaving,      setIsSaving]      = useState(false)
  const [saveError,     setSaveError]     = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string>('basic')

  // ── Determine skill pool based on faculty in profile ──────────────────────
  const faculty       = (profile as any).faculty as string | undefined
  const category      = faculty ? FACULTY_CATEGORY[faculty] : undefined
  const skillsPool    = category ? SKILLS_DATA[category] : null
  const rolesPool     = skillsPool?.roles        ?? ALL_ROLES
  const techPool      = skillsPool?.technicalSkills ?? ALL_TECH_SKILLS
  const toolsPool     = skillsPool?.tools        ?? ALL_TOOLS_LIST

  // ── Fetch profile on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/me')
        const d   = res.data
        setForm({
          fullName:          d.name || d.fullName   || '',
          bio:               d.bio                  || '',
          availability:      d.availability         || '',
          lookingFor:        d.lookingFor           || '',
          github:            d.github               || '',
          linkedin:          d.linkedin             || '',
          portfolio:         d.portfolio            || '',
          languages:         d.languages            || [],
          roles:             d.roles                || [],
          technicalSkills:   d.technicalSkills      || [],
          tools:             d.tools                || [],
          profilePicPreview: d.profilePictureBase64 || null,
        })
      } catch { /* keep context values */ }
      finally { setPageLoading(false) }
    }
    fetch()
  }, [])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const set = <K extends keyof EditFormState>(key: K, value: EditFormState[K]) => {
    setForm(f => ({ ...f, [key]: value })); setSaved(false)
  }

  const handlePic = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { if (ev.target?.result) set('profilePicPreview', ev.target.result as string) }
    reader.readAsDataURL(file)
  }

  const toggleArr = (field: 'roles' | 'technicalSkills' | 'tools' | 'languages', val: string) => {
    setForm(f => {
      const arr = f[field] as string[]
      return { ...f, [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }
    })
    setSaved(false)
  }

  const handleSave = async () => {
    setIsSaving(true); setSaveError(null)
    try {
      await api.put('/profile', {
        fullName:             form.fullName,
        bio:                  form.bio,
        availability:         form.availability,
        lookingFor:           form.lookingFor,
        github:               form.github,
        linkedin:             form.linkedin,
        portfolio:            form.portfolio,
        languages:            form.languages,
        roles:                form.roles,
        technicalSkills:      form.technicalSkills,
        tools:                form.tools,
        profilePictureBase64: form.profilePicPreview,
      })
      updateProfile({
        fullName:        form.fullName,
        bio:             form.bio,
        availability:    form.availability,
        lookingFor:      form.lookingFor,
        github:          form.github,
        linkedin:        form.linkedin,
        portfolio:       form.portfolio,
        languages:       form.languages,
        roles:           form.roles,
        technicalSkills: form.technicalSkills,
        tools:           form.tools,
        profilePic:      form.profilePicPreview,
      })
      setSaved(true)
      setTimeout(() => navigate('/profile'), 1200)
    } catch (err: any) {
      setSaveError(err.response?.data?.message || 'Failed to save. Please try again.')
    } finally { setIsSaving(false) }
  }

  const sections = [
    { id: 'basic',  label: '👤 Basic Info'  },
    { id: 'work',   label: '💼 Work Style'  },
    { id: 'skills', label: '⚡ Skills'      },
    { id: 'links',  label: '🔗 Links'       },
  ]

  const initials = form.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  if (pageLoading) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ textAlign: 'center' as const }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
          <Save size={18} color="white" />
        </div>
        <p style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>Loading your profile...</p>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <BgDecor />

      {/* ══ NAV ══ */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <Link to="/profile" style={S.backBtn}><ArrowLeft size={14} /> Back to Profile</Link>
          <div style={S.navTitle}><span style={{ color: '#6EE7B7' }}>⟡</span> Edit Profile</div>
          <div style={{ width: 120 }} />
        </div>
      </nav>

      <div style={S.layout}>

        {/* ── SIDEBAR ── */}
        <aside style={S.aside}>
          <div style={S.asideCard}>
            <div style={S.avatarSection}>
              <div style={S.avatarWrap} onClick={() => fileRef.current?.click()}>
                {form.profilePicPreview
                  ? <img src={form.profilePicPreview} style={S.avatarImg} alt="profile" />
                  : <div style={S.avatarFallback}>{initials}</div>
                }
                <div style={S.cameraOverlay}><Camera size={18} style={{ color: '#fff' }} /></div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePic} />
              <button style={S.changePicBtn} onClick={() => fileRef.current?.click()}>Change Photo</button>
            </div>
            <div style={S.asideDivider} />
            <nav style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
              {sections.map(s => (
                <button key={s.id}
                  style={{ ...S.sectionBtn, ...(activeSection === s.id ? S.sectionBtnActive : {}) }}
                  onClick={() => setActiveSection(s.id)}>
                  {s.label}
                  {activeSection === s.id && <div style={S.sectionBtnDot} />}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main style={S.main}>

          {/* ── BASIC INFO ── */}
          {activeSection === 'basic' && (
            <FormSection title="Basic Information" sub="Your name and personal summary">
              <Field label="Full Name" required>
                <input style={S.input} value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Your full name" />
              </Field>
              <Field label="Bio / About Me">
                <textarea style={{ ...S.input, ...S.textarea }} value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell teammates about yourself — your interests, goals, what you're working on..." rows={5} />
                <span style={S.charCount}>{form.bio.length} / 500</span>
              </Field>
              <Field label="Languages">
                <div style={S.chipRow}>
                  {ALL_LANGUAGES.map(lang => {
                    const active = form.languages.includes(lang)
                    return (
                      <button key={lang}
                        style={{ ...S.chip, ...(active ? S.chipActiveIndigo : {}) }}
                        onClick={() => toggleArr('languages', lang)}>
                        {active && <span style={{ fontSize: 10, fontWeight: 900 }}>✓</span>} {lang}
                      </button>
                    )
                  })}
                </div>
              </Field>
            </FormSection>
          )}

          {/* ── WORK STYLE ── */}
          {activeSection === 'work' && (
            <FormSection title="Work Style" sub="Help teammates understand how you work best">
              <Field label="Weekly Availability">
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  {AVAILABILITY_OPTIONS.map(a => (
                    <button key={a}
                      style={{ ...S.radioRow, ...(form.availability === a ? S.radioRowActive : {}) }}
                      onClick={() => set('availability', a)}>
                      <div style={{ ...S.radioCircle, ...(form.availability === a ? S.radioCircleActive : {}) }}>
                        {form.availability === a && <div style={S.radioDot} />}
                      </div>
                      <span style={{ fontSize: 13, color: form.availability === a ? '#6366f1' : '#475569' }}>{a}</span>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Looking For">
                <div style={S.chipRow}>
                  {LOOKING_FOR_OPTIONS.map(l => (
                    <button key={l}
                      style={{ ...S.chip, ...(form.lookingFor === l ? S.chipActivePurple : {}) }}
                      onClick={() => set('lookingFor', l)}>
                      {form.lookingFor === l && <span style={{ fontSize: 10, fontWeight: 900 }}>✓</span>} {l}
                    </button>
                  ))}
                </div>
              </Field>
            </FormSection>
          )}

          {/* ── SKILLS ── */}
          {activeSection === 'skills' && (
            <FormSection title="Your Skills" sub="Select all that apply to you">

              {/* Specialization */}
              <Field label={`Specialization · ${form.roles.length} selected`}>
                <p style={S.hint}>What role best describes you?</p>
                <div style={S.chipRow}>
                  {rolesPool.map(r => (
                    <button key={r}
                      style={{ ...S.chip, ...(form.roles.includes(r) ? S.chipActiveIndigo : {}) }}
                      onClick={() => toggleArr('roles', r)}>
                      {form.roles.includes(r) && <span style={{ fontSize: 10, fontWeight: 900 }}>✓</span>} {r}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Technical Skills */}
              <Field label={`Technical Skills · ${form.technicalSkills.length} selected`}>
                <p style={S.hint}>Skills you're comfortable with</p>
                <div style={S.chipRow}>
                  {techPool.map(s => (
                    <button key={s}
                      style={{ ...S.chip, ...(form.technicalSkills.includes(s) ? S.chipActivePurple : {}) }}
                      onClick={() => toggleArr('technicalSkills', s)}>
                      {form.technicalSkills.includes(s) && <span style={{ fontSize: 10, fontWeight: 900 }}>✓</span>} {s}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Technologies & Tools */}
              <Field label={`Technologies & Tools · ${form.tools.length} selected`}>
                <p style={S.hint}>Languages, frameworks, and tools you use</p>
                <div style={S.chipRow}>
                  {toolsPool.map(t => (
                    <button key={t}
                      style={{ ...S.chip, ...(form.tools.includes(t) ? S.chipActiveTeal : {}) }}
                      onClick={() => toggleArr('tools', t)}>
                      {form.tools.includes(t) && <span style={{ fontSize: 10, fontWeight: 900 }}>✓</span>} {t}
                    </button>
                  ))}
                </div>
              </Field>

            </FormSection>
          )}

          {/* ── LINKS ── */}
          {activeSection === 'links' && (
            <FormSection title="Links & Profiles" sub="Connect your online presence">
              <Field label="GitHub">
                <div style={S.inputWithIcon}>
                  <Github size={15} style={S.inputIcon} />
                  <input style={{ ...S.input, paddingLeft: 38 }} value={form.github} onChange={e => set('github', e.target.value)} placeholder="github.com/username" />
                </div>
              </Field>
              <Field label="LinkedIn">
                <div style={S.inputWithIcon}>
                  <Linkedin size={15} style={S.inputIcon} />
                  <input style={{ ...S.input, paddingLeft: 38 }} value={form.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="linkedin.com/in/username" />
                </div>
              </Field>
              <Field label="Portfolio / Website">
                <div style={S.inputWithIcon}>
                  <Globe size={15} style={S.inputIcon} />
                  <input style={{ ...S.input, paddingLeft: 38 }} value={form.portfolio} onChange={e => set('portfolio', e.target.value)} placeholder="yourwebsite.com" />
                </div>
              </Field>
            </FormSection>
          )}

          {/* ══ BOTTOM BAR ══ */}
          <div style={S.bottomBar}>
            {saveError && <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600, flex: 1 }}>❌ {saveError}</span>}
            <Link to="/profile" style={S.cancelBtn}>Cancel</Link>
            <button
              style={{ ...S.saveBtn, ...(saved ? S.saveBtnDone : {}), ...(isSaving ? { opacity: 0.7, cursor: 'not-allowed' } : {}) }}
              onClick={handleSave} disabled={isSaving}>
              {isSaving ? '⏳ Saving...' : saved ? <><CheckCircle2 size={16} /> Profile Saved!</> : <><Save size={16} /> Save Changes</>}
            </button>
          </div>

        </main>
      </div>

      <style>{`
        input::placeholder, textarea::placeholder { color: #94a3b8; }
        input:focus, textarea:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        button:hover { opacity: 0.88; }
        a { text-decoration: none; }
      `}</style>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function FormSection({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div style={S.formSection}>
      <div style={S.formSectionHeader}>
        <h2 style={S.formSectionTitle}>{title}</h2>
        <p style={S.formSectionSub}>{sub}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 24 }}>{children}</div>
    </div>
  )
}

function Field({ label, required = false, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
      <label style={S.fieldLabel}>{label} {required && <span style={{ color: '#ef4444' }}>*</span>}</label>
      {children}
    </div>
  )
}

function BgDecor() {
  return (
    <>
      <div style={{ position: 'fixed' as const, top: -150, right: -150, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)', pointerEvents: 'none' as const, zIndex: 0 }} />
      <div style={{ position: 'fixed' as const, bottom: -120, left: -120, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.06) 0%,transparent 70%)', pointerEvents: 'none' as const, zIndex: 0 }} />
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S: Record<string, CSSProperties> = {
  page:              { minHeight: '100vh', background: 'linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)', fontFamily: 'DM Sans, sans-serif', color: '#0f172a', paddingBottom: 80 },
  nav:               { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(248,247,255,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(99,102,241,0.1)' },
  navInner:          { maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navTitle:          { fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 },
  backBtn:           { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 600 },
  layout:            { maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' },
  aside:             { position: 'sticky', top: 76 },
  main:              { display: 'flex', flexDirection: 'column', gap: 0 },
  asideCard:         { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(99,102,241,0.06)' },
  avatarSection:     { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 18 },
  avatarWrap:        { width: 80, height: 80, borderRadius: '50%', cursor: 'pointer', position: 'relative', overflow: 'hidden' },
  avatarFallback:    { width: '100%', height: '100%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#fff', borderRadius: '50%' },
  avatarImg:         { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' },
  cameraOverlay:     { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', borderRadius: '50%' },
  changePicBtn:      { fontSize: 12, color: '#6366f1', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' },
  asideDivider:      { height: 1, background: '#f1f5f9', margin: '0 0 14px' },
  sectionBtn:        { width: '100%', padding: '9px 12px', background: 'none', border: 'none', color: '#64748b', fontSize: 13, fontWeight: 500, cursor: 'pointer', borderRadius: 9, textAlign: 'left', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' },
  sectionBtnActive:  { background: '#eef2ff', color: '#6366f1', fontWeight: 700 },
  sectionBtnDot:     { width: 6, height: 6, borderRadius: '50%', background: '#6366f1', flexShrink: 0 },
  formSection:       { background: 'white', border: '1px solid #e2e8f0', borderRadius: 18, padding: '32px', boxShadow: '0 2px 12px rgba(99,102,241,0.04)', marginBottom: 16 },
  formSectionHeader: { marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid #f1f5f9' },
  formSectionTitle:  { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', fontFamily: 'Syne, sans-serif' },
  formSectionSub:    { fontSize: 13, color: '#94a3b8', margin: 0 },
  fieldLabel:        { fontSize: 13, fontWeight: 600, color: '#475569' },
  hint:              { fontSize: 12, color: '#94a3b8', margin: '0 0 8px' },
  input:             { width: '100%', padding: '11px 14px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, color: '#0f172a', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'none', transition: 'border-color 0.2s' },
  textarea:          { resize: 'vertical', minHeight: 110 },
  charCount:         { fontSize: 11, color: '#94a3b8', alignSelf: 'flex-end', marginTop: -4 },
  // Chips
  chipRow:           { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip:              { padding: '7px 14px', borderRadius: 20, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: 5 },
  chipActiveIndigo:  { background: '#eef2ff', border: '1.5px solid #6366f1', color: '#6366f1', fontWeight: 700 },
  chipActivePurple:  { background: '#faf5ff', border: '1.5px solid #a855f7', color: '#a855f7', fontWeight: 700 },
  chipActiveTeal:    { background: '#f0fdfa', border: '1.5px solid #14b8a6', color: '#0d9488', fontWeight: 700 },
  // Radio
  radioRow:          { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' },
  radioRowActive:    { background: '#eef2ff', borderColor: '#c7d2fe' },
  radioCircle:       { width: 16, height: 16, borderRadius: '50%', border: '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'border-color 0.2s' },
  radioCircleActive: { borderColor: '#6366f1' },
  radioDot:          { width: 7, height: 7, borderRadius: '50%', background: '#6366f1' },
  // Links
  inputWithIcon:     { position: 'relative' },
  inputIcon:         { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' },
  // Bottom bar
  bottomBar:         { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, padding: '20px 0', borderTop: '1px solid #f1f5f9' },
  cancelBtn:         { padding: '11px 20px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 9, color: '#64748b', fontSize: 14, fontWeight: 600, textDecoration: 'none' },
  saveBtn:           { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' },
  saveBtnDone:       { background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 0 16px rgba(34,197,94,0.3)' },
}