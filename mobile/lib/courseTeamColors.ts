export type TeamColorTheme = {
  label: string;
  accent: string;
  soft: string;
};

const THEMES: TeamColorTheme[] = [
  { label: "Purple", accent: "#7C3AED", soft: "rgba(124, 58, 237, 0.12)" },
  { label: "Blue", accent: "#2563EB", soft: "rgba(37, 99, 235, 0.12)" },
  { label: "Green", accent: "#059669", soft: "rgba(5, 150, 105, 0.12)" },
  { label: "Orange", accent: "#EA580C", soft: "rgba(234, 88, 12, 0.12)" },
  { label: "Pink", accent: "#DB2777", soft: "rgba(219, 39, 119, 0.12)" },
];

export function getTeamColorTheme(teamIndex: number): TeamColorTheme {
  return THEMES[((teamIndex % THEMES.length) + THEMES.length) % THEMES.length];
}
