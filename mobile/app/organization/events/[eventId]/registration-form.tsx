import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { Alert } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getOrganizationEvent } from "@/api/organizationEventsApi";
import {
  getEventRegistrationForm,
  type EventRegistrationForm,
} from "@/api/eventRegistrationFormApi";
import { EventRegistrationFormEditor } from "@/components/organization/EventRegistrationFormEditor";
import { OrgScreenHeader } from "@/components/organization/OrgScreenHeader";
import { assocColors } from "@/constants/associationTheme";
import { spacing } from "@/constants/responsiveLayout";

export default function OrganizationEventRegistrationFormScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const id = Number(eventId);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState("");
  const [form, setForm] = useState<EventRegistrationForm | null>(null);
  const kav = Platform.OS === "ios" ? "padding" : undefined;
  const backHref = Number.isFinite(id)
    ? (`/organization/events/${id}/edit` as Href)
    : ("/organization/events" as Href);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [event, regForm] = await Promise.all([
        getOrganizationEvent(id),
        getEventRegistrationForm(id),
      ]);
      if (!regForm) {
        Alert.alert("Error", "Registration form not found");
        router.replace(backHref);
        return;
      }
      setEventTitle(event.title);
      setForm(regForm);
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
      router.replace(backHref);
    } finally {
      setLoading(false);
    }
  }, [id, backHref]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <OrgScreenHeader
        title={eventTitle.trim() ? `${eventTitle} form` : "Registration form"}
        onBack={() => router.replace(backHref)}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={kav}
        keyboardVerticalOffset={insets.top + spacing.sm}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={assocColors.accent} size="large" />
          </View>
        ) : form ? (
          <EventRegistrationFormEditor eventId={id} eventTitle={eventTitle} form={form} />
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: assocColors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
