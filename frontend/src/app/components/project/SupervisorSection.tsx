import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { Loader2, X } from 'lucide-react'
import api from '../../../api/axiosInstance'
import React from 'react'
import ProfileLink from '../common/ProfileLink'
const GENERIC_ERROR = 'Something went wrong. Please try again.'

// ─── Types (strict, aligned with your gradProject + API contract) ───────────

export interface ProjectSupervisor {
  doctorId: number
  /** AspNetUsers.Id — for /doctors/:id profile links */
  userId?: number
  name: string
  major: string
}

export interface GradProjectSupervisorProps {
  id: number
  supervisor: ProjectSupervisor | null
  isOwner: boolean
}

export interface RecommendedSupervisor {
  doctorId: number
  name: string
  major: string
  matchScore: number
}

export interface SupervisorSectionProps {
  gradProject: GradProjectSupervisorProps
  /** Optional: refetch project from parent after a request is sent */
  onRequestSent?: () => void
}

// ─── API (real endpoints, no mocks) ───────────────────────────────────────────

async function fetchRecommendedSupervisors(
  projectId: number
): Promise<RecommendedSupervisor[]> {
  const { data } = await api.get<RecommendedSupervisor[]>(
    `/projects/${projectId}/recommended-supervisors`
  )
  return Array.isArray(data) ? data : []
}

async function postSupervisorRequest(
  projectId: number,
  doctorId: number
): Promise<{ message?: string }> {
  const { data } = await api.post<{ message?: string }>(
    `/projects/${projectId}/request-supervisor/${doctorId}`
  )
  return data ?? {}
}

