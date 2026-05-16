import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowUp, ListPlus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  createEventRegistrationField,
  deleteEventRegistrationField,
  getEventRegistrationForm,
  parseApiErrorMessage,
  updateEventRegistrationField,
  updateEventRegistrationForm,
  type EventRegistrationField,
  type EventRegistrationForm,
} from '../../../api/eventRegistrationFormApi'
import {
  emptyEventFieldDraft,
  eventFieldDraftToPayload,
  eventFieldToDraft,
  eventFieldTypeLabel,
  eventFieldUsesOptions,
  eventFieldsToPreviewFields,
  EVENT_FORM_FIELD_TYPES,
  validateEventFieldDraft,
  type EventFieldDraft,
} from '../../../utils/eventRegistrationFormFields'
import { ApplicationFormPreview } from './ApplicationFormPreview'
import { assocCard, assocDash } from '../../pages/association/dashboard/associationDashTokens'

type Props = {
  eventId: number
  eventTitle: string
  form: EventRegistrationForm
  backTo: string
  backLabel?: string
  onFormChange?: (form: EventRegistrationForm) => void
}

type Selection = number | 'new' | null

export function EventRegistrationFormEditor({
  eventId,
  eventTitle,
  form: initialForm,
  backTo,
  backLabel = 'Back to event',
  onFormChange,
}: Props) {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selection, setSelection] = useState<Selection>(null)
  const [draft, setDraft] = useState<EventFieldDraft | null>(null)
  const [metaTitle, setMetaTitle] = useState(initialForm.title)
  const [metaDescription, setMetaDescription] = useState(initialForm.description ?? '')

  const fields = form.fields

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getEventRegistrationForm(eventId)
      if (data) {
        setForm(data)
        setMetaTitle(data.title)
        setMetaDescription(data.description ?? '')
        onFormChange?.(data)
      }
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [eventId, onFormChange])

  useEffect(() => {
    setForm(initialForm)
    setMetaTitle(initialForm.title)
    setMetaDescription(initialForm.description ?? '')
  }, [initialForm])

  useEffect(() => {
    if (selection === 'new') {
      setDraft(emptyEventFieldDraft(fields.length))
      return
    }
    if (typeof selection === 'number') {
      const f = fields.find((x) => x.id === selection)
      setDraft(f ? eventFieldToDraft(f) : null)
      return
    }
    setDraft(null)
  }, [selection, fields])

  const selectedId = typeof selection === 'number' ? selection : null
  const previewFields = eventFieldsToPreviewFields(fields)

  const saveMeta = async () => {
    if (!metaTitle.trim()) {
      toast.error('Form title is required.')
      return
    }
    setSaving(true)
    try {
      const updated = await updateEventRegistrationForm(eventId, {
        title: metaTitle.trim(),
        description: metaDescription.trim() || null,
      })
      setForm((f) => ({ ...updated, fields: f.fields }))
      onFormChange?.({ ...updated, fields: form.fields })
      toast.success('Form details saved')
    } catch (e) {
      toast.error(parseApiErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const saveField = async () => {
    if (!draft) return
    const err = validateEventFieldDraft(draft)
    if (err) {
      toast.error(err)
      return
    }
    setSaving(true)
    try {
      const payload = eventFieldDraftToPayload(draft)
      if (selection === 'new') {
        await createEventRegistrationField(eventId, payload)
        toast.success('Field added')
      } else if (typeof selection === 'number') {
        await updateEventRegistrationField(eventId, selection, payload)
        toast.success('Field saved')
      }
      await load()
      setSelection(null)
      setDraft(null)
    } catch (e) {
      toast.error(parseApiErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const removeField = async (id: number) => {
    if (!window.confirm('Remove this field from the registration form?')) return
    setSaving(true)
    try {
      await deleteEventRegistrationField(eventId, id)
      toast.success('Field removed')
      if (selection === id) {
        setSelection(null)
        setDraft(null)
      }
      await load()
    } catch (e) {
      toast.error(parseApiErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const moveField = async (index: number, direction: -1 | 1) => {
    const next = index + direction
    if (next < 0 || next >= fields.length) return
    const a = fields[index]
    const b = fields[next]
    setSaving(true)
    try {
      await Promise.all([
        updateEventRegistrationField(eventId, a.id, { displayOrder: b.displayOrder }),
        updateEventRegistrationField(eventId, b.id, { displayOrder: a.displayOrder }),
      ])
      await load()
    } catch (e) {
      toast.error(parseApiErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const title = eventTitle.trim() || 'Event'

  return (
    <div>
      <Link to={backTo} style={backLink}>
        <ArrowLeft size={16} />
        {backLabel}
      </Link>

      <header style={pageHeader}>
        <p style={eyebrow}>Registration form</p>
        <h1 style={pageTitle}>{title} registration form</h1>
        <p style={pageSub}>
          Design the form students will complete when registering. The preview shows exactly what
          applicants will see.
        </p>
      </header>

      <div style={{ ...assocCard, padding: 22, marginBottom: 24 }}>
        <h2 style={panelTitle}>Form details</h2>
        <label style={fieldLabel}>
          Form title *
          <input
            style={input}
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            disabled={saving}
          />
        </label>
        <label style={fieldLabel}>
          Form description
          <textarea
            style={{ ...input, minHeight: 72 }}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="Optional intro shown above the fields"
            disabled={saving}
          />
        </label>
        <button type="button" onClick={() => void saveMeta()} disabled={saving} style={metaSaveBtn}>
          {saving ? 'Saving…' : 'Save form details'}
        </button>
      </div>

      {loading ? (
        <p style={{ color: assocDash.muted, fontSize: 14 }}>Loading form…</p>
      ) : (
        <div style={workspace}>
          <section style={previewPanel}>
            <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <h2 style={panelTitle}>Live preview</h2>
              <span style={previewBadge}>Student view</span>
            </div>
            <div style={previewCanvas}>
              <ApplicationFormPreview
                fields={previewFields}
                title={metaTitle.trim() || 'Registration form'}
                selectedFieldId={selectedId}
                onFieldClick={(id) => setSelection(id)}
                interactive
              />
            </div>
          </section>

          <aside style={sidebar}>
            <div style={sidebarSticky}>
              {selection != null && draft ? (
                <FieldSettingsPanel
                  draft={draft}
                  onChange={(patch) => setDraft({ ...draft, ...patch })}
                  onSave={() => void saveField()}
                  onCancel={() => {
                    setSelection(null)
                    setDraft(null)
                  }}
                  onDelete={
                    typeof selection === 'number' ? () => void removeField(selection) : undefined
                  }
                  onMoveUp={
                    typeof selection === 'number'
                      ? () => {
                          const idx = fields.findIndex((f) => f.id === selection)
                          if (idx > 0) void moveField(idx, -1)
                        }
                      : undefined
                  }
                  onMoveDown={
                    typeof selection === 'number'
                      ? () => {
                          const idx = fields.findIndex((f) => f.id === selection)
                          if (idx >= 0 && idx < fields.length - 1) void moveField(idx, 1)
                        }
                      : undefined
                  }
                  saving={saving}
                  isNew={selection === 'new'}
                  canMoveUp={
                    typeof selection === 'number' && fields.findIndex((f) => f.id === selection) > 0
                  }
                  canMoveDown={
                    typeof selection === 'number' &&
                    fields.findIndex((f) => f.id === selection) < fields.length - 1
                  }
                />
              ) : (
                <div style={sidebarIdle}>
                  <h2 style={panelTitle}>Fields</h2>
                  <p style={sidebarHint}>
                    Click a field in the preview to edit it, or add a new field below.
                  </p>
                  {fields.length > 0 ? (
                    <ul style={fieldList}>
                      {fields
                        .slice()
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((f, index) => (
                          <li key={f.id}>
                            <button
                              type="button"
                              style={fieldListBtn}
                              onClick={() => setSelection(f.id)}
                            >
                              <span style={fieldListNum}>{index + 1}</span>
                              <span style={fieldListText}>
                                {f.label}
                                <span style={fieldListMeta}>
                                  {eventFieldTypeLabel(f.fieldType)}
                                  {f.isRequired ? ' · Required' : ''}
                                </span>
                              </span>
                            </button>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p style={emptyFields}>No fields yet — your form is empty.</p>
                  )}
                  <button type="button" onClick={() => setSelection('new')} style={addFieldBtn} disabled={saving}>
                    <ListPlus size={18} />
                    Add field
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

function FieldSettingsPanel({
  draft,
  onChange,
  onSave,
  onCancel,
  onDelete,
  onMoveUp,
  onMoveDown,
  saving,
  isNew,
  canMoveUp,
  canMoveDown,
}: {
  draft: EventFieldDraft
  onChange: (patch: Partial<EventFieldDraft>) => void
  onSave: () => void
  onCancel: () => void
  onDelete?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  saving?: boolean
  isNew?: boolean
  canMoveUp?: boolean
  canMoveDown?: boolean
}) {
  const usesOptions = eventFieldUsesOptions(draft.fieldType)

  return (
    <div style={settingsCard}>
      <h2 style={panelTitle}>{isNew ? 'New field' : 'Field settings'}</h2>
      <label style={fieldLabel}>
        Field label *
        <input
          style={input}
          value={draft.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="e.g. Dietary restrictions"
          disabled={saving}
        />
      </label>
      <label style={fieldLabel}>
        Field type *
        <select
          style={input}
          value={draft.fieldType}
          onChange={(e) =>
            onChange({
              fieldType: e.target.value,
              options: eventFieldUsesOptions(e.target.value) ? draft.options : ['', ''],
            })
          }
          disabled={saving}
        >
          {EVENT_FORM_FIELD_TYPES.map((t) => (
            <option key={t} value={t}>
              {eventFieldTypeLabel(t)}
            </option>
          ))}
        </select>
      </label>
      <label style={fieldLabel}>
        Help text
        <textarea
          style={{ ...input, minHeight: 72 }}
          value={draft.helpText}
          onChange={(e) => onChange({ helpText: e.target.value })}
          disabled={saving}
        />
      </label>
      <label style={fieldLabel}>
        Placeholder
        <input
          style={input}
          value={draft.placeholder}
          onChange={(e) => onChange({ placeholder: e.target.value })}
          disabled={saving}
        />
      </label>
      <label style={toggleRow}>
        <input
          type="checkbox"
          checked={draft.isRequired}
          onChange={(e) => onChange({ isRequired: e.target.checked })}
          disabled={saving}
        />
        <span>Required</span>
      </label>
      {usesOptions ? (
        <div style={{ marginBottom: 14 }}>
          <p style={optionsHead}>Answer options</p>
          {draft.options.map((opt, i) => (
            <div key={i} style={optionRow}>
              <span style={optNum}>{i + 1}</span>
              <input
                style={{ ...input, flex: 1 }}
                value={opt}
                onChange={(e) => {
                  const next = [...draft.options]
                  next[i] = e.target.value
                  onChange({ options: next })
                }}
                disabled={saving}
              />
              {draft.options.length > 2 ? (
                <button
                  type="button"
                  style={optRemove}
                  onClick={() => onChange({ options: draft.options.filter((_, j) => j !== i) })}
                  disabled={saving}
                >
                  ×
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            style={addOptBtn}
            onClick={() => onChange({ options: [...draft.options, ''] })}
            disabled={saving}
          >
            + Add option
          </button>
        </div>
      ) : null}
      {!isNew && onMoveUp && onMoveDown ? (
        <div style={reorderRow}>
          <button type="button" style={iconBtn} onClick={onMoveUp} disabled={saving || !canMoveUp}>
            <ArrowUp size={16} /> Up
          </button>
          <button type="button" style={iconBtn} onClick={onMoveDown} disabled={saving || !canMoveDown}>
            <ArrowDown size={16} /> Down
          </button>
        </div>
      ) : null}
      <div style={actionRow}>
        <button type="button" onClick={onSave} disabled={saving} style={primaryBtn}>
          {saving ? 'Saving…' : isNew ? 'Add to form' : 'Save field'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} style={ghostBtn}>
          Cancel
        </button>
      </div>
      {!isNew && onDelete ? (
        <button type="button" onClick={onDelete} disabled={saving} style={deleteBtn}>
          <Trash2 size={16} />
          Delete field
        </button>
      ) : null}
    </div>
  )
}

const backLink: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 20,
  fontSize: 13,
  fontWeight: 600,
  color: assocDash.accentDark,
  textDecoration: 'none',
}

const pageHeader: React.CSSProperties = { marginBottom: 28 }

const eyebrow: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  fontWeight: 700,
  color: assocDash.accent,
  textTransform: 'uppercase',
  letterSpacing: 0.6,
}

const pageTitle: React.CSSProperties = {
  margin: '8px 0 0',
  fontSize: 28,
  fontWeight: 800,
  fontFamily: assocDash.fontDisplay,
  color: assocDash.text,
  lineHeight: 1.2,
}

const pageSub: React.CSSProperties = {
  margin: '10px 0 0',
  fontSize: 15,
  color: assocDash.muted,
  lineHeight: 1.55,
  maxWidth: 720,
}

const workspace: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 360px)',
  gap: 24,
  alignItems: 'start',
}

const previewPanel: React.CSSProperties = {
  ...assocCard,
  padding: 0,
  overflow: 'hidden',
  minHeight: 480,
}

const panelTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 800,
  fontFamily: assocDash.fontDisplay,
  color: assocDash.text,
}

const previewBadge: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  padding: '4px 10px',
  borderRadius: 20,
  background: assocDash.accentMuted,
  color: assocDash.accentDark,
  border: `1px solid ${assocDash.accentBorder}`,
}

const previewCanvas: React.CSSProperties = {
  padding: 28,
  background: `linear-gradient(180deg, ${assocDash.bg} 0%, #fff 120px)`,
  minHeight: 400,
}

const sidebar: React.CSSProperties = { position: 'relative' }
const sidebarSticky: React.CSSProperties = { position: 'sticky', top: 16 }
const sidebarIdle: React.CSSProperties = { ...assocCard, padding: 22 }
const sidebarHint: React.CSSProperties = {
  margin: '8px 0 16px',
  fontSize: 13,
  color: assocDash.muted,
  lineHeight: 1.5,
}
const settingsCard: React.CSSProperties = { ...assocCard, padding: 22, borderColor: assocDash.accentBorder }
const fieldList: React.CSSProperties = { listStyle: 'none', margin: '0 0 16px', padding: 0, display: 'grid', gap: 8 }
const fieldListBtn: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  padding: '12px 14px',
  borderRadius: 12,
  border: `1px solid ${assocDash.border}`,
  background: '#fff',
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'left',
}
const fieldListNum: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 6,
  background: assocDash.accentMuted,
  color: assocDash.accentDark,
  fontSize: 12,
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}
const fieldListText: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 14,
  fontWeight: 700,
  color: assocDash.text,
}
const fieldListMeta: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: assocDash.muted,
}
const emptyFields: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: 13,
  color: assocDash.muted,
  fontStyle: 'italic',
}
const addFieldBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  padding: '12px 16px',
  borderRadius: assocDash.radiusMd,
  border: 'none',
  background: assocDash.gradient,
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
const fieldLabel: React.CSSProperties = {
  display: 'block',
  marginBottom: 14,
  fontSize: 13,
  fontWeight: 600,
  color: assocDash.text,
}
const input: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 8,
  padding: '10px 12px',
  borderRadius: 10,
  border: `1.5px solid ${assocDash.border}`,
  fontSize: 14,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}
const metaSaveBtn: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: assocDash.radiusMd,
  border: 'none',
  background: assocDash.gradient,
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
const toggleRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 14,
  fontSize: 14,
  fontWeight: 600,
}
const optionsHead: React.CSSProperties = { margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: assocDash.text }
const optionRow: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }
const optNum: React.CSSProperties = {
  width: 20,
  fontSize: 12,
  fontWeight: 800,
  color: assocDash.muted,
  textAlign: 'center',
}
const optRemove: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #fecaca',
  borderRadius: 6,
  background: '#fff',
  color: '#b91c1c',
  cursor: 'pointer',
  fontFamily: 'inherit',
}
const addOptBtn: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: `1px dashed ${assocDash.border}`,
  background: assocDash.bg,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  width: '100%',
}
const reorderRow: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 14 }
const iconBtn: React.CSSProperties = {
  flex: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '8px 10px',
  borderRadius: 8,
  border: `1px solid ${assocDash.border}`,
  background: '#fff',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
const actionRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }
const primaryBtn: React.CSSProperties = {
  flex: 1,
  padding: '11px 16px',
  borderRadius: assocDash.radiusMd,
  border: 'none',
  background: assocDash.gradient,
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
const ghostBtn: React.CSSProperties = {
  padding: '11px 16px',
  borderRadius: assocDash.radiusMd,
  border: `1px solid ${assocDash.border}`,
  background: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
const deleteBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  marginTop: 12,
  padding: '10px',
  borderRadius: 10,
  border: '1px solid #fecaca',
  background: '#fff',
  color: '#b91c1c',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
