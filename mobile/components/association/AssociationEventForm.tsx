import * as ImagePicker from "expo-image-picker";

import { useMemo, useState } from "react";

import { Alert, StyleSheet, Switch, Text, View } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";

import {
  ORGANIZATION_EVENT_CATEGORIES,
  ORGANIZATION_EVENT_TYPES,
  uploadOrganizationEventCover,
  type CreateOrganizationEventPayload,
} from "@/api/organizationEventsApi";

import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { AssociationDateTimeField } from "@/components/association/AssociationDateTimeField";

import { AssociationSelectField } from "@/components/association/AssociationSelectField";

import { AssociationTextField } from "@/components/association/AssociationTextField";

import { ASSOC_COLORS } from "@/constants/associationTheme";

import {
  isRegistrationDeadlineValid,
  syncRegistrationDeadlineDate,
} from "@/lib/eventFormUtils";

import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export type EventFormState = {
  title: string;

  description: string;

  eventType: string;

  category: string;

  location: string;

  isOnline: boolean;

  eventDate: Date | null;

  registrationDeadline: Date | null;

  maxParticipants: string;

  coverImageUrl: string | null;
};

export function emptyEventFormState(): EventFormState {
  return {
    title: "",

    description: "",

    eventType: ORGANIZATION_EVENT_TYPES[0],

    category: ORGANIZATION_EVENT_CATEGORIES[0],

    location: "",

    isOnline: false,

    eventDate: null,

    registrationDeadline: null,

    maxParticipants: "",

    coverImageUrl: null,
  };
}

type Props = {
  initial: EventFormState;

  submitLabel: string;

  saving: boolean;

  onSubmit: (payload: CreateOrganizationEventPayload) => Promise<void>;

  onCancel: () => void;
};

function toIso(date: Date): string {
  return date.toISOString();
}

function requiredFieldsComplete(form: EventFormState): boolean {
  return (
    !!form.title.trim() &&
    !!form.description.trim() &&
    !!form.eventType &&
    !!form.category &&
    !!form.eventDate
  );
}

function buildValidationErrors(form: EventFormState): Record<string, string> {
  const next: Record<string, string> = {};

  if (!form.title.trim()) next.title = "Title is required.";

  if (!form.description.trim()) next.description = "Description is required.";

  if (!form.eventType) next.eventType = "Event type is required.";

  if (!form.category) next.category = "Category is required.";

  if (!form.eventDate) next.eventDate = "Event date is required.";

  const eventIso = form.eventDate ? toIso(form.eventDate) : undefined;

  const regIso = form.registrationDeadline
    ? toIso(form.registrationDeadline)
    : undefined;

  if (
    form.registrationDeadline &&
    regIso &&
    eventIso &&
    !isRegistrationDeadlineValid(eventIso, regIso)
  ) {
    next.registrationDeadline =
      "Registration deadline must be on or before the event date.";
  }

  if (form.maxParticipants.trim()) {
    const n = Number(form.maxParticipants);

    if (!Number.isInteger(n) || n < 1) {
      next.maxParticipants = "Max participants must be a positive number.";
    }
  }

  return next;
}

function serializeFormForLog(form: EventFormState) {
  return {
    title: form.title,

    description: form.description,

    eventType: form.eventType,

    category: form.category,

    location: form.location,

    isOnline: form.isOnline,

    eventDate: form.eventDate?.toISOString() ?? null,

    registrationDeadline: form.registrationDeadline?.toISOString() ?? null,

    maxParticipants: form.maxParticipants,

    coverImageUrl: form.coverImageUrl,
  };
}

