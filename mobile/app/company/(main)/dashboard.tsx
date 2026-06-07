import { router, type Href } from "expo-router";
import { Bookmark, Building2, FileText, TrendingUp, UserRound, Users, UsersRound } from "lucide-react-native";
import { useMemo } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";

import { CompanyActiveRequestCard } from "@/components/company/home/CompanyActiveRequestCard";
import { CompanyActivityTimeline } from "@/components/company/home/CompanyActivityTimeline";
import { CompanyEmptyState } from "@/components/company/home/CompanyEmptyState";
import { CompanyHeroCard } from "@/components/company/home/CompanyHeroCard";
import { CompanyHomeHeader } from "@/components/company/home/CompanyHomeHeader";
import { CompanyHomeSection } from "@/components/company/home/CompanyHomeSection";
import { CompanyHomeSkeleton } from "@/components/company/home/CompanyHomeSkeleton";
import { CompanyKpiGrid, type KpiCardConfig } from "@/components/company/home/CompanyKpiGrid";
import { CompanySavedCandidatesRow } from "@/components/company/home/CompanySavedCandidatesRow";
import { CompanySavedTeamsRow } from "@/components/company/home/CompanySavedTeamsRow";
import { createCompanyHomeStyles } from "@/components/company/home/companyHomeStyles";
import { CompanyScreen } from "@/components/company/ui/CompanyScreen";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { useCompanyDashboard } from "@/hooks/useCompanyDashboard";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";
import {
  COMPANY_ACTIVE_REQUESTS_SUBTITLE,
  COMPANY_DASHBOARD_BROWSE_REQUESTS,
  COMPANY_DASHBOARD_NO_REQUESTS,
  COMPANY_DASHBOARD_NO_SAVED_STUDENTS,
  COMPANY_DASHBOARD_NO_SAVED_TEAMS,
  COMPANY_WORKSPACE_ACTIVITY_EMPTY,
} from "@/lib/companyWorkspaceCopy";

