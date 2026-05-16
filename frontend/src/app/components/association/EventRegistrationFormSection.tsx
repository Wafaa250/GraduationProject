import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  createEventRegistrationForm,
  getEventRegistrationForm,
  parseApiErrorMessage,
} from '../../../api/eventRegistrationFormApi'
import { eventRegistrationFormPath } from '../../../utils/eventRegistrationFormFields'
import { assocCard, assocDash } from '../../pages/association/dashboard/associationDashTokens'

type Props = {
  eventId: number
  eventTitle: string
  disabled?: boolean
}

export function EventRegistrationFormSection({ eventId, eventTitle, disabled }: Props) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [fieldCount, setFieldCount] = useState(0)
  const [hasForm, setHasForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const form = await getEventRegistrationForm(eventId)
      setHasForm(!!form)
      setFieldCount(form?.fields?.length ?? 0)
    } catch {
      setHasForm(false)
      setFieldCount(0)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    void load()
  }, [load])

  const createForm = async () => {
    setCreating(true)
    try {
      const title = eventTitle.trim()
        ? `${eventTitle.trim()} registration`
        : 'Event registration'
      await createEventRegistrationForm(eventId, { title })
      toast.success('Registration form created')
      navigate(eventRegistrationFormPath(eventId))
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div style={{ ...assocCard, padding: 20, marginTop: 8 }}>
      <h3
        style={{
          margin: '0 0 6px',
          fontSize: 16,
          fontWeight: 700,
          fontFamily: assocDash.fontDisplay,
          color: assocDash.text,
        }}
      >
        Event registration form
      </h3>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: assocDash.muted, lineHeight: 1.5 }}>
        Design the form students will fill out when registering for this event.
      </p>

      {loading ? (
        <p style={{ margin: 0, fontSize: 13, color: assocDash.muted }}>Loading…</p>
      ) : hasForm ? (
        <div>
          <Link
            to={eventRegistrationFormPath(eventId)}
            style={{
              ...formLinkBtn,
              pointerEvents: disabled ? 'none' : undefined,
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <ClipboardList size={18} />
            {fieldCount > 0 ? 'Edit registration form' : 'Design registration form'}
          </Link>
          <span style={formLinkMeta}>
            {fieldCount > 0
              ? `${fieldCount} field${fieldCount === 1 ? '' : 's'}`
              : 'No fields yet'}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void createForm()}
          disabled={disabled || creating}
          style={createBtn}
        >
          <ClipboardList size={18} />
          {creating ? 'Creating…' : 'Create registration form'}
        </button>
      )}
    </div>
  )
}

const formLinkBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '11px 16px',
  borderRadius: assocDash.radiusMd,
  border: `1px solid ${assocDash.accentBorder}`,
  background: assocDash.accentMuted,
  color: assocDash.accentDark,
  fontSize: 14,
  fontWeight: 700,
  textDecoration: 'none',
  fontFamily: 'inherit',
}

const formLinkMeta: React.CSSProperties = {
  display: 'block',
  marginTop: 8,
  fontSize: 12,
  fontWeight: 600,
  color: assocDash.muted,
}

const createBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '11px 18px',
  borderRadius: assocDash.radiusMd,
  border: 'none',
  background: assocDash.gradient,
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
