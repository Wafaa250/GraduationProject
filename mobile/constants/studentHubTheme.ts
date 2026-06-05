import { AUTH_COLORS } from "@/constants/authTheme";

export const HUB_COLORS = {
  ...AUTH_COLORS,
  cardShadow: "rgba(15, 23, 42, 0.06)",
  student: "#6366F1",
  doctor: "#0EA5E9",
  company: "#F59E0B",
  association: "#10B981",
  tabBarBg: "#FFFFFF",
  tabBarBorder: "#E8E4F5",
  roleBg: {
    student: "rgba(99, 102, 241, 0.12)",
    doctor: "rgba(14, 165, 233, 0.12)",
    company: "rgba(245, 158, 11, 0.12)",
    association: "rgba(16, 185, 129, 0.12)",
  } as const,
};

export type HubRoleType = keyof typeof HUB_COLORS.roleBg;
