export type TeamColorTheme = {
  id: string;
  label: string;
  borderClass: string;
  iconClass: string;
  iconBgClass: string;
  headerClass: string;
  badgeClass: string;
  ringClass: string;
};

export const TEAM_COLOR_THEMES: TeamColorTheme[] = [
  {
    id: "purple",
    label: "Purple",
    borderClass: "border-l-purple-500",
    iconClass: "text-purple-600",
    iconBgClass: "bg-purple-500/12",
    headerClass: "bg-gradient-to-r from-purple-500/14 via-purple-500/6 to-transparent",
    badgeClass: "bg-purple-500/12 text-purple-700",
    ringClass: "ring-purple-500/25",
  },
  {
    id: "blue",
    label: "Blue",
    borderClass: "border-l-blue-500",
    iconClass: "text-blue-600",
    iconBgClass: "bg-blue-500/12",
    headerClass: "bg-gradient-to-r from-blue-500/14 via-blue-500/6 to-transparent",
    badgeClass: "bg-blue-500/12 text-blue-700",
    ringClass: "ring-blue-500/25",
  },
  {
    id: "green",
    label: "Green",
    borderClass: "border-l-emerald-500",
    iconClass: "text-emerald-600",
    iconBgClass: "bg-emerald-500/12",
    headerClass: "bg-gradient-to-r from-emerald-500/14 via-emerald-500/6 to-transparent",
    badgeClass: "bg-emerald-500/12 text-emerald-700",
    ringClass: "ring-emerald-500/25",
  },
  {
    id: "orange",
    label: "Orange",
    borderClass: "border-l-orange-500",
    iconClass: "text-orange-600",
    iconBgClass: "bg-orange-500/12",
    headerClass: "bg-gradient-to-r from-orange-500/14 via-orange-500/6 to-transparent",
    badgeClass: "bg-orange-500/12 text-orange-700",
    ringClass: "ring-orange-500/25",
  },
  {
    id: "pink",
    label: "Pink",
    borderClass: "border-l-pink-500",
    iconClass: "text-pink-600",
    iconBgClass: "bg-pink-500/12",
    headerClass: "bg-gradient-to-r from-pink-500/14 via-pink-500/6 to-transparent",
    badgeClass: "bg-pink-500/12 text-pink-700",
    ringClass: "ring-pink-500/25",
  },
];

export function getTeamColorTheme(teamIndex: number): TeamColorTheme {
  return TEAM_COLOR_THEMES[((teamIndex % TEAM_COLOR_THEMES.length) + TEAM_COLOR_THEMES.length) % TEAM_COLOR_THEMES.length];
}
