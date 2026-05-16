import { useEffect, useMemo, useState } from 'react'
import { ListPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  emptyFieldDraft,
  filterFieldsForCampaignForm,
  filterFieldsForPositionForm,
  newLocalFormField,
  validateFieldDraft,
  type FormFieldDraft,
  type LocalFormField,
  type PositionOption,
} from '../../../utils/recruitmentFormFields'
import type { FormBuilderScope } from './RecruitmentApplicationFormBuilder'
import {
  addFieldBtn,
  empty,
  emptySub,
  emptyTitle,
  FieldEditor,
  FieldSummaryCard,
  FormBuilderSection,
} from './recruitmentApplicationFormBuilderUi'

type Props = {
  fields: LocalFormField[]
  onChange: (fields: LocalFormField[]) => void
  onEditingChange?: (editing: boolean) => void
  disabled?: boolean
  scope: FormBuilderScope
  positions: PositionOption[]
  compact?: boolean
}

function scopeDefaults(scope: FormBuilderScope): Partial<FormFieldDraft> {
  if (scope.type === 'campaign') return { positionId: null, positionKey: null }
  if (scope.positionId != null) return { positionId: scope.positionId, positionKey: null }
  return { positionId: null, positionKey: scope.positionKey ?? null }
}

function filterDraftByScope(fields: LocalFormField[], scope: FormBuilderScope): LocalFormField[] {
  if (scope.type === 'campaign') return filterFieldsForCampaignForm(fields)
  return filterFieldsForPositionForm(fields, {
    id: scope.positionId,
    key: scope.positionKey ?? (scope.positionId != null ? `pos-${scope.positionId}` : ''),
  })
}

export function RecruitmentApplicationFormBuilderDraft({
  fields,
  onChange,
  onEditingChange,
  disabled,
  scope,
  positions,
  compact,
}: Props) {
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [newDraft, setNewDraft] = useState<FormFieldDraft | null>(null)
  const [editDrafts, setEditDrafts] = useState<Record<string, FormFieldDraft>>({})

  useEffect(() => {
    onEditingChange?.(editingId != null)
  }, [editingId, onEditingChange])

  const sorted = useMemo(() => filterDraftByScope(fields, scope), [fields, scope])

  const sectionTitle =
    scope.type === 'campaign'
      ? 'Shared campaign application form'
      : `Application form — ${scope.positionTitle}`

  const reindex = (list: LocalFormField[]) =>
    list
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((f, i) => ({ ...f, displayOrder: i }))

  const startAdd = () => {
    setEditingId('new')
    const defaults = scopeDefaults(scope)
    if (scope.type === 'position' && scope.positionKey) {
      defaults.positionKey = scope.positionKey
    }
    setNewDraft(emptyFieldDraft(sorted.length, defaults))
  }

  const saveNew = () => {
    if (!newDraft) return
    const err = validateFieldDraft(newDraft, positions)
    if (err) {
      toast.error(err)
      return
    }
    onChange(reindex([...fields, { ...newDraft, clientId: newLocalFormField(newDraft.displayOrder).clientId }]))
    setNewDraft(null)
    setEditingId(null)
  }

  const saveEdit = (f: LocalFormField) => {
    const draft = editDrafts[f.clientId] ?? f
    const err = validateFieldDraft(draft, positions)
    if (err) {
      toast.error(err)
      return
    }
    onChange(
      reindex(fields.map((x) => (x.clientId === f.clientId ? { ...x, ...draft, clientId: x.clientId } : x))),
    )
    setEditingId(null)
    setEditDrafts((prev) => {
      const next = { ...prev }
      delete next[f.clientId]
      return next
    })
  }

  const remove = (clientId: string) => {
    if (!window.confirm('Remove this field from the application form?')) return
    onChange(reindex(fields.filter((f) => f.clientId !== clientId)))
    if (editingId === clientId) setEditingId(null)
  }

  const move = (index: number, direction: -1 | 1) => {
    const scoped = filterDraftByScope(fields, scope)
    const next = index + direction
    if (next < 0 || next >= scoped.length) return
    const list = [...scoped]
    const a = list[index]
    const b = list[next]
    list[index] = { ...b, displayOrder: a.displayOrder }
    list[next] = { ...a, displayOrder: b.displayOrder }
    const updatedIds = new Set(list.map((x) => x.clientId))
    const others = fields.filter((f) => !updatedIds.has(f.clientId))
    onChange(reindex([...others, ...list]))
  }

  const patchEdit = (clientId: string, patch: Partial<FormFieldDraft>) => {
    setEditDrafts((prev) => {
      const base = prev[clientId] ?? fields.find((x) => x.clientId === clientId)!
      return { ...prev, [clientId]: { ...base, ...patch } }
    })
  }

  const locked = disabled || editingId != null

  return (
    <FormBuilderSection
      compact={compact}
      title={sectionTitle}
      headerExtra={
        editingId !== 'new' ? (
          <button type="button" onClick={startAdd} style={addFieldBtn} disabled={locked}>
            <ListPlus size={18} />
            Add field
          </button>
        ) : null
      }
    >
      {sorted.length === 0 && editingId !== 'new' ? (
        <div style={empty}>
          <p style={emptyTitle}>
            {scope.type === 'campaign' ? 'No shared form fields yet' : 'No fields for this position yet'}
          </p>
          <p style={emptySub}>
            {scope.type === 'campaign'
              ? 'Add questions every applicant answers, or build position-specific forms under each role.'
              : 'Add fields unique to this role.'}
          </p>
          <button type="button" onClick={startAdd} style={addFieldBtn} disabled={disabled}>
            <ListPlus size={18} />
            Add first field
          </button>
        </div>
      ) : null}

      {sorted.map((f, index) => (
        <div key={f.clientId}>
          {editingId === f.clientId ? (
            <FieldEditor
              draft={editDrafts[f.clientId] ?? f}
              onChange={(patch) => patchEdit(f.clientId, patch)}
              onSave={() => saveEdit(f)}
              onCancel={() => setEditingId(null)}
              title={`Edit field ${index + 1}`}
              positions={positions}
              lockScope
            />
          ) : (
            <FieldSummaryCard
              field={f}
              index={index}
              total={sorted.length}
              positions={positions}
              onEdit={() => setEditingId(f.clientId)}
              onDelete={() => remove(f.clientId)}
              onMoveUp={() => move(index, -1)}
              onMoveDown={() => move(index, 1)}
              disabled={locked}
            />
          )}
        </div>
      ))}

      {editingId === 'new' && newDraft ? (
        <FieldEditor
          draft={newDraft}
          onChange={(patch) => setNewDraft({ ...newDraft, ...patch })}
          onSave={saveNew}
          onCancel={() => {
            setEditingId(null)
            setNewDraft(null)
          }}
          title="New form field"
          isNew
          positions={positions}
          lockScope
        />
      ) : null}
    </FormBuilderSection>
  )
}

export function validateNoOpenFormEditor(editing: boolean): boolean {
  if (editing) {
    toast.error('Save or cancel the form field you are editing before saving the campaign.')
    return false
  }
  return true
}
