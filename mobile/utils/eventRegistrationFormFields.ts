import type { EventRegistrationField } from "@/api/eventRegistrationFormApi";
import type { RecruitmentQuestion } from "@/api/organizationRecruitmentCampaignsApi";

export const EVENT_FORM_FIELD_TYPES = [
  "ShortText",
  "Paragraph",
  "Dropdown",
  "MultipleChoice",
  "CheckboxList",
  "FileUploadPlaceholder",
  "Url",
  "Email",
  "Phone",
  "Number",
  "Date",
  "YesNo",
] as const;

export const EVENT_FIELD_TYPE_LABELS: Record<string, string> = {
  ShortText: "Short text",
  Paragraph: "Paragraph",
  MultipleChoice: "Multiple choice",
  CheckboxList: "Checkbox list",
  Dropdown: "Dropdown",
  Number: "Number",
  Email: "Email",
  Phone: "Phone",
  Url: "URL",
  FileUploadPlaceholder: "File upload",
  FileUpload: "File upload",
  Date: "Date",
  YesNo: "Yes / No",
};

export function normalizeEventFieldType(type: string): string {
  if (type === "Link") return "Url";
  if (type === "FileUpload") return "FileUploadPlaceholder";
  return type;
}

export function eventFieldTypeLabel(type: string): string {
  const t = normalizeEventFieldType(type);
  return EVENT_FIELD_TYPE_LABELS[type] ?? EVENT_FIELD_TYPE_LABELS[t] ?? type;
}

export function eventFieldUsesOptions(type: string): boolean {
  const t = normalizeEventFieldType(type);
  return t === "MultipleChoice" || t === "CheckboxList" || t === "Dropdown";
}

export type EventFieldDraft = {
  label: string;
  fieldType: string;
  placeholder: string;
  helpText: string;
  isRequired: boolean;
  options: string[];
  displayOrder: number;
};

export function emptyEventFieldDraft(order: number): EventFieldDraft {
  return {
    label: "",
    fieldType: "ShortText",
    placeholder: "",
    helpText: "",
    isRequired: true,
    options: ["", ""],
    displayOrder: order,
  };
}

export function eventFieldToDraft(f: EventRegistrationField): EventFieldDraft {
  return {
    label: f.label,
    fieldType: normalizeEventFieldType(f.fieldType),
    placeholder: f.placeholder ?? "",
    helpText: f.helpText ?? "",
    isRequired: f.isRequired,
    options: f.options?.length ? [...f.options] : ["", ""],
    displayOrder: f.displayOrder,
  };
}

export function validateEventFieldDraft(d: EventFieldDraft): string | null {
  if (!d.label.trim()) return "Field label is required.";
  if (eventFieldUsesOptions(d.fieldType)) {
    const opts = d.options.map((o) => o.trim()).filter(Boolean);
    if (opts.length < 2) return "Add at least two options.";
  }
  return null;
}

export function eventFieldDraftToPayload(d: EventFieldDraft) {
  const type = normalizeEventFieldType(d.fieldType);
  return {
    label: d.label.trim(),
    fieldType: type,
    placeholder: d.placeholder.trim() || null,
    helpText: d.helpText.trim() || null,
    isRequired: d.isRequired,
    options: eventFieldUsesOptions(type) ? d.options.map((o) => o.trim()).filter(Boolean) : null,
    displayOrder: d.displayOrder,
  };
}

export function eventFieldsToPreviewFields(fields: EventRegistrationField[]): RecruitmentQuestion[] {
  return [...fields]
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
    .map((f) => ({
      id: f.id,
      campaignId: 0,
      questionTitle: f.label,
      questionType:
        f.fieldType === "FileUploadPlaceholder" ? "FileUpload" : normalizeEventFieldType(f.fieldType),
      placeholder: f.placeholder,
      helpText: f.helpText,
      isRequired: f.isRequired,
      options: f.options,
      displayOrder: f.displayOrder,
      createdAt: f.createdAt,
      positionId: null,
      positionRoleTitle: null,
    }));
}

export function eventRegistrationFormPath(eventId: number) {
  return `/organization/events/${eventId}/registration-form` as const;
}
