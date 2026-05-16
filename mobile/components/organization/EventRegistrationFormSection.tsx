import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { Alert } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  createEventRegistrationForm,
  getEventRegistrationForm,
} from "@/api/eventRegistrationFormApi";
import { eventRegistrationFormPath } from "@/utils/eventRegistrationFormFields";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";

type Props = {
  eventId: number;
  eventTitle: string;
  disabled?: boolean;
};

export function EventRegistrationFormSection({ eventId, eventTitle, disabled }: Props) {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [fieldCount, setFieldCount] = useState(0);
  const [hasForm, setHasForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const form = await getEventRegistrationForm(eventId);
      setHasForm(!!form);
      setFieldCount(form?.fields?.length ?? 0);
    } catch {
      setHasForm(false);
      setFieldCount(0);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const createForm = async () => {
    setCreating(true);
    try {
      const title = eventTitle.trim() ? `${eventTitle.trim()} registration` : "Event registration";
      await createEventRegistrationForm(eventId, { title });
      router.push(eventRegistrationFormPath(eventId) as Href);
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Event registration form</Text>
      <Text style={styles.hint}>Design the form students fill out when registering for this event.</Text>
      {loading ? (
        <ActivityIndicator color={assocColors.accent} style={{ marginTop: spacing.sm }} />
      ) : hasForm ? (
        <>
          <Pressable
            onPress={() => router.push(eventRegistrationFormPath(eventId) as Href)}
            disabled={disabled}
            style={[styles.linkBtn, disabled && { opacity: 0.6 }]}
          >
            <Ionicons name="clipboard-outline" size={20} color={assocColors.accentDark} />
            <Text style={styles.linkTxt}>
              {fieldCount > 0 ? "Edit registration form" : "Design registration form"}
            </Text>
          </Pressable>
          <Text style={styles.meta}>
            {fieldCount > 0 ? `${fieldCount} field${fieldCount === 1 ? "" : "s"}` : "No fields yet"}
          </Text>
        </>
      ) : (
        <Pressable
          onPress={() => void createForm()}
          disabled={disabled || creating}
          style={[styles.createBtn, (disabled || creating) && { opacity: 0.7 }]}
        >
          <Ionicons name="clipboard-outline" size={20} color="#fff" />
          <Text style={styles.createTxt}>{creating ? "Creating…" : "Create registration form"}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: assocColors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  heading: { fontSize: 15, fontWeight: "800", color: assocColors.text, marginBottom: 4 },
  hint: { fontSize: 13, color: assocColors.muted, lineHeight: 18, marginBottom: spacing.md },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
    backgroundColor: assocColors.accentMuted,
  },
  linkTxt: { fontSize: 14, fontWeight: "800", color: assocColors.accentDark },
  meta: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: assocColors.muted,
    textAlign: "center",
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: assocColors.accent,
  },
  createTxt: { fontSize: 14, fontWeight: "800", color: "#fff" },
});
