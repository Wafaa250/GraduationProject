export function requestStatusClass(status: string): string {
  if (status === "Active") return "cw-status-active";
  if (status === "Analyzing") return "cw-status-primary";
  return "bg-muted text-muted-foreground border-0";
}

export function collabStatusClass(status: string): string {
  if (status === "Active" || status === "Accepted") return "cw-status-primary";
  if (status === "Pending") return "bg-muted text-muted-foreground border-0";
  return "bg-muted text-muted-foreground border-0";
}
