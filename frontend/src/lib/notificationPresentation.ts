import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Bell,
  Bot,
  GraduationCap,
  MessageCircle,
  Users,
} from "lucide-react";
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
  accentClass: string;
  bgClass: string;
};

export function getNotificationVisual(n: GraduationNotification): NotificationVisual {
  const category = n.category?.toLowerCase() ?? "";
  const event = n.eventType?.toLowerCase() ?? "";

  if (category === "chat" || event.includes("message") || event.includes("conversation")) {
    return {
      kind: "message",
      icon: MessageCircle,
      accentClass: "text-blue-600",
      bgClass: "bg-blue-500/12",
    };
  }

  if (
    category === "ai" ||
    event.includes("ai_") ||
    event.includes("generation")
  ) {
    return {
      kind: "ai",
      icon: Bot,
      accentClass: "text-cyan-600",
      bgClass: "bg-cyan-500/12",
    };
  }

  if (
    event.includes("supervision") ||
    event.includes("supervisor") ||
    event.includes("invite") && category === "graduation_project"
  ) {
    return {
      kind: "supervision",
      icon: GraduationCap,
      accentClass: "text-orange-600",
      bgClass: "bg-orange-500/12",
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
        accentClass: "text-red-600",
        bgClass: "bg-red-500/12",
      };
    }
    return {
      kind: event.includes("team") || event.includes("invite") || event.includes("member")
        ? "team"
        : "course",
      icon: event.includes("team") || event.includes("invite") ? Users : GraduationCap,
      accentClass: event.includes("team") || event.includes("invite") ? "text-purple-600" : "text-emerald-600",
      bgClass: event.includes("team") || event.includes("invite") ? "bg-purple-500/12" : "bg-emerald-500/12",
    };
  }

  if (event.includes("deleted") || event.includes("rejected") || event.includes("removed")) {
    return {
      kind: "warning",
      icon: AlertTriangle,
      accentClass: "text-red-600",
      bgClass: "bg-red-500/12",
    };
  }

  return {
    kind: "default",
    icon: Bell,
    accentClass: "text-primary",
    bgClass: "bg-primary/10",
  };
}

export function getNotificationToastTitle(n: GraduationNotification): string {
  const title = n.title?.trim();
  if (title) return title;
  return "New notification";
}
