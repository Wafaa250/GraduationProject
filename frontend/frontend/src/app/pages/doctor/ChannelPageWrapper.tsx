
import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function ChannelPageWrapper() {
  const { channelId } = useParams<{ channelId: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect legacy /doctor/channels/:channelId → /doctor-dashboard
    navigate('/doctor-dashboard', { replace: true })
  }, [channelId, navigate])

  return null
}