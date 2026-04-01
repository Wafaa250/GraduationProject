// src/app/components/student/JoinChannelModal.tsx
import { useState } from 'react'
import { X, Loader, CheckCircle } from 'lucide-react'
import api from '../../api/axiosInstance'

interface Props {
  onClose: () => void
  onJoined?: (channelName: string) => void
}

export default function JoinChannelModal({ onClose, onJoined }: Props) {
  const [code, setCode]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await api.post('/channels/join', { inviteCode: code.trim() })
      setSuccess(`✅ Joined "${res.data.channelName}" successfully!`)
      onJoined?.(res.data.channelName)
      setTimeout(() => onClose(), 1800)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid invite code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>

        <div style={S.header}>
          <div>
            <h2 style={S.title}>Join a Channel</h2>
            <p style={S.sub}>Enter the invite code shared by your doctor</p>
          </div>
          <button style={S.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={S.form}>
          <div style={S.formGroup}>
            <label style={S.label}>Invite Code</label>
            <input
              style={S.input}
              placeholder="e.g. SWE305-3A7F2B"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              required
              autoFocus
            />
            <p style={S.hint}>The invite code looks like: COURSECODE-XXXXXX</p>
          </div>

          {error && <div style={S.errorBox}>❌ {error}</div>}

          {success && (
            <div style={S.successBox}>
              <CheckCircle size={16} color="#16a34a" />
              {success}
            </div>
          )}

          <div style={S.formActions}>
            <button type="button" style={S.cancelBtn} onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" style={{ ...S.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading
                ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Joining...</>
                : 'Join Channel'
              }
            </button>
          </div>
        </form>

        <style>{`
          input::placeholder{color:#94a3b8;}
          input:focus{outline:none;border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,.1);}
          button:hover:not(:disabled){opacity:.88;}
          @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        `}</style>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.45)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 200, padding: 16 },
  modal:      { background: 'white', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,.15)', width: '100%', maxWidth: 420 },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '22px 24px 0' },
  title:      { fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 3px', fontFamily: 'Syne, sans-serif' },
  sub:        { fontSize: 12, color: '#94a3b8', margin: 0 },
  closeBtn:   { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0', background: 'none', color: '#64748b', cursor: 'pointer' },
  form:       { padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 },
  formGroup:  { display: 'flex', flexDirection: 'column', gap: 6 },
  label:      { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em' },
  input:      { padding: '11px 14px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 15, color: '#0f172a', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '.04em' },
  hint:       { fontSize: 11, color: '#94a3b8', margin: '2px 0 0' },
  errorBox:   { background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ef4444', fontWeight: 500 },
  successBox: { display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#16a34a', fontWeight: 600 },
  formActions:{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 },
  cancelBtn:  { padding: '9px 18px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 9, color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtn:  { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
}
