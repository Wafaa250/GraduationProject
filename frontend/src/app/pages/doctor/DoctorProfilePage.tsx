import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, BriefcaseBusiness, Mail, Linkedin, Clock3, ShieldCheck } from 'lucide-react'
import api from '../../../api/axiosInstance'
import { mergeDoctorSkillsFromLists, normalizeSkillStringList } from '../../../context/UserContext'
import { navigateHome } from '../../../utils/homeNavigation'

interface DoctorProfile {
  fullName: string
  email: string
  title: string
  department: string
  university: string
  bio: string
  faculty: string
  specialization: string
  yearsOfExperience: string
  skills: string[]
  linkedin: string
  officeHours: string
  profilePictureBase64: string | null
}

function mapDoctorProfile(data: any): DoctorProfile {
  const user = data?.user ?? data ?? {}
  const dp = data?.doctorProfile ?? data?.DoctorProfile ?? {}

  const technical = normalizeSkillStringList(
    dp.technicalSkills ?? dp.TechnicalSkills ?? data?.technicalSkills ?? data?.TechnicalSkills,
  )
  const research = normalizeSkillStringList(
    dp.researchSkills ?? dp.ResearchSkills ?? data?.researchSkills ?? data?.ResearchSkills,
  )
  const skills = mergeDoctorSkillsFromLists(technical, research)

  return {
    // Required mapping
    fullName: user.name || user.fullName || '',
    email: user.email || '',
    faculty: dp.faculty ?? dp.Faculty ?? '',
    department: dp.department ?? dp.Department ?? '',
    specialization: dp.specialization ?? dp.Specialization ?? '',
    yearsOfExperience:
      dp.yearsOfExperience != null ? String(dp.yearsOfExperience) : '',
    skills,

    // Additional display fields
    title: dp.title || (user.role?.toLowerCase?.() === 'doctor' ? 'Doctor' : 'Professor'),
    university: dp.university ?? dp.University ?? user.university ?? '',
    bio: dp.bio ?? user.bio ?? '',
    linkedin: dp.linkedin ?? user.linkedin ?? '',
    officeHours: dp.officeHours ?? dp.OfficeHours ?? '',
    profilePictureBase64: user.profilePictureBase64 ?? dp.profilePictureBase64 ?? null,
  }
}

function displayValue(value?: string | null): string {
  if (value == null) return 'Not provided'
  const text = String(value).trim()
  return text.length > 0 ? text : 'Not provided'
}

