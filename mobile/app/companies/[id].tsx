import { router, type Href } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getPublicCompanyProfileDetail,
  listPublicCompanyOpportunities,
  type PublicCompanyOpportunitySummary,
  type PublicCompanyProfile,
} from "@/api/publicProfilesApi";
import { PublicLinkList, type PublicLinkItem } from "@/components/public-profile/PublicLinkList";
import { PublicProfileHero } from "@/components/public-profile/PublicProfileHero";
import { ChipList } from "@/components/student/ChipList";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { ProfileFieldRow } from "@/components/student/ProfileFieldRow";
import { PublicProfileShell } from "@/components/student/PublicProfileShell";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { companyOpportunityDetailPath } from "@/lib/studentRoutes";
import { normalizeUrl } from "@/lib/studentProfileHelpers";

function displayUrl(url: string): string {
  if (/^tel:/i.test(url)) return url.replace(/^tel:/i, "");
  if (/^mailto:/i.test(url)) return url.replace(/^mailto:/i, "");
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export default function PublicCompanyProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicCompanyProfile | null>(null);
  const [opportunities, setOpportunities] = useState<PublicCompanyOpportunitySummary[]>([]);
  const companyProfileId = Number(id);

  useEffect(() => {
    if (!Number.isFinite(companyProfileId) || companyProfileId <= 0) {
      setError("Invalid company profile.");
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [company, opps] = await Promise.all([
          getPublicCompanyProfileDetail(companyProfileId),
          listPublicCompanyOpportunities(companyProfileId),
        ]);
        setProfile(company);
        setOpportunities(opps);
        setError(company ? null : "Company not found.");
      } catch (err) {
        setProfile(null);
        setOpportunities([]);
        setError(parseApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [companyProfileId]);

  const locationLabel =
    profile?.headquartersLocation?.trim() || profile?.location?.trim() || null;

  const infoLinks = useMemo((): PublicLinkItem[] => {
    if (!profile) return [];
    const items: PublicLinkItem[] = [];
    if (profile.websiteUrl?.trim()) {
      items.push({
        key: "website",
        label: "Website",
        value: displayUrl(profile.websiteUrl),
        href: normalizeUrl(profile.websiteUrl),
      });
    }
    if (profile.linkedInUrl?.trim()) {
      items.push({
        key: "linkedin",
        label: "LinkedIn",
        value: displayUrl(profile.linkedInUrl),
        href: normalizeUrl(profile.linkedInUrl),
      });
    }
    if (profile.contactEmail?.trim()) {
      items.push({
        key: "email",
        label: "Contact email",
        value: profile.contactEmail.trim(),
        href: `mailto:${profile.contactEmail.trim()}`,
      });
    }
    if (profile.optionalContactLink?.trim()) {
      const raw = profile.optionalContactLink.trim();
      items.push({
        key: "contact-link",
        label: /^tel:/i.test(raw) ? "Phone" : "Contact link",
        value: displayUrl(raw),
        href: normalizeUrl(raw),
      });
    }
    return items;
  }, [profile]);

  if (loading) {
    return (
      <PublicProfileShell title="Company Profile" fallbackHref="/feed">
        <ActivityIndicator color={HUB_COLORS.primary} />
      </PublicProfileShell>
    );
  }

  if (error || !profile) {
    return (
      <PublicProfileShell title="Company Profile" fallbackHref="/feed">
        <Text style={styles.error}>{error ?? "Profile not found"}</Text>
      </PublicProfileShell>
    );
  }

  const areas = profile.areasOfInterest ?? [];

  return (
    <PublicProfileShell title={profile.companyName} fallbackHref="/feed">
      <ScrollView contentContainerStyle={styles.scroll}>
        <PublicProfileHero
          name={profile.companyName}
          subtitle={profile.industry?.trim() || undefined}
          metaLines={locationLabel ? [locationLabel] : []}
          roleType="company"
          badge={profile.industry?.trim() || undefined}
        />

        <HubSectionCard title="About">
          <Text style={styles.bodyText}>
            {profile.description?.trim() || "No company description provided yet."}
          </Text>
          {areas.length > 0 ? (
            <>
              <Text style={styles.subheading}>Areas of interest</Text>
              <ChipList items={areas} />
            </>
          ) : null}
        </HubSectionCard>

        {(infoLinks.length > 0 || locationLabel || profile.workingStyle?.trim()) ? (
          <HubSectionCard title="Information">
            {locationLabel ? <ProfileFieldRow label="Location" value={locationLabel} /> : null}
            {profile.workingStyle?.trim() ? (
              <ProfileFieldRow label="Working style" value={profile.workingStyle.trim()} />
            ) : null}
            {infoLinks.length > 0 ? <PublicLinkList items={infoLinks} /> : null}
          </HubSectionCard>
        ) : null}

        <HubSectionCard title="Active opportunities">
          {opportunities.length === 0 ? (
            <Text style={styles.muted}>No published opportunities at the moment.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {opportunities.map((opp) => (
                <Pressable
                  key={opp.id}
                  style={styles.opportunityRow}
                  onPress={() =>
                    router.push(companyOpportunityDetailPath(profile.id, opp.id) as Href)
                  }
                >
                  <Text style={styles.opportunityTitle}>{opp.title}</Text>
                  <Text style={styles.opportunityMeta}>
                    {[opp.category, opp.collaborationFormat, opp.durationLabel]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </HubSectionCard>
      </ScrollView>
    </PublicProfileShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: 16,
    alignItems: "stretch",
    paddingBottom: 24,
  },
  bodyText: {
    color: HUB_COLORS.foreground,
    fontSize: 14,
    lineHeight: 22,
  },
  subheading: {
    fontWeight: "700",
    color: HUB_COLORS.foreground,
    marginTop: 8,
  },
  muted: {
    color: HUB_COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  opportunityRow: {
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: HUB_COLORS.cardBg,
    gap: 4,
  },
  opportunityTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: HUB_COLORS.foreground,
  },
  opportunityMeta: {
    fontSize: 12,
    color: HUB_COLORS.muted,
  },
  error: {
    color: "#DC2626",
  },
});
