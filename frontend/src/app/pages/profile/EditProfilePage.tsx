import { useState, useRef, ChangeEvent, useEffect, useMemo, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Save, Github, Linkedin, Globe, CheckCircle2, Sparkles } from 'lucide-react'
import { useUser, normalizeSkillStringList } from "../../../context/UserContext"
import api from '../../../api/axiosInstance'
import { StudentDashboardShell } from '../dashboard/components/StudentDashboardShell'
import {
  EditProfileFormShell,
  type EditProfileSectionId,
} from './components/EditProfileFormShell'
import { Button } from '../../components/ui/button'
import {
  CUSTOM_SKILL_MAX_LENGTH,
  customSelections,
  getSkillsPack,
  normalizeCustomSkill,
} from '../../../constants/studentSkillPools'

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
  const { profile, refetch } = useUser()
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
    roles:             normalizeSkillStringList((profile as any).roles ?? (profile as any).generalSkills),
    technicalSkills:   normalizeSkillStringList((profile as any).technicalSkills ?? (profile as any).majorSkills),
    tools:             normalizeSkillStringList(profile.tools),
    profilePicPreview: profile.profilePic    || null,
  })

  const [pageLoading,   setPageLoading]   = useState(true)
  const [saved,         setSaved]         = useState(false)
  const [isSaving,      setIsSaving]      = useState(false)
  const [saveError,     setSaveError]     = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<EditProfileSectionId>('basic')
  const [customDraft, setCustomDraft] = useState({ roles: '', technicalSkills: '', tools: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const globalSearchWrapRef = useRef<HTMLDivElement>(null)
  const [academic, setAcademic] = useState({
    faculty: profile.faculty || '',
    major: profile.major || '',
    university: profile.university || '',
    academicYear: profile.academicYear || '',
  })

  const skillsData = useMemo(
    () => getSkillsPack(academic.faculty || undefined, academic.major || undefined),
    [academic.faculty, academic.major],
  )

  // ── Fetch profile on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/me')
        const d   = res.data
        setAcademic({
          faculty: d.faculty || '',
          major: d.major || '',
          university: d.university || '',
          academicYear: d.academicYear || '',
        })
        setForm({
          fullName:          d.name || d.fullName   || '',
          bio:               d.bio                  || '',
          availability:      d.availability         || '',
          lookingFor:        d.lookingFor           || '',
          github:            d.github               || '',
          linkedin:          d.linkedin             || '',
          portfolio:         d.portfolio            || '',
          languages:         d.languages            || [],
          roles:             normalizeSkillStringList(d.roles ?? d.generalSkills),
          technicalSkills:   normalizeSkillStringList(d.technicalSkills ?? d.majorSkills),
          tools:             normalizeSkillStringList(d.tools),
          profilePicPreview: d.profilePictureBase64 || null,
        })
      } catch { /* keep context values */ }
      finally { setPageLoading(false) }
    }
    fetch()
  }, [])

  useEffect(() => {
    if (!profile.faculty && !profile.major) return
    setAcademic({
      faculty: profile.faculty || '',
      major: profile.major || '',
      university: profile.university || '',
      academicYear: profile.academicYear || '',
    })
  }, [profile.faculty, profile.major, profile.university, profile.academicYear])

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash === 'basic' || hash === 'work' || hash === 'skills' || hash === 'links') {
      setActiveSection(hash)
    }
  }, [])

  const completeness = useMemo(() => {
    const skillCount =
      form.roles.length + form.technicalSkills.length + form.tools.length
    return Math.min(
      20 +
        (form.fullName.trim() ? 10 : 0) +
        (form.bio.trim() ? 15 : 0) +
        (skillCount > 0 ? 25 : 0) +
        (form.availability ? 10 : 0) +
        (form.lookingFor ? 10 : 0) +
        (form.profilePicPreview ? 10 : 0),
      100,
    )
  }, [form])

  const completenessHint =
    completeness >= 80
      ? 'Strong profile — you are ready for better AI teammate matches.'
      : 'Complete your about, skills, and work style to unlock stronger AI recommendations.'

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

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

  const addCustomSkill = (field: 'roles' | 'technicalSkills' | 'tools') => {
    const v = normalizeCustomSkill(customDraft[field])
    if (!v) return
    setForm(f => {
      const arr = f[field] as string[]
      if (arr.some(x => x.toLowerCase() === v.toLowerCase())) return f
      return { ...f, [field]: [...arr, v] }
    })
    setCustomDraft(d => ({ ...d, [field]: '' }))
    setSaved(false)
  }

  const handleSave = async () => {
    setIsSaving(true); setSaveError(null)
    try {
      const roles = normalizeSkillStringList(form.roles)
      const technicalSkills = normalizeSkillStringList(form.technicalSkills)
      const tools = normalizeSkillStringList(form.tools)
      const skills = [...new Set([...roles, ...technicalSkills, ...tools])]

      const payload = {
        fullName:             form.fullName,
        bio:                  form.bio,
        availability:         form.availability,
        lookingFor:           form.lookingFor,
        github:               form.github,
        linkedin:             form.linkedin,
        portfolio:            form.portfolio,
        languages:            form.languages,
        roles,
        technicalSkills,
        tools,
        skills,
        profilePictureBase64: form.profilePicPreview,
      }
      console.log("UPDATE PAYLOAD", payload)
      await api.put("/profile", payload)
      const response = await refetch(true)
      console.log("UPDATED USER", response)
      setSaved(true)
      setTimeout(() => navigate('/profile'), 1200)
    } catch (err: any) {
      setSaveError(err.response?.data?.message || 'Failed to save. Please try again.')
    } finally { setIsSaving(false) }
  }

  const initials = form.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  if (pageLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-gradient-surface">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Loading your profile…</p>
        </div>
      </div>
    )
  }

  const saveFooter = (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">
      {saveError ? (
        <p className="mr-auto text-sm font-medium text-destructive">{saveError}</p>
      ) : null}
      <Button variant="outline" asChild>
        <Link to="/profile">Cancel</Link>
      </Button>
      <Button variant="gradient" disabled={isSaving} onClick={() => void handleSave()}>
        {isSaving ? (
          'Saving…'
        ) : saved ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Profile saved
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save changes
          </>
        )}
      </Button>
    </div>
  )

  return (
    <StudentDashboardShell
      userName={form.fullName}
      profilePic={form.profilePicPreview}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchWrapRef={globalSearchWrapRef}
      globalSearchResults={null}
      globalSearchLoading={false}
      onSelectStudent={(id) => navigate(`/students/${id}`)}
      onSelectDoctor={(id) => navigate(`/doctors/${id}`)}
      onOpenSettings={() => {}}
      onLogout={handleLogout}
    >
      <EditProfileFormShell
        activeSection={activeSection}
        onSectionChange={(id) => {
          setActiveSection(id)
          window.location.hash = id
        }}
        fullName={form.fullName}
        major={academic.major || undefined}
        academicYear={academic.academicYear || undefined}
        university={academic.university || undefined}
        profilePicPreview={form.profilePicPreview}
        initials={initials}
        fileRef={fileRef}
        onPhotoClick={() => fileRef.current?.click()}
        onPhotoChange={handlePic}
        availability={form.availability}
        completeness={completeness}
        completenessHint={completenessHint}
        profileTasks={[
          { label: "Skills added", done: form.roles.length + form.technicalSkills.length + form.tools.length > 0 },
          { label: "Bio written", done: Boolean(form.bio.trim()) },
          { label: "Availability set", done: Boolean(form.availability) },
          { label: "Looking for set", done: Boolean(form.lookingFor) },
        ]}
        footer={saveFooter}
      >
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
            <FormSection title="Your Skills" sub="Help the AI find the best team matches for you">
              {!skillsData ? (
                <p style={S.skillsWarning}>
                  We could not match skills to your program. Add your faculty and major during registration, or contact support if your major is already shown above but skills still do not appear.
                </p>
              ) : (
              <>
              <Field label={`Team roles · ${form.roles.length} selected`}>
                <p style={S.hint}>How you usually contribute on projects (separate from your major)</p>
                <div style={S.chipRow}>
                  {skillsData.roles.map(r => (
                    <button key={r}
                      style={{ ...S.chip, ...(form.roles.includes(r) ? S.chipActiveIndigo : {}) }}
                      onClick={() => toggleArr('roles', r)}>
                      {form.roles.includes(r) && <span style={{ fontSize: 10, fontWeight: 900 }}>✓</span>} {r}
                    </button>
                  ))}
                  {customSelections(form.roles, skillsData.roles).map(r => (
                    <button key={`extra-${r}`}
                      type="button"
                      style={{ ...S.chip, ...S.chipActiveIndigo }}
                      onClick={() => toggleArr('roles', r)}>
                      <span style={{ fontSize: 10, fontWeight: 900 }}>✓</span> {r}
                    </button>
                  ))}
                </div>
                <SkillsCustomAdd
                  value={customDraft.roles}
                  onChange={v => setCustomDraft(d => ({ ...d, roles: v }))}
                  onAdd={() => addCustomSkill('roles')}
                  maxLen={CUSTOM_SKILL_MAX_LENGTH}
                />
              </Field>

              {/* Technical Skills */}
              <Field label={`Technical Skills · ${form.technicalSkills.length} selected`}>
                <p style={S.hint}>Skills you're comfortable with</p>
                <div style={S.chipRow}>
                  {skillsData.technicalSkills.map(s => (
                    <button key={s}
                      style={{ ...S.chip, ...(form.technicalSkills.includes(s) ? S.chipActivePurple : {}) }}
                      onClick={() => toggleArr('technicalSkills', s)}>
                      {form.technicalSkills.includes(s) && <span style={{ fontSize: 10, fontWeight: 900 }}>✓</span>} {s}
                    </button>
                  ))}
                  {customSelections(form.technicalSkills, skillsData.technicalSkills).map(s => (
                    <button key={`extra-${s}`}
                      type="button"
                      style={{ ...S.chip, ...S.chipActivePurple }}
                      onClick={() => toggleArr('technicalSkills', s)}>
                      <span style={{ fontSize: 10, fontWeight: 900 }}>✓</span> {s}
                    </button>
                  ))}
                </div>
                <SkillsCustomAdd
                  value={customDraft.technicalSkills}
                  onChange={v => setCustomDraft(d => ({ ...d, technicalSkills: v }))}
                  onAdd={() => addCustomSkill('technicalSkills')}
                  maxLen={CUSTOM_SKILL_MAX_LENGTH}
                />
              </Field>

              {/* Technologies & Tools */}
              <Field label={`Technologies & Tools · ${form.tools.length} selected`}>
                <p style={S.hint}>Languages, frameworks, and tools you use</p>
                <div style={S.chipRow}>
                  {skillsData.tools.map(t => (
                    <button key={t}
                      style={{ ...S.chip, ...(form.tools.includes(t) ? S.chipActiveTeal : {}) }}
                      onClick={() => toggleArr('tools', t)}>
                      {form.tools.includes(t) && <span style={{ fontSize: 10, fontWeight: 900 }}>✓</span>} {t}
                    </button>
                  ))}
                  {customSelections(form.tools, skillsData.tools).map(t => (
                    <button key={`extra-${t}`}
                      type="button"
                      style={{ ...S.chip, ...S.chipActiveTeal }}
                      onClick={() => toggleArr('tools', t)}>
                      <span style={{ fontSize: 10, fontWeight: 900 }}>✓</span> {t}
                    </button>
                  ))}
                </div>
                <SkillsCustomAdd
                  value={customDraft.tools}
                  onChange={v => setCustomDraft(d => ({ ...d, tools: v }))}
                  onAdd={() => addCustomSkill('tools')}
                  maxLen={CUSTOM_SKILL_MAX_LENGTH}
                />
              </Field>
              </>
              )}

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


      </EditProfileFormShell>
    </StudentDashboardShell>
  )

}

