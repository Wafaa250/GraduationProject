import type { StudentDiscoveryContact } from "@/types/studentDiscoveryContact";

export function mapStudentDiscoveryContact(source: {
  email?: string | null;
  linkedin?: string | null;
  github?: string | null;
  portfolio?: string | null;
}): StudentDiscoveryContact {
  return {
    email: source.email ?? null,
    linkedin: source.linkedin ?? null,
    github: source.github ?? null,
    portfolio: source.portfolio ?? null,
  };
}