export default function CompanyDashboardScreen() {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createCompanyHomeStyles(colors), [colors]);
  const {
    dashboard,
    companyName,
    loading,
    refreshing,
    loadError,
    showMembersLink,
    recentActivity,
    onRefresh,
    reload,
  } = useCompanyDashboard();

  const kpiConfigs = useMemo((): KpiCardConfig[] => {
    return [
      {
        key: "requests",
        label: "Active Requests",
        icon: FileText,
        href: COMPANY_ROUTES.requests,
      },
      {
        key: "students",
        label: "Saved Students",
        icon: UserRound,
        href: COMPANY_ROUTES.saved,
        highlight: true,
      },
      {
        key: "teams",
        label: "Saved Teams",
        icon: UsersRound,
        href: COMPANY_ROUTES.saved,
      },
      {
        key: "members",
        label: "Workspace Members",
        icon: Users,
        href: showMembersLink ? COMPANY_ROUTES.members : undefined,
      },
    ];
  }, [showMembersLink]);

  if (loading) {
    return (
      <CompanyScreen edges={["top"]}>
        <CompanyHomeSkeleton />
      </CompanyScreen>
    );
  }

  const activeRequests = dashboard?.activeRequests ?? 0;
  const savedStudents = dashboard?.savedStudents ?? 0;
  const savedTeams = dashboard?.savedTeams ?? 0;
  const previewCount = dashboard?.activeRequestsPreview.length ?? 0;
  const hasMoreRequests = activeRequests > previewCount;

  return (
    <CompanyScreen edges={["top"]}>
      <CompanyHomeHeader companyName={companyName} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <View style={styles.scroll}>
          <CompanyHeroCard />

          {loadError ? (
            <View style={[styles.card, { padding: 16 }]}>
              <CompanyEmptyState
                icon={Building2}
                message={loadError}
                actionLabel="Retry"
                onAction={() => void reload()}
              />
            </View>
          ) : (
            <>
              <CompanyKpiGrid
                metrics={{
                  requests: activeRequests,
                  students: savedStudents,
                  teams: savedTeams,
                  members: dashboard?.workspaceMembers ?? 0,
                }}
                configs={kpiConfigs}
              />

              <CompanyHomeSection
                title="Active Requests"
                subtitle={COMPANY_ACTIVE_REQUESTS_SUBTITLE}
                icon={FileText}
                count={activeRequests}
                collapsible
                defaultExpanded
                onSeeAll={hasMoreRequests ? () => router.push(COMPANY_ROUTES.requests as Href) : undefined}
              >
                {activeRequests === 0 ? (
                  <CompanyEmptyState
                    icon={FileText}
                    message={COMPANY_DASHBOARD_NO_REQUESTS}
                    actionLabel="Create Request"
                    onAction={() => router.push(COMPANY_ROUTES.newRequest as Href)}
                  />
                ) : (
                  <View>
                    {dashboard?.activeRequestsPreview.map((request, index) => (
                      <CompanyActiveRequestCard
                        key={request.id}
                        request={request}
                        showDivider={index > 0}
                      />
                    ))}
                  </View>
                )}
              </CompanyHomeSection>

              <CompanyHomeSection
                title="Workspace Activity"
                subtitle={recentActivity.length > 0 ? "Recent team actions" : undefined}
                icon={TrendingUp}
                count={recentActivity.length > 0 ? recentActivity.length : undefined}
                collapsible
                defaultExpanded={false}
                seeAllLabel={recentActivity.length > 0 ? "Last 5" : undefined}
              >
                {recentActivity.length === 0 ? (
                  <CompanyEmptyState
                    icon={TrendingUp}
                    message={COMPANY_WORKSPACE_ACTIVITY_EMPTY}
                  />
                ) : (
                  <View style={{ paddingTop: 4 }}>
                    <CompanyActivityTimeline items={recentActivity} />
                  </View>
                )}
              </CompanyHomeSection>

              <CompanyHomeSection
                title="Recently Saved Candidates"
                icon={Bookmark}
                count={savedStudents}
                collapsible
                defaultExpanded={false}
                onSeeAll={
                  savedStudents > 0 ? () => router.push(COMPANY_ROUTES.saved as Href) : undefined
                }
              >
                {!dashboard?.recentSavedStudents.length ? (
                  <CompanyEmptyState
                    icon={Bookmark}
                    message={COMPANY_DASHBOARD_NO_SAVED_STUDENTS}
                    actionLabel={activeRequests > 0 ? COMPANY_DASHBOARD_BROWSE_REQUESTS : undefined}
                    onAction={
                      activeRequests > 0
                        ? () => router.push(COMPANY_ROUTES.requests as Href)
                        : undefined
                    }
                  />
                ) : (
                  <CompanySavedCandidatesRow students={dashboard.recentSavedStudents} />
                )}
              </CompanyHomeSection>

              <CompanyHomeSection
                title="Recently Saved Teams"
                icon={UsersRound}
                count={savedTeams}
                collapsible
                defaultExpanded={false}
                onSeeAll={savedTeams > 0 ? () => router.push(COMPANY_ROUTES.saved as Href) : undefined}
              >
                {!dashboard?.recentSavedTeams.length ? (
                  <CompanyEmptyState
                    icon={UsersRound}
                    message={COMPANY_DASHBOARD_NO_SAVED_TEAMS}
                    actionLabel={activeRequests > 0 ? COMPANY_DASHBOARD_BROWSE_REQUESTS : undefined}
                    onAction={
                      activeRequests > 0
                        ? () => router.push(COMPANY_ROUTES.requests as Href)
                        : undefined
                    }
                  />
                ) : (
                  <CompanySavedTeamsRow teams={dashboard.recentSavedTeams} />
                )}
              </CompanyHomeSection>
            </>
          )}
        </View>
      </ScrollView>
    </CompanyScreen>
  );
}
