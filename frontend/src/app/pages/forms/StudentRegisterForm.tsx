import { useState, useRef, ReactNode, ChangeEvent, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from "../../../context/UserContext"
import { registerStudent } from '../../../api/authApi'
import { navigateHome } from '../../../utils/homeNavigation'
import {
  CUSTOM_SKILL_MAX_LENGTH,
  customSelections,
  getSkillsPack,
  normalizeCustomSkill,
} from '../../../constants/studentSkillPools'

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
const STEPS = [
  { id: 'account', label: 'Account', icon: '👤' },
  { id: 'student', label: 'Student Info', icon: '🎓' },
  { id: 'academic', label: 'Academic', icon: '📚' },
  { id: 'skills', label: 'Skills', icon: '⚡' },
]

export default function StudentRegisterForm({ onBack = null }: { onBack?: (() => void) | null }) {
  const navigate = useNavigate()
  const { updateProfile } = useUser()
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
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
    }
    if (step === 2) {
      if (!form.academicYear) e.academicYear = 'Please select your academic year'
      if (form.gpa.trim() && (isNaN(parseFloat(form.gpa)) || parseFloat(form.gpa) < 0 || parseFloat(form.gpa) > 4)) e.gpa = 'GPA must be between 0.0 and 4.0'
    }
    if (step === 3) { if (form.roles.length === 0) e.roles = 'Please select at least one team role' }
    setErrors(e); return Object.keys(e).length === 0
  }

  const next = () => { if (validate()) setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)
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

  gpa: parseFloat(form.gpa),

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
  const gpaVal = parseFloat(form.gpa)
  const gpaPct = Math.min((gpaVal/4)*100,100)
  const gpaColor = gpaVal>=3.5?'#10b981':gpaVal>=2.5?'#f59e0b':'#ef4444'
  const gpaLabel = gpaVal>=3.5?'Excellent':gpaVal>=2.5?'Good':'Needs Improvement'

  if (submitted) return (
    <div style={S.page}><Blobs />
      <div style={S.successWrap}>
        <div style={S.successIcon}><svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="15" stroke="#6366f1" strokeWidth="2"/><path d="M9 16l5 5 9-9" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
        <h2 style={S.successH2}>You're all set! 🎉</h2>
        <p style={S.successP}>Welcome to SkillSwap, <strong style={{color:'#6366f1'}}>{form.fullName}</strong>! Our AI will match you with the best teammates.</p>
        <div style={S.successStats}>
          <div style={S.successStat}><span style={{...S.successNum,color:'#6366f1'}}>{form.roles.length}</span><span style={S.successLabel}>Roles</span></div>
          <div style={S.successDivider}/>
          <div style={S.successStat}><span style={{...S.successNum,color:'#a855f7'}}>{form.technicalSkills.length}</span><span style={S.successLabel}>Skills</span></div>
          <div style={S.successDivider}/>
          <div style={S.successStat}><span style={{...S.successNum,color:'#6366f1'}}>{form.tools.length}</span><span style={S.successLabel}>Tools</span></div>
        </div>
        <div style={{display:'flex',flexDirection:'column' as const,gap:10}}>
          <button style={S.btnPrimary} onClick={()=>{sessionStorage.removeItem('selectedRole');navigate('/profile')}}>View My Profile →</button>
          <button style={S.btnOutline} onClick={()=>{sessionStorage.removeItem('selectedRole');navigateHome(navigate)}}>Go to Dashboard</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={S.page}><Blobs />
      <div style={S.wrap}>
        <div style={S.logoRow}>
          <div style={S.logoIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
          <span style={S.logoText}>Skill<span style={S.logoAccent}>Swap</span></span>
        </div>

        {onBack && <div style={{textAlign:'center' as const,marginBottom:16}}><button onClick={onBack} style={S.changeRoleBtn}>← Change role</button><span style={S.roleBadge}>Student</span></div>}

        <div style={S.stepper}>
          {STEPS.map((s,i) => (
            <div key={s.id} style={{display:'flex',alignItems:'center'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{...S.stepDot,...(i===step?S.stepDotActive:i<step?S.stepDotDone:S.stepDotIdle)}}>
                  {i<step?<span style={{fontSize:12,color:'white',fontWeight:900}}>✓</span>:<span style={{fontSize:11,fontWeight:700,color:i===step?'white':'#94a3b8'}}>{i+1}</span>}
                </div>
                <span style={{fontSize:12,fontWeight:600,color:i===step?'#1e293b':i<step?'#6366f1':'#94a3b8',whiteSpace:'nowrap' as const}}>{s.icon} {s.label}</span>
              </div>
              {i<STEPS.length-1&&<div style={{width:32,height:2,margin:'0 8px',background:i<step?'linear-gradient(90deg,#6366f1,#a855f7)':'#e2e8f0',borderRadius:2}}/>}
            </div>
          ))}
        </div>

        <div style={S.card}>
          {/* STEP 0 */}
          {step===0&&<Section title="Account Information" sub="Create your SkillSwap account">
            <div style={S.picRow}>
              <div style={S.picCircle} onClick={()=>fileRef.current?.click()}>
                {form.profilePicPreview?<img src={form.profilePicPreview} style={{width:'100%',height:'100%',objectFit:'cover' as const}} alt=""/>:<span style={{fontSize:26,color:'#cbd5e1'}}>+</span>}
              </div>
              <div><p style={{fontSize:13,fontWeight:600,color:'#475569',margin:'0 0 8px'}}>Profile Picture <span style={{color:'#94a3b8',fontWeight:400}}>(Optional)</span></p>
                <button style={S.picBtn} onClick={()=>fileRef.current?.click()}>Upload Photo</button>
                <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handlePic}/>
              </div>
            </div>
            <Field label="Full Name" placeholder="Mohammad Abdullah" value={form.fullName} onChange={v=>set('fullName',v)} error={errors.fullName} required/>
            <Field label="Email" placeholder="student@najah.edu" value={form.email} onChange={v=>set('email',v)} error={errors.email} required type="email"/>
            <div style={S.row2}>
              <Field label="Password" placeholder="Min. 8 characters" value={form.password} onChange={v=>set('password',v)} error={errors.password} required type={showPass?'text':'password'} suffix={<EyeBtn show={showPass} toggle={()=>setShowPass(x=>!x)}/>}/>
              <Field label="Confirm Password" placeholder="Re-enter password" value={form.confirmPassword} onChange={v=>set('confirmPassword',v)} error={errors.confirmPassword} required type={showConfirm?'text':'password'} suffix={<EyeBtn show={showConfirm} toggle={()=>setShowConfirm(x=>!x)}/>}/>
            </div>
            {form.password&&<div style={{marginBottom:16}}><div style={{display:'flex',alignItems:'center',gap:6}}>{[0,1,2,3].map(i=><div key={i} style={{flex:1,height:4,borderRadius:2,background:i<passScore?passColors[passScore]:'#e2e8f0',transition:'background 0.3s'}}/>)}<span style={{fontSize:12,fontWeight:700,minWidth:44,color:passColors[passScore]}}>{passLabels[passScore]}</span></div></div>}
          </Section>}

          {/* STEP 1 */}
          {step===1&&<Section title="Student Information" sub="Tell us about your university">
            <div style={S.row2}>
              <Field label="Student ID" placeholder="2021123456" value={form.studentId} onChange={v=>set('studentId',v)} error={errors.studentId} required/>
              <Select label="University" value={form.university} onChange={handleUniversity} error={errors.university} required options={UNIVERSITIES} placeholder="Select your university"/>
            </div>
            <Select label="Faculty / College" value={form.faculty} onChange={handleFaculty} error={errors.faculty} required options={availableFaculties} placeholder={form.university?'Select your faculty':'Select a university first'} disabled={!form.university}/>
            <Select label="Major / Department" value={form.major} onChange={handleMajor} error={errors.major} required options={availableMajors} placeholder={form.faculty?'Select your major':'Select a faculty first'} disabled={!form.faculty}/>
          </Section>}

          {/* STEP 2 */}
          {step===2&&<Section title="Academic Information" sub="Your current academic standing">
            <div style={{marginBottom:20}}>
              <label style={S.label}>Academic Year <span style={{color:'#ef4444'}}>*</span></label>
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
                {['First Year','Second Year','Third Year','Fourth Year','Fifth Year'].map(y=>(
                  <button key={y} style={{padding:'10px 4px',borderRadius:10,border:form.academicYear===y?'2px solid #6366f1':'2px solid #e2e8f0',background:form.academicYear===y?'#eef2ff':'white',color:form.academicYear===y?'#6366f1':'#64748b',fontSize:11,fontWeight:700,cursor:'pointer',transition:'all 0.2s',fontFamily:'inherit'}} onClick={()=>set('academicYear',y)}>{y}</button>
                ))}
              </div>
              {errors.academicYear&&<span style={S.error}>{errors.academicYear}</span>}
            </div>
            <div style={{marginBottom:20}}>
              <label style={S.label}>GPA <span style={{color:'#94a3b8',fontWeight:400,fontSize:12}}>(Optional)</span></label>
              <input style={S.input} placeholder="e.g. 3.50" value={form.gpa} onChange={e=>{const val=e.target.value;if(val===''||(/^\d*\.?\d*$/.test(val)&&parseFloat(val)<=4))set('gpa',val)}}/>
              {form.gpa&&!isNaN(gpaVal)&&<div style={{marginTop:8}}><div style={{height:6,background:'#f1f5f9',borderRadius:3,overflow:'hidden',marginBottom:4}}><div style={{height:'100%',width:`${gpaPct}%`,background:gpaColor,borderRadius:3,transition:'width 0.4s'}}/></div><span style={{fontSize:11,color:gpaColor,fontWeight:600}}>{gpaLabel}</span></div>}
              {errors.gpa&&<span style={S.error}>{errors.gpa}</span>}
            </div>
          </Section>}

          {/* STEP 3 — NEW SKILLS STRUCTURE */}
          {step===3&&<Section title="Your Skills" sub="Help the AI find the best team matches for you">
            {!skillsData?(
              <div style={{padding:16,background:'#fffbeb',border:'1px solid #fde68a',borderRadius:10,color:'#92400e',fontSize:13}}>
                ⚠️ Please complete your faculty and major in Step 2 to see skills matched to your program.
              </div>
            ):(
              <>
                {/* Team roles (stored as roles / generalSkills for AI matching — not your major) */}
                <SkillGroup title="Team roles" badge={`${form.roles.length} selected`} hint="How you usually contribute on projects (separate from your major)" required error={errors.roles}>
                  <div style={S.chipGrid}>
                    {skillsData.roles.map(r=><ChipBtn key={r} label={r} active={form.roles.includes(r)} onClick={()=>toggle('roles',r)} color="indigo"/>)}
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
                <SkillGroup title="Technical Skills" badge={`${form.technicalSkills.length} selected`} hint="Select skills you're comfortable with">
                  <div style={S.chipGrid}>
                    {skillsData.technicalSkills.map(s=><ChipBtn key={s} label={s} active={form.technicalSkills.includes(s)} onClick={()=>toggle('technicalSkills',s)} color="purple"/>)}
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
                <SkillGroup title="Technologies & Tools" badge={`${form.tools.length} selected`} hint="Languages, frameworks, and tools you use">
                  <div style={S.chipGrid}>
                    {skillsData.tools.map(t=><ChipBtn key={t} label={t} active={form.tools.includes(t)} onClick={()=>toggle('tools',t)} color="teal"/>)}
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
          </Section>}

          {apiError&&<div style={{marginTop:16,padding:'12px 16px',background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:10,color:'#dc2626',fontSize:13,fontWeight:500}}>❌ {apiError}</div>}

          <div style={S.navRow}>
            {step>0?<button style={S.btnBack} onClick={back}>← Back</button>:<div/>}
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <span style={{fontSize:12,color:'#94a3b8',fontWeight:600}}>{step+1} / {STEPS.length}</span>
              {step<STEPS.length-1
                ?<button style={S.btnPrimary} onClick={next}>Continue →</button>
                :<button style={{...S.btnPrimary,opacity:isLoading?0.7:1}} onClick={submit} disabled={isLoading}>{isLoading?'⏳ Creating...':'✦ Create Account'}</button>
              }
            </div>
          </div>
        </div>

        <p style={{textAlign:'center' as const,color:'#cbd5e1',fontSize:12,marginTop:24}}>SkillSwap · Academic Collaboration Platform</p>
      </div>
      <style>{`input::placeholder{color:#94a3b8;}input:focus,select:focus{outline:none;border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,0.1);}button:hover{opacity:0.92;}`}</style>
    </div>
  )
}

function Section({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return <div><div style={{marginBottom:24}}><h3 style={{fontSize:20,fontWeight:800,color:'#0f172a',margin:'0 0 4px',fontFamily:'Syne, sans-serif'}}>{title}</h3><p style={{fontSize:13,color:'#64748b',margin:0}}>{sub}</p></div>{children}</div>
}

function SkillGroup({ title, badge, hint, required=false, error, children }: { title: string; badge: string; hint: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <div style={{marginBottom:28}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
        <label style={{fontSize:13,fontWeight:700,color:'#374151'}}>{title}{required&&<span style={{color:'#ef4444'}}> *</span>}</label>
        <span style={{padding:'2px 8px',background:'#eef2ff',color:'#6366f1',borderRadius:10,fontSize:11,fontWeight:700,border:'1px solid #c7d2fe'}}>{badge}</span>
      </div>
      <p style={{fontSize:12,color:'#94a3b8',margin:'0 0 10px'}}>{hint}</p>
      {children}
      {error&&<span style={{display:'block',fontSize:12,color:'#ef4444',marginTop:6,fontWeight:500}}>{error}</span>}
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

function Field({ label, placeholder, value, onChange, error, required=false, type='text', suffix }: { label: ReactNode; placeholder: string; value: string; onChange: (v: string) => void; error?: string; required?: boolean; type?: string; suffix?: ReactNode }) {
  return (
    <div style={{marginBottom:16}}>
      <label style={S.label}>{label}{required&&<span style={{color:'#ef4444'}}> *</span>}</label>
      <div style={{position:'relative' as const}}>
        <input type={type} style={{...S.input,borderColor:error?'#fca5a5':'#e2e8f0',paddingRight:suffix?40:14}} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}/>
        {suffix&&<div style={{position:'absolute' as const,right:12,top:'50%',transform:'translateY(-50%)'}}>{suffix}</div>}
      </div>
      {error&&<span style={S.error}>{error}</span>}
    </div>
  )
}

function Select({ label, value, onChange, error, required=false, options, placeholder, disabled=false }: { label: string; value: string; onChange: (v: string) => void; error?: string; required?: boolean; options: string[]; placeholder: string; disabled?: boolean }) {
  return (
    <div style={{marginBottom:16}}>
      <label style={S.label}>{label}{required&&<span style={{color:'#ef4444'}}> *</span>}</label>
      <select style={{...S.input,borderColor:error?'#fca5a5':'#e2e8f0',opacity:disabled?0.5:1,cursor:disabled?'not-allowed':'pointer'}} value={value} onChange={e=>onChange(e.target.value)} disabled={disabled}>
        <option value="">{placeholder}</option>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
      {error&&<span style={S.error}>{error}</span>}
    </div>
  )
}

function EyeBtn({ show, toggle }: { show: boolean; toggle: () => void }) {
  return <button style={{background:'none',border:'none',cursor:'pointer',fontSize:15,padding:0,color:'#94a3b8'}} onClick={toggle} type="button">{show?'🙈':'👁️'}</button>
}

function Blobs() {
  return (
    <>
      <div style={{position:'fixed' as const,top:-150,right:-150,width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)',pointerEvents:'none' as const}}/>
      <div style={{position:'fixed' as const,bottom:-150,left:-150,width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(168,85,247,0.06) 0%,transparent 70%)',pointerEvents:'none' as const}}/>
    </>
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