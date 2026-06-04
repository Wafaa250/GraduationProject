import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlignLeft,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Calendar,
  CheckSquare,
  CircleDot,
  Eye,
  GripVertical,
  Hash,
  Link2,
  List,
  Mail,
  Paperclip,
  Phone,
  Plus,
  Save,
  Send,
  ToggleLeft,
  Trash2,
  Type,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  createEventRegistrationField,
  deleteEventRegistrationField,
  getEventRegistrationForm,
  parseApiErrorMessage,
  updateEventRegistrationField,
  updateEventRegistrationForm,
  type EventRegistrationForm,
} from '@/api/eventRegistrationFormApi'
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
} from '@/utils/eventRegistrationFormFields'
import { ApplicationFormPreview } from './ApplicationFormPreview'
import { assocDash } from '@/pages/association/dashboard/associationDashTokens'
import '@/styles/association-registration-form-builder.css'

type Props = {
  eventId: number
  eventTitle: string
  form: EventRegistrationForm
  backTo: string
  backLabel?: string
  onFormChange?: (form: EventRegistrationForm) => void
}

type Selection = number | 'new' | null

const sp = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 } as const

function formatLastSaved(date: Date | null): string {
  if (!date) return 'Not saved yet'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

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
  const [hoveredFieldId, setHoveredFieldId] = useState<number | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    initialForm.updatedAt ? new Date(initialForm.updatedAt) : null,
  )

  const fields = form.fields
  const sortedFields = fields.slice().sort((a, b) => a.displayOrder - b.displayOrder)
  const eventName = eventTitle.trim() || 'Event'
  const requiredCount = fields.filter((f) => f.isRequired).length
  const metaDirty =
    metaTitle.trim() !== form.title.trim() ||
    (metaDescription.trim() || '') !== (form.description?.trim() || '')
  const isPublished = fields.length > 0 && !metaDirty && lastSavedAt != null
  const formStatus: 'draft' | 'published' = isPublished ? 'published' : 'draft'
  const formTitle = metaTitle.trim() || 'Registration form'

  useEffect(() => {
    if (previewMode) {
      setSelection(null)
      setDraft(null)
      setHoveredFieldId(null)
    }
  }, [previewMode])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getEventRegistrationForm(eventId)
      if (data) {
        setForm(data)
        setMetaTitle(data.title)
        setMetaDescription(data.description ?? '')
        setLastSavedAt(data.updatedAt ? new Date(data.updatedAt) : null)
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

  const openAddField = () => {
    setPreviewMode(false)
    setSelection('new')
  }

  const deselectField = () => {
    setSelection(null)
    setDraft(null)
  }

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
      setLastSavedAt(updated.updatedAt ? new Date(updated.updatedAt) : new Date())
      toast.success('Draft saved')
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
      deselectField()
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
      if (selection === id) deselectField()
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

  const duplicateField = async (id: number) => {
    const f = fields.find((x) => x.id === id)
    if (!f) return
    const copy = eventFieldToDraft(f)
    copy.label = f.label.trim() ? `${f.label.trim()} (copy)` : 'Copy'
    copy.displayOrder = fields.length
    setSaving(true)
    try {
      await createEventRegistrationField(eventId, eventFieldDraftToPayload(copy))
      toast.success('Field duplicated')
      await load()
    } catch (e) {
      toast.error(parseApiErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const publishForm = async () => {
    if (!metaTitle.trim()) {
      toast.error('Form title is required.')
      return
    }
    if (fields.length === 0) {
      toast.error('Add at least one question before publishing.')
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
      setLastSavedAt(updated.updatedAt ? new Date(updated.updatedAt) : new Date())
      toast.success('Registration form published — students will complete this when registering.')
    } catch (e) {
      toast.error(parseApiErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="event-reg-form-builder" style={builderRoot}>
      {previewMode ? (
        <>
          <header className="erf-builder-preview-bar" style={previewTopBar}>
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className="erf-toolbar-ghost"
              style={previewExitBtn}
            >
              <ArrowLeft size={16} />
              Exit preview
            </button>
            <div style={{ minWidth: 0 }}>
              <p style={previewTopBarEyebrow}>Student registration preview</p>
              <p style={previewTopBarEvent}>{eventName}</p>
            </div>
          </header>
          <div className="erf-builder-preview-scroll" style={previewModeScroll}>
            {loading ? (
              <div style={previewModeLoading}>
                <p style={{ color: assocDash.muted, fontSize: 14 }}>Loading form…</p>
              </div>
            ) : (
              <div style={previewModeInner}>
                <ApplicationFormPreview
                  fields={previewFields}
                  title={metaTitle.trim() || 'Registration form'}
                  description={metaDescription.trim() || null}
                  builderMode
                  previewOnly
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <header className="erf-builder-topbar" style={topBar}>
            <div style={topBarLeft}>
              <Link to={backTo} style={backLink}>
                <ArrowLeft size={16} />
                {backLabel}
              </Link>
              <div style={topBarDivider} />
              <div style={{ minWidth: 0 }}>
                <div style={topBarTitleRow}>
                  <h1 style={topBarTitle}>{formTitle}</h1>
                  <FormStatusBadge status={formStatus} />
                </div>
                <p style={topBarSub}>{eventName}</p>
              </div>
            </div>

            <div style={topBarActions}>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className="erf-toolbar-ghost"
                style={toolbarGhostBtn}
              >
                <Eye size={16} />
                Preview form
              </button>
              <button
                type="button"
                onClick={() => void saveMeta()}
                disabled={saving}
                className="erf-toolbar-ghost"
                style={toolbarGhostBtn}
              >
                <Save size={16} />
                Save draft
              </button>
              <button
                type="button"
                onClick={openAddField}
                className="erf-toolbar-add"
                style={addFieldTopBtn}
                disabled={saving}
              >
                <Plus size={18} strokeWidth={2.5} />
                Add field
              </button>
              <button
                type="button"
                onClick={() => void publishForm()}
                disabled={saving}
                className="erf-toolbar-publish"
                style={publishBtn}
              >
                <Send size={16} />
                Publish form
              </button>
            </div>
          </header>

          {loading ? (
            <div style={loadingWrap}>
              <p style={{ color: assocDash.muted, fontSize: 14 }}>Loading form…</p>
            </div>
          ) : (
            <div className="erf-builder-workspace" style={workspace}>
          <nav className="erf-builder-rail" style={fieldRail} aria-label="Form fields">
            <div className="erf-rail-header" style={railHeader}>
              <span style={railTitle}>Questions</span>
              <span className="erf-rail-count" style={railCount}>{fields.length}</span>
            </div>
            <div className="erf-rail-list" style={railList}>
              {sortedFields.length === 0 ? (
                <div className="erf-rail-empty" style={railEmpty}>
                  <p style={{ margin: 0, fontSize: 12, color: assocDash.subtle, lineHeight: 1.5 }}>
                    Questions you add will appear here and on the student registration form.
                  </p>
                </div>
              ) : (
                sortedFields.map((f, index) => {
                  const selected = selectedId === f.id
                  const hovered = hoveredFieldId === f.id
                  return (
                    <button
                      key={f.id}
                      type="button"
                      className={`erf-rail-item${selected ? ' erf-rail-item--selected' : ''}`}
                      style={{
                        ...railItem,
                        ...(selected ? railItemSelected : {}),
                        ...(hovered && !selected ? railItemHover : {}),
                      }}
                      onClick={() => setSelection(f.id)}
                      onMouseEnter={() => setHoveredFieldId(f.id)}
                      onMouseLeave={() => setHoveredFieldId(null)}
                    >
                      <GripVertical size={14} color={assocDash.subtle} style={{ flexShrink: 0 }} />
                      <FieldTypeIcon type={f.fieldType} />
                      <span className="erf-rail-item-body" style={railItemBody}>
                        <span className="erf-rail-item-label" style={railItemLabel}>{f.label}</span>
                        <span className="erf-rail-item-meta" style={railItemMeta}>
                          {eventFieldTypeLabel(f.fieldType)}
                          {f.isRequired ? ' · Required' : ''}
                        </span>
                      </span>
                      <span style={railOrder}>{index + 1}</span>
                    </button>
                  )
                })
              )}
            </div>
          </nav>

          <section className="erf-builder-canvas" style={canvasZone} aria-label="Registration form canvas">
            <div style={canvasInner}>
              <ApplicationFormPreview
                fields={previewFields}
                title={metaTitle.trim() || 'Registration form'}
                description={metaDescription.trim() || null}
                builderMode
                selectedFieldId={selectedId}
                hoveredFieldId={hoveredFieldId}
                onFieldHover={setHoveredFieldId}
                onFieldClick={(id) => setSelection(id)}
                onFieldEdit={(id) => setSelection(id)}
                onFieldDuplicate={(id) => void duplicateField(id)}
                onFieldDelete={(id) => void removeField(id)}
                onAddField={openAddField}
                interactive
              />
            </div>
          </section>

          <aside className="erf-builder-inspector" style={inspectorPanel} aria-label="Properties">
            {selection != null && draft ? (
              <FieldInspector
                draft={draft}
                onChange={(patch) => setDraft({ ...draft, ...patch })}
                onSave={() => void saveField()}
                onClose={deselectField}
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
              <FormPropertiesPanel
                metaTitle={metaTitle}
                metaDescription={metaDescription}
                fieldCount={fields.length}
                requiredCount={requiredCount}
                metaDirty={metaDirty}
                lastSavedAt={lastSavedAt}
                onTitleChange={setMetaTitle}
                onDescriptionChange={setMetaDescription}
                onSave={() => void saveMeta()}
                saving={saving}
              />
            )}
          </aside>
        </div>
          )}
        </>
      )}
    </div>
  )
}

function FormStatusBadge({ status }: { status: 'draft' | 'published' }) {
  const isPublished = status === 'published'
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: '4px 10px',
        borderRadius: 999,
        letterSpacing: '0.03em',
        flexShrink: 0,
        ...(isPublished
          ? { background: assocDash.successMuted, color: assocDash.success, border: `1px solid ${assocDash.successBorder}` }
          : { background: assocDash.bg, color: assocDash.muted, border: `1px solid ${assocDash.border}` }),
      }}
    >
      {isPublished ? 'Published' : 'Draft'}
    </span>
  )
}

function FormPropertiesPanel({
  metaTitle,
  metaDescription,
  fieldCount,
  requiredCount,
  metaDirty,
  lastSavedAt,
  onTitleChange,
  onDescriptionChange,
  onSave,
  saving,
}: {
  metaTitle: string
  metaDescription: string
  fieldCount: number
  requiredCount: number
  metaDirty: boolean
  lastSavedAt: Date | null
  onTitleChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onSave: () => void
  saving?: boolean
}) {
  return (
    <div className="erf-inspector-shell" style={inspectorShell}>
      <div className="erf-inspector-head" style={inspectorHead}>
        <div style={{ minWidth: 0 }}>
          <h2 style={inspectorHeadTitle}>Registration form</h2>
          <p style={inspectorHeadSub}>Settings shown to students before they answer questions</p>
        </div>
      </div>
      <div className="erf-inspector-body" style={inspectorBody}>
        <div className="erf-form-summary-card" style={formSummaryCard}>
          <p style={formSummaryStat}>
            <strong>{fieldCount}</strong> question{fieldCount === 1 ? '' : 's'}
            <span style={formSummaryDot}> · </span>
            <strong>{requiredCount}</strong> required
          </p>
          <p style={formSummaryMeta}>
            {metaDirty
              ? 'Unsaved changes'
              : lastSavedAt
                ? `Saved ${formatLastSaved(lastSavedAt)}`
                : formatLastSaved(null)}
          </p>
        </div>
        <p style={sectionTag}>Form intro</p>
        <label className="erf-inspector-label" style={label}>
          Title
          <input
            className="erf-inspector-input"
            style={input}
            value={metaTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Registration form"
            disabled={saving}
          />
        </label>
        <label className="erf-inspector-label" style={label}>
          Description
          <textarea
            className="erf-inspector-input"
            style={{ ...input, minHeight: 88, resize: 'vertical' as const }}
            value={metaDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Brief intro students read before registering"
            disabled={saving}
          />
        </label>
        <p style={propertiesHint}>
          Select a question on the canvas to edit its label, placeholder, help text, and validation.
        </p>
      </div>
      <div className="erf-inspector-foot" style={inspectorFoot}>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="erf-inspector-primary"
          style={inspectorPrimaryBtn}
        >
          {saving ? 'Saving…' : 'Save form settings'}
        </button>
      </div>
    </div>
  )
}

function FieldInspector({
  draft,
  onChange,
  onSave,
  onClose,
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
  onClose: () => void
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
    <div className="erf-inspector-shell" style={inspectorShell}>
      <InspectorHeader
        title={isNew ? 'New question' : 'Question properties'}
        subtitle={isNew ? 'Add to the student registration form' : draft.label.trim() || 'Untitled question'}
        onClose={onClose}
      />
      <div className="erf-inspector-body" style={inspectorBody}>
        <p style={sectionTag}>Question</p>
        <label className="erf-inspector-label" style={label}>
          Label
          <input
            className="erf-inspector-input"
            style={input}
            value={draft.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="e.g. Full name"
            disabled={saving}
          />
        </label>
        <label className="erf-inspector-label" style={label}>
          Type
          <select
            className="erf-inspector-input erf-inspector-select"
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
        <label className="erf-inspector-check" style={checkLabel}>
          <input
            type="checkbox"
            checked={draft.isRequired}
            onChange={(e) => onChange({ isRequired: e.target.checked })}
            disabled={saving}
          />
          Required question
        </label>

        <p style={{ ...sectionTag, marginTop: sp.lg }}>Display</p>
        <label className="erf-inspector-label" style={label}>
          Help text
          <textarea
            className="erf-inspector-input"
            style={{ ...input, minHeight: 64, resize: 'vertical' as const }}
            value={draft.helpText}
            onChange={(e) => onChange({ helpText: e.target.value })}
            placeholder="Shown below the label"
            disabled={saving}
          />
        </label>
        <label className="erf-inspector-label" style={label}>
          Placeholder
          <input
            className="erf-inspector-input"
            style={input}
            value={draft.placeholder}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            disabled={saving}
          />
        </label>

        {usesOptions ? (
          <>
            <p style={{ ...sectionTag, marginTop: sp.lg }}>Options</p>
            {draft.options.map((opt, i) => (
              <div key={i} style={optionRow}>
                <span style={optNum}>{i + 1}</span>
                <input
                  className="erf-inspector-input"
                  style={{ ...input, flex: 1, marginTop: 0 }}
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
                    className="erf-opt-remove"
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
              className="erf-add-opt"
              style={addOptBtn}
              onClick={() => onChange({ options: [...draft.options, ''] })}
              disabled={saving}
            >
              + Add option
            </button>
          </>
        ) : null}

        {!isNew && onMoveUp && onMoveDown ? (
          <>
            <p style={{ ...sectionTag, marginTop: sp.lg }}>Order</p>
            <div style={reorderRow}>
              <button
                type="button"
                className="erf-reorder-btn"
                style={reorderBtn}
                onClick={onMoveUp}
                disabled={saving || !canMoveUp}
              >
                <ArrowUp size={15} /> Up
              </button>
              <button
                type="button"
                className="erf-reorder-btn"
                style={reorderBtn}
                onClick={onMoveDown}
                disabled={saving || !canMoveDown}
              >
                <ArrowDown size={15} /> Down
              </button>
            </div>
          </>
        ) : null}
      </div>
      <InspectorFooter
        primaryLabel={saving ? 'Saving…' : isNew ? 'Add to form' : 'Save field'}
        onPrimary={onSave}
        onCancel={onClose}
        onDelete={!isNew ? onDelete : undefined}
        saving={saving}
      />
    </div>
  )
}

function InspectorHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string
  subtitle: string
  onClose: () => void
}) {
  return (
    <div className="erf-inspector-head" style={inspectorHead}>
      <div style={{ minWidth: 0 }}>
        <h2 style={inspectorHeadTitle}>{title}</h2>
        <p style={inspectorHeadSub}>{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="erf-inspector-close"
        style={closeBtn}
        aria-label="Close panel"
      >
        <X size={18} />
      </button>
    </div>
  )
}

function InspectorFooter({
  primaryLabel,
  onPrimary,
  onCancel,
  onDelete,
  saving,
}: {
  primaryLabel: string
  onPrimary: () => void
  onCancel: () => void
  onDelete?: () => void
  saving?: boolean
}) {
  return (
    <div className="erf-inspector-foot" style={inspectorFoot}>
      <button
        type="button"
        onClick={onPrimary}
        disabled={saving}
        className="erf-inspector-primary"
        style={inspectorPrimaryBtn}
      >
        {primaryLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="erf-inspector-ghost"
        style={inspectorGhostBtn}
      >
        Cancel
      </button>
      {onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          disabled={saving}
          className="erf-inspector-delete"
          style={inspectorDeleteBtn}
        >
          <Trash2 size={15} />
          Delete
        </button>
      ) : null}
    </div>
  )
}

function FieldTypeIcon({ type }: { type: string }) {
  const p = { size: 14, strokeWidth: 2, color: assocDash.accentDark }
  switch (type) {
    case 'Paragraph':
      return <AlignLeft {...p} />
    case 'MultipleChoice':
      return <CircleDot {...p} />
    case 'CheckboxList':
      return <CheckSquare {...p} />
    case 'Dropdown':
      return <List {...p} />
    case 'Email':
      return <Mail {...p} />
    case 'Phone':
      return <Phone {...p} />
    case 'Url':
    case 'Link':
      return <Link2 {...p} />
    case 'Number':
      return <Hash {...p} />
    case 'Date':
      return <Calendar {...p} />
    case 'YesNo':
      return <ToggleLeft {...p} />
    case 'FileUploadPlaceholder':
    case 'FileUpload':
      return <Paperclip {...p} />
    default:
      return <Type {...p} />
  }
}

const topBarSub: React.CSSProperties = {
  margin: `${sp.xs}px 0 0`,
  fontSize: 13,
  color: assocDash.subtle,
  lineHeight: 1.45,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const topBarTitleRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  minWidth: 0,
}

const formSummaryMeta: React.CSSProperties = {
  margin: `${sp.xs}px 0 0`,
  fontSize: 12,
  color: assocDash.subtle,
  lineHeight: 1.45,
}

const formSummaryDot: React.CSSProperties = {
  color: assocDash.subtle,
  fontWeight: 400,
}

const toolbarGhostBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 12px',
  borderRadius: 10,
  border: `1px solid ${assocDash.border}`,
  background: '#fff',
  fontSize: 13,
  fontWeight: 600,
  color: assocDash.textSecondary,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const publishBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  borderRadius: 10,
  border: 'none',
  background: assocDash.text,
  color: '#fff',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const previewTopBar: React.CSSProperties = {
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: sp.lg,
  padding: `${sp.md}px ${sp.xl}px`,
  background: '#fff',
  borderBottom: `1px solid ${assocDash.border}`,
}

const previewExitBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 12px',
  borderRadius: 10,
  border: `1px solid ${assocDash.border}`,
  background: '#fff',
  fontSize: 13,
  fontWeight: 600,
  color: assocDash.textSecondary,
  cursor: 'pointer',
  fontFamily: 'inherit',
  flexShrink: 0,
}

const previewTopBarEyebrow: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  color: assocDash.subtle,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const previewTopBarEvent: React.CSSProperties = {
  margin: `${sp.xs}px 0 0`,
  fontSize: 14,
  fontWeight: 600,
  color: assocDash.text,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const previewModeScroll: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f6 100%)',
}

const previewModeInner: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  width: '100%',
  maxWidth: 720,
  margin: '0 auto',
  padding: `${sp.xl}px ${sp.lg}px 56px`,
  boxSizing: 'border-box',
}

const previewModeLoading: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 200,
}

const builderRoot: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
  overflow: 'hidden',
  background: '#f1f5f9',
}

const formSummaryStat: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: assocDash.muted,
}

const propertiesHint: React.CSSProperties = {
  margin: `${sp.sm}px 0 0`,
  fontSize: 12,
  color: assocDash.subtle,
  lineHeight: 1.5,
}

const formSummaryCard: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: sp.xs,
  padding: sp.md,
  marginBottom: sp.lg,
  borderRadius: 12,
  background: '#f8fafc',
  border: `1px solid ${assocDash.border}`,
}

const topBar: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: sp.lg,
  padding: `${sp.md}px ${sp.xl}px`,
  background: '#fff',
  borderBottom: `1px solid ${assocDash.border}`,
  flexShrink: 0,
}

const topBarLeft: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: sp.lg,
  minWidth: 0,
}

