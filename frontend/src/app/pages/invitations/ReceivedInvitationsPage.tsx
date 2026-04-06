// src/app/pages/invitations/ReceivedInvitationsPage.tsx
import { useState, useEffect, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Inbox, CheckCircle2, XCircle } from 'lucide-react'
import {
  getReceivedInvitations,
  acceptInvitation,
  rejectInvitation,
  ReceivedInvitation,
} from '../../../api/invitationsApi'

// ─── Types ────────────────────────────────────────────────────────────────────

// Per-invitation action state
// 'idle' | 'loading' | 'done' | 'error:<message>'
type ActionState = 'idle' | 'loading' | 'done' | string

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReceivedInvitationsPage() {
  const navigate = useNavigate()

  const [invitations, setInvitations] = useState<ReceivedInvitation[]>([])
  const [loading,     setLoading]     = useState(true)
  const [fetchError,  setFetchError]  = useState<string | null>(null)

  // Per-invitation action state: Record<invitationId, ActionState>
  const [actionState, setActionState] = useState<Record<number, ActionState>>({})

  // ── Fetch invitations on mount ────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const data = await getReceivedInvitations()
        setInvitations(data)
      } catch {
        setFetchError('Failed to load invitations. Please try again.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // ── Helpers ───────────────────────────────────────────────────────────────

  const setAction = (id: number, state: ActionState) =>
    setActionState(prev => ({ ...prev, [id]: state }))

  /** Update a single invitation's status in the list */
  const updateStatus = (id: number, status: ReceivedInvitation['status']) =>
    setInvitations(prev =>
      prev.map(inv => inv.invitationId === id ? { ...inv, status } : inv)
    )

  // ── Accept ────────────────────────────────────────────────────────────────
  const handleAccept = async (inv: ReceivedInvitation) => {
    setAction(inv.invitationId, 'loading')
    try {
      await acceptInvitation(inv.invitationId)
      updateStatus(inv.invitationId, 'accepted')
      setAction(inv.invitationId, 'done')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to accept.'
      setAction(inv.invitationId, `error:${msg}`)
    }
  }

  // ── Reject ────────────────────────────────────────────────────────────────
  const handleReject = async (inv: ReceivedInvitation) => {
    setAction(inv.invitationId, 'loading')
    try {
      await rejectInvitation(inv.invitationId)
      updateStatus(inv.invitationId, 'rejected')
      setAction(inv.invitationId, 'done')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to reject.'
      setAction(inv.invitationId, `error:${msg}`)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <BgDecor />

      {/* ── NAV ── */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <button onClick={() => navigate('/dashboard')} style={S.backBtn}>
            <ArrowLeft size={15} /> Dashboard
          </button>
          <h1 style={S.navTitle}>📬 Team Invitations</h1>
        </div>
      </nav>

      <div style={S.content}>

        {/* ── Loading ── */}
        {loading && (
          <div style={S.center}>
            <div style={S.spinner} />
            <p style={S.muted}>Loading invitations...</p>
          </div>
        )}

        {/* ── Fetch error ── */}
        {!loading && fetchError && (
          <div style={S.errorBox}>
            <XCircle size={16} /> {fetchError}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !fetchError && invitations.length === 0 && (
          <div style={S.center}>
            <Inbox size={44} color="#cbd5e1" />
            <p style={S.emptyTitle}>No invitations yet</p>
            <p style={S.muted}>
              When someone invites you to join their graduation project,
              it will appear here.
            </p>
          </div>
        )}

        {/* ── Invitation list ── */}
        {!loading && !fetchError && invitations.length > 0 && (
          <div style={S.list}>

            {/* Section counts */}
            <p style={S.sectionMeta}>
              {invitations.filter(i => i.status === 'pending').length} pending
              {' · '}
              {invitations.length} total
            </p>

            {invitations.map(inv => {
              const state    = actionState[inv.invitationId] ?? 'idle'
              const isLoading = state === 'loading'
              const isError   = state.startsWith('error:')
              const errorMsg  = isError ? state.replace('error:', '') : ''

              return (
                <div key={inv.invitationId} style={{
                  ...S.card,
                  // Dim non-pending cards slightly
                  opacity: inv.status !== 'pending' ? 0.75 : 1,
                }}>

                  {/* ── Card header ── */}
                  <div style={S.cardHeader}>
                    <div style={{ flex: 1, minWidth: 0 }}>

                      {/* Project name */}
                      <p style={S.projectName}>{inv.projectName}</p>

                      {/* Sender */}
                      <p style={S.senderLine}>
                        Invited by{' '}
                        <strong style={{ color: '#334155' }}>{inv.senderName}</strong>
                      </p>

                      {/* Date */}
                      <p style={S.date}>
                        {new Date(inv.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>

                    {/* Status badge */}
                    <StatusBadge status={inv.status} />
                  </div>

                  {/* ── Error message ── */}
                  {isError && (
                    <div style={S.inlineError}>
                      <XCircle size={13} /> {errorMsg}
                    </div>
                  )}

                  {/* ── Action buttons (pending only) ── */}
                  {inv.status === 'pending' && (
                    <div style={S.actions}>
                      <button
                        disabled={isLoading}
                        onClick={() => handleAccept(inv)}
                        style={{ ...S.acceptBtn, opacity: isLoading ? 0.55 : 1 }}
                      >
                        {isLoading
                          ? <span style={S.btnSpinner} />
                          : <><CheckCircle2 size={13} /> Accept</>
                        }
                      </button>
                      <button
                        disabled={isLoading}
                        onClick={() => handleReject(inv)}
                        style={{ ...S.rejectBtn, opacity: isLoading ? 0.55 : 1 }}
                      >
                        {isLoading
                          ? <span style={S.btnSpinner} />
                          : <><XCircle size={13} /> Reject</>
                        }
                      </button>
                    </div>
                  )}

                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        button:hover:not(:disabled) { opacity: 0.85 !important; }
      `}</style>
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

type Status = ReceivedInvitation['status']

const STATUS_CONFIG: Record<Status, { label: string; bg: string; color: string; border: string }> = {
  pending:   { label: '⏳ Pending',   bg: '#fef9c3', color: '#a16207', border: '#fde68a' },
  accepted:  { label: '✅ Accepted',  bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  rejected:  { label: '✕ Rejected',  bg: '#f1f5f9', color: '#94a3b8', border: '#e2e8f0' },
  cancelled: { label: '🚫 Cancelled', bg: '#f1f5f9', color: '#94a3b8', border: '#e2e8f0' },
  expired:   { label: '⌛ Expired',   bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
}

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span style={{
      flexShrink: 0,
      padding: '4px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      background: cfg.bg,
      color:      cfg.color,
      border:     `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  )
}

// ─── Background ───────────────────────────────────────────────────────────────

function BgDecor() {
  return (
    <>
      <div style={{ position: 'fixed' as const, top: -150, right: -150, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.07) 0%,transparent 70%)', pointerEvents: 'none' as const, zIndex: 0 }} />
      <div style={{ position: 'fixed' as const, bottom: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.05) 0%,transparent 70%)', pointerEvents: 'none' as const, zIndex: 0 }} />
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S: Record<string, CSSProperties> = {
  page:        { minHeight: '100vh', background: 'linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)', fontFamily: 'DM Sans, sans-serif', color: '#0f172a', position: 'relative' },
  nav:         { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(248,247,255,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(99,102,241,0.1)' },
  navInner:    { maxWidth: 760, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', gap: 16 },
  backBtn:     { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' },
  navTitle:    { fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: 'Syne, sans-serif' },
  content:     { maxWidth: 760, margin: '0 auto', padding: '28px 24px 60px', position: 'relative', zIndex: 1 },
  center:      { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '72px 0', gap: 10, textAlign: 'center' as const },
  spinner:     { width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite' },
  muted:       { fontSize: 13, color: '#94a3b8', margin: 0, maxWidth: 340, lineHeight: 1.6 },
  emptyTitle:  { fontSize: 16, fontWeight: 700, color: '#475569', margin: '4px 0 0' },
  errorBox:    { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 10, fontSize: 13, color: '#ef4444', fontWeight: 500 },
  list:        { display: 'flex', flexDirection: 'column' as const, gap: 12 },
  sectionMeta: { fontSize: 12, color: '#94a3b8', fontWeight: 500, margin: '0 0 4px' },
  card:        { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 8px rgba(99,102,241,0.04)', transition: 'opacity 0.2s' },
  cardHeader:  { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  projectName: { fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' },
  senderLine:  { fontSize: 13, color: '#64748b', margin: '0 0 3px' },
  date:        { fontSize: 11, color: '#94a3b8', margin: 0 },
  inlineError: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, color: '#ef4444', marginBottom: 10 },
  actions:     { display: 'flex', gap: 8 },
  acceptBtn:   { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  rejectBtn:   { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', background: 'white', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnSpinner:  { display: 'inline-block', width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' },
}
