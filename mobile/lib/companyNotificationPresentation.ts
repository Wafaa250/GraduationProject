import type { LucideIcon } from "lucide-react-native";
import {
  Bell,
  Bookmark,
  Bot,
  Building2,
  FileText,
  Megaphone,
  UserMinus,
  UserPlus,
  UsersRound,
} from "lucide-react-native";

import type { AppNotification } from "@/api/notificationsApi";
import type { CompanyColorScheme } from "@/constants/companyTheme";

export type CompanyNotificationVisual = {
  icon: LucideIcon;
  accentColor: string;
  backgroundColor: string;
};

export function getCompanyNotificationVisual(
  notification: Pick<AppNotification, "eventType">,
  colors: CompanyColorScheme,
): CompanyNotificationVisual {
  const event = notification.eventType?.toLowerCase() ?? "";

  if (event.includes("ai_recommendations") || event.includes("team_recommendations")) {
    return {
      icon: Bot,
      accentColor: colors.accent,
      backgroundColor: colors.accentSoft,
    };
  }

  if (event.includes("student_recommendation_saved") || event.includes("team_recommendation_saved")) {
    return {
      icon: Bookmark,
      accentColor: colors.accentDark,
      backgroundColor: colors.accentSoft,
    };
  }

  if (event.includes("member_added")) {
    return {
      icon: UserPlus,
      accentColor: colors.success,
      backgroundColor: colors.successMuted,
    };
  }

  if (event.includes("member_removed")) {
    return {
      icon: UserMinus,
      accentColor: "#DC2626",
      backgroundColor: "rgba(220, 38, 38, 0.1)",
    };
  }

  if (event.includes("request_paused") || event.includes("request_reactivated") || event.includes("request_closed")) {
    return {
      icon: FileText,
      accentColor: colors.accent,
      backgroundColor: colors.accentSoft,
    };
  }

  if (event.includes("published") || event.includes("hub")) {
    return {
      icon: Megaphone,
      accentColor: colors.accent,
      backgroundColor: colors.accentSoft,
    };
  }

  if (event.includes("profile")) {
    return {
      icon: Building2,
      accentColor: colors.accentDark,
      backgroundColor: colors.accentSoft,
    };
  }

  if (event.includes("team")) {
    return {
      icon: UsersRound,
      accentColor: colors.accent,
      backgroundColor: colors.accentSoft,
    };
  }

  return {
    icon: Bell,
    accentColor: colors.accent,
    backgroundColor: colors.accentSoft,
  };
}
