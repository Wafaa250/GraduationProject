import { router, type Href } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { resolveApiFileUrl } from "@/api/axiosInstance";
import type { PublicOrganizationMember } from "@/api/publicProfilesApi";
import type { PublicRecruitmentCampaignSummary } from "@/api/recruitmentCampaignsApi";
import { LeadershipProfileCard } from "@/components/association/LeadershipProfileCard";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { useHubDesign } from "@/hooks/use-hub-design";
import { formatEventDate } from "@/lib/eventFormUtils";
import {
  isUpcomingEvent,
  type OrganizationProfileExtras,
} from "@/lib/organizationProfileData";
import type { StudentOrganizationEvent } from "@/api/organizationEventsApi";

type Props = {
  organizationId: number;
  organizationName: string;
  extras: OrganizationProfileExtras;
  campaigns: PublicRecruitmentCampaignSummary[];
  loadingCampaigns?: boolean;
};

export function OrganizationVisitorSections({
  organizationId,
  organizationName,
  extras,
  campaigns,
  loadingCampaigns = false,
}: Props) {
  const hub = useHubDesign();
  const { colors } = hub;
  const upcomingEvents = extras.events.filter((event) => isUpcomingEvent(event.eventDate));

  return (
    <View style={{ gap: 16, width: "100%" }}>
      <HubSectionCard title="Events" description="Upcoming public events">
        {upcomingEvents.length === 0 ? (
          <Text style={[styles.empty, { color: colors.muted }]}>No upcoming events.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {upcomingEvents.map((event) => (
              <VisitorEventRow
                key={event.id}
                event={event}
                organizationId={organizationId}
                colors={colors}
              />
            ))}
          </View>
        )}
      </HubSectionCard>

      <HubSectionCard title="Leadership board">
        {extras.leadership.length === 0 ? (
          <Text style={[styles.empty, { color: colors.muted }]}>
            No leadership board published yet.
          </Text>
        ) : (
          <View style={{ gap: 10 }}>
            {extras.leadership.map((member) => (
              <LeadershipProfileCard
                key={member.id}
                fullName={member.fullName}
                roleTitle={member.roleTitle}
                major={member.major}
                imageUrl={member.imageUrl}
                linkedInUrl={member.linkedInUrl}
                organizationName={organizationName}
                preview
                compact
              />
            ))}
          </View>
        )}
      </HubSectionCard>

      {extras.members.length > 0 ? (
        <HubSectionCard title="Members">
          <View style={{ gap: 8 }}>
            {extras.members.map((member) => (
              <MemberRow key={`${member.studentUserId}-${member.roleTitle}`} member={member} colors={colors} />
            ))}
          </View>
        </HubSectionCard>
      ) : null}

      <HubSectionCard title="Recruitment campaigns">
        {loadingCampaigns ? (
          <Text style={[styles.empty, { color: colors.muted }]}>Loading campaigns…</Text>
        ) : campaigns.length === 0 ? (
          <Text style={[styles.empty, { color: colors.muted }]}>
            No open recruitment campaigns at the moment.
          </Text>
        ) : (
          <View style={{ gap: 10 }}>
            {campaigns.map((campaign) => (
              <Pressable
                key={campaign.id}
                style={[styles.campaignRow, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
                onPress={() =>
                  router.push({
                    pathname: "/recruitment/[campaignId]",
                    params: { campaignId: String(campaign.id), orgId: String(organizationId) },
                  } as Href)
                }
              >
                {campaign.coverImageUrl ? (
                  <Image
                    source={{ uri: resolveApiFileUrl(campaign.coverImageUrl) ?? campaign.coverImageUrl }}
                    style={styles.campaignThumb}
                  />
                ) : (
                  <View style={[styles.campaignThumb, styles.campaignThumbPlaceholder]}>
                    <Text style={[styles.campaignThumbLabel, { color: colors.muted }]}>Campaign</Text>
                  </View>
                )}
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.campaignTitle, { color: colors.foreground }]} numberOfLines={2}>
                    {campaign.title}
                  </Text>
                  <Text style={[styles.campaignMeta, { color: colors.muted }]}>
                    Deadline: {formatEventDate(campaign.applicationDeadline)}
                  </Text>
                  <Text style={[styles.campaignMeta, { color: colors.muted }]}>
                    {campaign.openPositionsCount} open position
                    {campaign.openPositionsCount === 1 ? "" : "s"}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </HubSectionCard>
    </View>
  );
}

function VisitorEventRow({
  event,
  organizationId,
  colors,
}: {
  event: StudentOrganizationEvent;
  organizationId: number;
  colors: ReturnType<typeof useHubDesign>["colors"];
}) {
  const cover = event.coverImageUrl
    ? resolveApiFileUrl(event.coverImageUrl) ?? event.coverImageUrl
    : null;

  return (
    <Pressable
      style={[styles.eventRow, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
      onPress={() =>
        router.push({
          pathname: "/events/[eventId]",
          params: { eventId: String(event.id), orgId: String(organizationId) },
        } as Href)
      }
    >
      {cover ? (
        <Image source={{ uri: cover }} style={styles.eventThumb} />
      ) : (
        <View style={[styles.eventThumb, styles.eventThumbPlaceholder]}>
          <Text style={[styles.eventThumbLabel, { color: colors.muted }]}>Event</Text>
        </View>
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.eventTitle, { color: colors.foreground }]} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={[styles.eventMeta, { color: colors.muted }]}>{formatEventDate(event.eventDate)}</Text>
        <Text style={[styles.eventMeta, { color: colors.muted }]}>
          {event.isOnline ? "Online" : event.location?.trim() || "Location TBA"}
        </Text>
      </View>
    </Pressable>
  );
}

function MemberRow({
  member,
  colors,
}: {
  member: PublicOrganizationMember;
  colors: ReturnType<typeof useHubDesign>["colors"];
}) {
  return (
    <Text style={[styles.memberLine, { color: colors.foreground }]}>
      <Text style={{ fontWeight: "700" }}>{member.studentName}</Text>
      {member.roleTitle ? (
        <Text style={{ color: colors.muted }}> · {member.roleTitle}</Text>
      ) : null}
      {member.major ? <Text style={{ color: colors.muted }}> · {member.major}</Text> : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 14, lineHeight: 20 },
  eventRow: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    padding: 10,
  },
  eventThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  eventThumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  eventThumbLabel: { fontSize: 11, fontWeight: "600" },
  eventTitle: { fontSize: 15, fontWeight: "700" },
  eventMeta: { fontSize: 12 },
  campaignRow: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  campaignThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  campaignThumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  campaignThumbLabel: { fontSize: 11, fontWeight: "600" },
  campaignTitle: { fontSize: 15, fontWeight: "700" },
  campaignMeta: { fontSize: 12 },
  memberLine: { fontSize: 14, lineHeight: 20 },
});
