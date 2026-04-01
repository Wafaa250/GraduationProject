// src/app/pages/doctor/components/GradProjectCard.tsx
import { useState } from 'react'
import { Users, Copy, Check, ExternalLink } from 'lucide-react'
import { GraduationProject } from '../data/doctorMockData'

interface Props { project: GraduationProject }

export default function GradProjectCard({ project }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(project.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={S.card}>
      <div style={{ ...S.accentBar, background: project.color }} />

      {/* Badge */}
      <div style={S.header}>
        <span style={{ ...S.badge, background: project.color + '18', color: project.color }}>
          GRAD PROJECT
        </span>
      </div>

      {/* Title */}
      <h3 style={S.title}>{project.title}</h3>
      <p style={S.supervisor}>Supervised by {project.supervisor}</p>

      {/* Progress */}
      <div style={S.progressSection}>
        <div style={S.progressHeader}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Progress</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: project.color }}>{project.progress}%</span>
        </div>
        <div style={S.progressTrack}>
          <div style={{ ...S.progressFill, width: `${project.progress}%`, background: project.color }} />
        </div>
      </div>

      {/* Skills */}
      <div style={S.skills}>
        {project.skills.slice(0, 3).map(sk => (
          <span key={sk} style={{ ...S.skillChip, borderColor: project.color + '50', color: project.color, background: project.color + '10' }}>
            {sk}
          </span>
        ))}
        {project.skills.length > 3 && (
          <span style={S.moreChip}>+{project.skills.length - 3}</span>
        )}
      </div>

      {/* Meta + Code */}
      <div style={S.meta}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Users size={13} color="#94a3b8" />
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{project.studentsCount} Members</span>
        </div>
        <div style={S.codeBox}>
          <code style={S.code}>{project.inviteCode}</code>
          <button style={S.copyBtn} onClick={handleCopy}>
            {copied ? <Check size={11} color="#10b981" /> : <Copy size={11} color="#94a3b8" />}
          </button>
        </div>
      </div>

      {/* Open Button */}
      <button style={S.openBtn}>
        <ExternalLink size={13} />
        Open Project
      </button>

      <style>{`button:hover:not(:disabled) { opacity: 0.88; }`}</style>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  card:            { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 20px 18px', boxShadow: '0 2px 12px rgba(99,102,241,0.04)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 10 },
  accentBar:       { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: '16px 16px 0 0' },
  header:          { display: 'flex' },
  badge:           { fontSize: 10, fontWeight: 700, letterSpacing: '.06em', padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase' as const },
  title:           { fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' },
  supervisor:      { fontSize: 12, color: '#64748b', margin: 0 },
  progressSection: { display: 'flex', flexDirection: 'column', gap: 5 },
  progressHeader:  { display: 'flex', justifyContent: 'space-between' },
  progressTrack:   { height: 5, background: '#f1f5f9', borderRadius: 100, overflow: 'hidden' },
  progressFill:    { height: '100%', borderRadius: 100, transition: 'width .4s ease' },
  skills:          { display: 'flex', flexWrap: 'wrap' as const, gap: 5 },
  skillChip:       { padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: '1px solid' },
  moreChip:        { padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8' },
  meta:            { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  codeBox:         { display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7, padding: '4px 8px' },
  code:            { fontFamily: 'monospace', fontSize: 11, color: '#0f172a', fontWeight: 600 },
  copyBtn:         { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 },
  openBtn:         { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 2 },
}
