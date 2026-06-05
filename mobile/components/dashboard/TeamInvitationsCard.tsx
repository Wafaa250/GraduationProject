import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { TeamInvitationView } from "@/lib/dashboardMappers";

type Props = {
  invitations: TeamInvitationView[];
  busyId: string | null;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
};

export function TeamInvitationsCard({ invitations, busyId, onAccept, onDecline }: Props) {
  const layout = useResponsiveLayout();
  const empty = invitations.length === 0;

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: layout.radius.button,
          padding: layout.space("lg"),
          marginBottom: layout.space("md"),
        },
      ]}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { fontSize: layout.scale(18) }]}>Team Invitations</Text>
          <Text style={[styles.subtitle, { fontSize: layout.fontSize.footer }]}>
            Pending invitations from project teams.
          </Text>
        </View>
        {!empty ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{invitations.length} pending</Text>
          </View>
        ) : null}
      </View>

      {empty ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { borderRadius: layout.radius.button }]}>
            <Ionicons name="mail-open-outline" size={28} color={HUB_COLORS.muted} />
          </View>
          <Text style={[styles.emptyTitle, { fontSize: layout.fontSize.label }]}>No pending invitations</Text>
          <Text style={[styles.emptyText, { fontSize: layout.fontSize.footer }]}>
            When teams invite you to collaborate, their pending invitations will appear right here.
          </Text>
        </View>
      ) : (
        <View style={{ gap: layout.space("sm") }}>
          {invitations.map((inv) => {
            const busy = busyId === inv.id;
            return (
              <View
                key={inv.id}
                style={[styles.inviteRow, { borderRadius: layout.radius.input, padding: layout.space("md") }]}
              >
                <View style={styles.inviteTop}>
                  <View
                    style={[
                      styles.avatar,
                      {
                        width: layout.scale(44),
                        height: layout.scale(44),
                        borderRadius: layout.radius.input,
                      },
                    ]}
                  >
                    <Text style={[styles.avatarText, { fontSize: layout.scale(14) }]}>
                      {inv.inviterInitials}
                    </Text>
                  </View>
                  <View style={styles.inviteMeta}>
                    <Text style={[styles.inviteTitle, { fontSize: layout.fontSize.label }]} numberOfLines={2}>
                      {inv.inviter}{" "}
                      <Text style={styles.inviteMuted}>invited you</Text>
                    </Text>
                    <Text style={[styles.inviteDetail, { fontSize: layout.fontSize.footer }]} numberOfLines={2}>
                      {inv.team} · {inv.project}
                    </Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.acceptBtn, { borderRadius: layout.radius.input, flex: 1 }]}
                    onPress={() => onAccept(inv.id)}
                    disabled={busy}
                  >
                    {busy ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        <Text style={styles.acceptText}>Accept</Text>
                      </>
                    )}
                  </Pressable>
                  <Pressable
                    style={[styles.declineBtn, { borderRadius: layout.radius.input, flex: 1 }]}
                    onPress={() => onDecline(inv.id)}
                    disabled={busy}
                  >
                    <Ionicons name="close" size={16} color={HUB_COLORS.foreground} />
                    <Text style={styles.declineText}>Decline</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: HUB_COLORS.cardBg,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  title: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
  },
  subtitle: {
    color: HUB_COLORS.muted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: HUB_COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: HUB_COLORS.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    backgroundColor: HUB_COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
    textAlign: "center",
  },
  emptyText: {
    color: HUB_COLORS.muted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
  inviteRow: {
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    backgroundColor: HUB_COLORS.background,
    gap: 12,
  },
  inviteTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  avatar: {
    backgroundColor: HUB_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  inviteMeta: {
    flex: 1,
    gap: 4,
  },
  inviteTitle: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
  },
  inviteMuted: {
    fontWeight: "400",
    color: HUB_COLORS.muted,
  },
  inviteDetail: {
    color: HUB_COLORS.muted,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  acceptBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: HUB_COLORS.primary,
    paddingVertical: 10,
    minHeight: 40,
  },
  acceptText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  declineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: HUB_COLORS.inputBg,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    paddingVertical: 10,
    minHeight: 40,
  },
  declineText: {
    color: HUB_COLORS.foreground,
    fontWeight: "600",
    fontSize: 14,
  },
});
