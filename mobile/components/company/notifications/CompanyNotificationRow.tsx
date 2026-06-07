import { ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { AppNotification } from "@/api/notificationsApi";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS, companyCardShadow } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { formatRelativeTime } from "@/lib/companyDashboardUtils";
import { getCompanyNotificationVisual } from "@/lib/companyNotificationPresentation";

type Props = {
  notification: AppNotification;
  showChevron?: boolean;
  onPress: () => void;
};

export function CompanyNotificationRow({ notification, showChevron = true, onPress }: Props) {
  const colors = useCompanyTheme();
  const unread = !notification.readAt;
  const visual = getCompanyNotificationVisual(notification, colors);
  const Icon = visual.icon;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: unread ? colors.accentMuted : colors.cardBg,
          borderColor: unread ? colors.accentBorder : colors.border,
          opacity: pressed ? 0.96 : 1,
          ...companyCardShadow(colors),
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: unread }}
    >
      <View style={[styles.iconCircle, { backgroundColor: visual.backgroundColor }]}>
        <Icon size={17} color={visual.accentColor} strokeWidth={2.2} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.titleWrap}>
            {unread ? (
              <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />
            ) : null}
            <Text
              style={[
                styles.title,
                {
                  color: unread ? colors.foreground : colors.textSecondary,
                  fontWeight: unread ? "700" : "600",
                },
              ]}
              numberOfLines={2}
            >
              {notification.title}
            </Text>
          </View>
          {showChevron ? (
            <View style={[styles.chevronWrap, { backgroundColor: colors.surfaceMuted }]}>
              <ChevronRight
                size={16}
                color={unread ? colors.accent : colors.subtle}
                strokeWidth={2.4}
              />
            </View>
          ) : null}
        </View>

        {notification.body?.trim() ? (
          <Text
            style={[
              styles.body,
              {
                color: unread ? colors.textSecondary : colors.muted,
              },
            ]}
            numberOfLines={2}
          >
            {notification.body}
          </Text>
        ) : null}

        <Text style={[styles.time, { color: colors.subtle }]}>
          {formatRelativeTime(notification.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: COMPANY_RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  titleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    minWidth: 0,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: -0.25,
  },
  body: {
    fontSize: 13,
    lineHeight: 17,
    marginTop: 2,
    fontWeight: "400",
  },
  time: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
    letterSpacing: 0.1,
  },
  chevronWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
});
