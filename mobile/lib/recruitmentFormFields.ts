import type { RecruitmentQuestion } from "@/api/recruitmentCampaignsApi";

export const FORM_FIELD_TYPES = [
  "ShortText",
  "Paragraph",
  "MultipleChoice",
  "CheckboxList",
  "Dropdown",
  "Number",
  "Email",
  "Phone",
  "Url",
  "FileUpload",
  "Date",
  "YesNo",
] as const;

export const EDITOR_FIELD_TYPES = [
  "ShortText",
  "Paragraph",
  "MultipleChoice",
  "CheckboxList",
  "Dropdown",
  "Email",
  "Url",
  "FileUpload",
  "Date",
  "YesNo",
] as const;

export const FORM_FIELD_TYPE_LABELS: Record<string, string> = {
  ShortText: "Short text",
  Paragraph: "Paragraph",
  MultipleChoice: "Multiple choice",
  CheckboxList: "Checkbox list",
  Dropdown: "Dropdown",
  Number: "Number",
  Email: "Email",
  Phone: "Phone",
  Url: "URL",
  Link: "URL",
  FileUpload: "File upload",
  Date: "Date",
  YesNo: "Yes / No",
};

export function normalizeFieldType(type: string): string {
  return type === "Link" ? "Url" : type;
}

export function fieldTypeLabel(type: string): string {
  return FORM_FIELD_TYPE_LABELS[type] ?? FORM_FIELD_TYPE_LABELS[normalizeFieldType(type)] ?? type;
}

export function fieldUsesOptions(type: string): boolean {
  const t = normalizeFieldType(type);
  return t === "MultipleChoice" || t === "CheckboxList" || t === "Dropdown";
}

export type FormFieldDraft = {
  questionTitle: string;
  questionType: string;
  placeholder: string;
  helpText: string;
  isRequired: boolean;
  options: string[];
  displayOrder: number;
  positionId?: number | null;
};

export function emptyFieldDraft(order: number, defaults?: Partial<FormFieldDraft>): FormFieldDraft {
  return {
    questionTitle: "",
    questionType: "ShortText",
    placeholder: "",
    helpText: "",
    isRequired: true,
    options: ["", ""],
    displayOrder: order,
    positionId: null,
    ...defaults,
  };
}

export function fieldToDraft(f: RecruitmentQuestion): FormFieldDraft {
  return {
    questionTitle: f.questionTitle,
    questionType: normalizeFieldType(f.questionType),
    placeholder: f.placeholder ?? "",
    helpText: f.helpText ?? "",
    isRequired: f.isRequired,
    options: f.options?.length ? [...f.options] : ["", ""],
    displayOrder: f.displayOrder,
    positionId: f.positionId ?? null,
  };
}

export function validateFieldDraft(d: FormFieldDraft): string | null {
  if (!d.questionTitle.trim()) return "Field label is required.";
  if (fieldUsesOptions(d.questionType)) {
    const opts = d.options.map((o) => o.trim()).filter(Boolean);
    if (opts.length < 2) return "Add at least two options.";
  }
  return null;
}

export function draftToPayload(d: FormFieldDraft, positionId?: number) {
  const type = normalizeFieldType(d.questionType);
  return {
    questionTitle: d.questionTitle.trim(),
    questionType: type,
    placeholder: d.placeholder.trim() || null,
    helpText: d.helpText.trim() || null,
    isRequired: d.isRequired,
    options: fieldUsesOptions(type) ? d.options.map((o) => o.trim()).filter(Boolean) : null,
    displayOrder: d.displayOrder,
    positionId: positionId ?? d.positionId ?? null,
  };
}

export function filterQuestionsForPosition(
  questions: RecruitmentQuestion[],
  positionId: number,
): RecruitmentQuestion[] {
  return [...questions]
    .filter((q) => q.positionId === positionId)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);
}

export function parseSkillsList(requiredSkills?: string | null): string[] {
  if (!requiredSkills?.trim()) return [];
  return requiredSkills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export type ApplicationAnswerDraft = {
  questionId: number;
  value: string;
  values: string[];
};

export function getStudentApplicationQuestions(
  questions: RecruitmentQuestion[],
  positionId: number,
): RecruitmentQuestion[] {
  return [...questions]
    .filter((q) => q.positionId == null || q.positionId === positionId)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);
}

export function buildEmptyAnswerDrafts(
  questions: RecruitmentQuestion[],
): Record<number, ApplicationAnswerDraft> {
  const map: Record<number, ApplicationAnswerDraft> = {};
  for (const q of questions) {
    map[q.id] = { questionId: q.id, value: "", values: [] };
  }
  return map;
}

export function validateApplicationAnswers(
  questions: RecruitmentQuestion[],
  drafts: Record<number, ApplicationAnswerDraft>,
): string | null {
  for (const q of questions) {
    const d = drafts[q.id];
    const type = normalizeFieldType(q.questionType);
    if (!q.isRequired) continue;
    if (type === "CheckboxList") {
      const selected = d?.values?.filter((v) => v.trim()) ?? [];
      if (selected.length === 0) return `"${q.questionTitle}" is required.`;
    } else if (!d?.value?.trim()) {
      return `"${q.questionTitle}" is required.`;
    }
  }
  return null;
}

export function draftsToSubmissionPayload(
  questions: RecruitmentQuestion[],
  drafts: Record<number, ApplicationAnswerDraft>,
) {
  return questions.map((q) => {
    const d = drafts[q.id];
    const type = normalizeFieldType(q.questionType);
    if (type === "CheckboxList") {
      return { questionId: q.id, values: d?.values?.filter((v) => v.trim()) ?? [] };
    }
    return { questionId: q.id, value: d?.value?.trim() || null };
  });
}

export function recruitmentQuestionToFormField(q: RecruitmentQuestion) {
  return {
    id: q.id,
    label: q.questionTitle,
    type: q.questionType,
    placeholder: q.placeholder,
    helpText: q.helpText,
    isRequired: q.isRequired,
    options: q.options,
    displayOrder: q.displayOrder,
  };
}