export function AssociationEventForm({
  initial,
  submitLabel,
  saving,
  onSubmit,
  onCancel,
}: Props) {
  const layout = useResponsiveLayout();

  const [form, setForm] = useState<EventFormState>(initial);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [uploadingCover, setUploadingCover] = useState(false);

  const [submitAttempted, setSubmitAttempted] = useState(false);

  const requiredComplete = useMemo(() => requiredFieldsComplete(form), [form]);

  const patchForm = (patch: Partial<EventFormState>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };

      if ("eventDate" in patch) {
        next.registrationDeadline = syncRegistrationDeadlineDate(
          next.eventDate,

          next.registrationDeadline,
        );
      }

      return next;
    });
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);

    console.log(
      "[AssociationEventForm] form values before submit:",
      serializeFormForLog(form),
    );

    const validationErrors = buildValidationErrors(form);

    const valid = Object.keys(validationErrors).length === 0;

    setErrors(validationErrors);

    console.log(
      "[AssociationEventForm] validation result:",
      valid,
      validationErrors,
    );

    if (!valid) return;

    const eventDate = form.eventDate ? toIso(form.eventDate) : undefined;

    if (!eventDate) {
      setErrors({ eventDate: "Invalid event date." });

      return;
    }

    const payload: CreateOrganizationEventPayload = {
      title: form.title.trim(),

      description: form.description.trim(),

      eventType: form.eventType,

      category: form.category,

      location: form.location.trim() || undefined,

      isOnline: form.isOnline,

      eventDate,

      registrationDeadline: form.registrationDeadline
        ? toIso(form.registrationDeadline)
        : undefined,

      coverImageUrl: form.coverImageUrl ?? undefined,

      maxParticipants: form.maxParticipants.trim()
        ? Number(form.maxParticipants)
        : undefined,
    };

    console.log("[AssociationEventForm] request payload:", payload);

    try {
      await onSubmit(payload);
    } catch (err) {
      console.error("[AssociationEventForm] submit error:", err);

      throw err;
    }
  };

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,

      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];

    setUploadingCover(true);

    try {
      const url = await uploadOrganizationEventCover({
        uri: asset.uri,

        name: asset.fileName ?? `cover-${Date.now()}.jpg`,

        mimeType: asset.mimeType ?? "image/jpeg",
      });

      setForm((prev) => ({ ...prev, coverImageUrl: url }));
    } catch (err) {
      Alert.alert("Upload failed", parseApiErrorMessage(err));
    } finally {
      setUploadingCover(false);
    }
  };

  const visibleErrors = submitAttempted
    ? Object.values(errors).filter(Boolean)
    : [];

  return (
    <View style={{ width: "100%" }}>
      <AssociationTextField
        label="Title"
        value={form.title}
        onChangeText={(title) => patchForm({ title })}
        placeholder="Spring Hackathon 2026"
        error={errors.title}
      />

      <AssociationTextField
        label="Description"
        value={form.description}
        onChangeText={(description) => patchForm({ description })}
        multiline
        placeholder="What is this event about? Who should attend?"
        error={errors.description}
      />

      <AssociationSelectField
        label="Event type"
        value={form.eventType}
        onValueChange={(eventType) => patchForm({ eventType })}
        options={ORGANIZATION_EVENT_TYPES}
        error={errors.eventType}
      />

      <AssociationSelectField
        label="Category"
        value={form.category}
        onValueChange={(category) => patchForm({ category })}
        options={ORGANIZATION_EVENT_CATEGORIES}
        error={errors.category}
      />

      <View style={styles.switchRow}>
        <Text style={[styles.fieldLabel, { fontSize: layout.fontSize.label }]}>
          Online event
        </Text>

        <Switch
          value={form.isOnline}
          onValueChange={(isOnline) =>
            patchForm({
              isOnline,

              location: isOnline ? "" : form.location,
            })
          }
          trackColor={{
            true: ASSOC_COLORS.accentSoft,
            false: ASSOC_COLORS.border,
          }}
          thumbColor={form.isOnline ? ASSOC_COLORS.accent : ASSOC_COLORS.muted}
        />
      </View>

      <AssociationTextField
        label="Location"
        value={form.location}
        onChangeText={(location) => patchForm({ location })}
        placeholder={
          form.isOnline ? "Link or platform" : "Building, room, or address"
        }
        editable={!form.isOnline}
      />

      <AssociationDateTimeField
        label="Event date"
        value={form.eventDate}
        onChange={(eventDate) => patchForm({ eventDate })}
        error={errors.eventDate}
        placeholder="Select date and time"
      />

      <AssociationDateTimeField
        label="Registration deadline"
        value={form.registrationDeadline}
        onChange={(registrationDeadline) =>
          setForm((prev) => ({ ...prev, registrationDeadline }))
        }
        error={errors.registrationDeadline}
        disabled={!form.eventDate}
        maxDate={form.eventDate}
        placeholder="Not set"
      />

      <AssociationTextField
        label="Max participants"
        value={form.maxParticipants}
        onChangeText={(maxParticipants) => patchForm({ maxParticipants })}
        keyboardType="numeric"
        placeholder="No limit"
        error={errors.maxParticipants}
      />

      <View style={{ marginBottom: layout.space("md"), gap: 8 }}>
        <Text style={[styles.fieldLabel, { fontSize: layout.fontSize.label }]}>
          Cover image
        </Text>

        <AssociationActionButton
          label={
            uploadingCover
              ? "Uploading…"
              : form.coverImageUrl
                ? "Change cover"
                : "Upload cover"
          }
          variant="outline"
          loading={uploadingCover}
          onPress={() => void pickCover()}
        />

        {form.coverImageUrl ? (
          <Text style={styles.hint}>Cover uploaded</Text>
        ) : null}
      </View>

      {visibleErrors.length > 0 ? (
        <View style={styles.validationSummary}>
          {visibleErrors.map((message) => (
            <Text key={message} style={styles.validationSummaryText}>
              {message}
            </Text>
          ))}
        </View>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          gap: layout.space("sm"),
          flexWrap: "wrap",
        }}
      >
        <AssociationActionButton
          label={saving ? "Saving…" : submitLabel}
          onPress={() => void handleSubmit()}
          loading={saving}
          disabled={!requiredComplete}
        />

        <AssociationActionButton
          label="Cancel"
          variant="outline"
          onPress={onCancel}
          disabled={saving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontWeight: "700",

    color: ASSOC_COLORS.foreground,
  },

  switchRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: 16,

    width: "100%",
  },

  hint: {
    color: ASSOC_COLORS.muted,

    fontSize: 12,
  },

  validationSummary: {
    marginBottom: 12,

    padding: 12,

    borderRadius: 10,

    borderWidth: 1,

    borderColor: "#FECACA",

    backgroundColor: "#FEF2F2",

    gap: 4,
  },

  validationSummaryText: {
    color: "#B91C1C",

    fontSize: 13,

    fontWeight: "500",
  },
});
