import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  ORGANIZATION_EVENT_CATEGORIES,
  ORGANIZATION_EVENT_TYPES,
  uploadOrganizationEventCover,
  type CreateOrganizationEventPayload,
} from "@/api/organizationEventsApi";
import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { AssociationSelectField } from "@/components/association/AssociationSelectField";
import { AssociationTextField } from "@/components/association/AssociationTextField";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { isRegistrationDeadlineValid } from "@/lib/eventFormUtils";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export type EventFormState = {
  title: string;
  description: string;
  eventType: string;
  category: string;
  location: string;
  isOnline: boolean;
  eventDate: Date;
  registrationDeadline: Date | null;
  maxParticipants: string;
  coverImageUrl: string | null;
};

export function emptyEventFormState(): EventFormState {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);
  return {
    title: "",
    description: "",
    eventType: ORGANIZATION_EVENT_TYPES[0],
    category: ORGANIZATION_EVENT_CATEGORIES[0],
    location: "",
    isOnline: false,
    eventDate: tomorrow,
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

function formatDateTime(date: Date): string {
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AssociationEventForm({ initial, submitLabel, saving, onSubmit, onCancel }: Props) {
  const layout = useResponsiveLayout();
  const [form, setForm] = useState<EventFormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pickerMode, setPickerMode] = useState<"event" | "deadline" | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "Event name is required";
    if (!form.description.trim()) next.description = "Description is required";
    if (!form.eventType) next.eventType = "Event type is required";
    if (!form.category) next.category = "Category is required";
    if (
      form.registrationDeadline &&
      !isRegistrationDeadlineValid(toIso(form.eventDate), toIso(form.registrationDeadline))
    ) {
      next.registrationDeadline = "Registration deadline must be on or before the event date";
    }
    if (form.maxParticipants.trim()) {
      const n = Number(form.maxParticipants);
      if (!Number.isInteger(n) || n <= 0) next.maxParticipants = "Enter a positive whole number";
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
      eventDate: toIso(form.eventDate),
      registrationDeadline: form.registrationDeadline ? toIso(form.registrationDeadline) : undefined,
      coverImageUrl: form.coverImageUrl ?? undefined,
      maxParticipants: form.maxParticipants.trim() ? Number(form.maxParticipants) : undefined,
    };
    await onSubmit(payload);
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

  const onPickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setPickerMode(null);
    if (event.type === "dismissed" || !date) return;
    if (pickerMode === "event") setForm((prev) => ({ ...prev, eventDate: date }));
    if (pickerMode === "deadline") setForm((prev) => ({ ...prev, registrationDeadline: date }));
  };

  const controlHeight = layout.scale(44);

  return (
    <View style={{ width: "100%" }}>
      <AssociationTextField
        label="Event name"
        value={form.title}
        onChangeText={(title) => setForm((prev) => ({ ...prev, title }))}
        error={errors.title}
      />
      <AssociationTextField
        label="Description"
        value={form.description}
        onChangeText={(description) => setForm((prev) => ({ ...prev, description }))}
        multiline
        error={errors.description}
      />

      <AssociationSelectField
        label="Event type"
        value={form.eventType}
        onValueChange={(eventType) => setForm((prev) => ({ ...prev, eventType }))}
        options={ORGANIZATION_EVENT_TYPES}
        error={errors.eventType}
      />

      <AssociationSelectField
        label="Category"
        value={form.category}
        onValueChange={(category) => setForm((prev) => ({ ...prev, category }))}
        options={ORGANIZATION_EVENT_CATEGORIES}
        error={errors.category}
      />

      <View style={styles.switchRow}>
        <Text style={[styles.fieldLabel, { fontSize: layout.fontSize.label }]}>Online event</Text>
        <Switch
          value={form.isOnline}
          onValueChange={(isOnline) => setForm((prev) => ({ ...prev, isOnline }))}
          trackColor={{ true: ASSOC_COLORS.accentSoft, false: ASSOC_COLORS.border }}
          thumbColor={form.isOnline ? ASSOC_COLORS.accent : ASSOC_COLORS.muted}
        />
      </View>

      <AssociationTextField
        label={form.isOnline ? "Link or platform" : "Location"}
        value={form.location}
        onChangeText={(location) => setForm((prev) => ({ ...prev, location }))}
      />

      <Pressable
        onPress={() => setPickerMode("event")}
        style={[styles.dateField, { borderRadius: layout.radius.input, minHeight: controlHeight }]}
      >
        <Text style={[styles.fieldLabel, { fontSize: layout.fontSize.label }]}>Event date & time</Text>
        <Text style={styles.dateValue} numberOfLines={2}>
          {formatDateTime(form.eventDate)}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setPickerMode("deadline")}
        style={[styles.dateField, { borderRadius: layout.radius.input, minHeight: controlHeight }]}
      >
        <Text style={[styles.fieldLabel, { fontSize: layout.fontSize.label }]}>
          Registration deadline (optional)
        </Text>
        <Text style={styles.dateValue} numberOfLines={2}>
          {form.registrationDeadline ? formatDateTime(form.registrationDeadline) : "Not set"}
        </Text>
      </Pressable>
      {errors.registrationDeadline ? (
        <Text style={styles.error}>{errors.registrationDeadline}</Text>
      ) : null}

      <AssociationTextField
        label="Max participants (optional)"
        value={form.maxParticipants}
        onChangeText={(maxParticipants) => setForm((prev) => ({ ...prev, maxParticipants }))}
        keyboardType="numeric"
        error={errors.maxParticipants}
      />

      <View style={{ marginBottom: layout.space("md"), gap: 8 }}>
        <Text style={[styles.fieldLabel, { fontSize: layout.fontSize.label }]}>Cover image (optional)</Text>
        <AssociationActionButton
          label={uploadingCover ? "Uploading…" : form.coverImageUrl ? "Change cover" : "Upload cover"}
          variant="outline"
          loading={uploadingCover}
          onPress={() => void pickCover()}
        />
        {form.coverImageUrl ? <Text style={styles.hint}>Cover uploaded</Text> : null}
      </View>

      <View style={{ flexDirection: "row", gap: layout.space("sm"), flexWrap: "wrap" }}>
        <AssociationActionButton label={submitLabel} onPress={() => void handleSubmit()} loading={saving} />
        <AssociationActionButton label="Cancel" variant="outline" onPress={onCancel} disabled={saving} />
      </View>

      {pickerMode ? (
        <DateTimePicker
          value={pickerMode === "event" ? form.eventDate : form.registrationDeadline ?? new Date()}
          mode="datetime"
          onChange={onPickerChange}
        />
      ) : null}
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
  dateField: {
    width: "100%",
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
    backgroundColor: ASSOC_COLORS.inputBg,
    justifyContent: "center",
    gap: 2,
  },
  dateValue: {
    color: ASSOC_COLORS.foreground,
    fontSize: 15,
    fontWeight: "500",
  },
  error: {
    color: "#DC2626",
    fontSize: 12,
    marginBottom: 12,
  },
  hint: {
    color: ASSOC_COLORS.muted,
    fontSize: 12,
  },
});
