import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { AssociationAvatar } from "@/components/association/AssociationAvatar";
import { AssociationCategoryBadge } from "@/components/association/AssociationCategoryBadge";
import { AssociationVerifiedBadge } from "@/components/association/AssociationVerifiedBadge";
import {
  AssociationWorkspaceScreen,
  useAssociationWorkspaceRefresh,
} from "@/components/association/AssociationWorkspaceScreen";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import type { StudentAssociationProfile } from "@/api/associationApi";
import { useAssociationWorkspace } from "@/contexts/AssociationWorkspaceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { ASSOCIATION_ROUTES } from "@/lib/associationRoutes";

type QuickAction = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  disabled?: boolean;
  href?: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: "add-circle-outline",
    title: "Create Event",
    desc: "Set up a new workshop, hackathon, or gathering",
    href: ASSOCIATION_ROUTES.eventsCreate,
  },
  {
    icon: "calendar-outline",
    title: "My Events",
    desc: "View and manage your organization events",
    href: ASSOCIATION_ROUTES.events,
  },
  {
    icon: "people-outline",
    title: "Manage Leadership Board",
    desc: "Showcase coordinators and representatives on your public profile",
    href: ASSOCIATION_ROUTES.leadership,
  },
  {
    icon: "clipboard-outline",
    title: "Executive Board Selection Applications",
    desc: "Open selection applications for executive board, committee, and volunteer positions",
    href: ASSOCIATION_ROUTES.recruitment,
  },
  {
    icon: "sparkles-outline",
    title: "Discovery",
    desc: "Discover students based on skills and interests",
    disabled: true,
  },
];

export default function AssociationDashboardScreen() {
  const layout = useResponsiveLayout();
  const { profile, loading, associationName } = useAssociationWorkspace();
  const reload = useAssociationWorkspaceRefresh();

  if (loading) {
    return (
      <AssociationWorkspaceScreen>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={ASSOC_COLORS.accent} />
          <Text style={[styles.loadingText, { fontSize: layout.fontSize.body }]}>Loading dashboard…</Text>
        </View>
      </AssociationWorkspaceScreen>
    );
  }

  return (
    <AssociationWorkspaceScreen refreshing={loading} onRefresh={() => void reload()}>
      <WelcomeHero profile={profile} associationName={associationName} layout={layout} />
      <ProfileSummaryCard profile={profile} layout={layout} />
      <QuickActionsCard layout={layout} />
    </AssociationWorkspaceScreen>
  );
}

function WelcomeHero({
  profile,
  associationName,
  layout,
}: {
  profile: StudentAssociationProfile | null;
  associationName: string;
  layout: ReturnType<typeof useResponsiveLayout>;
}) {
  const displayName = profile?.associationName ?? associationName;

  return (
    <LinearGradient
      colors={[ASSOC_COLORS.accentMuted, ASSOC_COLORS.cardBg]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.heroCard,
        {
          borderRadius: layout.radius.button,
          padding: layout.space("xl"),
          gap: layout.space("lg"),
        },
      ]}
    >
      <View style={[styles.heroTop, { gap: layout.space("lg") }]}>
        <AssociationAvatar name={displayName} logoUrl={profile?.logoUrl} size="lg" />
        <View style={styles.heroText}>
          <Text style={[styles.eyebrow, { fontSize: layout.fontSize.footer }]}>STUDENT ORGANIZATION</Text>
          <Text style={[styles.heroTitle, { fontSize: layout.scale(24), marginTop: layout.space("xs") }]}>
            Welcome back, {displayName}
          </Text>
          {profile?.faculty ? (
            <Text style={[styles.heroFaculty, { fontSize: layout.fontSize.body, marginTop: layout.space("sm") }]}>
              {profile.faculty}
            </Text>
          ) : null}
          <View style={[styles.badgeRow, { gap: layout.space("sm"), marginTop: layout.space("md") }]}>
            {profile?.category ? <AssociationCategoryBadge category={profile.category} /> : null}
            {profile?.isVerified ? <AssociationVerifiedBadge /> : null}
          </View>
        </View>
      </View>
      <View style={[styles.heroDivider, { marginTop: layout.space("md"), paddingTop: layout.space("lg") }]}>
        <Text style={[styles.heroBody, { fontSize: layout.fontSize.body, lineHeight: 22 }]}>
          Your organization hub on SkillSwap. Keep your profile up to date so students can discover your community.
        </Text>
      </View>
    </LinearGradient>
  );
}

