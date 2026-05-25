/** UI-only metric slot definitions — labels and styling; values come from APIs later. */

export type DoctorHubMetricTone = "primary" | "info" | "accent" | "success" | "warning" | "danger";

export type DoctorHubMetricSlot = {
  key: string;
  label: string;
  subLabel: string;
  tone: DoctorHubMetricTone;
  icon: "FileText" | "Activity" | "BookOpen" | "Users" | "MessageSquare";
};

export const DOCTOR_HUB_METRIC_SLOTS: DoctorHubMetricSlot[] = [
  {
    key: "pending",
    label: "Pending Requests",
    subLabel: "Awaiting your review",
    tone: "primary",
    icon: "FileText",
  },
  {
    key: "active",
    label: "Active Projects",
    subLabel: "Across your cohorts",
    tone: "info",
    icon: "Activity",
  },
  {
    key: "courses",
    label: "Courses",
    subLabel: "Current term",
    tone: "accent",
    icon: "BookOpen",
  },
  {
    key: "students",
    label: "Students Supervised",
    subLabel: "Under your mentorship",
    tone: "success",
    icon: "Users",
  },
  {
    key: "messages",
    label: "Unread Messages",
    subLabel: "From your teams",
    tone: "warning",
    icon: "MessageSquare",
  },
];
