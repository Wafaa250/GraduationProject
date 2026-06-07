export type DoctorHubMetricTone = "primary" | "info" | "accent" | "success" | "warning" | "danger";

export type DoctorHubMetricSlot = {
  key: string;
  label: string;
  subLabel: string;
  tone: DoctorHubMetricTone;
  icon: "file-text" | "activity" | "book-open" | "users" | "message-square";
};

export const DOCTOR_HUB_METRIC_SLOTS: DoctorHubMetricSlot[] = [
  {
    key: "pending",
    label: "Pending Requests",
    subLabel: "Awaiting your review",
    tone: "primary",
    icon: "file-text",
  },
  {
    key: "active",
    label: "Active Projects",
    subLabel: "Across your cohorts",
    tone: "primary",
    icon: "activity",
  },
  {
    key: "courses",
    label: "Courses",
    subLabel: "Current term",
    tone: "primary",
    icon: "book-open",
  },
  {
    key: "students",
    label: "Students",
    subLabel: "Supervised",
    tone: "primary",
    icon: "users",
  },
  {
    key: "messages",
    label: "Unread Messages",
    subLabel: "From your teams",
    tone: "primary",
    icon: "message-square",
  },
];
