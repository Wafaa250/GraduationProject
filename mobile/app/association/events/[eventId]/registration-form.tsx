import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Eye } from "lucide-react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  createEventRegistrationField,
  deleteEventRegistrationField,
  ensureEventRegistrationForm,
  updateEventRegistrationField,
  updateEventRegistrationForm,
  type EventRegistrationField,
  type EventRegistrationForm,
} from "@/api/eventRegistrationFormApi";
import { getOrganizationEvent } from "@/api/organizationEventsApi";
import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { AssociationCard } from "@/components/association/AssociationCard";
import { AssociationErrorState } from "@/components/association/AssociationErrorState";
import { AssociationLoadingState } from "@/components/association/AssociationLoadingState";
import { AssociationTextField } from "@/components/association/AssociationTextField";
import { AssociationWorkspaceScreen } from "@/components/association/AssociationWorkspaceScreen";
import {
  FormFieldBuilderList,
  type BuilderFieldDraft,
} from "@/components/association/FormFieldBuilderList";
import { RegistrationFormPreviewModal } from "@/components/association/RegistrationFormPreviewModal";
import { associationCardStyles } from "@/constants/associationCardStyles";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  EVENT_FORM_FIELD_TYPES,
  emptyEventFieldDraft,
  eventFieldDraftToPayload,
  eventFieldToDraft,
  eventFieldTypeLabel,
  eventFieldUsesOptions,
  validateEventFieldDraft,
} from "@/lib/eventRegistrationFormFields";
import { associationEventPath } from "@/lib/associationRoutes";
import { showAlert } from "@/lib/confirmAlert";

type Selection = number | "new" | null;

