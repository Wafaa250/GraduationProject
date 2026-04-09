import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Camera, Save, X } from 'lucide-react'
import { apiClient } from '../../../api/client'
import { navigateHome } from '../../../utils/homeNavigation'

const doctorSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  bio: z.string().max(600, 'Bio must be 600 characters or less').optional(),
  department: z.string().max(120, 'Department is too long').optional(),
  faculty: z.string().max(120, 'Faculty is too long').optional(),
  specialization: z.string().max(120, 'Specialization is too long').optional(),
  linkedin: z.string().max(300, 'LinkedIn URL is too long').optional(),
  officeHours: z.string().max(120, 'Office hours is too long').optional(),
  yearsOfExperience: z.string().max(20, 'Years of experience is too long').optional(),
  profilePictureBase64: z.string().nullable().optional(),
  technicalSkills: z.array(z.string()).default([]),
  researchSkills: z.array(z.string()).default([]),
})

type DoctorFormValues = z.infer<typeof doctorSchema>

const RESEARCH_HINTS = [
  'research',
  'publication',
  'academic',
  'analysis',
  'methodology',
  'journal',
  'clinical trial',
  'thesis',
  'literature',
  'survey',
]

function normalizeLinkedin(v?: string): boolean {
  if (!v) return true
  return /^https?:\/\/.+/i.test(v) || /^linkedin\.com\/.+/i.test(v)
}

