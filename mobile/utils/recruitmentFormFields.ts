import type { RecruitmentPosition, RecruitmentQuestion } from "@/api/organizationRecruitmentCampaignsApi";

/** Stored in API as questionType; displayed as application form field types. */
export const FORM_FIELD_TYPES = [
  'ShortText',
  'Paragraph',
  'MultipleChoice',
  'CheckboxList',
  'Dropdown',
  'Number',
  'Email',
  'Url',
  'FileUpload',
  'Date',
  'YesNo',
] as const

export type FormFieldType = (typeof FORM_FIELD_TYPES)[number]

export const FORM_FIELD_TYPE_LABELS: Record<string, string> = {
  ShortText: 'Short text',
  Paragraph: 'Paragraph',
  MultipleChoice: 'Multiple choice',
  CheckboxList: 'Checkbox list',
  Dropdown: 'Dropdown',
  Number: 'Number',
  Email: 'Email',
  Url: 'URL',
  Link: 'URL',
  FileUpload: 'File upload',
  Date: 'Date',
  YesNo: 'Yes / No',
}

export function normalizeFieldType(type: string): string {
  return type === 'Link' ? 'Url' : type
}

export function fieldTypeLabel(type: string): string {
  return FORM_FIELD_TYPE_LABELS[type] ?? FORM_FIELD_TYPE_LABELS[normalizeFieldType(type)] ?? type
}

export function fieldUsesOptions(type: string): boolean {
  const t = normalizeFieldType(type)
  return t === 'MultipleChoice' || t === 'CheckboxList' || t === 'Dropdown'
}

export function defaultPlaceholder(type: string): string {
  const t = normalizeFieldType(type)
  switch (t) {
    case 'Email':
      return 'you@university.edu'
    case 'Url':
      return 'https://…'
    case 'Number':
      return '0'
    case 'Date':
      return 'Select a date'
    case 'FileUpload':
      return 'Upload will be available when applications open'
    case 'YesNo':
      return ''
    case 'Paragraph':
      return 'Write your answer here…'
    default:
      return 'Your answer…'
  }
}

export type FormFieldDraft = {
  questionTitle: string
  questionType: string
  placeholder: string
  helpText: string
  isRequired: boolean
  options: string[]
  displayOrder: number
  /** Persisted: null = shared campaign form */
  positionId?: number | null
  /** Create flow: links to PositionDraft._key before positions have server ids */
  positionKey?: string | null
}

export type PositionOption = {
  id?: number
  key: string
  roleTitle: string
}

export function emptyFieldDraft(order: number, defaults?: Partial<FormFieldDraft>): FormFieldDraft {
  return {
    questionTitle: '',
    questionType: 'ShortText',
    placeholder: '',
    helpText: '',
    isRequired: true,
    options: ['', ''],
    displayOrder: order,
    positionId: null,
    positionKey: null,
    ...defaults,
  }
}

export function fieldToDraft(f: RecruitmentQuestion): FormFieldDraft {
  return {
    questionTitle: f.questionTitle,
    questionType: normalizeFieldType(f.questionType),
    placeholder: f.placeholder ?? '',
    helpText: f.helpText ?? '',
    isRequired: f.isRequired,
    options: f.options?.length ? [...f.options] : ['', ''],
    displayOrder: f.displayOrder,
    positionId: f.positionId ?? null,
    positionKey: null,
  }
}

export function isCampaignWideField(field: Pick<FormFieldDraft, 'positionId' | 'positionKey'>): boolean {
  return field.positionId == null && !field.positionKey
}

export function fieldAppliesToLabel(
  field: Pick<FormFieldDraft, 'positionId' | 'positionKey'>,
  positions: PositionOption[],
): string {
  if (isCampaignWideField(field)) return 'Entire campaign'
  if (field.positionId != null) {
    const match = positions.find((p) => p.id === field.positionId)
    return match?.roleTitle?.trim() || 'Specific position'
  }
  if (field.positionKey) {
    const match = positions.find((p) => p.key === field.positionKey)
    return match?.roleTitle?.trim() || 'Specific position'
  }
  return 'Specific position'
}

export function getApplyScope(field: Pick<FormFieldDraft, 'positionId' | 'positionKey'>): 'campaign' | 'position' {
  return isCampaignWideField(field) ? 'campaign' : 'position'
}

