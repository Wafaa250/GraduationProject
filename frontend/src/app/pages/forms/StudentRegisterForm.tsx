import { useState, useRef, ReactNode, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  profilePic: File | null
  profilePicPreview: string | null
  studentId: string
  university: string
  faculty: string
  major: string
  academicYear: string
  gpa: string
  generalSkills: string[]
  majorSkills: string[]
}

interface Skill {
  id: string
  label: string
  icon: string
}

type SkillCategory = 'medical' | 'engineering' | 'tech' | 'business' | 'design' | 'media' | 'science'

// ─── Data ─────────────────────────────────────────────────────────────────────

const UNIVERSITIES: string[] = [
  'An-Najah National University (NNU)',
  'Birzeit University',
  'Al-Quds University',
  'Palestine Polytechnic University',
  'Hebron University',
  'Arab American University',
  'Al-Quds Open University',
  'Other',
]

const UNIVERSITY_FACULTIES: Record<string, string[]> = {
  'An-Najah National University (NNU)': [
    'Faculty of Medicine and Allied Medical Sciences',
    'NNU - Faculty of Engineering',
  ],
  default: [
    'Faculty of Information Technology & Computer Engineering',
    'Faculty of Engineering',
    'Faculty of Business & Economics',
    'Faculty of Arts & Design',
    'Faculty of Media & Communication',
    'Faculty of Science',
    'Faculty of Medicine & Health Sciences',
    'Faculty of Law',
    'Faculty of Education',
    'Other',
  ],
}

const MAJORS: Record<string, string[]> = {
  'Faculty of Medicine and Allied Medical Sciences': [
    'Health Information Management', 'Optometry',
    'Anesthesia and Resuscitation Technology', 'Medical Imaging',
    'Clinical Nutrition', 'Medicine (Doctor of Medicine – MD)',
    'Physical Therapy', 'Biomedical Sciences', 'Medical Laboratory Sciences',
    'Respiratory Care', 'Therapeutic Exercise and Rehabilitation',
    'Cardiac Perfusion Technology', 'Speech and Hearing Sciences',
  ],
  'NNU - Faculty of Engineering': [
    'Industrial Engineering', 'Electrical Engineering', 'Chemical Engineering',
    'Chemical Engineering – Pharmaceutical Engineering Minor', 'Civil Engineering',
    'Architectural Engineering', 'Mechanical Engineering',
    'Mechanical Engineering – Vehicle Engineering Minor', 'Construction Engineering',
    'Urban Planning and City Technology Engineering', 'Computer Engineering',
    'Network and Smart Systems Engineering', 'Energy and Environmental Engineering',
    'Surveying and Geomatics Engineering', 'Mechatronics Engineering',
    'Materials Science Engineering',
  ],
  'Faculty of Information Technology & Computer Engineering': [
    'Computer Engineering', 'Computer Science', 'Information Technology',
    'Software Engineering', 'Artificial Intelligence', 'Cyber Security',
    'Data Science', 'Information Systems',
  ],
  'Faculty of Engineering': [
    'Electrical Engineering', 'Telecommunications Engineering',
    'Civil Engineering', 'Mechanical Engineering',
  ],
  'Faculty of Business & Economics': [
    'Business Administration', 'Accounting', 'Marketing',
    'Economics', 'Finance', 'Entrepreneurship',
  ],
  'Faculty of Arts & Design': ['Graphic Design', 'UI/UX Design', 'Visual Arts', 'Interior Design'],
  'Faculty of Media & Communication': ['Journalism', 'Public Relations', 'Digital Media', 'Media Production'],
  'Faculty of Science': ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
}

const FACULTY_CATEGORY: Record<string, SkillCategory> = {
  'Faculty of Medicine and Allied Medical Sciences': 'medical',
  'NNU - Faculty of Engineering': 'engineering',
  'Faculty of Information Technology & Computer Engineering': 'tech',
  'Faculty of Engineering': 'engineering',
  'Faculty of Business & Economics': 'business',
  'Faculty of Arts & Design': 'design',
  'Faculty of Media & Communication': 'media',
  'Faculty of Science': 'science',
}

