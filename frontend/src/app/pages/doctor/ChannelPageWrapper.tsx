// src/app/pages/doctor/ChannelPageWrapper.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader } from 'lucide-react'
import api from '../../../api/axiosInstance'
import ChannelPage from './ChannelPage'
import { CourseChannel, DoctorStudent, DoctorTeam } from './data/doctorMockData'

export default function ChannelPageWrapper() {
  const { channelId } = useParams<{ channelId: string }>()
  const navigate      = useNavigate()
  const [channel, setChannel] = useState<CourseChannel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!channelId) return
    setLoading(true)
    api.get(`/doctor/channels/${channelId}`)
      .then(res => {
        const c = res.data
        const mapped: CourseChannel = {
          id:            String(c.id),
          type:          'course',
          name:          c.name,
          courseCode:    c.courseCode,
          section:       c.section,
          studentsCount: c.studentsCount ?? 0,
          inviteCode:    c.inviteCode,
          inviteLink:    `https://platform.edu/join/${c.inviteCode}`,
          color:         c.color ?? '#6366f1',
          students: (c.students ?? []).map((s: any): DoctorStudent => ({
            id:        s.id,
            name:      s.name,
            studentId: s.studentId,
            email:     s.email,
            avatar:    s.name?.slice(0, 2).toUpperCase() ?? '??',
          })),
          teams: (c.teams ?? []).map((t: any): DoctorTeam => ({
            id:           String(t.id),
            name:         t.name,
            projectTitle: t.projectTitle,
            skills:       [],
            members: (t.members ?? []).map((m: any): DoctorStudent => ({
              id:        m.id,
              name:      m.name,
              studentId: m.studentId,
              email:     '',
              avatar:    m.name?.slice(0, 2).toUpperCase() ?? '??',
            })),
          })),
        }
        setChannel(mapped)
      })
      .catch(() => setError('Channel not found or you do not have access.'))
      .finally(() => setLoading(false))
  }, [channelId])

  if (loading) return (
    <div style={S.center}>
      <Loader size={28} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
      <p style={S.loadingText}>Loading channel...</p>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error || !channel) return (
    <div style={S.center}>
      <p style={S.errorText}>{error ?? 'Channel not found.'}</p>
      <button style={S.backBtn} onClick={() => navigate('/doctor-dashboard')}>
        <ArrowLeft size={14} /> Back to Dashboard
      </button>
    </div>
  )

  return <ChannelPage channels={[channel]} />
}

const S: Record<string, React.CSSProperties> = {
  center:      { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, fontFamily: 'DM Sans, sans-serif', background: 'linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)' },
  loadingText: { fontSize: 14, color: '#94a3b8', margin: 0 },
  errorText:   { fontSize: 14, color: '#ef4444', margin: 0, fontWeight: 500 },
  backBtn:     { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#64748b', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit' },
}