export default function AssociationEventRegistrationFormScreen() {
  const layout = useResponsiveLayout();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const numericId = Number(eventId);
  const [form, setForm] = useState<EventRegistrationForm | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [selection, setSelection] = useState<Selection>(null);
  const [draft, setDraft] = useState<BuilderFieldDraft | null>(null);

  const sortedFields = useMemo(
    () => form?.fields.slice().sort((a, b) => a.displayOrder - b.displayOrder) ?? [],
    [form?.fields],
  );

  const load = useCallback(async () => {
    if (!Number.isFinite(numericId)) return;
    setLoading(true);
    setError(null);
    try {
      const event = await getOrganizationEvent(numericId);
      setEventTitle(event.title);
      const data = await ensureEventRegistrationForm(numericId, event.title);
      setForm(data);
      setMetaTitle(data.title);
      setMetaDescription(data.description ?? "");
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [numericId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selection === "new") {
      setDraft(emptyEventFieldDraft(sortedFields.length));
      return;
    }
    if (typeof selection === "number") {
      const field = sortedFields.find((f) => f.id === selection);
      setDraft(field ? eventFieldToDraft(field) : null);
      return;
    }
    setDraft(null);
  }, [selection, sortedFields]);

  const saveMeta = async () => {
    if (!metaTitle.trim()) {
      showAlert("Title required", "Form title is required.");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateEventRegistrationForm(numericId, {
        title: metaTitle.trim(),
        description: metaDescription.trim() || null,
      });
      setForm((prev) => (prev ? { ...updated, fields: prev.fields } : updated));
      showAlert("Saved", "Form settings saved.");
    } catch (err) {
      showAlert("Save failed", parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveField = async () => {
    if (!draft) return;
    const err = validateEventFieldDraft({
      label: draft.label,
      fieldType: draft.fieldType,
      placeholder: draft.placeholder,
      helpText: draft.helpText,
      isRequired: draft.isRequired,
      options: draft.options,
      displayOrder: draft.displayOrder,
    });
    if (err) {
      showAlert("Check field", err);
      return;
    }
    setSaving(true);
    try {
      const payload = eventFieldDraftToPayload({
        label: draft.label,
        fieldType: draft.fieldType,
        placeholder: draft.placeholder,
        helpText: draft.helpText,
        isRequired: draft.isRequired,
        options: draft.options,
        displayOrder: draft.displayOrder,
      });
      if (selection === "new") {
        await createEventRegistrationField(numericId, payload);
      } else if (typeof selection === "number") {
        await updateEventRegistrationField(numericId, selection, payload);
      }
      setSelection(null);
      await load();
    } catch (err) {
      showAlert("Save failed", parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const removeField = async (field: EventRegistrationField) => {
    setSaving(true);
    try {
      await deleteEventRegistrationField(numericId, field.id);
      if (selection === field.id) setSelection(null);
      await load();
    } catch (err) {
      showAlert("Delete failed", parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const duplicateField = async (field: EventRegistrationField) => {
    setSaving(true);
    try {
      await createEventRegistrationField(numericId, {
        ...eventFieldDraftToPayload(eventFieldToDraft(field)),
        label: `${field.label} (copy)`,
        displayOrder: sortedFields.length,
      });
      await load();
    } catch (err) {
      showAlert("Duplicate failed", parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const moveField = async (field: EventRegistrationField, direction: "up" | "down") => {
    const index = sortedFields.findIndex((f) => f.id === field.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const swapField = sortedFields[swapIndex];
    if (!swapField) return;
    setSaving(true);
    try {
      await Promise.all([
        updateEventRegistrationField(numericId, field.id, { displayOrder: swapField.displayOrder }),
        updateEventRegistrationField(numericId, swapField.id, { displayOrder: field.displayOrder }),
      ]);
      await load();
    } catch (err) {
      showAlert("Reorder failed", parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !form) {
    return (
      <AssociationWorkspaceScreen showBack fallbackHref={associationEventPath(numericId)} navTitle="Registration form">
        <AssociationLoadingState message="Loading registration form…" />
      </AssociationWorkspaceScreen>
    );
  }

  if (error && !form) {
    return (
      <AssociationWorkspaceScreen showBack fallbackHref={associationEventPath(numericId)} navTitle="Registration form">
        <AssociationErrorState message={error} onRetry={() => void load()} />
      </AssociationWorkspaceScreen>
    );
  }

  return (
    <AssociationWorkspaceScreen
      showBack
      fallbackHref={associationEventPath(numericId)}
      navTitle="Registration form"
      refreshing={loading}
      onRefresh={() => void load()}
    >
      <View style={[styles.header, { gap: layout.space("sm") }]}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Form builder</Text>
          <Text style={styles.title} numberOfLines={2}>
            {form?.title ?? "Registration form"}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {eventTitle}
          </Text>
        </View>
        <AssociationActionButton
          label="Preview"
          variant="outline"
          compact
          onPress={() => setPreviewOpen(true)}
          icon={<Eye size={15} color={ASSOC_COLORS.accentDark} strokeWidth={2.25} />}
        />
      </View>

      <AssociationCard compact>
        <Text style={associationCardStyles.sectionTitle}>Form settings</Text>
        <AssociationTextField
          label="Form title"
          value={metaTitle}
          onChangeText={setMetaTitle}
        />
        <AssociationTextField
          label="Form description (optional)"
          value={metaDescription}
          onChangeText={setMetaDescription}
          multiline
        />
        <AssociationActionButton label="Save form settings" loading={saving} onPress={() => void saveMeta()} />
      </AssociationCard>

      <FormFieldBuilderList
        fields={sortedFields.map((f) => ({
          id: f.id,
          label: f.label,
          fieldType: f.fieldType,
          placeholder: f.placeholder,
          helpText: f.helpText,
          isRequired: f.isRequired,
          options: f.options,
          displayOrder: f.displayOrder,
        }))}
        fieldTypes={EVENT_FORM_FIELD_TYPES}
        fieldTypeLabel={eventFieldTypeLabel}
        fieldUsesOptions={eventFieldUsesOptions}
        selection={selection}
        draft={draft}
        saving={saving}
        allowDuplicate
        onSelect={setSelection}
        onDraftChange={setDraft}
        onSaveField={() => void saveField()}
        onDeleteField={(field) => void removeField(field as EventRegistrationField)}
        onDuplicateField={(field) => void duplicateField(field as EventRegistrationField)}
        onMoveField={(field, direction) => void moveField(field as EventRegistrationField, direction)}
        onCancelEdit={() => setSelection(null)}
      />

      <RegistrationFormPreviewModal
        visible={previewOpen}
        form={form}
        eventTitle={eventTitle}
        onClose={() => setPreviewOpen(false)}
      />
    </AssociationWorkspaceScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: ASSOC_COLORS.accent,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: ASSOC_COLORS.foreground,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: ASSOC_COLORS.muted,
    marginTop: 2,
  },
});