const GENERAL_SKILLS: Skill[] = [
  { id: 'communication', label: 'Communication', icon: '💬' },
  { id: 'teamwork', label: 'Teamwork', icon: '🤝' },
  { id: 'leadership', label: 'Leadership', icon: '🎯' },
  { id: 'problem_solving', label: 'Problem Solving', icon: '🧩' },
  { id: 'time_management', label: 'Time Management', icon: '⏰' },
  { id: 'critical_thinking', label: 'Critical Thinking', icon: '🧠' },
]

const MAJOR_SKILLS: Record<SkillCategory, Skill[]> = {
  medical: [
    { id: 'clinical_skills', label: 'Clinical Skills', icon: '🩺' },
    { id: 'patient_care', label: 'Patient Care', icon: '❤️' },
    { id: 'medical_imaging', label: 'Medical Imaging', icon: '🩻' },
    { id: 'lab_diagnostics', label: 'Lab Diagnostics', icon: '🧪' },
    { id: 'health_informatics', label: 'Health Informatics', icon: '💊' },
    { id: 'anatomy', label: 'Anatomy & Physiology', icon: '🫀' },
    { id: 'nutrition_science', label: 'Nutrition Science', icon: '🥗' },
    { id: 'rehabilitation', label: 'Rehabilitation Therapy', icon: '🦽' },
    { id: 'research_methods', label: 'Research Methods', icon: '🔬' },
    { id: 'medical_data', label: 'Medical Data Analysis', icon: '📊' },
  ],
  engineering: [
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
  ],
  tech: [
    { id: 'programming', label: 'Programming', icon: '💻' },
    { id: 'web_dev', label: 'Web Development', icon: '🌐' },
    { id: 'mobile_dev', label: 'Mobile Development', icon: '📱' },
    { id: 'ai_ml', label: 'AI / Machine Learning', icon: '🤖' },
    { id: 'cyber_security', label: 'Cyber Security', icon: '🔒' },
    { id: 'data_analysis', label: 'Data Analysis', icon: '📊' },
    { id: 'networking', label: 'Networking', icon: '🔗' },
    { id: 'database', label: 'Database Management', icon: '🗄️' },
  ],
  business: [
    { id: 'marketing', label: 'Marketing', icon: '📣' },
    { id: 'finance', label: 'Finance', icon: '💰' },
    { id: 'entrepreneurship', label: 'Entrepreneurship', icon: '🚀' },
    { id: 'business_analysis', label: 'Business Analysis', icon: '📈' },
    { id: 'project_management', label: 'Project Management', icon: '📋' },
  ],
  design: [
    { id: 'graphic_design', label: 'Graphic Design', icon: '🎨' },
    { id: 'ui_ux', label: 'UI/UX Design', icon: '🖼️' },
    { id: 'branding', label: 'Branding', icon: '✨' },
    { id: 'illustration', label: 'Illustration', icon: '🖌️' },
  ],
  media: [
    { id: 'content_writing', label: 'Content Writing', icon: '✍️' },
    { id: 'video_editing', label: 'Video Editing', icon: '🎬' },
    { id: 'photography', label: 'Photography', icon: '📷' },
    { id: 'social_media', label: 'Social Media Management', icon: '📲' },
  ],
  science: [
    { id: 'research', label: 'Research & Analysis', icon: '🔬' },
    { id: 'data_analysis', label: 'Data Analysis', icon: '📊' },
    { id: 'lab_skills', label: 'Laboratory Skills', icon: '🧪' },
    { id: 'technical_writing', label: 'Technical Writing', icon: '📝' },
  ],
}