export default function DoctorProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/me', {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      })
      const data = res.data
      console.log('Fetched profile:', data)
      setProfile(mapDoctorProfile(data))
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load doctor profile.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [location.pathname, location.key])

  const initials = useMemo(
    () => (profile?.fullName || 'DR').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase(),
    [profile?.fullName],
  )

  const skills = useMemo(() => profile?.skills ?? [], [profile?.skills])

  if (loading) {
    return (
      <div style={S.page}>
        <div style={S.centerState}>
          <div style={S.spinner} />
          <p style={S.centerText}>Loading doctor profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div style={S.page}>
        <div style={S.centerState}>
          <p style={S.errorText}>{error || 'Profile not found.'}</p>
          <button style={S.backButton} onClick={() => navigateHome(navigate)}>
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <div style={S.decorTop} />
      <div style={S.decorBottom} />

      <nav style={S.nav}>
        <div style={S.navInner}>
          <button style={S.backButton} onClick={() => navigateHome(navigate)}>
            <ArrowLeft size={14} /> Dashboard
          </button>
          <Link to="/doctor/edit-profile" style={S.editButton}>
            Edit Doctor Profile
          </Link>
        </div>
      </nav>

      <div style={S.container}>
        <section style={S.heroCard}>
          <div style={S.avatarWrap}>
            {profile.profilePictureBase64 ? (
              <img src={profile.profilePictureBase64} alt={profile.fullName} style={S.avatarImg} />
            ) : (
              <div style={S.avatarFallback}>
                <span style={S.fallbackGlyph}>👨‍⚕️</span>
                <span>{initials}</span>
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={S.roleBadge}>
              <ShieldCheck size={12} /> Doctor
            </div>
            <h1 style={S.name}>{profile.fullName || 'Doctor'}</h1>
            <p style={S.title}>{displayValue(profile.title)}</p>
            <div style={S.heroMeta}>
              <span style={S.metaBadge}>
                <Building2 size={12} /> {displayValue(profile.department)}
              </span>
              <span style={S.metaBadgePurple}>
                <BriefcaseBusiness size={12} /> {displayValue(profile.university)}
              </span>
            </div>
            <p style={S.bio}>{displayValue(profile.bio)}</p>
          </div>
        </section>

        <div style={S.grid}>
          <section style={S.card}>
            <h2 style={S.sectionTitle}>Academic Info</h2>
            <div style={S.infoGrid}>
              <InfoCell label="Faculty" value={displayValue(profile.faculty)} />
              <InfoCell label="Department" value={displayValue(profile.department)} />
              <InfoCell label="Specialization" value={displayValue(profile.specialization)} />
              <InfoCell
                label="Experience"
                value={profile.yearsOfExperience ? `${profile.yearsOfExperience} years` : 'Not provided'}
              />
            </div>
          </section>

          <section style={S.card}>
            <h2 style={S.sectionTitle}>Contact</h2>
            <div style={S.contactCol}>
              <ContactRow icon={<Mail size={14} />} label="Email" value={profile.email} />
              <ContactRow icon={<Linkedin size={14} />} label="LinkedIn" value={profile.linkedin} isLink />
              <ContactRow icon={<Clock3 size={14} />} label="Office Hours" value={profile.officeHours} />
            </div>
          </section>
        </div>

        <section style={S.card}>
          <h2 style={S.sectionTitle}>Skills</h2>
          {skills.length === 0 ? (
            <p style={S.muted}>Not provided</p>
          ) : (
            <div style={S.tagsRow}>
              {(profile.skills || []).map((skill, index) => (
                <span key={`skill-${skill}`} style={index % 2 === 0 ? S.techTag : S.researchTag}>{skill}</span>
              ))}
            </div>
          )}
        </section>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={S.infoCell}>
      <p style={S.infoLabel}>{label}</p>
      <p style={S.infoValue}>{displayValue(value)}</p>
    </div>
  )
}

function ContactRow({
  icon,
  label,
  value,
  isLink = false,
}: {
  icon: ReactNode
  label: string
  value: string
  isLink?: boolean
}) {
  if (!value || !String(value).trim()) return <p style={S.muted}>Not provided</p>
  const href = value.startsWith('http') ? value : (isLink ? `https://${value}` : value)
  return (
    <div style={S.contactRow}>
      <span style={S.contactLabel}>{icon} {label}</span>
      {isLink ? (
        <a href={href} target="_blank" rel="noopener noreferrer" style={S.contactLink}>
          {value}
        </a>
      ) : (
        <span style={S.contactValue}>{value}</span>
      )}
    </div>
  )
}

const S: Record<string, CSSProperties> = {
  page: { minHeight: '100vh', background: 'linear-gradient(160deg,#f8f7ff 0%,#f0f4ff 50%,#faf5ff 100%)', fontFamily: 'DM Sans, sans-serif', color: '#0f172a', position: 'relative' },
  decorTop: { position: 'fixed', top: -140, right: -150, width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 },
  decorBottom: { position: 'fixed', bottom: -120, left: -120, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.09) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 },
  nav: { position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(99,102,241,0.12)', backdropFilter: 'blur(16px)', background: 'rgba(248,247,255,0.9)' },
  navInner: { maxWidth: 1100, margin: '0 auto', height: 62, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid #dbe1f0', background: 'white', color: '#475569', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' },
  editButton: { display: 'inline-flex', alignItems: 'center', padding: '10px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 700, boxShadow: '0 6px 18px rgba(99,102,241,0.28)' },
  container: { maxWidth: 1100, margin: '0 auto', padding: '26px 20px 56px', display: 'flex', flexDirection: 'column', gap: 18, position: 'relative', zIndex: 1 },
  heroCard: { display: 'flex', gap: 22, alignItems: 'center', background: 'linear-gradient(135deg,#ffffff 0%,#f6f5ff 55%,#f3f7ff 100%)', border: '1px solid rgba(99,102,241,0.16)', borderRadius: 18, padding: '24px', boxShadow: '0 8px 24px rgba(99,102,241,0.08)', flexWrap: 'wrap' },
  avatarWrap: { width: 124, height: 124, borderRadius: '50%', overflow: 'hidden', boxShadow: '0 0 0 5px #eef2ff' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarFallback: { width: '100%', height: '100%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', fontWeight: 800, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 },
  fallbackGlyph: { fontSize: 24, lineHeight: 1 },
  roleBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8, borderRadius: 999, padding: '6px 12px', border: '1px solid #c7d2fe', background: '#eef2ff', color: '#4f46e5', fontSize: 12, fontWeight: 800, letterSpacing: '0.02em' },
  name: { margin: '0 0 4px', fontSize: 28, fontWeight: 800, fontFamily: 'Syne, sans-serif' },
  title: { margin: '0 0 10px', fontSize: 14, color: '#6366f1', fontWeight: 700 },
  heroMeta: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  metaBadge: { display: 'inline-flex', alignItems: 'center', gap: 5, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#4f46e5', borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 600 },
  metaBadgePurple: { display: 'inline-flex', alignItems: 'center', gap: 5, border: '1px solid #e9d5ff', background: '#faf5ff', color: '#7c3aed', borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 600 },
  bio: { margin: 0, fontSize: 14, color: '#64748b', lineHeight: 1.75 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 },
  card: { background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(99,102,241,0.06)', padding: 18 },
  sectionTitle: { margin: '0 0 14px', fontSize: 13, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 },
  infoCell: { padding: '10px 12px', border: '1px solid #e5eaf4', borderRadius: 10, background: '#f8fafc' },
  infoLabel: { margin: '0 0 4px', fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' },
  infoValue: { margin: 0, fontSize: 13, color: '#0f172a', fontWeight: 700 },
  contactCol: { display: 'flex', flexDirection: 'column', gap: 10 },
  contactRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1px solid #e5eaf4', borderRadius: 10, background: '#f8fafc', flexWrap: 'wrap' },
  contactLabel: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', fontWeight: 700 },
  contactValue: { fontSize: 13, color: '#334155', fontWeight: 600 },
  contactLink: { fontSize: 13, color: '#4f46e5', textDecoration: 'none', fontWeight: 700 },
  tagsRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  techTag: { borderRadius: 999, padding: '6px 12px', border: '1px solid #c7d2fe', background: '#eef2ff', color: '#4f46e5', fontSize: 12, fontWeight: 700 },
  researchTag: { borderRadius: 999, padding: '6px 12px', border: '1px solid #e9d5ff', background: '#faf5ff', color: '#7c3aed', fontSize: 12, fontWeight: 700 },
  centerState: { minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 },
  spinner: { width: 36, height: 36, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', animation: 'spin 0.9s linear infinite' },
  centerText: { margin: 0, color: '#64748b', fontWeight: 600 },
  errorText: { margin: 0, color: '#dc2626', fontWeight: 700 },
  muted: { margin: 0, fontSize: 13, color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: 6 },
}
