// src/app/pages/doctor/components/ChannelDetailView.tsx
import { useState } from 'react'
import { ArrowLeft, Users, Copy, Check, Plus } from 'lucide-react'
import { CourseChannel } from '../data/doctorMockData'
import StudentListModal from './StudentListModal'

interface Props {
  channel: CourseChannel
  onBack: () => void
}

export default function ChannelDetailView({ channel, onBack }: Props) {
  const [showStudents, setShowStudents] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(channel.inviteLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div style={S.page}>
      <BgDecor />
      <div style={S.content}>

        {/* Header */}
        <div style={S.header}>
          <button style={S.backBtn} onClick={onBack}>
            <ArrowLeft size={15} />
            Back
          </button>
          <div style={S.titleGroup}>
            <span style={{ ...S.badge, background: channel.color + '18', color: channel.color }}>
              {channel.courseCode}
            </span>
            <h1 style={S.title}>{channel.name}</h1>
            <span style={S.section}>{channel.section}</span>
          </div>
          <div style={S.actions}>
            <button style={S.ghostBtn} onClick={handleCopyLink}>
              {copiedLink ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              Copy Invite Link
            </button>
            <button style={S.ghostBtn} onClick={() => setShowStudents(true)}>
              <Users size={13} />
              {channel.studentsCount} Students
            </button>
          </div>
        </div>

        {/* Teams Section */}
        <div style={S.teamsHeader}>
          <h2 style={S.teamsTitle}>Project Teams</h2>
          <button style={S.createBtn}>
            <Plus size={13} />
            Create Team
          </button>
        </div>

        {channel.teams.length === 0 ? (
          <div style={S.empty}>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 12px' }}>No teams yet. Create the first team!</p>
            <button style={S.createBtn}>
              <Plus size={13} />
              Create Team
            </button>
          </div>
        ) : (
          <div style={S.teamsGrid}>
            {channel.teams.map(team => (
              <div key={team.id} style={S.teamCard}>
                <h3 style={S.teamName}>{team.name}</h3>
                <p style={S.projectTitle}>{team.projectTitle}</p>

                {/* Members */}
                <div style={S.membersRow}>
                  {team.members.map(m => (
                    <div key={m.id} style={S.memberAvatar} title={m.name}>{m.avatar}</div>
                  ))}
                  <span style={S.membersLabel}>{team.members.length} members</span>
                </div>

                {/* Skills */}
                <div style={S.skills}>
                  {team.skills.map(sk => (
                    <span key={sk} style={S.skillChip}>{sk}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showStudents && (
        <StudentListModal
          students={channel.students}
          channelName={`${channel.name} – ${channel.section}`}
          onClose={() => setShowStudents(false)}
        />
      )}

      <style>{`button:hover:not(:disabled){opacity:.88;} a{text-decoration:none;}`}</style>
    </div>
  )
}

function BgDecor() {
  return (
    <>
      <div style={{ position: 'fixed', top: -150, right: -150, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -120, left: -120, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.06) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
    </>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:        { minHeight: '100vh', background: 'linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)', fontFamily: 'DM Sans, sans-serif', color: '#0f172a', position: 'relative' },
  content:     { maxWidth: 1100, margin: '0 auto', padding: '32px 24px 60px', position: 'relative', zIndex: 1 },
  header:      { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, flexWrap: 'wrap' as const },
  backBtn:     { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', fontWeight: 500, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
  titleGroup:  { flex: 1, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const },
  badge:       { fontSize: 11, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '.04em', padding: '3px 9px', borderRadius: 6 },
  title:       { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px', fontFamily: 'Syne, sans-serif' },
  section:     { fontSize: 12, color: '#94a3b8' },
  actions:     { display: 'flex', gap: 8 },
  ghostBtn:    { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 9, color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  teamsHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  teamsTitle:  { fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 },
  createBtn:   { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  empty:       { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', background: 'white', border: '1.5px dashed #c7d2fe', borderRadius: 16, textAlign: 'center' as const },
  teamsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 },
  teamCard:    { background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, boxShadow: '0 2px 8px rgba(99,102,241,0.04)', display: 'flex', flexDirection: 'column', gap: 10 },
  teamName:    { fontSize: 13, fontWeight: 700, color: '#6366f1', margin: 0 },
  projectTitle:{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1.4 },
  membersRow:  { display: 'flex', alignItems: 'center', gap: 4 },
  memberAvatar:{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxShadow: '0 0 0 1px #e2e8f0', cursor: 'default' },
  membersLabel:{ fontSize: 11, color: '#94a3b8', marginLeft: 4 },
  skills:      { display: 'flex', flexWrap: 'wrap' as const, gap: 4 },
  skillChip:   { padding: '3px 10px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, fontSize: 11, color: '#6366f1', fontWeight: 600 },
}