const STEPS = [
  { id: 'account', label: 'Account', icon: '👤' },
  { id: 'student', label: 'Student Info', icon: '🎓' },
  { id: 'academic', label: 'Academic', icon: '📚' },
  { id: 'skills', label: 'Skills', icon: '⚡' },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface StudentRegisterFormProps {
  onBack?: (() => void) | null
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentRegisterForm({ onBack = null }: StudentRegisterFormProps) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormState>({
    fullName: '', email: '', password: '', confirmPassword: '',
    profilePic: null, profilePicPreview: null,
    studentId: '', university: '', faculty: '', major: '',
    academicYear: '', gpa: '',
    generalSkills: [], majorSkills: [],
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'generalSkills', string>>>({})
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const toggleSkill = (field: 'generalSkills' | 'majorSkills', id: string) => {
    setForm(f => {
      const arr = f[field]
      return { ...f, [field]: arr.includes(id) ? arr.filter((x: string) => x !== id) : [...arr, id] }
    })
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

  const handleUniversity = (val: string) => {
    setForm(f => ({ ...f, university: val, faculty: '', major: '', majorSkills: [] }))
  }
  const handleFaculty = (val: string) => {
    setForm(f => ({ ...f, faculty: val, major: '', majorSkills: [] }))
  }
  const handleMajor = (val: string) => {
    setForm(f => ({ ...f, major: val, majorSkills: [] }))
  }

  const availableFaculties: string[] = form.university
    ? (UNIVERSITY_FACULTIES[form.university] ?? UNIVERSITY_FACULTIES['default'])
    : UNIVERSITY_FACULTIES['default']

  const facultyCategory = FACULTY_CATEGORY[form.faculty] as SkillCategory | undefined
  const availableMajorSkills: Skill[] = facultyCategory ? MAJOR_SKILLS[facultyCategory] : []
  const availableMajors: string[] = MAJORS[form.faculty] ?? []

  // ── Validation ──
  const validate = (): boolean => {
    const e: Partial<Record<string, string>> = {}
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
    }
    if (step === 2) {
      if (!form.academicYear) e.academicYear = 'Please select your academic year'
    }
    if (step === 3) {
      if (form.generalSkills.length === 0) e.generalSkills = 'Please select at least one general skill'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate()) setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)
  const submit = () => { if (validate()) setSubmitted(true) }

  // ── Password strength ──
  const passChecks = [
    form.password.length >= 8,
    /[A-Z]/.test(form.password),
    /[0-9]/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ]
  const passScore = passChecks.filter(Boolean).length
  const passLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const passColors = ['', '#F87171', '#FBBF24', '#34D399', '#6EE7B7']

  // ── GPA bar ──
  const gpaVal = parseFloat(form.gpa)
  const gpaPct = Math.min((gpaVal / 4) * 100, 100)
  const gpaColor = gpaVal >= 3.5 ? '#6EE7B7' : gpaVal >= 2.5 ? '#FBBF24' : '#F87171'
  const gpaLabel = gpaVal >= 3.5 ? 'Excellent' : gpaVal >= 2.5 ? 'Good' : 'Needs Improvement'

  // ── Success screen ──
  if (submitted) return (
    <div style={S.page}>
      <Blobs />
      <div style={S.successWrap}>
        <div style={S.successRing}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="17" stroke="#6EE7B7" strokeWidth="2" />
            <path d="M10 18l6 6 10-10" stroke="#6EE7B7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 style={S.successH2}>Profile Created!</h2>
        <p style={S.successP}>
          Welcome to SkillSwap, <strong style={{ color: '#fff' }}>{form.fullName || 'there'}</strong>!
          Your academic profile is live. Our AI will now analyze your skills and match you with the right teammates and projects.
        </p>

        <div style={S.successStats}>
          <div style={S.successStat}>
            <span style={S.successStatNum}>{form.generalSkills.length + form.majorSkills.length}</span>
            <span style={S.successStatLabel}>Skills Added</span>
          </div>
          <div style={S.successStatDivider} />
          <div style={S.successStat}>
            <span style={S.successStatNum}>{form.major ? '✓' : '—'}</span>
            <span style={S.successStatLabel}>Major Set</span>
          </div>
          <div style={S.successStatDivider} />
          <div style={S.successStat}>
            <span style={S.successStatNum}>0</span>
            <span style={S.successStatLabel}>Connections</span>
          </div>
        </div>

        {(form.generalSkills.length > 0 || form.majorSkills.length > 0) && (
          <div style={S.successChips}>
            {form.generalSkills.slice(0, 3).map(id => {
              const sk = GENERAL_SKILLS.find(x => x.id === id)
              return sk ? <span key={id} style={S.chip}>{sk.icon} {sk.label}</span> : null
            })}
            {form.majorSkills.slice(0, 3).map(id => {
              const sk = availableMajorSkills.find(x => x.id === id)
              return sk ? <span key={id} style={{ ...S.chip, ...S.chipPurple }}>{sk.icon} {sk.label}</span> : null
            })}
          </div>
        )}

        <div style={S.successActions}>
          <button style={S.btnSubmit} onClick={() => navigate('/profile')}>View My Profile →</button>
          <button style={S.successDashBtn} onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
        </div>
        <p style={S.successFootnote}>You can complete your profile anytime from your dashboard</p>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <Blobs />
      <div style={S.wrap}>

        {/* Logo */}
        <div style={S.logo}>
          <span style={S.logoMark}>⟡</span>
          <span style={S.logoName}>SkillSwap</span>
        </div>

        {/* Change role button */}
        {onBack && (
          <div style={{ textAlign: 'center' as const, marginBottom: 8 }}>
            <button onClick={onBack} style={S.changeRoleBtn}>← Change role</button>
            <span style={S.roleBadge}>Student</span>
          </div>
        )}

        {/* Stepper */}
        <div style={S.stepper}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={S.stepperItem}>
              <div style={{ ...S.stepDot, ...(i === step ? S.stepDotActive : i < step ? S.stepDotDone : S.stepDotIdle) }}>
                {i < step
                  ? <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 900 }}>✓</span>
                  : <span style={{ fontSize: 12, fontWeight: 700, color: i === step ? '#0f172a' : 'rgba(255,255,255,0.25)' }}>{i + 1}</span>
                }
              </div>
              <span style={{ ...S.stepLabel, color: i === step ? '#fff' : i < step ? '#6EE7B7' : 'rgba(255,255,255,0.3)' }}>
                {s.icon} {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div style={{ ...S.stepLine, background: i < step ? 'linear-gradient(90deg,#6EE7B7,#34D399)' : 'rgba(255,255,255,0.08)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={S.card}>

          {/* STEP 0 — Account */}
          {step === 0 && (
            <StepSection title="Account Information" sub="Create your SkillSwap account">
              {/* Profile Picture */}
              <div style={S.picRow}>
                <div style={S.picCircle} onClick={() => fileRef.current?.click()}>
                  {form.profilePicPreview
                    ? <img src={form.profilePicPreview} style={S.picImg} alt="profile" />
                    : <span style={S.picPlus}>+</span>}
                </div>
                <div>
                  <p style={S.picLabel}>Profile Picture <span style={S.optional}>(Optional)</span></p>
                  <button style={S.picBtn} onClick={() => fileRef.current?.click()}>Upload Photo</button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePic} />
                </div>
              </div>

              <InputField label="Full Name" placeholder="Mohammad Abdullah" value={form.fullName}
                onChange={(v: string) => set('fullName', v)} error={errors.fullName} required />
              <InputField label="Email" placeholder="student@university.edu" value={form.email}
                onChange={(v: string) => set('email', v)} error={errors.email} required type="email" />

              <div style={S.row2}>
                <InputField label="Password" placeholder="Min. 8 characters" value={form.password}
                  onChange={(v: string) => set('password', v)} error={errors.password} required
                  type={showPass ? 'text' : 'password'}
                  suffix={<EyeBtn show={showPass} toggle={() => setShowPass(x => !x)} />} />
                <InputField label="Confirm Password" placeholder="Re-enter password" value={form.confirmPassword}
                  onChange={(v: string) => set('confirmPassword', v)} error={errors.confirmPassword} required
                  type={showConfirm ? 'text' : 'password'}
                  suffix={<EyeBtn show={showConfirm} toggle={() => setShowConfirm(x => !x)} />} />
              </div>

              {/* Password strength */}
              {form.password && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < passScore ? passColors[passScore] : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
                    ))}
                    <span style={{ fontSize: 12, fontWeight: 700, minWidth: 50, color: passColors[passScore] }}>{passLabels[passScore]}</span>
                  </div>
                </div>
              )}
            </StepSection>
          )}

          {/* STEP 1 — Student Info */}
          {step === 1 && (
            <StepSection title="Student Information" sub="Tell us about your university">
              <div style={S.row2}>
                <InputField label="Student ID" placeholder="2021123456" value={form.studentId}
                  onChange={(v: string) => set('studentId', v)} error={errors.studentId} required />
                <SelectField label="University" value={form.university}
                  onChange={handleUniversity} error={errors.university} required
                  options={UNIVERSITIES} placeholder="Select your university" />
              </div>
              <SelectField label="Faculty / College" value={form.faculty}
                onChange={handleFaculty} error={errors.faculty} required
                options={availableFaculties}
                placeholder={form.university ? 'Select your faculty' : 'Select a university first'}
                disabled={!form.university} />
              <SelectField label="Major / Department" value={form.major}
                onChange={handleMajor} error={errors.major} required
                options={availableMajors}
                placeholder={form.faculty ? 'Select your major' : 'Select a faculty first'}
                disabled={!form.faculty} />
            </StepSection>
          )}

          {/* STEP 2 — Academic */}
          {step === 2 && (
            <StepSection title="Academic Information" sub="Your current academic standing">
              <div style={S.fieldGroup}>
                <label style={S.label}>Academic Year <span style={S.req}>*</span></label>
                <div style={S.yearGrid}>
                  {['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Fifth Year'].map(y => (
                    <button key={y}
                      style={{ ...S.yearBtn, ...(form.academicYear === y ? S.yearBtnActive : {}) }}
                      onClick={() => set('academicYear', y)}>
                      {y}
                    </button>
                  ))}
                </div>
                {errors.academicYear && <span style={S.errorMsg}>{errors.academicYear}</span>}
              </div>

              <div style={S.fieldGroup}>
                <label style={S.label}>GPA <span style={S.optional}>(Optional)</span></label>
                <input style={S.input} placeholder="e.g. 3.50" value={form.gpa}
                  onChange={e => set('gpa', e.target.value)} />
                {form.gpa && !isNaN(gpaVal) && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ height: '100%', width: `${gpaPct}%`, background: gpaColor, borderRadius: 3, transition: 'width 0.4s' }} />
                    </div>
                    <span style={{ fontSize: 11, color: gpaColor, fontWeight: 600 }}>{gpaLabel}</span>
                  </div>
                )}
              </div>
            </StepSection>
          )}

          {/* STEP 3 — Skills */}
          {step === 3 && (
            <StepSection title="Your Skills" sub="Help the AI find the best team matches for you">

              {/* General Skills */}
              <div style={S.fieldGroup}>
                <label style={S.label}>
                  General Skills <span style={S.req}>*</span>
                  <span style={S.skillCount}>{form.generalSkills.length} selected</span>
                </label>
                <p style={S.skillDesc}>Skills every student should have</p>
                <div style={S.skillsGrid}>
                  {GENERAL_SKILLS.map(sk => {
                    const active = form.generalSkills.includes(sk.id)
                    return (
                      <button key={sk.id}
                        style={{ ...S.skillCard, ...(active ? S.skillCardActive : {}) }}
                        onClick={() => toggleSkill('generalSkills', sk.id)}>
                        <span style={{ fontSize: 22 }}>{sk.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'center' as const, color: active ? '#6EE7B7' : 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>{sk.label}</span>
                        {active && <span style={{ position: 'absolute' as const, top: 6, right: 8, fontSize: 11, color: '#6EE7B7', fontWeight: 900 }}>✓</span>}
                      </button>
                    )
                  })}
                </div>
                {errors.generalSkills && <span style={S.errorMsg}>{errors.generalSkills}</span>}
              </div>

              {/* Major Skills */}
              {availableMajorSkills.length > 0 && (
                <div style={S.fieldGroup}>
                  <label style={S.label}>
                    Major Skills
                    <span style={{ ...S.skillCount, background: 'rgba(167,139,250,0.2)', color: '#A78BFA' }}>
                      {form.majorSkills.length} selected
                    </span>
                  </label>
                  <p style={S.skillDesc}>
                    Skills specific to <strong style={{ color: '#A78BFA' }}>{form.faculty}</strong>
                  </p>
                  <div style={S.skillsGrid}>
                    {availableMajorSkills.map(sk => {
                      const active = form.majorSkills.includes(sk.id)
                      return (
                        <button key={sk.id}
                          style={{ ...S.skillCard, ...(active ? S.skillCardActivePurple : {}) }}
                          onClick={() => toggleSkill('majorSkills', sk.id)}>
                          <span style={{ fontSize: 22 }}>{sk.icon}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'center' as const, color: active ? '#A78BFA' : 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>{sk.label}</span>
                          {active && <span style={{ position: 'absolute' as const, top: 6, right: 8, fontSize: 11, color: '#A78BFA', fontWeight: 900 }}>✓</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {!form.faculty && (
                <div style={S.noFacultyNote}>
                  ⚠️ Please complete your faculty selection in Step 2 to see major-specific skills.
                </div>
              )}
            </StepSection>
          )}

          {/* Navigation */}
          <div style={S.navRow}>
            {step > 0
              ? <button style={S.btnBack} onClick={back}>← Back</button>
              : <div />
            }
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{step + 1} / {STEPS.length}</span>
              {step < STEPS.length - 1
                ? <button style={S.btnPrimary} onClick={next}>Continue →</button>
                : <button style={S.btnSubmit} onClick={submit}>✦ Create Account</button>
              }
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center' as const, color: 'rgba(255,255,255,0.15)', fontSize: 12, marginTop: 28 }}>
          SkillSwap · Academic Collaboration Platform
        </p>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepSection({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>{title}</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{sub}</p>
      </div>
      {children}
    </div>
  )
}

function InputField({
  label, placeholder, value, onChange, error, required = false,
  type = 'text', suffix,
}: {
  label: ReactNode
  placeholder: string
  value: string
  onChange: (v: string) => void
  error?: string
  required?: boolean
  type?: string
  suffix?: ReactNode
}) {
  return (
    <div style={S.fieldGroup}>
      <label style={S.label}>{label} {required && <span style={S.req}>*</span>}</label>
      <div style={{ position: 'relative' as const }}>
        <input
          type={type}
          style={{ ...S.input, borderColor: error ? '#F87171' : 'rgba(255,255,255,0.1)', paddingRight: suffix ? 40 : 14 }}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        {suffix && <div style={{ position: 'absolute' as const, right: 12, top: '50%', transform: 'translateY(-50%)' }}>{suffix}</div>}
      </div>
      {error && <span style={S.errorMsg}>{error}</span>}
    </div>
  )
}

function SelectField({
  label, value, onChange, error, required = false,
  options, placeholder, disabled = false,
}: {
  label: string
  value: string
  onChange: (val: string) => void
  error?: string
  required?: boolean
  options: string[]
  placeholder: string
  disabled?: boolean
}) {
  return (
    <div style={S.fieldGroup}>
      <label style={S.label}>{label} {required && <span style={S.req}>*</span>}</label>
      <select
        style={{ ...S.select, borderColor: error ? '#F87171' : 'rgba(255,255,255,0.1)', opacity: disabled ? 0.4 : 1 }}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <span style={S.errorMsg}>{error}</span>}
    </div>
  )
}

function EyeBtn({ show, toggle }: { show: boolean; toggle: () => void }) {
  return (
    <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0 }} onClick={toggle} type="button">
      {show ? '🙈' : '👁️'}
    </button>
  )
}

function Blobs() {
  return (
    <>
      <div style={{ position: 'fixed' as const, top: -200, right: -150, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(110,231,183,0.05) 0%, transparent 70%)', pointerEvents: 'none' as const }} />
      <div style={{ position: 'fixed' as const, bottom: -200, left: -150, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)', pointerEvents: 'none' as const }} />
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #080d1a 0%, #0d1628 50%, #080d1a 100%)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 20px 60px', fontFamily: "'Segoe UI', Tahoma, sans-serif", position: 'relative', overflow: 'hidden' },
  wrap: { width: '100%', maxWidth: 680, position: 'relative', zIndex: 1 },

  logo: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 },
  logoMark: { fontSize: 30, color: '#6EE7B7' },
  logoName: { fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: 1 },

  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, gap: 0 },
  stepperItem: { display: 'flex', alignItems: 'center', gap: 8 },
  stepDot: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.3s' },
  stepDotActive: { background: '#fff', boxShadow: '0 0 0 4px rgba(255,255,255,0.1)' },
  stepDotDone: { background: '#6EE7B7', border: '2px solid #6EE7B7' },
  stepDotIdle: { background: 'transparent', border: '2px solid rgba(255,255,255,0.12)' },
  stepLabel: { fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', transition: 'color 0.3s' },
  stepLine: { width: 36, height: 2, margin: '0 6px', borderRadius: 2, transition: 'all 0.4s', flexShrink: 0 },

  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '36px 40px', backdropFilter: 'blur(20px)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' },

  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  fieldGroup: { marginBottom: 20 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: 8 },
  req: { color: '#F87171', marginLeft: 2 },
  optional: { color: 'rgba(255,255,255,0.3)', fontWeight: 400, fontSize: 12, marginLeft: 4 },
  errorMsg: { display: 'block', fontSize: 12, color: '#F87171', marginTop: 5, fontWeight: 500 },

  input: { width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: 'inherit' },
  select: { width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },

  picRow: { display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' },
  picCircle: { width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '2px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, overflow: 'hidden' },
  picImg: { width: '100%', height: '100%', objectFit: 'cover' },
  picPlus: { fontSize: 28, color: 'rgba(255,255,255,0.3)', lineHeight: 1 },
  picLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 0 8px', fontWeight: 600 },
  picBtn: { padding: '6px 14px', background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.3)', borderRadius: 8, color: '#6EE7B7', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },

  yearGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 },
  yearBtn: { padding: '10px 6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', textAlign: 'center' },
  yearBtnActive: { background: 'rgba(110,231,183,0.12)', border: '1px solid #6EE7B7', color: '#6EE7B7', boxShadow: '0 0 12px rgba(110,231,183,0.15)' },

  skillCount: { display: 'inline-block', marginLeft: 8, padding: '2px 8px', background: 'rgba(110,231,183,0.15)', color: '#6EE7B7', borderRadius: 10, fontSize: 11, fontWeight: 700 },
  skillDesc: { fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 12px' },
  skillsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  skillCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', position: 'relative', fontFamily: 'inherit' },
  skillCardActive: { background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.35)', boxShadow: '0 0 12px rgba(110,231,183,0.1)' },
  skillCardActivePurple: { background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.35)', boxShadow: '0 0 12px rgba(167,139,250,0.1)' },
  noFacultyNote: { padding: 16, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, color: 'rgba(251,191,36,0.7)', fontSize: 13, textAlign: 'center' },

  navRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' },
  btnBack: { padding: '11px 22px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimary: { padding: '11px 28px', background: 'linear-gradient(135deg, #6EE7B7, #34D399)', color: '#0f172a', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(52,211,153,0.25)' },
  btnSubmit: { padding: '12px 30px', background: 'linear-gradient(135deg, #6EE7B7 0%, #A78BFA 100%)', color: '#0f172a', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(110,231,183,0.3)' },

  changeRoleBtn: { background: 'none', border: 'none', color: '#6366f1', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginRight: 10 },
  roleBadge: { display: 'inline-block', padding: '3px 12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, color: '#6366f1', fontSize: 12, fontWeight: 700 },

  successWrap: { margin: '60px auto', maxWidth: 480, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(110,231,183,0.15)', borderRadius: 24, padding: '48px 40px', textAlign: 'center', backdropFilter: 'blur(20px)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' },
  successRing: { width: 72, height: 72, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(110,231,183,0.08)', borderRadius: '50%', border: '1px solid rgba(110,231,183,0.2)' },
  successH2: { fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 10px' },
  successP: { color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7, margin: '0 0 28px' },
  successStats: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 24px', marginBottom: 24 },
  successStat: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  successStatNum: { fontSize: 22, fontWeight: 800, color: '#6EE7B7' },
  successStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  successStatDivider: { width: 1, height: 36, background: 'rgba(255,255,255,0.08)', margin: '0 16px' },
  successChips: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 28 },
  successActions: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 },
  successDashBtn: { padding: '11px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  successFootnote: { fontSize: 12, color: 'rgba(255,255,255,0.2)', margin: 0 },
  chip: { padding: '5px 12px', background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.25)', borderRadius: 20, color: '#6EE7B7', fontSize: 13 },
  chipPurple: { background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', color: '#A78BFA' },
}