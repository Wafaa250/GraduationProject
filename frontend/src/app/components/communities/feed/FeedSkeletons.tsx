import type { CSSProperties, ReactElement } from 'react'
import { feed } from '../../../pages/communities/communitiesFeedStyles'
import { hub } from '../../../pages/organizations/organizationHubStyles'

function Sk({ width, height, style }: { width: string | number; height: number; style?: CSSProperties }) {
  return <div style={{ ...feed.skeletonPulse, width, height, ...style }} />
}

export function OrgCardSkeleton() {
  return (
    <article style={feed.orgCard}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <Sk width={48} height={48} style={{ borderRadius: 12, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <Sk width="70%" height={14} style={{ marginBottom: 8 }} />
          <Sk width="40%" height={10} />
        </div>
      </div>
      <Sk width="100%" height={10} style={{ marginBottom: 6 }} />
      <Sk width="85%" height={10} style={{ marginBottom: 16 }} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 'auto',
          paddingTop: 12,
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <Sk width={72} height={10} />
        <Sk width={64} height={28} style={{ borderRadius: 8 }} />
      </div>
    </article>
  )
}

export function EventCardSkeleton() {
  return (
    <article style={feed.eventCard}>
      <Sk width="100%" height={120} style={{ borderRadius: 0 }} />
      <div style={{ padding: 14 }}>
        <Sk width="55%" height={10} style={{ marginBottom: 10 }} />
        <Sk width="85%" height={14} style={{ marginBottom: 8 }} />
        <Sk width="60%" height={10} style={{ marginBottom: 14 }} />
        <Sk width={90} height={30} style={{ borderRadius: 8 }} />
      </div>
    </article>
  )
}

export function RecruitmentCardSkeleton() {
  return (
    <article style={feed.recruitmentCard}>
      <Sk width="50%" height={10} />
      <Sk width="80%" height={14} style={{ marginTop: 4 }} />
      <Sk width="45%" height={10} style={{ marginTop: 6 }} />
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <Sk width={52} height={20} style={{ borderRadius: 6 }} />
        <Sk width={48} height={20} style={{ borderRadius: 6 }} />
      </div>
      <Sk width={72} height={30} style={{ borderRadius: 8, marginTop: 8 }} />
    </article>
  )
}

export function ActivityRowSkeleton() {
  return (
    <div style={feed.activityCard}>
      <Sk width={40} height={40} style={{ borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <Sk width="35%" height={10} style={{ marginBottom: 8 }} />
        <Sk width="75%" height={12} style={{ marginBottom: 6 }} />
        <Sk width="50%" height={10} />
      </div>
    </div>
  )
}

export function HorizontalSkeletonRow({
  count = 4,
  Card,
}: {
  count?: number
  Card: () => ReactElement
}) {
  return (
    <div style={hub.horizontalRow}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={feed.horizontalCard}>
          <Card />
        </div>
      ))}
    </div>
  )
}
