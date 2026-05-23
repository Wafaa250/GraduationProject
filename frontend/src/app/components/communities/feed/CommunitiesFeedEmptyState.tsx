import type { ReactNode } from 'react'
import { BrandLogoMark } from '../../brand/BrandLogo'
import { hub } from '../../../pages/organizations/organizationHubStyles'
import { assocDash } from '../../../pages/association/dashboard/associationDashTokens'

type Props = {
  icon: ReactNode
  title: string
  message: string
  action?: ReactNode
}

export function CommunitiesFeedEmptyState({ icon, title, message, action }: Props) {
  return (
    <div style={hub.empty}>
      <div style={{ ...hub.emptyIcon, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <BrandLogoMark size="md" />
        {icon}
      </div>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: assocDash.text }}>{title}</p>
      <p
        style={{
          margin: '8px 0 0',
          fontSize: 13,
          lineHeight: 1.5,
          color: assocDash.muted,
          maxWidth: 400,
          marginInline: 'auto',
        }}
      >
        {message}
      </p>
      {action}
    </div>
  )
}
