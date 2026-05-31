/**
 * Temporary dev access — no login UI. Set VITE_DEV_* in .env to override defaults.
 * API calls still send Authorization: Bearer <token> from localStorage.
 */
export function ensureDevAssociationAccess(): void {
  const token = import.meta.env.VITE_DEV_TOKEN ?? ''
  if (!token.trim()) {
    console.warn(
      '[SkillSwap] VITE_DEV_TOKEN is empty. Set it in frontend/.env (see .env.example) so API requests authenticate.',
    )
  }

  localStorage.setItem('token', token)
  localStorage.setItem('userId', import.meta.env.VITE_DEV_USER_ID ?? '1')
  localStorage.setItem('role', import.meta.env.VITE_DEV_ROLE ?? 'studentassociation')
  localStorage.setItem('name', import.meta.env.VITE_DEV_ORG_NAME ?? 'Demo Organization')
  localStorage.setItem('email', import.meta.env.VITE_DEV_EMAIL ?? 'association@example.com')
}

export function resetDevAssociationAccess(): void {
  ensureDevAssociationAccess()
}
