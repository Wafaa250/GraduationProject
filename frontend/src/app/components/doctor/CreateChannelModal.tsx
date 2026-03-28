// src/app/components/doctor/CreateChannelModal.tsx
import { useState } from 'react'
import { X, Loader } from 'lucide-react'

interface Props {
  onClose: () => void
  onSubmit: (data: { type: 'course' | 'graduation'; name: string; code: string; section: string }) => Promise<void>
}

export default function CreateChannelModal({ onClose, onSubmit }: Props) {
  const [type, setType]       = useState<'course' | 'graduation'>('course')
  const [name, setName]       = useState('')
  const [code, setCode]       = useState('')
  const [section, setSection] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit({ type, name, code, section })
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.header}>
          <div>
            <h2 style={S.title}>Create Channel</h2>
            <p style={S.sub}>Set up a new course or graduation channel</p>
          </div>
          <button style={S.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={S.form}>
          <div style={S.formGroup}>
            <label style={S.label}>Channel Type</label>
            <div style={S.toggle}>
              <button type="button" style={{ ...S.toggleBtn, ...(type === 'course' ? S.toggleBtnActive : {}) }} onClick={() => setType('course')}>
                Course Channel
              </button>
              <button type="button" style={{ ...S.toggleBtn, ...(type === 'graduation' ? S.toggleBtnActive : {}) }} onClick={() => setType('graduation')}>
                Graduation Channel
              </button>
            </div>
          </div>

          <div style={S.formGroup}>
            <label style={S.label}>{type === 'course' ? 'Course Name' : 'Project Title'}</label>
            <input
              style={S.input}
              placeholder={type === 'course' ? 'e.g. Web Development' : 'e.g. Smart Agriculture System'}
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          {type === 'course' && (
            <div style={S.formRow}>
              <div style={S.formGroup}>
                <label style={S.label}>Course Code</label>
                <input style={S.input} placeholder="e.g. SWE305" value={code} onChange={e => setCode(e.target.value)} required />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Section</label>
                <input style={S.input} placeholder="e.g. Section A" value={section} onChange={e => setSection(e.target.value)} />
              </div>
            </div>
          )}

          {type === 'graduation' && (
            <div style={S.formGroup}>
              <label style={S.label}>Project Code</label>
              <input
                style={S.input}
                placeholder="e.g. GP-2025-01"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={S.errorBox}>❌ {error}</div>
          )}

          <div style={S.formActions}>
            <button type="button" style={S.cancelBtn} onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" style={{ ...S.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : 'Create Channel'}
            </button>
          </div>
        </form>

        <style>{`
          input::placeholder{color:#94a3b8;}
          input:focus{outline:none;border-color:#6366f1!important;}
          button:hover:not(:disabled){opacity:.88;}
          @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        `}</style>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  overlay:         { position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.45)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 200, padding: 16 },
  modal:           { background: 'white', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,.15)', width: '100%', maxWidth: 460 },
  header:          { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '22px 24px 0' },
  title:           { fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 3px', fontFamily: 'Syne, sans-serif' },
  sub:             { fontSize: 12, color: '#94a3b8', margin: 0 },
  closeBtn:        { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0', background: 'none', color: '#64748b', cursor: 'pointer' },
  form:            { padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 },
  formGroup:       { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  label:           { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em' },
  input:           { padding: '9px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#0f172a', fontFamily: 'inherit' },
  formRow:         { display: 'flex', gap: 12 },
  toggle:          { display: 'flex', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9, padding: 3, gap: 3 },
  toggleBtn:       { flex: 1, padding: '7px 10px', borderRadius: 7, fontSize: 12.5, fontWeight: 500, color: '#64748b', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' },
  toggleBtnActive: { background: 'white', color: '#6366f1', fontWeight: 700, boxShadow: '0 1px 4px rgba(99,102,241,0.12)' },
  errorBox:        { background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ef4444', fontWeight: 500 },
  formActions:     { display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 },
  cancelBtn:       { padding: '9px 18px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 9, color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtn:       { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
}