export default function EditDoctorProfilePage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [techInput, setTechInput] = useState('')
  const [researchInput, setResearchInput] = useState('')

  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema.refine(v => normalizeLinkedin(v.linkedin), {
      message: 'Enter a valid LinkedIn URL',
      path: ['linkedin'],
    })),
    defaultValues: {
      fullName: '',
      bio: '',
      department: '',
      faculty: '',
      specialization: '',
      linkedin: '',
      officeHours: '',
      yearsOfExperience: '',
      profilePictureBase64: null,
      technicalSkills: [],
      researchSkills: [],
    },
  })

  const watchedFullName = form.watch('fullName')
  const avatarText = useMemo(() => {
    const name = watchedFullName || 'DR'
    return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
  }, [watchedFullName])

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await apiClient.get('/me')
        const data = res.data
        const user = data?.user ?? data ?? {}
        const doctorProfile = data?.doctorProfile ?? data ?? {}
        const incomingSkills = Array.isArray(doctorProfile.skills)
          ? doctorProfile.skills
          : (
            Array.isArray(doctorProfile.technicalSkills)
              ? doctorProfile.technicalSkills
              : []
          )
        const splitSkills = splitSkillsByHeuristic(incomingSkills)

        form.reset({
          fullName: user.name || user.fullName || '',
          bio: doctorProfile.bio || user.bio || '',
          department: doctorProfile.department || '',
          faculty: doctorProfile.faculty || '',
          specialization: doctorProfile.specialization || '',
          linkedin: doctorProfile.linkedin || user.linkedin || '',
          officeHours: doctorProfile.officeHours || '',
          yearsOfExperience:
            doctorProfile.yearsOfExperience != null
              ? String(doctorProfile.yearsOfExperience)
              : '',
          profilePictureBase64: user.profilePictureBase64 || doctorProfile.profilePictureBase64 || null,
          technicalSkills: splitSkills.technicalSkills,
          researchSkills: splitSkills.researchSkills,
        })
      } finally {
        setLoading(false)
      }
    }
    fetchDoctor()
  }, [form])

  const addTag = (field: 'technicalSkills' | 'researchSkills', value: string) => {
    const tag = value.trim()
    if (!tag) return
    const list = form.getValues(field) || []
    if (list.some(item => item.toLowerCase() === tag.toLowerCase())) return
    form.setValue(field, [...list, tag], { shouldValidate: true, shouldDirty: true })
  }

  const removeTag = (field: 'technicalSkills' | 'researchSkills', index: number) => {
    const list = form.getValues(field) || []
    form.setValue(field, list.filter((_, i) => i !== index), { shouldValidate: true, shouldDirty: true })
  }

  const onSkillInputKey = (
    e: KeyboardEvent<HTMLInputElement>,
    field: 'technicalSkills' | 'researchSkills',
    value: string,
    setValue: (v: string) => void,
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(field, value)
      setValue('')
    }
  }

  const handlePicture = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      if (ev.target?.result) {
        form.setValue('profilePictureBase64', ev.target.result as string, { shouldDirty: true })
      }
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = async (values: DoctorFormValues) => {
    setSaving(true)
    setToast(null)
    try {
      const mergedSkills = [...(values.technicalSkills || []), ...(values.researchSkills || [])]
      const uniqueSkills = Array.from(new Set(mergedSkills.map(s => s.trim()).filter(Boolean)))
      const payload = {
        doctorProfile: {
          faculty: values.faculty || '',
          department: values.department || '',
          specialization: values.specialization || '',
          yearsOfExperience: values.yearsOfExperience ? Number(values.yearsOfExperience) : null,
          skills: uniqueSkills,
          bio: values.bio || '',
          officeHours: values.officeHours || '',
          linkedin: values.linkedin || '',
        },
      }
      console.log('Updating doctor profile:', payload)
      await apiClient.put('/profile', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      setToast('Doctor profile updated successfully.')
      setTimeout(() => navigate('/doctor/profile', { replace: true }), 900)
    } catch (err: any) {
      setToast(err?.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={S.page}>
        <div style={S.center}>
          <div style={S.spinner} />
          <p style={S.loadingText}>Loading doctor profile...</p>
        </div>
      </div>
    )
  }

  const technicalSkills = form.watch('technicalSkills') || []
  const researchSkills = form.watch('researchSkills') || []
  const profilePic = form.watch('profilePictureBase64')

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <div style={S.navInner}>
          <button style={S.backBtn} onClick={() => navigateHome(navigate)}>
            <ArrowLeft size={14} /> Dashboard
          </button>
          <Link to="/doctor/profile" style={S.secondaryBtn}>Doctor Profile</Link>
        </div>
      </nav>

      {toast && (
        <div style={S.toast}>
          {toast}
        </div>
      )}

      <form style={S.layout} onSubmit={form.handleSubmit(onSubmit)}>
        <aside style={S.sideCard}>
          <div style={S.avatarWrap} onClick={() => fileRef.current?.click()}>
            {profilePic ? <img src={profilePic} style={S.avatarImg} alt="doctor" /> : <div style={S.avatarFallback}>{avatarText}</div>}
            <div style={S.cameraOverlay}><Camera size={16} /></div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => handlePicture(e.target.files?.[0])}
          />
          <button type="button" style={S.outlineBtn} onClick={() => fileRef.current?.click()}>
            Change picture
          </button>
        </aside>

        <main style={S.main}>
          <section style={S.card}>
            <h2 style={S.heading}>Doctor Information</h2>
            <div style={S.grid}>
              <Field label="Full Name" error={form.formState.errors.fullName?.message}>
                <input style={S.input} {...form.register('fullName')} />
              </Field>
              <Field label="Department" error={form.formState.errors.department?.message}>
                <input style={S.input} {...form.register('department')} />
              </Field>
              <Field label="Faculty" error={form.formState.errors.faculty?.message}>
                <input style={S.input} {...form.register('faculty')} />
              </Field>
              <Field label="Specialization" error={form.formState.errors.specialization?.message}>
                <input style={S.input} {...form.register('specialization')} />
              </Field>
              <Field label="Years of Experience" error={form.formState.errors.yearsOfExperience?.message}>
                <input style={S.input} placeholder="e.g. 8" {...form.register('yearsOfExperience')} />
              </Field>
              <Field label="LinkedIn" error={form.formState.errors.linkedin?.message}>
                <input style={S.input} placeholder="https://linkedin.com/in/..." {...form.register('linkedin')} />
              </Field>
              <Field label="Office Hours" error={form.formState.errors.officeHours?.message}>
                <input style={S.input} placeholder="Mon 10:00 - 12:00" {...form.register('officeHours')} />
              </Field>
            </div>
            <Field label="Bio" error={form.formState.errors.bio?.message}>
              <textarea style={S.textarea} rows={4} {...form.register('bio')} />
            </Field>
          </section>

          <section style={S.card}>
            <h2 style={S.heading}>Skills</h2>
            <TagField
              label="Technical Skills"
              inputValue={techInput}
              setInputValue={setTechInput}
              tags={technicalSkills}
              onKeyDown={(e) => onSkillInputKey(e, 'technicalSkills', techInput, setTechInput)}
              onRemove={(idx) => removeTag('technicalSkills', idx)}
            />
            <TagField
              label="Research Skills"
              inputValue={researchInput}
              setInputValue={setResearchInput}
              tags={researchSkills}
              onKeyDown={(e) => onSkillInputKey(e, 'researchSkills', researchInput, setResearchInput)}
              onRemove={(idx) => removeTag('researchSkills', idx)}
            />
          </section>

          <div style={S.actions}>
            <Link to="/doctor/profile" style={S.cancelBtn}>Cancel</Link>
            <button type="submit" style={S.saveBtn} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </main>
      </form>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function Field({
  label,
  children,
  error,
}: {
  label: string
  children: ReactNode
  error?: string
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={S.label}>{label}</span>
      {children}
      {error && <span style={S.error}>{error}</span>}
    </label>
  )
}

function TagField({
  label,
  inputValue,
  setInputValue,
  tags,
  onKeyDown,
  onRemove,
}: {
  label: string
  inputValue: string
  setInputValue: (v: string) => void
  tags: string[]
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
  onRemove: (index: number) => void
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={S.label}>{label}</p>
      <input
        style={S.input}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type and press Enter"
      />
      <div style={S.tagRow}>
        {tags.map((tag, idx) => (
          <span key={`${tag}-${idx}`} style={S.tag}>
            {tag}
            <button type="button" style={S.tagRemove} onClick={() => onRemove(idx)}>
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

function splitSkillsByHeuristic(skills: string[]): {
  technicalSkills: string[]
  researchSkills: string[]
} {
  const technicalSkills: string[] = []
  const researchSkills: string[] = []

  for (const raw of skills) {
    const skill = String(raw || '').trim()
    if (!skill) continue
    const lower = skill.toLowerCase()
    const isResearch = RESEARCH_HINTS.some(hint => lower.includes(hint))
    if (isResearch) researchSkills.push(skill)
    else technicalSkills.push(skill)
  }

  return { technicalSkills, researchSkills }
}

const S: Record<string, CSSProperties> = {
  page: { minHeight: '100vh', background: 'linear-gradient(160deg,#f8f7ff 0%,#f0f4ff 50%,#faf5ff 100%)', fontFamily: 'DM Sans, sans-serif', color: '#0f172a' },
  nav: { position: 'sticky', top: 0, zIndex: 20, borderBottom: '1px solid rgba(99,102,241,0.12)', background: 'rgba(248,247,255,0.9)', backdropFilter: 'blur(16px)' },
  navInner: { maxWidth: 1140, margin: '0 auto', height: 62, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #dbe1f0', background: 'white', color: '#64748b', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' },
  secondaryBtn: { textDecoration: 'none', color: '#4f46e5', fontWeight: 700, fontSize: 13 },
  layout: { maxWidth: 1140, margin: '0 auto', padding: '24px 20px 56px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 },
  sideCard: { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, height: 'fit-content', boxShadow: '0 4px 16px rgba(99,102,241,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  avatarWrap: { width: 110, height: 110, borderRadius: '50%', overflow: 'hidden', position: 'relative', cursor: 'pointer', boxShadow: '0 0 0 4px #eef2ff' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarFallback: { width: '100%', height: '100%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 34, fontWeight: 800 },
  cameraOverlay: { position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.35)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  outlineBtn: { border: '1px solid #dbe1f0', background: '#f8fafc', color: '#475569', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 12 },
  main: { display: 'flex', flexDirection: 'column', gap: 14 },
  card: { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 4px 16px rgba(99,102,241,0.06)', padding: 20 },
  heading: { margin: '0 0 14px', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 },
  label: { fontSize: 12, color: '#64748b', fontWeight: 700 },
  input: { border: '1.5px solid #dbe1f0', borderRadius: 10, background: '#f8fafc', padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', color: '#0f172a' },
  textarea: { border: '1.5px solid #dbe1f0', borderRadius: 10, background: '#f8fafc', padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', color: '#0f172a', resize: 'vertical' },
  error: { fontSize: 11, color: '#dc2626', fontWeight: 600 },
  tagRow: { marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 },
  tag: { display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#4f46e5', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 700 },
  tagRemove: { border: 'none', background: 'transparent', padding: 0, color: '#4f46e5', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { textDecoration: 'none', border: '1px solid #dbe1f0', background: 'white', color: '#64748b', borderRadius: 10, padding: '10px 16px', fontWeight: 600, fontSize: 13 },
  saveBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 18px rgba(99,102,241,0.26)', fontFamily: 'inherit', fontSize: 13 },
  center: { minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: 36, height: 36, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', animation: 'spin 0.9s linear infinite' },
  loadingText: { color: '#64748b', marginTop: 10, fontWeight: 600 },
  toast: { position: 'fixed', top: 80, right: 20, zIndex: 1000, padding: '10px 14px', borderRadius: 10, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#4338ca', fontSize: 13, fontWeight: 700, boxShadow: '0 8px 20px rgba(79,70,229,0.2)' },
}
