/** Normalize stored profile picture values for use in img src / AvatarImage. */
export function profilePhotoUrl(raw?: string | null): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (value.startsWith("data:")) return value;
  return `data:image/jpeg;base64,${value}`;
}
