// src/app/pages/doctor/components/StudentListModal.tsx
import { Mail, X } from 'lucide-react'
import { DoctorStudent } from '../data/doctorMockData'

interface Props {
  students: DoctorStudent[]
  channelName: string
  onClose: () => void
}

export default function StudentListModal({ students, channelName, onClose }: Props) {
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={S.header}>
          <div>
            <h2 style={S.title}>Enrolled Students</h2>
            <p style={S.sub}>{channelName} · {students.length} students</p>
          </div>
          <button style={S.closeBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* List */}
        <div style={S.list}>
          {students.map(student => (
            <div key={student.id} style={S.row}>
              <div style={S.avatar}>{student.avatar}</div>
              <div style={S.info}>
                <span style={S.name}>{student.name}</span>
                <span style={S.studentId}>{student.studentId}</span>
              </div>
              <a href={`mailto:${student.email}`} style={S.emailLink}>
                <Mail size={13} />
                {student.email}
              </a>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .modal-row:hover { background: #f8fafc; }
        a { text-decoration: none; }
      `}</style>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.45)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 200, padding: 16 },
  modal:   { background: 'white', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,.15)', width: '100%', maxWidth: 520, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'slideUp .18s ease' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '22px 24px 16px', borderBottom: '1px solid #f1f5f9' },
  title:   { fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 3px', fontFamily: 'Syne, sans-serif' },
  sub:     { fontSize: 12, color: '#94a3b8', margin: 0 },
  closeBtn:{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0', background: 'none', color: '#64748b', cursor: 'pointer' },
  list:    { overflowY: 'auto', padding: '8px 12px 16px' },
  row:     { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, transition: 'background .12s' },
  avatar:  { width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  info:    { flex: 1, display: 'flex', flexDirection: 'column' },
  name:    { fontSize: 13, fontWeight: 600, color: '#0f172a' },
  studentId: { fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' },
  emailLink: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6366f1', fontWeight: 500 },
}