const backLink: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
  color: assocDash.accentDark,
  textDecoration: 'none',
  flexShrink: 0,
}

const topBarDivider: React.CSSProperties = {
  width: 1,
  height: 36,
  background: assocDash.border,
  flexShrink: 0,
}

const topBarTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 800,
  fontFamily: assocDash.fontDisplay,
  color: assocDash.text,
  letterSpacing: '-0.025em',
  lineHeight: 1.15,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
}

const topBarActions: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  marginLeft: 'auto',
}

const addFieldTopBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '9px 16px',
  borderRadius: 10,
  border: 'none',
  background: assocDash.gradient,
  color: '#fff',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.28)',
}

const loadingWrap: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const workspace: React.CSSProperties = {
  flex: 1,
  display: 'grid',
  gridTemplateColumns: 'minmax(200px, 22fr) minmax(0, 58fr) minmax(260px, 20fr)',
  minHeight: 0,
  overflow: 'hidden',
}

const fieldRail: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: '#fff',
  borderRight: `1px solid ${assocDash.border}`,
  minHeight: 0,
}

const railHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${sp.md}px ${sp.lg}px`,
  borderBottom: `1px solid ${assocDash.border}`,
  flexShrink: 0,
}

const railTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: assocDash.text,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const railCount: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: assocDash.subtle,
  padding: '2px 7px',
  borderRadius: 6,
  background: '#f1f5f9',
}

const railList: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: sp.sm,
  display: 'flex',
  flexDirection: 'column',
  gap: sp.xs,
}

const railEmpty: React.CSSProperties = {
  padding: sp.lg,
  margin: sp.sm,
  borderRadius: 12,
  border: `1.5px dashed ${assocDash.border}`,
  background: '#fafbfc',
}

const railItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  width: '100%',
  padding: `${sp.sm}px ${sp.sm}px`,
  borderRadius: 10,
  border: '1.5px solid transparent',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'left',
  transition: 'background 0.15s, border-color 0.15s',
}

const railItemHover: React.CSSProperties = {
  background: '#f8fafc',
  borderColor: assocDash.border,
}

const railItemSelected: React.CSSProperties = {
  background: assocDash.accentMuted,
  borderColor: assocDash.accent,
  boxShadow: '0 0 0 2px rgba(245, 158, 11, 0.1)',
}

const railItemBody: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}

const railItemLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: assocDash.text,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const railItemMeta: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: assocDash.subtle,
}

const railOrder: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: assocDash.subtle,
  flexShrink: 0,
}

const canvasZone: React.CSSProperties = {
  overflow: 'auto',
  background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f6 100%)',
  display: 'flex',
  justifyContent: 'center',
  padding: '40px 32px 56px',
}

const canvasInner: React.CSSProperties = {
  width: '100%',
  maxWidth: 680,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: sp.lg,
}

const inspectorPanel: React.CSSProperties = {
  background: '#fff',
  borderLeft: `1px solid ${assocDash.border}`,
  minHeight: 0,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}

const inspectorShell: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
}

const inspectorHead: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: sp.md,
  padding: `${sp.lg}px ${sp.lg}px ${sp.md}px`,
  borderBottom: `1px solid ${assocDash.border}`,
  flexShrink: 0,
}

const inspectorHeadTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  fontWeight: 800,
  fontFamily: assocDash.fontDisplay,
  color: assocDash.text,
}

const inspectorHeadSub: React.CSSProperties = {
  margin: `${sp.xs}px 0 0`,
  fontSize: 12,
  color: assocDash.subtle,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const closeBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: 8,
  border: `1px solid ${assocDash.border}`,
  background: '#fff',
  color: assocDash.muted,
  cursor: 'pointer',
  fontFamily: 'inherit',
  flexShrink: 0,
}

const inspectorBody: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: sp.lg,
}

const inspectorFoot: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: sp.sm,
  padding: sp.lg,
  borderTop: `1px solid ${assocDash.border}`,
  background: '#fafbfc',
  flexShrink: 0,
}

const inspectorPrimaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: sp.sm,
  width: '100%',
  maxWidth: 240,
  padding: '11px 16px',
  borderRadius: 10,
  border: 'none',
  background: assocDash.gradient,
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.22)',
}

const inspectorGhostBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '10px 16px',
  borderRadius: 10,
  border: `1px solid ${assocDash.border}`,
  background: '#fff',
  fontSize: 13,
  fontWeight: 600,
  color: assocDash.textSecondary,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const inspectorDeleteBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  marginLeft: 'auto',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #fecaca',
  background: '#fff',
  color: '#b91c1c',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const sectionTag: React.CSSProperties = {
  margin: `0 0 ${sp.sm}px`,
  fontSize: 10,
  fontWeight: 700,
  color: assocDash.subtle,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

const label: React.CSSProperties = {
  display: 'block',
  marginBottom: sp.md,
  fontSize: 12,
  fontWeight: 600,
  color: assocDash.textSecondary,
}

const checkLabel: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  marginBottom: sp.md,
  fontSize: 13,
  fontWeight: 600,
  color: assocDash.textSecondary,
}

const input: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: sp.xs,
  padding: '10px 12px',
  borderRadius: 10,
  border: `1.5px solid ${assocDash.border}`,
  fontSize: 14,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  background: '#fff',
}

const optionRow: React.CSSProperties = {
  display: 'flex',
  gap: sp.sm,
  alignItems: 'center',
  marginBottom: sp.sm,
}

const optNum: React.CSSProperties = {
  width: 18,
  fontSize: 11,
  fontWeight: 800,
  color: assocDash.subtle,
  textAlign: 'center',
  flexShrink: 0,
}

const optRemove: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #fecaca',
  borderRadius: 8,
  background: '#fff',
  color: '#b91c1c',
  cursor: 'pointer',
  fontFamily: 'inherit',
  flexShrink: 0,
}

const addOptBtn: React.CSSProperties = {
  padding: '9px 12px',
  borderRadius: 10,
  border: `1.5px dashed ${assocDash.border}`,
  background: '#fafbfc',
  fontSize: 13,
  fontWeight: 600,
  color: assocDash.muted,
  cursor: 'pointer',
  fontFamily: 'inherit',
  width: '100%',
}

const reorderRow: React.CSSProperties = { display: 'flex', gap: sp.sm }

const reorderBtn: React.CSSProperties = {
  flex: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '9px 10px',
  borderRadius: 10,
  border: `1px solid ${assocDash.border}`,
  background: '#fff',
  fontSize: 12,
  fontWeight: 600,
  color: assocDash.textSecondary,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
