import { Link, useLocation } from 'react-router-dom'
import { Compass } from 'lucide-react'

const COMMUNITY_PREFIXES = [
  '/communities',
  '/organizations',
  '/following',
  '/community-events',
  '/community-recruitment',
]

const TOOLTIP = 'Student Communities'

function isCommunitiesArea(pathname: string) {
  return COMMUNITY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function CommunitiesNavLink() {
  const location = useLocation()
  const active = isCommunitiesArea(location.pathname)

  return (
    <>
      <Link
        to="/communities"
        className={`communities-nav-icon${active ? ' communities-nav-icon--active' : ''}`}
        aria-label={TOOLTIP}
        aria-current={active ? 'page' : undefined}
      >
        <Compass size={20} strokeWidth={2.15} className="communities-nav-icon__glyph" />
        <span className="communities-nav-tooltip" role="tooltip">
          {TOOLTIP}
        </span>
      </Link>
      <style>{`
        .communities-nav-icon {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          margin-right: 2px;
          border-radius: 12px;
          border: 1px solid transparent;
          background: rgba(99, 102, 241, 0.08);
          text-decoration: none;
          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.15s ease;
        }
        .communities-nav-icon__glyph {
          color: #818cf8;
          transition: color 0.2s ease;
        }
        .communities-nav-tooltip {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%;
          z-index: 300;
          padding: 7px 11px;
          border-radius: 8px;
          background: rgba(15, 23, 42, 0.88);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 8px 24px rgba(15, 23, 42, 0.28),
            0 2px 8px rgba(0, 0, 0, 0.12);
          color: #f1f5f9;
          font-size: 12px;
          font-weight: 600;
          font-family: inherit;
          letter-spacing: 0.01em;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transform: translateX(-50%) translateY(6px);
          transition:
            opacity 0.2s ease,
            transform 0.2s ease;
        }
        .communities-nav-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border: 5px solid transparent;
          border-top-color: rgba(15, 23, 42, 0.88);
        }
        .communities-nav-icon:hover {
          background: rgba(99, 102, 241, 0.14);
          border-color: rgba(199, 210, 254, 0.5);
        }
        .communities-nav-icon:hover .communities-nav-icon__glyph {
          color: #6366f1;
        }
        .communities-nav-icon:hover .communities-nav-tooltip {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .communities-nav-icon:focus-visible {
          outline: 2px solid #a5b4fc;
          outline-offset: 2px;
        }
        .communities-nav-icon:focus-visible .communities-nav-tooltip {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .communities-nav-icon--active {
          background: linear-gradient(145deg, rgba(238, 242, 255, 0.98) 0%, rgba(224, 231, 255, 0.9) 100%);
          border-color: #c7d2fe;
          box-shadow:
            0 0 0 1px rgba(99, 102, 241, 0.08),
            0 4px 16px rgba(99, 102, 241, 0.18);
        }
        .communities-nav-icon--active .communities-nav-icon__glyph {
          color: #4f46e5;
        }
        .communities-nav-icon--active:hover {
          background: linear-gradient(145deg, #eef2ff 0%, #e0e7ff 100%);
        }
        .communities-nav-icon--active:hover .communities-nav-icon__glyph {
          color: #4338ca;
        }
      `}</style>
    </>
  )
}
