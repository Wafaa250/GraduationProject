import { useCallback, useEffect, useMemo, useState } from 'react'

import { ListPlus } from 'lucide-react'

import toast from 'react-hot-toast'

import {

  createRecruitmentCampaignQuestion,

  deleteRecruitmentCampaignQuestion,

  listRecruitmentCampaignQuestions,

  parseApiErrorMessage,

  updateRecruitmentCampaignQuestion,

  type RecruitmentQuestion,

} from '../../../api/recruitmentCampaignsApi'

import {

  draftToPayload,

  emptyFieldDraft,

  fieldToDraft,

  filterFieldsForCampaignForm,

  filterFieldsForPositionForm,

  validateFieldDraft,

  type FormFieldDraft,

  type PositionOption,

} from '../../../utils/recruitmentFormFields'

import { assocDash } from '../../pages/association/dashboard/associationDashTokens'

import {

  addFieldBtn,

  empty,

  emptySub,

  emptyTitle,

  FieldEditor,

  FieldSummaryCard,

  FormBuilderSection,

} from './recruitmentApplicationFormBuilderUi'



export type FormBuilderScope =
  | { type: 'campaign' }
  | {
      type: 'position'
      positionTitle: string
      positionId?: number
      positionKey?: string
    }



type Props = {

  campaignId: number

  scope: FormBuilderScope

  positions: PositionOption[]

  embedded?: boolean

  compact?: boolean

}



function scopeDefaults(scope: FormBuilderScope): Partial<FormFieldDraft> {
  if (scope.type === 'campaign') return { positionId: null, positionKey: null }
  if (scope.positionId != null) return { positionId: scope.positionId, positionKey: null }
  return { positionId: null, positionKey: scope.positionKey ?? null }
}



function filterByScope(fields: RecruitmentQuestion[], scope: FormBuilderScope): RecruitmentQuestion[] {

  if (scope.type === 'campaign') return filterFieldsForCampaignForm(fields) as RecruitmentQuestion[]

  return filterFieldsForPositionForm(fields, {
    id: scope.positionId,
    key: scope.positionKey ?? (scope.positionId != null ? `pos-${scope.positionId}` : ''),
  })

}



