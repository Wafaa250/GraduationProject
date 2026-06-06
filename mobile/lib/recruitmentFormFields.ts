import type { RecruitmentQuestion } from "@/api/recruitmentCampaignsApi";

export const FORM_FIELD_TYPES = [
  "ShortText",
  "Paragraph",
  "MultipleChoice",
  "CheckboxList",
  "Dropdown",
  "Number",
  "Email",
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
