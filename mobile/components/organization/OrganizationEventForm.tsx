import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  ORGANIZATION_EVENT_CATEGORIES,
  ORGANIZATION_EVENT_TYPES,
  type CreateOrganizationEventPayload,
  type StudentOrganizationEvent,
  uploadOrganizationEventCoverFromUri,
} from "@/api/organizationEventsApi";
import { radius, spacing } from "@/constants/responsiveLayout";
import { assocColors } from "@/constants/associationTheme";
import { MobileDateTimeField } from "@/components/organization/MobileDateTimeField";

type FormValues = {
  title: string;
  description: string;
  eventType: string;
  category: string;
  location: string;
  isOnline: boolean;
  eventDateIso: string;
  registrationDeadlineIso: string;
  maxParticipants: string;
  coverImageUrl: string | null;
};

function emptyValues(): FormValues {
  return {
    title: "",
    description: "",
    eventType: ORGANIZATION_EVENT_TYPES[0],
    category: ORGANIZATION_EVENT_CATEGORIES[0],
    location: "",
    isOnline: false,
    eventDateIso: "",
    registrationDeadlineIso: "",
    maxParticipants: "",
    coverImageUrl: null,
  };
}

function eventToValues(e: StudentOrganizationEvent): FormValues {
  return {
    title: e.title,
    description: e.description,
    eventType: e.eventType,
    category: e.category,
    location: e.location ?? "",
    isOnline: e.isOnline,
    eventDateIso: e.eventDate,
    registrationDeadlineIso: e.registrationDeadline ?? "",
    maxParticipants: e.maxParticipants != null ? String(e.maxParticipants) : "",
    coverImageUrl: e.coverImageUrl ?? null,
  };
}

type Props = {
  initialEvent?: StudentOrganizationEvent;
  submitLabel: string;
  saving: boolean;
  onSubmit: (payload: CreateOrganizationEventPayload) => Promise<void>;
  onCancel: () => void;
  extraContent?: ReactNode;
};

