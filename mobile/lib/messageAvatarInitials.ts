/** Avatar initials for conversation titles (Eyad → E, Dr Ahmad → DA, NexusTech → NT). */
export function messageAvatarInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";

  const camelParts = trimmed.match(/[A-Z]?[a-z]+|[A-Z]+(?![a-z])/g);
  if (camelParts && camelParts.length >= 2) {
    return camelParts
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  return trimmed[0].toUpperCase();
}
