import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getOrganizationEventRegistration,
  type EventRegistrationDetail,
} from "@/api/eventRegistrationsApi";
import { AssociationLoadingState } from "@/components/association/AssociationLoadingState";
import { AssociationPageHeader } from "@/components/association/AssociationPageHeader";
import { AssociationWorkspaceScreen } from "@/components/association/AssociationWorkspaceScreen";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { associationEventPath } from "@/lib/associationRoutes";

export default function AssociationEventRegistrationDetailScreen() {
  const layout = useResponsiveLayout();
  const { eventId, registrationId } = useLocalSearchParams<{
    eventId: string;
    registrationId: string;
  }>();
  const [detail, setDetail] = useState<EventRegistrationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const evId = Number(eventId);
    const regId = Number(registrationId);
    if (!Number.isFinite(evId) || !Number.isFinite(regId)) return;
    setLoading(true);
    try {
      const data = await getOrganizationEventRegistration(evId, regId);
      setDetail(data);
    } catch (err) {
      Alert.alert("Could not load registration", parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [eventId, registrationId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <AssociationWorkspaceScreen
        showBack
        fallbackHref={associationEventPath(Number(eventId))}
        navTitle="Registration"
      >
        <AssociationLoadingState message="Loading registration…" />
      </AssociationWorkspaceScreen>
    );
  }

  if (!detail) {
    return (
      <AssociationWorkspaceScreen
        showBack
        fallbackHref={associationEventPath(Number(eventId))}
        navTitle="Registration"
      >
        <Text style={styles.muted}>Registration not found.</Text>
      </AssociationWorkspaceScreen>
    );
  }

  return (
    <AssociationWorkspaceScreen
      showBack
      fallbackHref={associationEventPath(Number(eventId))}
      navTitle="Registration"
    >
      <AssociationPageHeader title="Registration detail" subtitle={detail.eventTitle} />
      <View style={[styles.card, { borderRadius: layout.radius.input, padding: layout.space("md") }]}>
        <Text style={styles.name}>{detail.studentName}</Text>
        {detail.studentEmail ? <Text style={styles.meta}>{detail.studentEmail}</Text> : null}
        {detail.studentMajor ? <Text style={styles.meta}>{detail.studentMajor}</Text> : null}
        <Text style={styles.meta}>
          Submitted {new Date(detail.submittedAt).toLocaleString()}
        </Text>
      </View>

      <View style={{ gap: layout.space("sm"), width: "100%" }}>
        {detail.answers.map((answer) => (
          <View key={answer.fieldId} style={[styles.answerCard, { borderRadius: layout.radius.input, padding: layout.space("md") }]}>
            <Text style={styles.question}>{answer.fieldLabel}</Text>
            <Text style={styles.answer}>{answer.answerValue || "—"}</Text>
          </View>
        ))}
      </View>
    </AssociationWorkspaceScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ASSOC_COLORS.cardBg,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
    width: "100%",
    marginBottom: 16,
    gap: 4,
  },
  name: {
    fontWeight: "800",
    fontSize: 18,
    color: ASSOC_COLORS.foreground,
  },
  meta: {
    color: ASSOC_COLORS.muted,
    fontSize: 13,
  },
  answerCard: {
    backgroundColor: ASSOC_COLORS.cardBg,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
    width: "100%",
  },
  question: {
    fontWeight: "700",
    color: ASSOC_COLORS.foreground,
    marginBottom: 4,
  },
  answer: {
    color: ASSOC_COLORS.muted,
    lineHeight: 20,
  },
  muted: {
    color: ASSOC_COLORS.muted,
    textAlign: "center",
  },
});
