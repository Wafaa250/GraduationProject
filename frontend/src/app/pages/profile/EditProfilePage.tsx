import { useState, useRef, ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Save, Camera, Github, Linkedin, Globe,
  Plus, X, CheckCircle2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SkillItem {
  id: string
  label: string
  icon: string
}

interface EditFormState {
  fullName: string
  bio: string
  preferredRole: string
  availability: string
  lookingFor: string
  github: string
  linkedin: string
  portfolio: string
  languages: string[]
  tools: string[]
  generalSkills: string[]
  majorSkills: string[]
  profilePicPreview: string | null
}

// ─── Static Data ─────────────────────────────────────────────────────────────

const ALL_GENERAL_SKILLS: SkillItem[] = [
  { id: 'communication', label: 'Communication', icon: '💬' },
  { id: 'teamwork', label: 'Teamwork', icon: '🤝' },
  { id: 'leadership', label: 'Leadership', icon: '🎯' },
  { id: 'problem_solving', label: 'Problem Solving', icon: '🧩' },
  { id: 'time_management', label: 'Time Management', icon: '⏰' },
  { id: 'critical_thinking', label: 'Critical Thinking', icon: '🧠' },
]

const ALL_MAJOR_SKILLS: SkillItem[] = [
  { id: 'autocad', label: 'AutoCAD / CAD Design', icon: '📐' },
  { id: 'circuit_design', label: 'Circuit Design', icon: '⚡' },
  { id: 'structural_analysis', label: 'Structural Analysis', icon: '🏗️' },
  { id: 'programming_eng', label: 'Engineering Programming', icon: '💻' },
  { id: 'project_planning', label: 'Project Planning', icon: '📋' },
  { id: 'matlab', label: 'MATLAB / Simulation', icon: '📈' },
  { id: '3d_modeling', label: '3D Modeling', icon: '🧊' },
  { id: 'materials_science', label: 'Materials Science', icon: '🔩' },
  { id: 'energy_systems', label: 'Energy Systems', icon: '🔋' },
  { id: 'quality_control', label: 'Quality Control', icon: '✅' },
]

const ROLE_OPTIONS = [
  'Full-Stack Developer', 'Frontend Developer', 'Backend Developer',
  'UI/UX Designer', 'Data Scientist', 'Project Manager',
  'DevOps Engineer', 'Mobile Developer', 'AI/ML Engineer', 'Other',
]

const AVAILABILITY_OPTIONS = [
  'Less than 5 hours/week', '5–10 hours/week',
  '10–20 hours/week', '20+ hours/week', 'Full-time',
]

const LOOKING_FOR_OPTIONS = [
  'Graduation Project Team', 'Study Group',
  'Hackathon Team', 'Internship Partner', 'Open to anything',
]

const ALL_LANGUAGES = ['Arabic', 'English', 'French', 'German', 'Spanish', 'Chinese', 'Other']

const TOOL_SUGGESTIONS = [
  'Git/GitHub', 'VS Code', 'Figma', 'Postman', 'Docker',
  'Jira', 'Notion', 'Slack', 'MATLAB', 'AutoCAD',
  'Android Studio', 'Xcode', 'IntelliJ', 'PyCharm',
]

// ─── Initial state from "current user" (replace with API) ──────────────────

const INITIAL_FORM: EditFormState = {
  fullName: 'Mohammad Abdullah',
  bio: 'Passionate computer engineering student focused on building impactful software. Experienced in full-stack development and interested in AI applications for education. Currently looking for a motivated graduation project team.',
  preferredRole: 'Full-Stack Developer',
  availability: '10–20 hours/week',
  lookingFor: 'Graduation Project Team',
  github: 'github.com/mohabbas',
  linkedin: 'linkedin.com/in/mohabbas',
  portfolio: 'mohabbas.dev',
  languages: ['Arabic', 'English'],
  tools: ['Git/GitHub', 'VS Code', 'Figma', 'Postman', 'Docker'],
  generalSkills: ['communication', 'teamwork', 'problem_solving', 'leadership'],
  majorSkills: ['programming_eng', 'autocad', 'circuit_design', 'matlab', 'energy_systems'],
  profilePicPreview: null,
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EditProfilePage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<EditFormState>(INITIAL_FORM)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('basic')
  const [customTool, setCustomTool] = useState('')

  const set = <K extends keyof EditFormState>(key: K, value: EditFormState[K]) => {
    setForm(f => ({ ...f, [key]: value }))
    setSaved(false)
  }

  const handlePic = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (ev.target?.result) set('profilePicPreview', ev.target.result as string)
    }
    reader.readAsDataURL(file)
  }

  const toggleSkill = (field: 'generalSkills' | 'majorSkills', id: string) => {
    setForm(f => {
      const arr = f[field]
      const updated = arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]
      return { ...f, [field]: updated }
    })
    setSaved(false)
  }

  const toggleLanguage = (lang: string) => {
    setForm(f => {
      const arr = f.languages
      return { ...f, languages: arr.includes(lang) ? arr.filter(x => x !== lang) : [...arr, lang] }
    })
    setSaved(false)
  }

  const toggleTool = (tool: string) => {
    setForm(f => {
      const arr = f.tools
      return { ...f, tools: arr.includes(tool) ? arr.filter(x => x !== tool) : [...arr, tool] }
    })
    setSaved(false)
  }

  const addCustomTool = () => {
    const t = customTool.trim()
    if (t && !form.tools.includes(t)) {
      set('tools', [...form.tools, t])
    }
    setCustomTool('')
  }

  const handleSave = () => {
    // TODO: call PATCH /api/profile with form data
    setSaved(true)
    setTimeout(() => navigate('/profile'), 1200)
  }

  const sections = [
    { id: 'basic', label: '👤 Basic Info' },
    { id: 'work', label: '💼 Work Style' },
    { id: 'skills', label: '⚡ Skills' },
    { id: 'tools', label: '🔧 Tools' },
    { id: 'links', label: '🔗 Links' },
  ]

  const initials = form.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div style={S.page}>
      <BgDecor />

      {/* ── NAV ── */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <Link to="/profile" style={S.backBtn}>
            <ArrowLeft size={14} /> Back to Profile
          </Link>
          <div style={S.navTitle}>
            <span style={{ color: '#6EE7B7' }}>⟡</span> Edit Profile
          </div>
          <button
            style={{ ...S.saveBtn, ...(saved ? S.saveBtnDone : {}) }}
            onClick={handleSave}
          >
            {saved ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
          </button>
        </div>
      </nav>

      <div style={S.layout}>

        {/* ── LEFT NAV ── */}
        <aside style={S.aside}>
          <div style={S.asideCard}>
            {/* Avatar preview */}
            <div style={S.avatarSection}>
              <div style={S.avatarWrap} onClick={() => fileRef.current?.click()}>
                {form.profilePicPreview
                  ? <img src={form.profilePicPreview} style={S.avatarImg} alt="profile" />
                  : <div style={S.avatarFallback}>{initials}</div>
                }
                <div style={S.cameraOverlay}>
                  <Camera size={18} style={{ color: '#fff' }} />
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePic} />
              <button style={S.changePicBtn} onClick={() => fileRef.current?.click()}>
                Change Photo
              </button>
            </div>

            <div style={S.asideDivider} />

            {/* Section nav */}
            <nav style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
              {sections.map(s => (
                <button
                  key={s.id}
                  style={{ ...S.sectionBtn, ...(activeSection === s.id ? S.sectionBtnActive : {}) }}
                  onClick={() => setActiveSection(s.id)}
                >
                  {s.label}
                  {activeSection === s.id && <div style={S.sectionBtnDot} />}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── MAIN FORM ── */}
        <main style={S.main}>

          {/* ── BASIC INFO ── */}
          {activeSection === 'basic' && (
            <FormSection title="Basic Information" sub="Your name and personal summary">
              <Field label="Full Name" required>
                <input style={S.input} value={form.fullName}
                  onChange={e => set('fullName', e.target.value)}
                  placeholder="Your full name" />
              </Field>

              <Field label="Bio / About Me">
                <textarea
                  style={{ ...S.input, ...S.textarea }}
                  value={form.bio}
                  onChange={e => set('bio', e.target.value)}
                  placeholder="Tell teammates about yourself — your interests, goals, what you're working on..."
                  rows={5}
                />
                <span style={S.charCount}>{form.bio.length} / 500</span>
              </Field>

              <Field label="Languages">
                <div style={S.toggleGrid}>
                  {ALL_LANGUAGES.map(lang => {
                    const active = form.languages.includes(lang)
                    return (
                      <button key={lang}
                        style={{ ...S.toggleChip, ...(active ? S.toggleChipActive : {}) }}
                        onClick={() => toggleLanguage(lang)}>
                        {lang}
                        {active && <X size={10} style={{ marginLeft: 4, opacity: 0.7 }} />}
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
              <Field label="Preferred Role" required>
                <div style={S.optionGrid}>
                  {ROLE_OPTIONS.map(r => (
                    <button key={r}
                      style={{ ...S.optionBtn, ...(form.preferredRole === r ? S.optionBtnActive : {}) }}
                      onClick={() => set('preferredRole', r)}>
                      {r}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Weekly Availability">
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  {AVAILABILITY_OPTIONS.map(a => (
                    <button key={a}
                      style={{ ...S.radioRow, ...(form.availability === a ? S.radioRowActive : {}) }}
                      onClick={() => set('availability', a)}>
                      <div style={{ ...S.radioCircle, ...(form.availability === a ? S.radioCircleActive : {}) }}>
                        {form.availability === a && <div style={S.radioDot} />}
                      </div>
                      <span style={{ fontSize: 13, color: form.availability === a ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                        {a}
                      </span>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Looking For">
                <div style={S.optionGrid}>
                  {LOOKING_FOR_OPTIONS.map(l => (
                    <button key={l}
                      style={{ ...S.optionBtn, ...(form.lookingFor === l ? S.optionBtnActivePurple : {}) }}
                      onClick={() => set('lookingFor', l)}>
                      {l}
                    </button>
                  ))}
                </div>
              </Field>
            </FormSection>
          )}

          {/* ── SKILLS ── */}
          {activeSection === 'skills' && (
            <FormSection title="Your Skills" sub="Select all the skills that apply to you">
              <Field label={`General Skills · ${form.generalSkills.length} selected`}>
                <div style={S.skillGrid}>
                  {ALL_GENERAL_SKILLS.map(sk => {
                    const active = form.generalSkills.includes(sk.id)
                    return (
                      <button key={sk.id}
                        style={{ ...S.skillCard, ...(active ? S.skillCardActive : {}) }}
                        onClick={() => toggleSkill('generalSkills', sk.id)}>
                        <span style={{ fontSize: 24 }}>{sk.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'center' as const, color: active ? '#6EE7B7' : 'rgba(255,255,255,0.6)', lineHeight: 1.3 }}>
                          {sk.label}
                        </span>
                        {active && <CheckCircle2 size={13} style={{ color: '#6EE7B7', position: 'absolute' as const, top: 8, right: 8 }} />}
                      </button>
                    )
                  })}
                </div>
              </Field>

              <Field label={`Major Skills · ${form.majorSkills.length} selected`}>
                <div style={S.skillGrid}>
                  {ALL_MAJOR_SKILLS.map(sk => {
                    const active = form.majorSkills.includes(sk.id)
                    return (
                      <button key={sk.id}
                        style={{ ...S.skillCard, ...(active ? S.skillCardActivePurple : {}) }}
                        onClick={() => toggleSkill('majorSkills', sk.id)}>
                        <span style={{ fontSize: 24 }}>{sk.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'center' as const, color: active ? '#A78BFA' : 'rgba(255,255,255,0.6)', lineHeight: 1.3 }}>
                          {sk.label}
                        </span>
                        {active && <CheckCircle2 size={13} style={{ color: '#A78BFA', position: 'absolute' as const, top: 8, right: 8 }} />}
                      </button>
                    )
                  })}
                </div>
              </Field>
            </FormSection>
          )}

          {/* ── TOOLS ── */}
          {activeSection === 'tools' && (
            <FormSection title="Tools & Technologies" sub="What tools do you use regularly?">
              <Field label="Selected Tools">
                {form.tools.length > 0 ? (
                  <div style={S.selectedTools}>
                    {form.tools.map(t => (
                      <span key={t} style={S.toolBadge}>
                        {t}
                        <button style={S.toolRemoveBtn} onClick={() => toggleTool(t)}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>No tools selected yet.</p>
                )}
              </Field>

              <Field label="Quick Add">
                <div style={S.toggleGrid}>
                  {TOOL_SUGGESTIONS.filter(t => !form.tools.includes(t)).map(t => (
                    <button key={t}
                      style={{ ...S.toggleChip, background: 'rgba(255,255,255,0.04)' }}
                      onClick={() => toggleTool(t)}>
                      <Plus size={10} style={{ opacity: 0.6 }} /> {t}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Add Custom Tool">
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    style={{ ...S.input, flex: 1 }}
                    value={customTool}
                    onChange={e => setCustomTool(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomTool()}
                    placeholder="e.g. Blender, Unity, Terraform..."
                  />
                  <button style={S.addToolBtn} onClick={addCustomTool}>
                    <Plus size={14} /> Add
                  </button>
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
                  <input style={{ ...S.input, paddingLeft: 38 }}
                    value={form.github}
                    onChange={e => set('github', e.target.value)}
                    placeholder="github.com/username" />
                </div>
              </Field>

              <Field label="LinkedIn">
                <div style={S.inputWithIcon}>
                  <Linkedin size={15} style={S.inputIcon} />
                  <input style={{ ...S.input, paddingLeft: 38 }}
                    value={form.linkedin}
                    onChange={e => set('linkedin', e.target.value)}
                    placeholder="linkedin.com/in/username" />
                </div>
              </Field>

              <Field label="Portfolio / Website">
                <div style={S.inputWithIcon}>
                  <Globe size={15} style={S.inputIcon} />
                  <input style={{ ...S.input, paddingLeft: 38 }}
                    value={form.portfolio}
                    onChange={e => set('portfolio', e.target.value)}
                    placeholder="yourwebsite.com" />
                </div>
              </Field>
            </FormSection>
          )}

          {/* Save button bottom */}
          <div style={S.bottomBar}>
            <Link to="/profile" style={S.cancelBtn}>Cancel</Link>
            <button
              style={{ ...S.saveBtn, ...S.saveBtnLarge, ...(saved ? S.saveBtnDone : {}) }}
              onClick={handleSave}
            >
              {saved
                ? <><CheckCircle2 size={16} /> Profile Saved!</>
                : <><Save size={16} /> Save Changes</>
              }
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormSection({ title, sub, children }: {
  title: string
  sub: string
  children: React.ReactNode
}) {
  return (
    <div style={S.formSection}>
      <div style={S.formSectionHeader}>
        <h2 style={S.formSectionTitle}>{title}</h2>
        <p style={S.formSectionSub}>{sub}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 24 }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, required = false, children }: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
      <label style={S.fieldLabel}>
        {label} {required && <span style={{ color: '#F87171' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function BgDecor() {
  return (
    <>
      <div style={{ position: 'fixed' as const, top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(110,231,183,0.04) 0%, transparent 70%)', pointerEvents: 'none' as const, zIndex: 0 }} />
      <div style={{ position: 'fixed' as const, bottom: -200, left: -200, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 70%)', pointerEvents: 'none' as const, zIndex: 0 }} />
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: 'linear-gradient(160deg, #080d1a 0%, #0d1628 60%, #080d1a 100%)', fontFamily: "'Segoe UI', Tahoma, sans-serif", color: '#fff', paddingBottom: 80 },

  // Nav
  nav: { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(8,13,26,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  navInner: { maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navTitle: { fontSize: 15, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 },
  backBtn: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 500 },
  saveBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'linear-gradient(135deg, #6EE7B7, #34D399)', color: '#0f172a', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s' },
  saveBtnDone: { background: 'linear-gradient(135deg, #34D399, #10B981)', boxShadow: '0 0 16px rgba(52,211,153,0.3)' },
  saveBtnLarge: { padding: '12px 28px', fontSize: 15 },

  // Layout
  layout: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' },
  aside: { position: 'sticky', top: 76 },
  main: { display: 'flex', flexDirection: 'column', gap: 0 },

  // Aside
  asideCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, backdropFilter: 'blur(12px)' },
  avatarSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 18 },
  avatarWrap: { width: 80, height: 80, borderRadius: '50%', cursor: 'pointer', position: 'relative', overflow: 'hidden' },
  avatarFallback: { width: '100%', height: '100%', background: 'linear-gradient(135deg, #6EE7B7, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#0f172a', borderRadius: '50%' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' },
  cameraOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', borderRadius: '50%' },
  changePicBtn: { fontSize: 12, color: '#6EE7B7', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' },
  asideDivider: { height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 0 14px' },

  sectionBtn: { width: '100%', padding: '9px 12px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 500, cursor: 'pointer', borderRadius: 9, textAlign: 'left', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' },
  sectionBtnActive: { background: 'rgba(110,231,183,0.08)', color: '#6EE7B7', fontWeight: 700 },
  sectionBtnDot: { width: 6, height: 6, borderRadius: '50%', background: '#6EE7B7', flexShrink: 0 },

  // Form section
  formSection: { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '32px', backdropFilter: 'blur(12px)', marginBottom: 16 },
  formSectionHeader: { marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' },
  formSectionTitle: { fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 6px' },
  formSectionSub: { fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 },

  fieldLabel: { fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' },
  input: { width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'none', transition: 'border-color 0.2s' },
  textarea: { resize: 'vertical', minHeight: 110 },
  charCount: { fontSize: 11, color: 'rgba(255,255,255,0.25)', alignSelf: 'flex-end', marginTop: -4 },

  // Toggles / chips
  toggleGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  toggleChip: { padding: '6px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', transition: 'all 0.2s' },
  toggleChipActive: { background: 'rgba(110,231,183,0.12)', border: '1px solid rgba(110,231,183,0.35)', color: '#6EE7B7', fontWeight: 700 },

  // Option buttons
  optionGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  optionBtn: { padding: '8px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, fontSize: 13, color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, transition: 'all 0.2s' },
  optionBtnActive: { background: 'rgba(110,231,183,0.12)', border: '1px solid rgba(110,231,183,0.4)', color: '#6EE7B7', fontWeight: 700 },
  optionBtnActivePurple: { background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.4)', color: '#A78BFA', fontWeight: 700 },

  // Radio rows
  radioRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' },
  radioRowActive: { background: 'rgba(110,231,183,0.06)', borderColor: 'rgba(110,231,183,0.25)' },
  radioCircle: { width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'border-color 0.2s' },
  radioCircleActive: { borderColor: '#6EE7B7' },
  radioDot: { width: 7, height: 7, borderRadius: '50%', background: '#6EE7B7' },

  // Skills
  skillGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 },
  skillCard: { padding: '16px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, cursor: 'pointer', position: 'relative', transition: 'all 0.2s', fontFamily: 'inherit' },
  skillCardActive: { background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.35)' },
  skillCardActivePurple: { background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.35)' },

  // Tools
  selectedTools: { display: 'flex', flexWrap: 'wrap', gap: 8, padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' },
  toolBadge: { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px 5px 12px', background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.25)', borderRadius: 20, fontSize: 12, color: '#6EE7B7', fontWeight: 600 },
  toolRemoveBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#6EE7B7', display: 'flex', alignItems: 'center', padding: 0 },
  addToolBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '11px 18px', background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.25)', borderRadius: 10, color: '#6EE7B7', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },

  // Links
  inputWithIcon: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' },

  // Bottom bar
  bottomBar: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, padding: '20px 0', borderTop: '1px solid rgba(255,255,255,0.06)' },
  cancelBtn: { padding: '11px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 600, textDecoration: 'none' },
}