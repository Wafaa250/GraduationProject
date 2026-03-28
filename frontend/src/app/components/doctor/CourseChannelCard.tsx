// src/app/pages/doctor/components/CourseChannelCard.tsx
import { useState } from 'react'
import { Users, Copy, Check, ChevronRight, UserPlus } from 'lucide-react'
import { CourseChannel } from '../data/doctorMockData'

interface Props {
  channel: CourseChannel
  onView: () => void
  onManageStudents: () => void
}

export default function CourseChannelCard({ channel, onView, onManageStudents }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(channel.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={S.card}>
      {/* Accent bar */}
      <div style={{ ...S.accentBar, background: channel.color }} />

      {/* Header */}
      <div style={S.header}>
        <span style={{ ...S.badge, background: channel.color + '18', color: channel.color }}>
          {channel.courseCode}
        </span>
        <span style={S.section}>{channel.section}</span>
      </div>

      {/* Name */}
      <h3 style={S.name}>{channel.name}</h3>

      {/* Meta */}
      <div style={S.meta}>
        <div style={S.metaItem}>
          <Users size={13} color="#94a3b8" />
          <span style={S.metaText}>{channel.studentsCount} Students</span>
        </div>
        <span style={S.teamsText}>{channel.teams.length} Teams</span>
      </div>

      {/* Invite Code */}
      <div style={S.codeRow}>
        <span style={S.codeLabel}>Invite Code</span>
        <div style={S.codeBox}>
          <code style={S.code}>{channel.inviteCode}</code>
          <button style={S.copyBtn} onClick={handleCopy} title="Copy">
            {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} color="#94a3b8" />}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div style={S.actions}>
        <button style={S.primaryBtn} onClick={onView}>
          <ChevronRight size={14} />
          View Channel
        </button>
        <button style={S.ghostBtn} onClick={onManageStudents}>
          <UserPlus size={13} />
          Students
        </button>
      </div>

      <style>{`button:hover:not(:disabled) { opacity: 0.88; }`}</style>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  card:       { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 20px 18px', boxShadow: '0 2px 12px rgba(99,102,241,0.04)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 10, transition: 'box-shadow .15s' },
  accentBar:  { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: '16px 16px 0 0' },
  header:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  badge:      { fontSize: 11, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '.04em', padding: '3px 8px', borderRadius: 6 },
  section:    { fontSize: 11, color: '#94a3b8', fontWeight: 500 },
  name:       { fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' },
  meta:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  metaItem:   { display: 'flex', alignItems: 'center', gap: 5 },
  metaText:   { fontSize: 12, color: '#64748b', fontWeight: 500 },
  teamsText:  { fontSize: 12, color: '#94a3b8' },
  codeRow:    { display: 'flex', flexDirection: 'column', gap: 4 },
  codeLabel:  { fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' },
  codeBox:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px' },
  code:       { fontFamily: 'monospace', fontSize: 12, color: '#0f172a', fontWeight: 600 },
  copyBtn:    { background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, display: 'flex', alignItems: 'center' },
  actions:    { display: 'flex', gap: 8, marginTop: 2 },
  primaryBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  ghostBtn:   { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
}
