import { router, type Href } from "expo-router";
import { Building2, ChevronRight, Settings, Users } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { getCompanyDashboard, getCompanyProfile } from "@/api/companyApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { CompanyEmptyState } from "@/components/company/home/CompanyEmptyState";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS, companyCardShadow } from "@/components/company/ui/companyDesignSystem";
import { CompanyWorkspaceToolbar } from "@/components/company/CompanyWorkspaceToolbar";
import { CompanyScreen } from "@/components/company/ui/CompanyScreen";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { getItem } from "@/utils/authStorage";
import { isCompanyOwnerAccountRole } from "@/utils/companyAccountRole";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";
import {
  COMPANY_WORKSPACE_HUB_SUBTITLE,
  COMPANY_WORKSPACE_PROFILE_LINK_SUBTITLE,
} from "@/lib/companyWorkspaceCopy";

type WorkspaceLink = {
  title: string;
  subtitle: string;
  icon: typeof Users;
  href: string;
  ownerOnly?: boolean;
};

const LINKS: WorkspaceLink[] = [
  {
    title: "Company Members",
    subtitle: "Manage workspace access",
    icon: Users,
    href: COMPANY_ROUTES.members,
    ownerOnly: true,
  },
  {
    title: "Company Profile",
    subtitle: COMPANY_WORKSPACE_PROFILE_LINK_SUBTITLE,
    icon: Building2,
    href: COMPANY_ROUTES.profile,
  },
  {
    title: "Settings",
    subtitle: "Notifications and security",
    icon: Settings,
    href: COMPANY_ROUTES.settings,
    ownerOnly: true,
  },
];

export default function CompanyWorkspaceScreen() {
  const colors = useCompanyTheme();
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [members, setMembers] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboard, profile, role] = await Promise.all([
        getCompanyDashboard(),
        getCompanyProfile(),
        getItem("role"),
      ]);
      setCompanyName(profile.companyName?.trim() || dashboard.companyName || "Company");
      setMembers(dashboard.workspaceMembers);
      setIsOwner(isCompanyOwnerAccountRole(role));
      setError(null);
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleLinks = LINKS.filter((link) => !link.ownerOnly || isOwner);

  return (
    <CompanyScreen edges={["top"]}>
      <CompanyWorkspaceToolbar companyName={companyName} />
      <ScrollView contentContainerStyle={{ padding: HOME_SPACE.lg, paddingBottom: HOME_SPACE.xxxl }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground, letterSpacing: -0.6 }}>
          Workspace
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: HOME_SPACE.xl }}>
          {COMPANY_WORKSPACE_HUB_SUBTITLE}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : error ? (
          <CompanyEmptyState
            icon={Building2}
            message={error}
            actionLabel="Retry"
            onAction={() => void load()}
          />
        ) : (
          <>
            <View
              style={{
                backgroundColor: colors.accentSoft,
                borderRadius: COMPANY_RADIUS.xl,
                borderWidth: 1,
                borderColor: colors.accentBorder,
                padding: HOME_SPACE.xl,
                marginBottom: HOME_SPACE.xxl,
                ...companyCardShadow(colors),
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.accent, letterSpacing: 0.8 }}>
                YOUR COMPANY
              </Text>
              <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground, marginTop: 6 }}>
                {companyName}
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8 }}>
                {members} workspace member{members === 1 ? "" : "s"}
              </Text>
            </View>

            <View style={{ gap: HOME_SPACE.sm }}>
              {visibleLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Pressable
                    key={link.href}
                    onPress={() => router.push(link.href as Href)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: HOME_SPACE.md,
                      backgroundColor: colors.cardBg,
                      borderRadius: COMPANY_RADIUS.lg,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: HOME_SPACE.lg,
                      opacity: pressed ? 0.94 : 1,
                      ...companyCardShadow(colors),
                    })}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: COMPANY_RADIUS.md,
                        backgroundColor: colors.accentSoft,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={20} color={colors.accent} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{link.title}</Text>
                      <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>{link.subtitle}</Text>
                    </View>
                    <ChevronRight size={18} color={colors.muted} />
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </CompanyScreen>
  );
}
