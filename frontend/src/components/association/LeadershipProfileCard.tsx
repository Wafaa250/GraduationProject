import { Linkedin, Loader2, Pencil, Trash2, UserRound } from 'lucide-react'
import { resolveApiFileUrl } from '@/api/axiosInstance'
import { assocDash } from '@/pages/association/dashboard/associationDashTokens'

export type LeadershipProfileCardProps = {
  fullName: string
  roleTitle: string
  major?: string | null
  imageUrl?: string | null
  linkedInUrl?: string | null
  organizationName: string
  /** Preview mode shows placeholders and hides admin actions */
  preview?: boolean
  deleting?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

function resolveImageSrc(imageUrl: string | null | undefined): string | null {
  if (!imageUrl?.trim()) return null
  if (imageUrl.startsWith('blob:') || imageUrl.startsWith('http')) return imageUrl
  return resolveApiFileUrl(imageUrl)
}

export function LeadershipProfileCard({
  fullName,
  roleTitle,
  major,
  imageUrl,
  linkedInUrl,
  organizationName,
  preview = false,
  deleting,
  onEdit,
  onDelete,
}: LeadershipProfileCardProps) {
  const src = resolveImageSrc(imageUrl ?? null)
  const name = fullName.trim()
  const role = roleTitle.trim()
  const majorText = major?.trim()
  const linkedIn = linkedInUrl?.trim()
  const initial = (name || '?').charAt(0).toUpperCase()
  const isDraft = preview && (!name || !role)

  const displayName = name || (preview ? 'Full name' : '')
  const displayRole = role || (preview ? 'Position' : '')

  return (
    <article
      className={`ltp-card${src ? ' ltp-card--has-photo' : ''}${isDraft ? ' ltp-card--draft' : ''}${preview ? ' ltp-card--preview' : ''}`}
    >
      <div
        className="ltp-cover"
        style={src ? { backgroundImage: `url(${src})` } : undefined}
        aria-hidden
      />
      <div className="ltp-cover-fade" aria-hidden />

      <div className="ltp-avatar-ring">
        {src ? (
          <img src={src} alt="" className="ltp-avatar" />
        ) : (
          <div className="ltp-avatar-ph" aria-hidden>
            {name ? initial : <UserRound size={preview ? 32 : 28} strokeWidth={1.5} />}
          </div>
        )}
      </div>

      <div className="ltp-body">
        <h3 className={`ltp-name${!name && preview ? ' ltp-placeholder' : ''}`}>{displayName}</h3>

        <p className={`ltp-role${!role && preview ? ' ltp-placeholder' : ''}`}>{displayRole}</p>

        {(majorText || preview) && (
          <p className={`ltp-major${!majorText && preview ? ' ltp-placeholder' : ''}`}>
            {majorText || 'Major (optional)'}
          </p>
        )}

        <p className="ltp-org">{organizationName}</p>

        {linkedIn ? (
          preview ? (
            <div className="ltp-social ltp-social--static">
              <Linkedin size={15} strokeWidth={2.25} />
              LinkedIn
            </div>
          ) : (
            <a
              href={linkedIn.startsWith('http') ? linkedIn : `https://${linkedIn}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ltp-social"
            >
              <Linkedin size={15} strokeWidth={2.25} />
              LinkedIn
            </a>
          )
        ) : null}
      </div>

      {!preview && onEdit && onDelete && (
        <div className="ltp-admin">
          <button type="button" onClick={onEdit} className="ltp-admin-btn">
            <Pencil size={14} strokeWidth={2.25} />
            Edit
          </button>
          <span className="ltp-admin-dot" aria-hidden />
          <button
            type="button"
            disabled={deleting}
            onClick={onDelete}
            className="ltp-admin-btn ltp-admin-btn--danger"
          >
            {deleting ? <Loader2 size={14} className="ltp-spin" /> : <Trash2 size={14} strokeWidth={2.25} />}
            {deleting ? 'Removing…' : 'Remove'}
          </button>
        </div>
      )}

      <ProfileCardStyles />
    </article>
  )
}

function ProfileCardStyles() {
  return (
    <style>{`
      .ltp-card {
        position: relative;
        display: flex;
        flex-direction: column;
        border-radius: 20px;
        border: 1px solid ${assocDash.border};
        background: ${assocDash.surface};
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.05);
        transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
      }

      .ltp-card:not(.ltp-card--preview):hover {
        transform: translateY(-4px);
        border-color: ${assocDash.accentBorder};
        box-shadow: ${assocDash.shadowHover};
      }

      .ltp-card--preview {
        box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
      }

      .ltp-card--draft {
        opacity: 0.96;
      }

      .ltp-cover {
        height: 96px;
        background: ${assocDash.accent};
        background-size: cover;
        background-position: center top;
      }

      .ltp-card--has-photo .ltp-cover {
        height: 120px;
      }

      .ltp-cover-fade {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 120px;
        background: linear-gradient(
          180deg,
          rgba(15, 23, 42, 0) 0%,
          rgba(15, 23, 42, 0.08) 55%,
          rgba(255, 255, 255, 0.92) 100%
        );
        pointer-events: none;
      }

      .ltp-card--has-photo .ltp-cover-fade {
        background: linear-gradient(
          180deg,
          rgba(15, 23, 42, 0.05) 0%,
          rgba(15, 23, 42, 0.25) 50%,
          rgba(255, 255, 255, 0.95) 100%
        );
      }

      .ltp-avatar-ring {
        position: relative;
        z-index: 1;
        display: flex;
        justify-content: center;
        margin-top: -52px;
      }

      .ltp-card--has-photo .ltp-avatar-ring {
        margin-top: -64px;
      }

      .ltp-avatar,
      .ltp-avatar-ph {
        width: 104px;
        height: 104px;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid #fff;
        box-shadow: 0 4px 20px rgba(15, 23, 42, 0.14);
      }

      .ltp-card--has-photo .ltp-avatar,
      .ltp-card--has-photo .ltp-avatar-ph {
        width: 112px;
        height: 112px;
      }

      .ltp-avatar-ph {
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fff;
        font-family: ${assocDash.fontDisplay};
        font-size: 38px;
        font-weight: 800;
        color: ${assocDash.accentDark};
      }

      .ltp-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 14px 20px 12px;
      }

      .ltp-name {
        margin: 0;
        font-family: ${assocDash.fontDisplay};
        font-size: 18px;
        font-weight: 800;
        letter-spacing: -0.025em;
        color: ${assocDash.text};
        line-height: 1.25;
      }

      .ltp-placeholder {
        color: ${assocDash.subtle};
        font-weight: 600;
        font-style: italic;
      }

      .ltp-role {
        margin: 12px 0 0;
        padding: 5px 14px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        color: ${assocDash.accentDark};
        background: hsl(var(--aw-accent) / 0.12);
        border: 1px solid hsl(var(--aw-accent) / 0.22);
        line-height: 1.35;
      }

      .ltp-role.ltp-placeholder {
        color: ${assocDash.subtle};
        background: ${assocDash.bg};
        border-color: ${assocDash.border};
        font-style: italic;
        font-weight: 600;
      }

      .ltp-major {
        margin: 10px 0 0;
        font-size: 13px;
        font-weight: 500;
        color: ${assocDash.muted};
        line-height: 1.45;
      }

      .ltp-major.ltp-placeholder {
        color: ${assocDash.subtle};
        font-style: italic;
      }

      .ltp-org {
        margin: 6px 0 0;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        color: ${assocDash.subtle};
      }

      .ltp-social,
      .ltp-social--static {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-top: 14px;
        padding: 8px 14px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        color: #0a66c2;
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        text-decoration: none;
        transition: background 0.15s ease, transform 0.15s ease;
      }

      a.ltp-social:hover {
        background: #dbeafe;
        transform: translateY(-1px);
      }

      .ltp-admin {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 12px 16px 16px;
        border-top: 1px solid ${assocDash.border};
        background: ${assocDash.gradientSurface};
        opacity: 0.85;
        transition: opacity 0.18s ease;
      }

      .ltp-card:hover .ltp-admin {
        opacity: 1;
      }

      .ltp-admin-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 12px;
        border: none;
        border-radius: 999px;
        background: transparent;
        font-size: 12px;
        font-weight: 600;
        font-family: inherit;
        color: ${assocDash.muted};
        cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
      }

      .ltp-admin-btn:hover:not(:disabled) {
        background: #fff;
        color: ${assocDash.text};
        box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
      }

      .ltp-admin-btn--danger:hover:not(:disabled) {
        color: #dc2626;
        background: #fef2f2;
      }

      .ltp-admin-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .ltp-admin-dot {
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background: #cbd5e1;
      }

      .ltp-spin {
        animation: ltp-spin 0.85s linear infinite;
      }

      @keyframes ltp-spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  )
}
