import type { ReactNode } from 'react'
import { Building2 } from 'lucide-react'
import { hub } from '../../pages/organizations/organizationHubStyles'
import { assocDash } from '../../pages/association/dashboard/associationDashTokens'

type Props = {
  title: string
  message: string
  action?: ReactNode
}

export function OrganizationsEmptyState({ title, message, action }: Props) {
  return (
    <div style={hub.empty}>
      <div style={hub.emptyIcon}>
        <Building2 size={28} />
      </div>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: assocDash.text }}>{title}</p>
      <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.5, color: assocDash.muted, maxWidth: 360, marginInline: 'auto' }}>
        {message}
      </p>
      {action}
    </div>
  )
}
