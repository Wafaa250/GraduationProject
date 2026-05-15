import { useCallback, useEffect, useState } from "react";
import { Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams, type Href } from "expo-router";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getOrganizationEvent,
  updateOrganizationEvent,
  type StudentOrganizationEvent,
} from "@/api/organizationEventsApi";
import { OrganizationEventForm } from "@/components/organization/OrganizationEventForm";
import { OrgScreenHeader } from "@/components/organization/OrgScreenHeader";
import { assocColors } from "@/constants/associationTheme";
import { spacing } from "@/constants/responsiveLayout";

export default function OrganizationEventEditScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const id = Number(eventId);
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<StudentOrganizationEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const kav = Platform.OS === "ios" ? "padding" : undefined;

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getOrganizationEvent(id);
      setEvent(data);
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <OrgScreenHeader title="Edit event" onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={kav}
        keyboardVerticalOffset={insets.top + spacing.sm}
      >
        {loading || !event ? (
          <View style={styles.center}>
            <ActivityIndicator color={assocColors.accent} size="large" />
          </View>
        ) : (
          <OrganizationEventForm
            initialEvent={event}
            submitLabel="Save changes"
            saving={saving}
            onCancel={() => router.back()}
            onSubmit={async (payload) => {
              setSaving(true);
              try {
                await updateOrganizationEvent(event.id, payload);
                router.replace(`/organization/events/${event.id}` as Href);
              } catch (e) {
                Alert.alert("Error", parseApiErrorMessage(e));
              } finally {
                setSaving(false);
              }
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: assocColors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