export function filterFieldsForCampaignForm<T extends FormFieldDraft>(fields: T[]): T[] {
  return fields.filter(isCampaignWideField).sort((a, b) => a.displayOrder - b.displayOrder)
}

export function filterFieldsForPositionForm<T extends FormFieldDraft>(
  fields: T[],
  position: { id?: number; key: string },
): T[] {
  return fields
    .filter((f) => {
      if (f.positionId != null && position.id != null) return f.positionId === position.id
      if (f.positionKey) return f.positionKey === position.key
      return false
    })
    .sort((a, b) => a.displayOrder - b.displayOrder)
}

/** Questions belonging to a single position's application form. */
export function filterQuestionsForPosition(
  questions: RecruitmentQuestion[],
  positionId: number,
): RecruitmentQuestion[] {
  return [...questions]
    .filter((q) => q.positionId === positionId)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
}

/** Fields a student sees when applying to a position (position-specific form only). */
export function getApplicationFormForPosition(
  questions: RecruitmentQuestion[],
  positionId: number,
): RecruitmentQuestion[] {
  return filterQuestionsForPosition(questions, positionId)
}

export function countQuestionsForPosition(
  questions: RecruitmentQuestion[],
  positionId: number,
): number {
  return questions.filter((q) => q.positionId === positionId).length
}

export function positionsToOptions(
  positions: Array<{ id?: number; _key?: string; key?: string; roleTitle: string }>,
): PositionOption[] {
  return positions.map((p) => ({
    id: p.id,
    key: p._key ?? p.key ?? (p.id != null ? `pos-${p.id}` : `pos-${p.roleTitle}`),
    roleTitle: p.roleTitle,
  }))
}

export function validateFieldDraft(
  d: FormFieldDraft,
  positions: PositionOption[] = [],
): string | null {
  if (!d.questionTitle.trim()) return 'Field label is required.'
  if (fieldUsesOptions(d.questionType)) {
    const opts = d.options.map((o) => o.trim()).filter(Boolean)
    if (opts.length < 2) return 'Add at least two options.'
  }
  if (!isCampaignWideField(d)) {
    const hasPosition =
      (d.positionId != null && positions.some((p) => p.id === d.positionId)) ||
      (d.positionKey != null && positions.some((p) => p.key === d.positionKey))
    if (!hasPosition && positions.length > 0) return 'Select a position for this field.'
  }
  return null
}

export type LocalFormField = FormFieldDraft & { clientId: string }

let localFieldSeq = 0
export function newLocalFormField(order: number, defaults?: Partial<FormFieldDraft>): LocalFormField {
  localFieldSeq += 1
  return { ...emptyFieldDraft(order, defaults), clientId: `lf-${Date.now()}-${localFieldSeq}` }
}

export function validateFormFieldList(
  fields: FormFieldDraft[],
  positions: PositionOption[] = [],
): string | null {
  for (let i = 0; i < fields.length; i++) {
    const err = validateFieldDraft(fields[i], positions)
    if (err) return `Field ${i + 1}: ${err}`
  }
  return null
}

export function draftToPayload(d: FormFieldDraft, positionId?: number) {
  const type = normalizeFieldType(d.questionType)
  const resolvedPositionId = positionId ?? d.positionId ?? null
  return {
    questionTitle: d.questionTitle.trim(),
    questionType: type === 'Url' ? 'Url' : d.questionType,
    placeholder: d.placeholder.trim() || null,
    helpText: d.helpText.trim() || null,
    isRequired: d.isRequired,
    options: fieldUsesOptions(type) ? d.options.map((o) => o.trim()).filter(Boolean) : null,
    displayOrder: d.displayOrder,
    positionId: resolvedPositionId,
  }
}

export function resolvePositionIdsAfterCreate(
  fields: LocalFormField[],
  createdPositions: RecruitmentPosition[],
  draftPositionKeys: string[],
): LocalFormField[] {
  const keyToId = new Map<string, number>()
  draftPositionKeys.forEach((key, index) => {
    const created = createdPositions[index]
    if (created) keyToId.set(key, created.id)
  })
  return fields.map((f) => {
    if (!f.positionKey || f.positionId != null) return f
    const id = keyToId.get(f.positionKey)
    if (id == null) return f
    return { ...f, positionId: id, positionKey: null }
  })
}
