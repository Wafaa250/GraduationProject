const FORMATS: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  "on-site": "On-site",
  flexible: "Flexible",
};

export function collaborationFormatLabel(value: string): string {
  if (!value) return "";
  return FORMATS[value.toLowerCase()] ?? value;
}