export function RecruitmentApplicationFormBuilder({

  campaignId,

  scope,

  positions,

  embedded,

  compact,

}: Props) {

  const [allFields, setAllFields] = useState<RecruitmentQuestion[]>([])

  const [loading, setLoading] = useState(true)

  const [editingId, setEditingId] = useState<number | 'new' | null>(null)

  const [newDraft, setNewDraft] = useState<FormFieldDraft | null>(null)

  const [editDrafts, setEditDrafts] = useState<Record<number, FormFieldDraft>>({})

  const [saving, setSaving] = useState(false)

  const [deletingId, setDeletingId] = useState<number | null>(null)



  const load = useCallback(async () => {

    setLoading(true)

    try {

      const data = await listRecruitmentCampaignQuestions(campaignId)

      setAllFields(data)

      setEditDrafts({})

    } catch (err) {

      toast.error(parseApiErrorMessage(err))

    } finally {

      setLoading(false)

    }

  }, [campaignId])



  useEffect(() => {

    void load()

  }, [load])



  const sorted = useMemo(() => filterByScope(allFields, scope), [allFields, scope])



  const sectionTitle =

    scope.type === 'campaign'

      ? 'Shared campaign application form'

      : `Application form — ${scope.positionTitle}`



  const sectionSubtitle =

    scope.type === 'campaign'

      ? 'Fields here apply to every position. Students also see any position-specific fields you add below.'

      : 'Fields only for this role, plus the shared campaign form when students apply.'



  const startAdd = () => {

    setEditingId('new')

    setNewDraft(emptyFieldDraft(sorted.length, scopeDefaults(scope)))

  }



  const saveNew = async () => {

    if (!newDraft) return

    const err = validateFieldDraft(newDraft, positions)

    if (err) {

      toast.error(err)

      return

    }

    setSaving(true)

    try {

      await createRecruitmentCampaignQuestion(campaignId, draftToPayload(newDraft))

      toast.success('Form field added')

      setNewDraft(null)

      setEditingId(null)

      await load()

    } catch (e) {

      toast.error(parseApiErrorMessage(e))

    } finally {

      setSaving(false)

    }

  }



  const saveEdit = async (f: RecruitmentQuestion) => {

    const draft = editDrafts[f.id] ?? fieldToDraft(f)

    const err = validateFieldDraft(draft, positions)

    if (err) {

      toast.error(err)

      return

    }

    setSaving(true)

    try {

      await updateRecruitmentCampaignQuestion(campaignId, f.id, draftToPayload(draft))

      toast.success('Form field saved')

      setEditingId(null)

      await load()

    } catch (e) {

      toast.error(parseApiErrorMessage(e))

    } finally {

      setSaving(false)

    }

  }



  const remove = async (id: number) => {

    if (!window.confirm('Remove this field from the application form?')) return

    setDeletingId(id)

    try {

      await deleteRecruitmentCampaignQuestion(campaignId, id)

      toast.success('Field removed')

      if (editingId === id) setEditingId(null)

      await load()

    } catch (e) {

      toast.error(parseApiErrorMessage(e))

    } finally {

      setDeletingId(null)

    }

  }



  const move = async (index: number, direction: -1 | 1) => {

    const next = index + direction

    if (next < 0 || next >= sorted.length) return

    const a = sorted[index]

    const b = sorted[next]

    setSaving(true)

    try {

      await Promise.all([

        updateRecruitmentCampaignQuestion(campaignId, a.id, { displayOrder: b.displayOrder }),

        updateRecruitmentCampaignQuestion(campaignId, b.id, { displayOrder: a.displayOrder }),

      ])

      await load()

    } catch (e) {

      toast.error(parseApiErrorMessage(e))

    } finally {

      setSaving(false)

    }

  }



  const patchEdit = (id: number, patch: Partial<FormFieldDraft>) => {

    setEditDrafts((prev) => {

      const base = prev[id] ?? fieldToDraft(allFields.find((x) => x.id === id)!)

      return { ...prev, [id]: { ...base, ...patch } }

    })

  }



  return (

    <FormBuilderSection

      id={embedded ? undefined : scope.type === 'campaign' ? 'application-form' : undefined}

      embedded={embedded}

      compact={compact}

      title={sectionTitle}

      subtitle={sectionSubtitle}

      headerExtra={

        editingId !== 'new' ? (

          <button type="button" onClick={startAdd} style={addFieldBtn} disabled={saving || loading}>

            <ListPlus size={18} />

            Add field

          </button>

        ) : null

      }

    >

      {loading ? (

        <p style={{ color: assocDash.muted, fontSize: 14 }}>Loading form…</p>

      ) : (

        <>

          {sorted.length === 0 && editingId !== 'new' ? (
            <FormBuilderEmptyState scope={scope} onAdd={startAdd} disabled={saving} />
          ) : null}



          {sorted.map((f, index) => (

            <div key={f.id}>

              {editingId === f.id ? (

                <FieldEditor

                  draft={editDrafts[f.id] ?? fieldToDraft(f)}

                  onChange={(patch) => patchEdit(f.id, patch)}

                  onSave={() => void saveEdit(f)}

                  onCancel={() => setEditingId(null)}

                  saving={saving}

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

                  onEdit={() => setEditingId(f.id)}

                  onDelete={() => void remove(f.id)}

                  onMoveUp={() => void move(index, -1)}

                  onMoveDown={() => void move(index, 1)}

                  disabled={saving || deletingId != null || editingId === 'new'}

                  deleting={deletingId === f.id}

                />

              )}

            </div>

          ))}



          {editingId === 'new' && newDraft ? (

            <FieldEditor

              draft={newDraft}

              onChange={(patch) => setNewDraft({ ...newDraft, ...patch })}

              onSave={() => void saveNew()}

              onCancel={() => {

                setEditingId(null)

                setNewDraft(null)

              }}

              saving={saving}

              title="New form field"

              isNew

              positions={positions}

              lockScope

            />

          ) : null}

        </>

      )}

    </FormBuilderSection>

  )

}



function FormBuilderEmptyState({

  onAdd,

  scope,

  disabled,

}: {

  onAdd: () => void

  scope: FormBuilderScope

  disabled?: boolean
}): JSX.Element {

  return (

    <div style={empty}>

      <p style={emptyTitle}>

        {scope.type === 'campaign' ? 'No shared form fields yet' : 'No fields for this position yet'}

      </p>

      <p style={emptySub}>

        {scope.type === 'campaign'

          ? 'Add questions every applicant answers, or build position-specific forms under each role.'

          : 'Add fields unique to this role—portfolio links, experience, samples, and more.'}

      </p>

      <button type="button" onClick={onAdd} style={addFieldBtn} disabled={disabled}>

        <ListPlus size={18} />

        Add first field

      </button>

    </div>

  )

}



