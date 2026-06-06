import { LIGHT_HUB_COLORS } from "@/constants/hubColorSchemes";

/** Default light palette — prefer `useHubTheme().colors` for themed screens. */
export const HUB_COLORS = LIGHT_HUB_COLORS;

export type HubRoleType = "student" | "doctor" | "company" | "association";
