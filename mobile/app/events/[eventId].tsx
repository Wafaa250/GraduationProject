import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  getMyEventRegistration,
  submitEventRegistration,
} from "@/api/eventRegistrationsApi";
import {
  getPublicOrganizationEvent,
  type PublicOrganizationEventDetail,
} from "@/api/publicProfilesApi";
import {
  DynamicFormFields,
  buildEmptyFormValues,
  type FormFieldsValueMap,
} from "@/components/forms/DynamicFormFields";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { PublicProfileShell } from "@/components/student/PublicProfileShell";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { formatEventDate, getRegistrationDeadlineStatus } from "@/lib/eventFormUtils";
import {
  eventFieldUsesOptions,
  eventRegistrationFieldToFormField,
  eventRegistrationValuesToPayload,
  normalizeEventFieldType,
  validateEventRegistrationAnswers,
} from "@/lib/eventRegistrationFormFields";

export default function StudentOrganizationEventDetailScreen() {
  const { eventId, orgId } = useLocalSearchParams<{ eventId: string; orgId?: string }>();
  const numericEventId = Number(eventId);
  const orgIdFromQuery = Number(orgId ?? 0);

  const [event, setEvent] = useState<PublicOrganizationEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationStatusLoading, setRegistrationStatusLoading] = useState(true);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formValues, setFormValues] = useState<FormFieldsValueMap>({});
  const [submitting, setSubmitting] = useState(false);

  const registrationFields = useMemo(
    () =>
      [...(event?.registrationForm?.fields ?? [])].sort(
        (a, b) => a.displayOrder - b.displayOrder || a.id - b.id,
      ),
    [event?.registrationForm?.fields],
  );

  const formFieldDefs = useMemo(
    () => registrationFields.map(eventRegistrationFieldToFormField),
    [registrationFields],
  );

  useEffect(() => {
    if (!Number.isFinite(numericEventId) || orgIdFromQuery <= 0) {
      setError("Invalid event link.");
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        setEvent(await getPublicOrganizationEvent(orgIdFromQuery, numericEventId));
      } catch (err) {
        setError(parseApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [numericEventId, orgIdFromQuery]);

  useEffect(() => {
    if (!Number.isFinite(numericEventId) || orgIdFromQuery <= 0) return;
    setRegistrationStatusLoading(true);
    void getMyEventRegistration(orgIdFromQuery, numericEventId)
      .then((status) => setHasRegistered(!!status.hasSubmitted))
      .catch(() => setHasRegistered(false))
      .finally(() => setRegistrationStatusLoading(false));
  }, [numericEventId, orgIdFromQuery]);

  useEffect(() => {
    if (formFieldDefs.length > 0) {
      setFormValues(buildEmptyFormValues(formFieldDefs));
    }
  }, [formFieldDefs]);

  const registrationClosed = useMemo(
    () => getRegistrationDeadlineStatus(event?.registrationDeadline ?? null) === "closed",
    [event?.registrationDeadline],
  );

  const canRegister =
    !hasRegistered &&
    registrationFields.length > 0 &&
    !registrationClosed &&
    !registrationStatusLoading;

  const handleFieldChange = (fieldId: number, patch: Partial<FormFieldsValueMap[number]>) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: { ...(prev[fieldId] ?? { value: "", values: [] }), ...patch },
    }));
  };

  const handleSubmit = async () => {
    if (!event || orgIdFromQuery <= 0) return;
    const validationError = validateEventRegistrationAnswers(registrationFields, formValues);
    if (validationError) {
      Alert.alert("Registration incomplete", validationError);
      return;
    }
    setSubmitting(true);
    try {
      const payload = eventRegistrationValuesToPayload(registrationFields, formValues);
      await submitEventRegistration(orgIdFromQuery, numericEventId, payload);
      setHasRegistered(true);
      setShowForm(false);
      Alert.alert("Registered", "Your registration was submitted successfully.");
    } catch (err) {
      Alert.alert("Registration failed", parseApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PublicProfileShell title="Event" fallbackHref="/feed">
        <ActivityIndicator color={HUB_COLORS.primary} />
      </PublicProfileShell>
    );
  }

  if (error || !event) {
    return (
      <PublicProfileShell title="Event" fallbackHref="/feed">
        <Text style={styles.error}>{error ?? "Event not found."}</Text>
      </PublicProfileShell>
    );
  }

  const cover = event.coverImageUrl ? resolveApiFileUrl(event.coverImageUrl) : null;

  return (
    <PublicProfileShell title={event.title} fallbackHref="/feed">
      <ScrollView contentContainerStyle={styles.scroll}>
        {cover ? <Image source={{ uri: cover }} style={styles.cover} /> : null}
        <Text style={styles.org}>{event.organizationName}</Text>
        <Text style={styles.meta}>
          {[formatEventDate(event.eventDate), event.location, event.isOnline ? "Online" : null]
            .filter(Boolean)
            .join(" · ")}
        </Text>
        <Text style={styles.description}>{event.description}</Text>

        <HubSectionCard title="Event registration">
          {registrationStatusLoading ? (
            <View style={styles.inlineLoading}>
              <ActivityIndicator color={HUB_COLORS.primary} size="small" />
              <Text style={styles.muted}>Checking your registration status…</Text>
            </View>
          ) : hasRegistered ? (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>You are registered for this event</Text>
            </View>
          ) : registrationFields.length === 0 ? (
            <Text style={styles.muted}>Registration is not open for this event yet.</Text>
          ) : registrationClosed ? (
            <Text style={styles.muted}>Registration has closed for this event.</Text>
          ) : !showForm ? (
            <Pressable style={styles.primaryBtn} onPress={() => setShowForm(true)}>
              <Text style={styles.primaryBtnText}>Register for this event</Text>
            </Pressable>
          ) : (
            <>
              <DynamicFormFields
                fields={formFieldDefs}
                values={formValues}
                onChange={handleFieldChange}
                normalizeType={normalizeEventFieldType}
                fieldUsesOptions={eventFieldUsesOptions}
                multipleChoiceStyle="select"
                disabled={submitting}
              />
              <View style={styles.actions}>
                <Pressable
                  style={[styles.primaryBtn, submitting && styles.btnDisabled]}
                  onPress={() => void handleSubmit()}
                  disabled={submitting || !canRegister}
                >
                  <Text style={styles.primaryBtnText}>
                    {submitting ? "Submitting…" : "Submit registration"}
                  </Text>
                </Pressable>
                <Pressable style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
              </View>
            </>
          )}
        </HubSectionCard>
      </ScrollView>
    </PublicProfileShell>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 14, paddingBottom: 24 },
  error: { color: "#DC2626", lineHeight: 22 },
  cover: { width: "100%", height: 180, borderRadius: 12, backgroundColor: HUB_COLORS.primarySoft },
  org: { fontWeight: "700", color: HUB_COLORS.primary, fontSize: 13 },
  meta: { color: HUB_COLORS.muted, fontSize: 14 },
  description: { color: HUB_COLORS.foreground, lineHeight: 22, fontSize: 15 },
  muted: { color: HUB_COLORS.muted, fontSize: 14, lineHeight: 20 },
  inlineLoading: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusBadge: {
    backgroundColor: HUB_COLORS.primarySoft,
    padding: 12,
    borderRadius: 10,
  },
  statusText: { color: HUB_COLORS.primary, fontWeight: "600" },
  actions: { gap: 10, marginTop: 4 },
  primaryBtn: {
    backgroundColor: HUB_COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  cancelBtn: { alignItems: "center", paddingVertical: 8 },
  cancelBtnText: { color: HUB_COLORS.muted, fontWeight: "600" },
  btnDisabled: { opacity: 0.6 },
});