export function OrganizationEventForm({
  initialEvent,
  submitLabel,
  saving,
  onSubmit,
  onCancel,
  extraContent,
}: Props) {
  const [form, setForm] = useState<FormValues>(() =>
    initialEvent ? eventToValues(initialEvent) : emptyValues(),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pickerOpen, setPickerOpen] = useState<"type" | "category" | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverErr, setCoverErr] = useState<string | null>(null);

  useEffect(() => {
    if (initialEvent) setForm(eventToValues(initialEvent));
  }, [initialEvent]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "Title is required.";
    if (!form.description.trim()) next.description = "Description is required.";
    if (!form.eventType) next.eventType = "Event type is required.";
    if (!form.category) next.category = "Category is required.";
    if (!form.eventDateIso) next.eventDateIso = "Event date is required.";

    if (form.registrationDeadlineIso && form.eventDateIso) {
      const reg = new Date(form.registrationDeadlineIso);
      const ev = new Date(form.eventDateIso);
      if (!Number.isNaN(reg.getTime()) && !Number.isNaN(ev.getTime()) && reg > ev) {
        next.registrationDeadlineIso = "Registration deadline must be on or before the event date.";
      }
    }

    if (form.maxParticipants.trim()) {
      const n = Number(form.maxParticipants);
      if (!Number.isInteger(n) || n < 1) next.maxParticipants = "Max participants must be a positive number.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload: CreateOrganizationEventPayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      eventType: form.eventType,
      category: form.category,
      location: form.location.trim() || undefined,
      isOnline: form.isOnline,
      eventDate: form.eventDateIso,
      registrationDeadline: form.registrationDeadlineIso || undefined,
      coverImageUrl: form.coverImageUrl ?? undefined,
      maxParticipants: form.maxParticipants.trim() ? Number(form.maxParticipants) : undefined,
    };
    await onSubmit(payload);
  };

  const pickCover = async () => {
    setCoverErr(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    setCoverBusy(true);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const a = res.assets[0];
      const uri = a.uri;
      const mime = a.mimeType ?? "image/jpeg";
      const name = uri.split("/").pop() ?? "cover.jpg";
      const url = await uploadOrganizationEventCoverFromUri(uri, mime, name);
      setForm((f) => ({ ...f, coverImageUrl: url }));
    } catch (e) {
      setCoverErr(parseApiErrorMessage(e));
    } finally {
      setCoverBusy(false);
    }
  };

  const coverDisplay = resolveApiFileUrl(form.coverImageUrl ?? undefined);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.section}>Basic information</Text>
        <Field label="Title" error={errors.title} required>
          <TextInput
            value={form.title}
            onChangeText={(t) => setForm((f) => ({ ...f, title: t }))}
            placeholder="e.g. Spring Hackathon 2026"
            placeholderTextColor={assocColors.subtle}
            style={styles.input}
            editable={!saving}
          />
        </Field>
        <Field label="Description" error={errors.description} required>
          <TextInput
            value={form.description}
            onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
            placeholder="What is this event about?"
            placeholderTextColor={assocColors.subtle}
            style={[styles.input, styles.textArea]}
            multiline
            textAlignVertical="top"
            editable={!saving}
          />
        </Field>

        <Text style={styles.section}>Event classification</Text>
        <Field label="Event type" error={errors.eventType} required>
          <Pressable
            style={styles.select}
            onPress={() => setPickerOpen("type")}
            disabled={saving}
          >
            <Text style={styles.selectText}>{form.eventType}</Text>
            <Text style={styles.chev}>▼</Text>
          </Pressable>
        </Field>
        <Field label="Category" error={errors.category} required>
          <Pressable
            style={styles.select}
            onPress={() => setPickerOpen("category")}
            disabled={saving}
          >
            <Text style={styles.selectText}>{form.category}</Text>
            <Text style={styles.chev}>▼</Text>
          </Pressable>
        </Field>

        <Text style={styles.section}>Time & location</Text>
        <MobileDateTimeField
          label="Event date *"
          valueIso={form.eventDateIso}
          onChangeIso={(iso) => setForm((f) => ({ ...f, eventDateIso: iso }))}
        />
        {errors.eventDateIso ? <Text style={styles.err}>{errors.eventDateIso}</Text> : null}
        <MobileDateTimeField
          label="Registration deadline (optional)"
          valueIso={form.registrationDeadlineIso}
          onChangeIso={(iso) => setForm((f) => ({ ...f, registrationDeadlineIso: iso }))}
        />
        {errors.registrationDeadlineIso ? (
          <Text style={styles.err}>{errors.registrationDeadlineIso}</Text>
        ) : null}

        <Field label="Location (optional if online)" error={errors.location}>
          <TextInput
            value={form.location}
            onChangeText={(t) => setForm((f) => ({ ...f, location: t }))}
            placeholder="Campus building or city"
            placeholderTextColor={assocColors.subtle}
            style={styles.input}
            editable={!saving && !form.isOnline}
          />
        </Field>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Online event</Text>
            <Text style={styles.switchHint}>Guests join remotely</Text>
          </View>
          <Switch
            value={form.isOnline}
            onValueChange={(v) => setForm((f) => ({ ...f, isOnline: v }))}
            trackColor={{ false: "#e2e8f0", true: assocColors.accentBorder }}
            thumbColor={form.isOnline ? assocColors.accent : "#f4f4f5"}
            disabled={saving}
          />
        </View>

        <Field label="Max participants (optional)" error={errors.maxParticipants}>
          <TextInput
            value={form.maxParticipants}
            onChangeText={(t) => setForm((f) => ({ ...f, maxParticipants: t.replace(/[^\d]/g, "") }))}
            placeholder="e.g. 120"
            placeholderTextColor={assocColors.subtle}
            style={styles.input}
            keyboardType="number-pad"
            editable={!saving}
          />
        </Field>

        <Text style={styles.section}>Cover image</Text>
        <Pressable
          onPress={pickCover}
          disabled={saving || coverBusy}
          style={[styles.coverBox, coverDisplay && styles.coverBoxOn]}
        >
          {coverDisplay ? (
            <Image source={{ uri: coverDisplay }} style={styles.coverImg} contentFit="cover" />
          ) : (
            <Text style={styles.coverHint}>Tap to upload cover</Text>
          )}
          {coverBusy ? <ActivityIndicator style={styles.coverSpin} color={assocColors.accent} /> : null}
        </Pressable>
        {coverErr ? <Text style={styles.err}>{coverErr}</Text> : null}

        {extraContent}

        <View style={styles.actions}>
          <Pressable onPress={onCancel} style={styles.btnSecondary} disabled={saving}>
            <Text style={styles.btnSecondaryText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => void handleSubmit()}
            style={[styles.btnPrimary, saving && { opacity: 0.7 }]}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>{submitLabel}</Text>}
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={pickerOpen != null} transparent animationType="fade">
        <Pressable style={styles.modalBg} onPress={() => setPickerOpen(null)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalH}>
              {pickerOpen === "type" ? "Event type" : "Category"}
            </Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {(pickerOpen === "type" ? ORGANIZATION_EVENT_TYPES : ORGANIZATION_EVENT_CATEGORIES).map(
                (opt) => (
                  <Pressable
                    key={opt}
                    style={styles.modalRow}
                    onPress={() => {
                      if (pickerOpen === "type") setForm((f) => ({ ...f, eventType: opt }));
                      else setForm((f) => ({ ...f, category: opt }));
                      setPickerOpen(null);
                    }}
                  >
                    <Text style={styles.modalRowText}>{opt}</Text>
                  </Pressable>
                ),
              )}
            </ScrollView>
            <Pressable style={styles.modalCancel} onPress={() => setPickerOpen(null)}>
              <Text style={styles.modalCancelText}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={{ color: "#dc2626" }}> *</Text> : null}
      </Text>
      {children}
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  section: {
    fontSize: 15,
    fontWeight: "800",
    color: assocColors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: assocColors.text, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: assocColors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: assocColors.text,
    backgroundColor: assocColors.bg,
    minHeight: 48,
  },
  textArea: { minHeight: 120 },
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: assocColors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    backgroundColor: assocColors.bg,
  },
  selectText: { fontSize: 15, fontWeight: "600", color: assocColors.text, flex: 1 },
  chev: { color: assocColors.muted, fontSize: 12 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  switchLabel: { fontSize: 14, fontWeight: "700", color: assocColors.text },
  switchHint: { fontSize: 12, color: assocColors.muted, marginTop: 2 },
  coverBox: {
    height: 160,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: assocColors.accentMuted,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  coverBoxOn: { borderStyle: "solid" },
  coverImg: { width: "100%", height: "100%" },
  coverHint: { color: assocColors.accentDark, fontWeight: "700" },
  coverSpin: { position: "absolute" },
  err: { color: "#dc2626", fontSize: 12, fontWeight: "600", marginTop: 4, marginBottom: spacing.sm },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
    flexWrap: "wrap",
  },
  btnSecondary: {
    flex: 1,
    minWidth: 120,
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: assocColors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: assocColors.surface,
  },
  btnSecondaryText: { fontWeight: "700", color: assocColors.muted },
  btnPrimary: {
    flex: 1,
    minWidth: 120,
    minHeight: 48,
    borderRadius: radius.lg,
    backgroundColor: assocColors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: assocColors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  btnPrimaryText: { fontWeight: "800", color: "#fff", fontSize: 15 },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: assocColors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    maxHeight: "80%",
  },
  modalH: { fontSize: 16, fontWeight: "800", marginBottom: spacing.sm, color: assocColors.text },
  modalRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: assocColors.border,
  },
  modalRowText: { fontSize: 15, color: assocColors.text, fontWeight: "600" },
  modalCancel: { padding: spacing.md, alignItems: "center" },
  modalCancelText: { color: assocColors.accentDark, fontWeight: "700" },
});
