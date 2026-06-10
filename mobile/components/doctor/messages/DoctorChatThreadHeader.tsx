import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

import type { ConversationUser } from "@/api/conversationsApi";
import { ChatParticipantsSheet } from "@/components/messages/ChatParticipantsSheet";
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
  currentUserId: number | null;
  showViewStudent: boolean;
  deleting: boolean;
  showBack?: boolean;
  onOpenConversations?: () => void;
  onViewStudent: () => void;
  onDelete: () => void;
};

export function DoctorChatThreadHeader({
  title,
  kind,
  participantCount,
  participants,
  currentUserId,
  showViewStudent,
  deleting,
  showBack = true,
  onOpenConversations,
  onViewStudent,
  onDelete,
}: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = createStyles(colors);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isTeam = kind === "team";
  const showParticipants = isTeam && participants.length > 0;
  const subtitle =
    participantCount > 0
      ? `${isTeam ? "Team" : "Direct"} · ${participantCount} member${participantCount === 1 ? "" : "s"}`
      : "Loading conversation…";

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
          {showBack ? <MobileBackButton fallbackHref={DOCTOR_ROUTES.messages} color={colors.foreground} /> : null}
          {onOpenConversations ? (
            <Pressable
              onPress={onOpenConversations}
              hitSlop={8}
              style={[styles.actionBtn, { backgroundColor: colors.inputBg, borderRadius: DOCTOR_RADIUS.pill }]}
              accessibilityRole="button"
              accessibilityLabel="Open conversations"
            >
              <Ionicons name="chatbubbles-outline" size={18} color={colors.foreground} />
            </Pressable>
          ) : null}

          <View style={styles.identity}>
            <MessageConversationAvatar name={title} size={layout.scale(40)} />
            <View style={styles.titleBlock}>
              <Text style={[styles.title, { fontSize: layout.fontSize.label }]} numberOfLines={1}>
                {title}
              </Text>
              <Text style={[styles.subtitle, { fontSize: layout.fontSize.footer }]} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          </View>

          {showParticipants ? (
            <Pressable
              onPress={() => setParticipantsOpen(true)}
              hitSlop={8}
              style={[styles.actionBtn, { backgroundColor: colors.inputBg, borderRadius: DOCTOR_RADIUS.pill }]}
              accessibilityRole="button"
              accessibilityLabel="View participants"
            >
              <Ionicons name="people-outline" size={18} color={colors.foreground} />
            </Pressable>
          ) : null}

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

      <ChatParticipantsSheet
        visible={participantsOpen}
        participants={participants}
        currentUserId={currentUserId}
        colors={colors}
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
    subtitle: {
      color: colors.muted,
      fontWeight: "600",
      flexShrink: 1,
    },
    actionBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
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
