import { resolveApiFileUrl } from "@/api/axiosInstance";

/** Normalize stored profile picture values for use in Image source URIs. */
export function profilePhotoUrl(raw?: string | null): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (value.startsWith("data:")) return value;
  return `data:image/jpeg;base64,${value}`;
}

/** Resolve base64, data URIs, absolute URLs, and API-relative file paths. */
export function resolveProfileImageUri(raw?: string | null): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (value.startsWith("data:")) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return resolveApiFileUrl(value) ?? value;
  return profilePhotoUrl(value);
}