function ProfileSummaryCard({
  profile,
  layout,
}: {
  profile: StudentAssociationProfile | null;
  layout: ReturnType<typeof useResponsiveLayout>;
}) {
  if (!profile) {
    return (
      <View style={[styles.card, { borderRadius: layout.radius.button, padding: layout.space("xl") }]}>
        <Text style={[styles.bodySm, { fontSize: layout.fontSize.body }]}>
          Complete your profile to show students who you are.
        </Text>
        <Pressable
          onPress={() => router.push(ASSOCIATION_ROUTES.settings as Href)}
          style={{ marginTop: layout.space("lg") }}
        >
          <Text style={styles.link}>Go to profile →</Text>
        </Pressable>
      </View>
    );
  }

  const about = profile.description?.trim();

  return (
    <View style={[styles.card, { borderRadius: layout.radius.button, padding: layout.space("xl"), gap: layout.space("md") }]}>
      <View style={[styles.cardHeader, { gap: layout.space("md") }]}>
        <AssociationAvatar name={profile.associationName} logoUrl={profile.logoUrl} size="md" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { fontSize: layout.scale(18) }]}>Profile summary</Text>
          <Text style={[styles.meta, { fontSize: layout.fontSize.footer, marginTop: 4 }]}>
            @{profile.username}
          </Text>
        </View>
      </View>
      <SummaryRow label="Faculty" value={profile.faculty ?? "—"} layout={layout} />
      <SummaryRow label="Category" value={profile.category ?? "—"} layout={layout} />
      <SummaryRow
        label="About"
        value={about || "Add a short description on your profile."}
        layout={layout}
        multiline
      />
      <Pressable
        onPress={() => router.push(ASSOCIATION_ROUTES.profile as Href)}
        style={[styles.editLink, { marginTop: layout.space("md") }]}
      >
        <Ionicons name="create-outline" size={16} color={ASSOC_COLORS.accentDark} />
        <Text style={styles.link}>Edit profile</Text>
      </Pressable>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  layout,
  multiline = false,
}: {
  label: string;
  value: string;
  layout: ReturnType<typeof useResponsiveLayout>;
  multiline?: boolean;
}) {
  return (
    <View
      style={[
        styles.summaryRow,
        {
          borderRadius: layout.radius.input,
          padding: layout.space("md"),
        },
      ]}
    >
      <Text style={[styles.summaryLabel, { fontSize: layout.scale(11) }]}>{label.toUpperCase()}</Text>
      <Text
        style={[
          multiline ? styles.summaryValueMuted : styles.summaryValue,
          { fontSize: layout.fontSize.body, marginTop: 6 },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function QuickActionsCard({ layout }: { layout: ReturnType<typeof useResponsiveLayout> }) {
  return (
    <View style={[styles.card, { borderRadius: layout.radius.button, padding: layout.space("xl"), gap: layout.space("md") }]}>
      <View>
        <Text style={[styles.sectionTitle, { fontSize: layout.scale(18) }]}>Quick actions</Text>
        <Text style={[styles.sectionDesc, { fontSize: layout.fontSize.footer, marginTop: 4 }]}>
          Shortcuts to key organization tools
        </Text>
      </View>
      {QUICK_ACTIONS.map((action) => (
        <Pressable
          key={action.title}
          disabled={action.disabled}
          onPress={action.href ? () => router.push(action.href as Href) : undefined}
          style={[
            styles.actionItem,
            {
              borderRadius: layout.radius.input,
              padding: layout.space("md"),
              opacity: action.disabled ? 0.88 : 1,
            },
          ]}
        >
          <View style={[styles.actionIcon, { borderRadius: layout.radius.input }]}>
            <Ionicons name={action.icon} size={18} color={ASSOC_COLORS.accentDark} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.actionTitle, { fontSize: layout.fontSize.body }]}>{action.title}</Text>
            <Text style={[styles.actionDesc, { fontSize: layout.fontSize.footer, marginTop: 2 }]}>
              {action.desc}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 48,
    width: "100%",
  },
  loadingText: {
    color: ASSOC_COLORS.muted,
  },
  heroCard: {
    borderWidth: 1,
    borderColor: ASSOC_COLORS.accentBorder,
    width: "100%",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },
  heroText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: ASSOC_COLORS.accent,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontWeight: "800",
    color: ASSOC_COLORS.foreground,
    letterSpacing: -0.4,
  },
  heroFaculty: {
    color: ASSOC_COLORS.muted,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  heroDivider: {
    borderTopWidth: 1,
    borderTopColor: ASSOC_COLORS.accentBorder,
  },
  heroBody: {
    color: ASSOC_COLORS.muted,
  },
  card: {
    backgroundColor: ASSOC_COLORS.cardBg,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
    width: "100%",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  sectionTitle: {
    fontWeight: "800",
    color: ASSOC_COLORS.foreground,
  },
  sectionDesc: {
    color: ASSOC_COLORS.muted,
  },
  bodySm: {
    color: ASSOC_COLORS.muted,
    lineHeight: 22,
  },
  meta: {
    color: ASSOC_COLORS.muted,
    fontWeight: "500",
  },
  link: {
    color: ASSOC_COLORS.accentDark,
    fontWeight: "700",
    fontSize: 14,
  },
  editLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  summaryRow: {
    backgroundColor: ASSOC_COLORS.background,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
  },
  summaryLabel: {
    color: ASSOC_COLORS.muted,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  summaryValue: {
    color: ASSOC_COLORS.foreground,
    fontWeight: "600",
  },
  summaryValueMuted: {
    color: ASSOC_COLORS.muted,
    fontWeight: "400",
    lineHeight: 20,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
    backgroundColor: ASSOC_COLORS.cardBg,
  },
  actionIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ASSOC_COLORS.accentMuted,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.accentBorder,
  },
  actionTitle: {
    fontWeight: "700",
    color: ASSOC_COLORS.foreground,
  },
  actionDesc: {
    color: ASSOC_COLORS.muted,
    lineHeight: 18,
  },
});
