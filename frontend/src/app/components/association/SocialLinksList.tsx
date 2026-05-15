import { Facebook, Instagram, Linkedin, ExternalLink } from 'lucide-react'
import { assocDash } from '../../pages/association/dashboard/associationDashTokens'

type LinkItem = {
  key: string
  label: string
  url: string
  icon: typeof Instagram
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function displayHost(url: string): string {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

type Props = {
  instagramUrl?: string | null
  facebookUrl?: string | null
  linkedInUrl?: string | null
}

export function SocialLinksList({ instagramUrl, facebookUrl, linkedInUrl }: Props) {
  const links: LinkItem[] = []

  if (instagramUrl?.trim()) {
    links.push({ key: 'ig', label: 'Instagram', url: instagramUrl, icon: Instagram })
  }
  if (facebookUrl?.trim()) {
    links.push({ key: 'fb', label: 'Facebook', url: facebookUrl, icon: Facebook })
  }
  if (linkedInUrl?.trim()) {
    links.push({ key: 'li', label: 'LinkedIn', url: linkedInUrl, icon: Linkedin })
  }

  if (links.length === 0) return null

  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {links.map(({ key, label, url, icon: Icon }) => {
        const href = normalizeUrl(url)
        return (
          <li key={key}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="assoc-social-link"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: assocDash.radiusMd,
                border: `1px solid ${assocDash.border}`,
                background: assocDash.surface,
                textDecoration: 'none',
                color: assocDash.text,
                transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: assocDash.accentMuted,
                  border: `1px solid ${assocDash.accentBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: assocDash.accentDark,
                  flexShrink: 0,
                }}
              >
                <Icon size={18} strokeWidth={2} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>{label}</span>
                <span
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: assocDash.muted,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {displayHost(url)}
                </span>
              </span>
              <ExternalLink size={16} color={assocDash.subtle} style={{ flexShrink: 0 }} />
            </a>
          </li>
        )
      })}
      <style>{`
        .assoc-social-link:hover {
          border-color: ${assocDash.accentBorder};
          background: ${assocDash.accentMuted};
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.12);
        }
        .assoc-social-link:hover span:last-child {
          color: ${assocDash.accentDark};
        }
      `}</style>
    </ul>
  )
}
