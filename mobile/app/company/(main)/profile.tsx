import { useFocusEffect } from "expo-router";
import { Building2, Briefcase, MapPin } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";

import { CompanyEmptyState } from "@/components/company/home/CompanyEmptyState";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { CompanyWorkspaceToolbar } from "@/components/company/CompanyWorkspaceToolbar";
import { CompanyProfileContactCard } from "@/components/company/profile/CompanyProfileContactCard";
import { CompanyProfilePageHeader } from "@/components/company/profile/CompanyProfilePageHeader";
import {
  CompanyProfileDiscoveryNote,
  CompanyProfileHero,
  CompanyProfileInfoItem,
  CompanyProfileInterestChips,
} from "@/components/company/profile/CompanyProfileSections";
import { CompanyProfileSkeleton } from "@/components/company/profile/CompanyProfileSkeleton";
import { createCompanyProfileStyles } from "@/components/company/profile/companyProfileStyles";
import { CompanyAccordionSection } from "@/components/company/ui/CompanyAccordionSection";
import { CompanyScreen } from "@/components/company/ui/CompanyScreen";
import { useCompanyProfilePage } from "@/hooks/useCompanyProfilePage";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { emptyLabel } from "@/lib/companyProfileUtils";

export default function CompanyProfileScreen() {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createCompanyProfileStyles(colors), [colors]);
  const { profile, loading, loadError, form, canEditProfile, reload } = useCompanyProfilePage();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void reload(true);
    }, [reload]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload(true);
    setRefreshing(false);
  }, [reload]);

  const name = form.companyName || profile?.companyName || "Company";

  return (
    <CompanyScreen edges={["top"]}>
      <CompanyWorkspaceToolbar companyName={name} />
      <CompanyProfilePageHeader canEdit={canEditProfile} />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.accent} />
        }
        contentContainerStyle={styles.screenPad}
        showsVerticalScrollIndicator={false}
      >
        {loading && !profile ? (
          <CompanyProfileSkeleton />
        ) : loadError ? (
          <CompanyEmptyState
            icon={Building2}
            message={loadError}
            actionLabel="Retry"
            onAction={() => void reload()}
          />
        ) : profile ? (
          <>
            <CompanyProfileHero
              companyName={name}
              industry={form.industry || profile.industry}
              location={form.headquartersLocation || profile.headquartersLocation || profile.location}
            />

            <View style={{ gap: HOME_SPACE.md, marginTop: HOME_SPACE.md }}>
              <CompanyAccordionSection
                title="About Company"
                defaultExpanded
                summary={form.about.trim() ? form.about.trim().slice(0, 80) : "No company description yet."}
              >
                {form.about.trim() ? (
                  <Text style={[styles.bodyText, { paddingTop: 4 }]}>{form.about.trim()}</Text>
                ) : (
                  <Text style={[styles.emptyText, { paddingTop: 4 }]}>No company description yet.</Text>
                )}
              </CompanyAccordionSection>

              <CompanyAccordionSection
                title="Company Information"
                icon={Building2}
                summary={[form.industry, form.headquartersLocation].filter(Boolean).join(" · ") || "Company details"}
              >
                <View style={{ paddingTop: 4 }}>
                  <CompanyProfileInfoItem
                    icon={Briefcase}
                    label="Industry"
                    value={emptyLabel(form.industry, "No industry specified")}
                  />
                  <CompanyProfileInfoItem
                    icon={MapPin}
                    label="Headquarters / location"
                    value={emptyLabel(form.headquartersLocation, "No headquarters specified")}
                  />
                  <CompanyProfileInfoItem
                    icon={Building2}
                    label="Working style"
                    value={emptyLabel(form.workingStyle, "No working style specified")}
                    isLast
                  />
                </View>
              </CompanyAccordionSection>

              <CompanyAccordionSection
                title="Areas of Interest"
                summary={
                  form.areasOfInterest.length > 0
                    ? `${form.areasOfInterest.length} focus area${form.areasOfInterest.length === 1 ? "" : "s"}`
                    : "No focus areas specified"
                }
              >
                <View style={{ paddingTop: 4 }}>
                  <CompanyProfileInterestChips tags={form.areasOfInterest} />
                </View>
              </CompanyAccordionSection>

              <CompanyAccordionSection
                title="Contact & Links"
                summary={emptyLabel(form.contactEmail ?? profile.email, "Contact details")}
              >
                <View style={{ paddingTop: 4 }}>
                  <CompanyProfileContactCard
                    linkedInUrl={form.linkedInUrl}
                    optionalContactLink={form.optionalContactLink}
                    contactEmail={form.contactEmail}
                    email={profile.email}
                    websiteUrl={form.website}
                    embedded
                  />
                </View>
              </CompanyAccordionSection>

              <CompanyProfileDiscoveryNote />
            </View>
          </>
        ) : null}
      </ScrollView>
    </CompanyScreen>
  );
}
