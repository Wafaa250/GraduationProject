/** Reads session display fields only — no fabricated profile data. */

export function getDoctorHubSessionProfile() {
  const name = (localStorage.getItem("name") ?? "").trim();
  const email = (localStorage.getItem("email") ?? "").trim();

  const initials = name
    ? name
        .split(/\s+/)
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "—";

  return {
    displayName: name || "—",
    email,
    initials,
    title: "—",
    department: "—",
    faculty: "—",
    semester: "—",
  };
}
