import type { Href } from "expo-router";

import type { GraduationNotificationDto } from "@/api/notificationsApi";

/**
 * Maps a notification to a mobile route using the same intent as the web bells where possible.
 * Always returns a safe in-app path (never null) so navigation never crashes on unknown types.
 */
export function getNotificationTargetHref(
  n: GraduationNotificationDto,
  roleNorm: string,
): Href {
  const cat = (n.category ?? "").trim().toLowerCase();
  const et = (n.eventType ?? "").trim().toLowerCase();
  const isDoctor = roleNorm === "doctor";

  if (cat === "chat") {
    return "/ChatPage" as Href;
  }

  if (et === "section_message" || et === "team_message") {
    return "/ChatPage" as Href;
  }

  if (cat === "course") {
    if (isDoctor) {
      return "/doctor-dashboard" as Href;
    }
    return "/dashboard" as Href;
  }

  if (cat === "graduation_project") {
    if (isDoctor && et.includes("supervision")) {
      return "/doctor-dashboard" as Href;
    }
    return "/dashboard" as Href;
  }

  return (isDoctor ? "/doctor-dashboard" : "/dashboard") as Href;
}
