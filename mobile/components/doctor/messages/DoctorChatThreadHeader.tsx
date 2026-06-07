import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

import type { ConversationUser } from "@/api/conversationsApi";
import { DoctorChatParticipantsSheet } from "@/components/doctor/messages/DoctorChatParticipantsSheet";
import {
  DOCTOR_RADIUS,
  doctorElevatedShadow,
} from "@/components/doctor/ui/doctorDesignSystem";
import { MessageConversationAvatar } from "@/components/messages/MessageConversationAvatar";
import { MobileBackButton } from "@/components/navigation/MobileBackButton";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { DoctorConversationKind } from "@/lib/doctorMessagesNavigation";
import { DOCTOR_ROUTES } from "@/lib/doctorRoutes";

type Props = {
  title: string;
  kind: DoctorConversationKind | null;
  participantCount: number;
  participants: ConversationUser[];
  showViewStudent: boolean;
  deleting: boolean;
  onViewStudent: () => void;
  onDelete: () => void;
};

export function DoctorChatThreadHeader({
  title,
  kind,
  participantCount,
  participants,
  showViewStudent,
  deleting,
  onViewStudent,
  onDelete,
}: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = createStyles(colors);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isTeam = kind === "team";
  const subtitle =
    participantCount > 0
      ? `${isTeam ? "Team" : "Direct"} · ${participantCount} member${participantCount === 1 ? "" : "s"}`
      : "Loading conversation…";

  const openParticipants = () => {
    if (participants.length === 0) return;
    setParticipantsOpen(true);
  };

  const handleMenuAction = (action: "student" | "delete") => {
    setMenuOpen(false);
    if (action === "student") onViewStudent();
    else onDelete();
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            paddingHorizontal: layout.horizontalPadding,
            paddingVertical: layout.space("sm"),
          },
        ]}
      >
        <View style={styles.row}>
          <MobileBackButton fallbackHref={DOCTOR_ROUTES.messages} color={colors.foreground} />

          <Pressable
            style={styles.identity}
            onPress={openParticipants}
            disabled={participants.length === 0}
            accessibilityRole="button"
            accessibilityLabel="Conversation details"
          >
            <MessageConversationAvatar name={title} size={layout.scale(40)} />
            <View style={styles.titleBlock}>
              <Text style={[styles.title, { fontSize: layout.fontSize.label }]} numberOfLines={1}>
                {title}
              </Text>
              <View style={styles.subtitleRow}>
                <Text style={[styles.subtitle, { fontSize: layout.fontSize.footer }]} numberOfLines={1}>
                  {subtitle}
                </Text>
                {participants.length > 0 ? (
                  <Ionicons name="chevron-down" size={14} color={colors.muted} />
                ) : null}
              </View>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setMenuOpen((v) => !v)}
            hitSlop={8}
            style={[styles.menuBtn, { backgroundColor: colors.inputBg, borderRadius: DOCTOR_RADIUS.pill }]}
            accessibilityRole="button"
            accessibilityLabel="Conversation options"
          >
            {deleting ? (
              <ActivityIndicator size="small" color={colors.muted} />
            ) : (
              <Ionicons name="ellipsis-vertical" size={18} color={colors.foreground} />
            )}
          </Pressable>
        </View>

        {menuOpen ? (
          <View
            style={[
              styles.menu,
              {
                top: layout.scale(52),
                right: layout.horizontalPadding,
                borderRadius: DOCTOR_RADIUS.md,
              },
            ]}
          >
            {showViewStudent ? (
              <Pressable style={styles.menuItem} onPress={() => handleMenuAction("student")}>
                <Ionicons name="person-outline" size={18} color={colors.primary} />
                <Text style={[styles.menuText, { fontSize: layout.fontSize.footer }]}>View student</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.menuItem} onPress={() => handleMenuAction("delete")}>
              <Ionicons name="trash-outline" size={18} color="#DC2626" />
              <Text style={[styles.menuText, styles.menuTextDanger, { fontSize: layout.fontSize.footer }]}>
                Delete conversation
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {menuOpen ? (
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)} accessibilityLabel="Close menu" />
      ) : null}

      <DoctorChatParticipantsSheet
        visible={participantsOpen}
        participants={participants}
        onClose={() => setParticipantsOpen(false)}
      />
    </>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.cardBg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      zIndex: 2,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    identity: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      minWidth: 0,
    },
    titleBlock: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    title: {
      color: colors.foreground,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    subtitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    subtitle: {
      color: colors.muted,
      fontWeight: "600",
      flexShrink: 1,
    },
    menuBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    menuBackdrop: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 1,
    },
    menu: {
      position: "absolute",
      minWidth: 200,
      backgroundColor: colors.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: 6,
      ...doctorElevatedShadow(colors),
      zIndex: 3,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },
    menuText: {
      color: colors.foreground,
      fontWeight: "600",
    },
    menuTextDanger: {
      color: "#DC2626",
    },
  });
}