// ─── Sub-components ───────────────────────────────────────────────────────────
function FormSection({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
      </div>
      <div className="flex flex-col gap-6">{children}</div>
    </div>
  )
}

function SkillsCustomAdd({
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
      <p style={{ ...S.hint, margin: '0 0 8px' }}>
        Other — not listed? Type and press Enter or Add (max {maxLen} characters).
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
          placeholder="e.g. specific tool or method"
        />
        <button type="button" style={S.btnAddCustom} onClick={onAdd}>
          Add
        </button>
      </div>
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
  skillsWarning:     { padding: 16, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, color: '#92400e', fontSize: 13, margin: 0, lineHeight: 1.5 },
  input:             { width: '100%', padding: '11px 14px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, color: '#0f172a', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'none', transition: 'border-color 0.2s' },
  textarea:          { resize: 'vertical', minHeight: 110 },
  charCount:         { fontSize: 11, color: '#94a3b8', alignSelf: 'flex-end', marginTop: -4 },
  // Chips
  chipRow:           { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip:              { padding: '7px 14px', borderRadius: 20, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: 5 },
  chipActiveIndigo:  { background: '#eef2ff', border: '1.5px solid #6366f1', color: '#6366f1', fontWeight: 700 },
  chipActivePurple:  { background: '#faf5ff', border: '1.5px solid #a855f7', color: '#a855f7', fontWeight: 700 },
  chipActiveTeal:    { background: '#f0fdfa', border: '1.5px solid #14b8a6', color: '#0d9488', fontWeight: 700 },
  btnAddCustom:      { padding: '10px 16px', background: '#f8fafc', border: '1.5px solid #c7d2fe', borderRadius: 10, color: '#4f46e5', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
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