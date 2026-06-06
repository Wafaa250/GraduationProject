import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ConversationUser } from "@/api/conversationsApi";
import { MessageConversationAvatar } from "@/components/messages/MessageConversationAvatar";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  visible: boolean;
  participants: ConversationUser[];
  onClose: () => void;
};

export function DoctorChatParticipantsSheet({ visible, participants, onClose }: Props) {
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const { colors } = useHubTheme();
  const styles = createStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close participants">
        <Pressable
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, layout.space("md")),
              borderTopLeftRadius: layout.radius.input + 4,
              borderTopRightRadius: layout.radius.input + 4,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={[styles.title, { fontSize: layout.fontSize.label }]}>Participants</Text>
          <Text style={[styles.subtitle, { fontSize: layout.fontSize.footer, marginBottom: layout.space("md") }]}>
            {participants.length} member{participants.length === 1 ? "" : "s"} in this conversation
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: layout.scale(320) }}>
            {participants.map((user) => (
              <View
                key={user.id}
                style={[
                  styles.row,
                  {
                    paddingVertical: layout.space("sm"),
                    gap: layout.space("sm"),
                  },
                ]}
              >
                <MessageConversationAvatar name={user.name} size={layout.scale(40)} />
                <View style={styles.rowText}>
                  <Text style={[styles.name, { fontSize: layout.fontSize.body }]} numberOfLines={1}>
                    {user.name}
                  </Text>
                  {user.email ? (
                    <Text style={[styles.email, { fontSize: layout.fontSize.footer }]} numberOfLines={1}>
                      {user.email}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.cardBg,
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    handle: {
      alignSelf: "center",
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 14,
    },
    title: {
      color: colors.foreground,
      fontWeight: "800",
    },
    subtitle: {
      color: colors.muted,
      fontWeight: "500",
      marginTop: 4,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    name: {
      color: colors.foreground,
      fontWeight: "700",
    },
    email: {
      color: colors.muted,
      fontWeight: "500",
    },
  });
}