function toPercent(score: number): number {
  if (!Number.isFinite(score)) return 0
  return score <= 1 ? Math.round(score * 100) : Math.round(score)
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SupervisorSection({
  gradProject,
  onRequestSent,
}: SupervisorSectionProps) {
  const { id: projectId, supervisor, isOwner } = gradProject

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [recommendations, setRecommendations] = useState<RecommendedSupervisor[]>(
    []
  )
  const [loadingList, setLoadingList] = useState(false)
  const [requestingDoctorId, setRequestingDoctorId] = useState<number | null>(
    null
  )
  const [listError, setListError] = useState<string | null>(null)
  const [isRequestSent, setIsRequestSent] = useState(false)

  const clearModalError = useCallback(() => {
    setListError(null)
  }, [])

  // Reset modal-local state when navigating to another project
  useEffect(() => {
    setIsModalOpen(false)
    setRecommendations([])
    setListError(null)
    setLoadingList(false)
    setRequestingDoctorId(null)
    setIsRequestSent(false)
  }, [projectId])

  useEffect(() => {
    if (gradProject.supervisor) setIsRequestSent(false)
  }, [gradProject.supervisor])

  const openModalAndFetch = useCallback(async () => {
    clearModalError()
    setIsModalOpen(true)
    setLoadingList(true)
    setListError(null)
    setRecommendations([])

    try {
      const list = await fetchRecommendedSupervisors(projectId)
      setRecommendations(list)
    } catch (err: unknown) {
      const serverMsg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      setListError(
        typeof serverMsg === 'string' && serverMsg.trim() !== ''
          ? serverMsg
          : GENERIC_ERROR
      )
    } finally {
      setLoadingList(false)
    }
  }, [projectId, clearModalError])

  const handleRequest = useCallback(
    async (doctorId: number) => {
      clearModalError()
      setRequestingDoctorId(doctorId)

      try {
        await postSupervisorRequest(projectId, doctorId)
        setIsRequestSent(true)
        setIsModalOpen(false)
        setRecommendations([])
        onRequestSent?.()
      } catch (err: unknown) {
        const serverMsg = (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message
        setListError(
          typeof serverMsg === 'string' && serverMsg.trim() !== ''
            ? serverMsg
            : GENERIC_ERROR
        )
      } finally {
        setRequestingDoctorId(null)
      }
    },
    [projectId, onRequestSent, clearModalError]
  )

  const closeModal = useCallback(() => {
    if (loadingList || requestingDoctorId !== null) return
    setIsModalOpen(false)
    setListError(null)
  }, [loadingList, requestingDoctorId])

  const busy = loadingList || requestingDoctorId !== null
  const findSupervisorDisabled = busy || isRequestSent
  const modalRequestDisabled = busy || isRequestSent

  return (
    <div style={styles.section}>
      <p style={styles.sectionLabel}>Supervisor</p>

      {supervisor ? (
        <div style={styles.supervisorCard}>
          <p style={styles.supervisorName}>
            <ProfileLink
              userId={
                supervisor.userId != null && supervisor.userId > 0
                  ? supervisor.userId
                  : supervisor.doctorId
              }
              role="doctor"
            >
          </p>
          <p style={styles.supervisorMeta}>{supervisor.major}</p>
        </div>
      ) : (
        <>
          <p style={styles.muted}>No supervisor assigned yet</p>
          {isRequestSent && (
            <p style={styles.pendingText} role="status">
              Request sent – waiting for approval
            </p>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={openModalAndFetch}
              disabled={findSupervisorDisabled}
              style={{
                ...styles.primaryBtn,
                marginTop: 4,
                opacity: findSupervisorDisabled ? 0.65 : 1,
                cursor: findSupervisorDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              {loadingList && isModalOpen ? 'Loading…' : 'Find Supervisor'}
            </button>
          )}
        </>
      )}

      {isModalOpen && (
        <div
          style={styles.overlay}
          role="presentation"
          onClick={closeModal}
        >
          <div
            style={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="supervisor-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <h2 id="supervisor-modal-title" style={styles.modalTitle}>
                Recommended supervisors
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={closeModal}
                disabled={busy}
                style={{
                  ...styles.iconBtn,
                  opacity: busy ? 0.5 : 1,
                  cursor: busy ? 'not-allowed' : 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {loadingList && (
              <div style={styles.loadingBlock} role="status" aria-live="polite">
                <Loader2 size={22} color="#6366f1" style={styles.spinner} />
                <p style={styles.loadingText}>Loading recommendations…</p>
              </div>
            )}

            {!loadingList && listError && (
              <p style={styles.errorText} role="alert">
                {listError}
              </p>
            )}

            {!loadingList && !listError && recommendations.length === 0 && (
              <p style={styles.centerMuted}>No supervisors found for this project.</p>
            )}

            {!loadingList && recommendations.length > 0 && (
              <ul style={styles.list}>
                {recommendations.map((doc) => {
                  const isThisRequest = requestingDoctorId === doc.doctorId
                  return (
                    <li key={doc.doctorId} style={styles.listItem}>
                      <div style={styles.listItemRow}>
                        <div style={styles.listItemText}>
                          <p style={styles.itemName}>
                            <ProfileLink userId={doc.doctorId} role="doctor">{doc.name}</ProfileLink>
                          </p>
                          <p style={styles.itemMajor}>{doc.major}</p>
                        </div>
                        <div style={styles.listItemActions}>
                          <span style={styles.matchBadge}>
                            {toPercent(doc.matchScore)}% match
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRequest(doc.doctorId)}
                            disabled={modalRequestDisabled}
                            style={{
                              ...styles.requestBtn,
                              opacity: modalRequestDisabled ? 0.65 : 1,
                              cursor: modalRequestDisabled
                                ? 'not-allowed'
                                : 'pointer',
                            }}
                          >
                            {isThisRequest ? 'Sending...' : 'Request'}
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes supervisor-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// ─── Styles (self-contained for easy drop-in) ─────────────────────────────────

const styles: Record<string, CSSProperties> = {
  section: {
    marginTop: 14,
    paddingTop: 12,
    borderTop: '1px solid rgba(99, 102, 241, 0.12)',
    fontFamily: 'inherit',
  },
  sectionLabel: {
    margin: '0 0 8px',
    fontSize: 10,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  supervisorCard: {
    padding: '10px 12px',
    borderRadius: 10,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  supervisorName: {
    margin: '0 0 4px',
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
  },
  supervisorMeta: {
    margin: 0,
    fontSize: 12,
    color: '#64748b',
  },
  muted: {
    margin: '0 0 10px',
    fontSize: 12,
    color: '#94a3b8',
  },
  primaryBtn: {
    padding: '8px 14px',
    fontSize: 12,
    fontWeight: 700,
    color: '#6366f1',
    background: '#fff',
    border: '1.5px solid #c7d2fe',
    borderRadius: 8,
    fontFamily: 'inherit',
  },
  pendingText: {
    margin: '0 0 10px',
    fontSize: 12,
    fontWeight: 600,
    color: '#b45309',
  },
  errorText: {
    margin: '12px 0',
    fontSize: 13,
    fontWeight: 600,
    color: '#dc2626',
  },
  centerMuted: {
    margin: '24px 0',
    textAlign: 'center',
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 1.5,
  },
  loadingBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: '28px 16px',
  },
  spinner: {
    animation: 'supervisor-spin 0.85s linear infinite',
  },
  loadingText: {
    margin: 0,
    fontSize: 13,
    fontWeight: 600,
    color: '#64748b',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modal: {
    width: '100%',
    maxWidth: 520,
    maxHeight: 'min(480px, 85vh)',
    overflow: 'auto',
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    padding: 20,
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 12,
  },
  modalTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 800,
    color: '#0f172a',
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    border: 'none',
    borderRadius: 10,
    background: '#f1f5f9',
    color: '#475569',
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  listItem: {
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
  },
  listItemRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    flexWrap: 'wrap',
  },
  listItemText: {
    minWidth: 0,
    flex: '1 1 160px',
  },
  listItemActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
    marginLeft: 'auto',
  },
  itemName: {
    margin: '0 0 4px',
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
  },
  itemMajor: {
    margin: 0,
    fontSize: 12,
    color: '#64748b',
  },
  matchBadge: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.02em',
    color: '#166534',
    background: '#dcfce7',
    padding: '5px 11px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
  },
  requestBtn: {
    padding: '8px 16px',
    minWidth: 88,
    fontSize: 12,
    fontWeight: 700,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontFamily: 'inherit',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
  },
}

export default SupervisorSection
