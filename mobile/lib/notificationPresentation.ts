import type { LucideIcon } from "lucide-react-native";
import {
  AlertTriangle,
  Bell,
  Bot,
  GraduationCap,
  MessageCircle,
  Users,
} from "lucide-react-native";

import type { GraduationNotification } from "@/api/notificationsApi";

export type NotificationVisualKind =
  | "message"
  | "team"
  | "course"
  | "supervision"
  | "ai"
  | "warning"
  | "default";

export type NotificationVisual = {
  kind: NotificationVisualKind;
  icon: LucideIcon;
  accentColor: string;
  backgroundColor: string;
};

export function getNotificationVisual(n: GraduationNotification): NotificationVisual {
  const category = n.category?.toLowerCase() ?? "";
  const event = n.eventType?.toLowerCase() ?? "";

  if (category === "chat" || event.includes("message") || event.includes("conversation")) {
    return {
      kind: "message",
      icon: MessageCircle,
      accentColor: "#2563EB",
      backgroundColor: "rgba(37, 99, 235, 0.12)",
    };
  }

  if (category === "ai" || event.includes("ai_") || event.includes("generation")) {
    return {
      kind: "ai",
      icon: Bot,
      accentColor: "#0891B2",
      backgroundColor: "rgba(8, 145, 178, 0.12)",
    };
  }

  if (
    event.includes("supervision") ||
    event.includes("supervisor") ||
    (event.includes("invite") && category === "graduation_project")
  ) {
    return {
      kind: "supervision",
      icon: GraduationCap,
      accentColor: "#EA580C",
      backgroundColor: "rgba(234, 88, 12, 0.12)",
    };
  }

  if (
    category === "course" ||
    event.includes("course_") ||
    event.includes("team") ||
    event.includes("invite") ||
    event.includes("member")
  ) {
    if (event.includes("removed") || event.includes("rejected") || event.includes("deleted")) {
      return {
        kind: "warning",
        icon: AlertTriangle,
        accentColor: "#DC2626",
        backgroundColor: "rgba(220, 38, 38, 0.1)",
      };
    }
    const isTeam = event.includes("team") || event.includes("invite") || event.includes("member");
    return {
      kind: isTeam ? "team" : "course",
      icon: isTeam ? Users : GraduationCap,
      accentColor: isTeam ? "#9333EA" : "#059669",
      backgroundColor: isTeam ? "rgba(147, 51, 234, 0.12)" : "rgba(5, 150, 105, 0.12)",
    };
  }

  if (event.includes("deleted") || event.includes("rejected") || event.includes("removed")) {
    return {
      kind: "warning",
      icon: AlertTriangle,
      accentColor: "#DC2626",
      backgroundColor: "rgba(220, 38, 38, 0.1)",
    };
  }

  return {
    kind: "default",
    icon: Bell,
    accentColor: "#6366F1",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  };
}

export function getNotificationToastTitle(n: GraduationNotification): string {
  const title = n.title?.trim();
  if (title) return title;
  return "New notification";
}
