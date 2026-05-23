import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Megaphone } from 'lucide-react'
import { hub } from '../organizations/organizationHubStyles'
import { PublicPageNavBrand } from '../../components/brand/PublicPageNavBrand'
import { publicOrgPage } from '../organizations/publicOrgPageStyles'
import { assocDash } from '../association/dashboard/associationDashTokens'

type Props = {
  title: string
  subtitle: string
  icon: 'events' | 'recruitment'
}

export default function CommunityComingSoonPage({ title, subtitle, icon }: Props) {
  const navigate = useNavigate()
  const Icon = icon === 'events' ? CalendarDays : Megaphone

  return (
    <div style={hub.page}>
      <nav style={publicOrgPage.nav}>
        <div style={{ ...publicOrgPage.navInner, maxWidth: 1040, margin: '0 auto' }}>
          <button type="button" onClick={() => navigate(-1)} style={publicOrgPage.backBtn}>
            <ArrowLeft size={14} />
            Back
          </button>
          <PublicPageNavBrand />
        </div>
      </nav>

      <div style={{ ...hub.shell, display: 'flex', justifyContent: 'center' }}>
        <div style={{ ...hub.empty, maxWidth: 440, width: '100%', padding: '48px 32px' }}>
          <div style={hub.emptyIcon}>
            <Icon size={28} />
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, fontFamily: assocDash.fontDisplay }}>{title}</h1>
          <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.55, color: assocDash.muted }}>{subtitle}</p>
          <p
            style={{
              margin: '20px 0 0',
              fontSize: 13,
              fontWeight: 700,
              color: assocDash.accentDark,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Coming soon
          </p>
          <button type="button" style={{ ...hub.ctaBtn, marginTop: 24 }} onClick={() => navigate('/organizations')}>
            Discover organizations
          </button>
        </div>
      </div>
    </div>
  )
}
