import { useEffect, useState } from 'react'
import {
  getDoctorRequests,
  acceptSupervisorRequest,
  rejectSupervisorRequest,
  type SupervisorRequest
} from '../../../api/supervisorApi'

export default function DoctorRequestsPage() {
  const [requests, setRequests] = useState<SupervisorRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const data = await getDoctorRequests()
      setRequests(data)
    } catch {
      alert('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (id: number) => {
    setActionLoadingId(id)
    try {
      await acceptSupervisorRequest(id)

      setRequests(prev =>
        prev.map(r =>
          r.requestId === id ? { ...r, status: 'accepted' } : r
        )
      )
    } catch {
      alert('Failed to accept request')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReject = async (id: number) => {
    setActionLoadingId(id)
    try {
      await rejectSupervisorRequest(id)

      setRequests(prev =>
        prev.map(r =>
          r.requestId === id ? { ...r, status: 'rejected' } : r
        )
      )
    } catch {
      alert('Failed to reject request')
    } finally {
      setActionLoadingId(null)
    }
  }

  if (loading) {
    return <p style={{ padding: 20 }}>Loading...</p>
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>🎓 Supervisor Requests</h2>

      {requests.length === 0 ? (
        <p>No requests</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map(r => (
            <div
              key={r.requestId}
              style={{
                padding: 16,
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                background: '#f8fafc'
              }}
            >
              <p><strong>Project:</strong> {r.project.name}</p>
              <p><strong>Student:</strong> {r.sender.name}</p>
              <p><strong>Status:</strong> {r.status}</p>

              {r.status === 'pending' && (
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button
                    onClick={() => handleAccept(r.requestId)}
                    disabled={actionLoadingId === r.requestId}
                  >
                    {actionLoadingId === r.requestId ? 'Accepting...' : 'Accept'}
                  </button>

                  <button
                    onClick={() => handleReject(r.requestId)}
                    disabled={actionLoadingId === r.requestId}
                  >
                    {actionLoadingId === r.requestId ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}