/** Normalize API base64 profile pictures for <img src>. */
export function profileImageSrc(base64?: string | null): string | undefined {
  if (!base64?.trim()) return undefined
  const trimmed = base64.trim()
  if (trimmed.startsWith('data:')) return trimmed
  return `data:image/jpeg;base64,${trimmed}`
}
