import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import {
  ASSOCIATION_CATEGORIES,
  getAssociationProfile,
  parseApiErrorMessage,
  updateAssociationProfile,
  type StudentAssociationProfile,
} from "@/api/associationApi";
import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { AssociationCard } from "@/components/association/AssociationCard";
import { AssociationFormSection } from "@/components/association/AssociationFormSection";
import { AssociationLoadingState } from "@/components/association/AssociationLoadingState";
import { AssociationLogoUpload } from "@/components/association/AssociationLogoUpload";
import { AssociationSelectField } from "@/components/association/AssociationSelectField";
import { AssociationTextField } from "@/components/association/AssociationTextField";
import { AssociationWorkspaceScreen } from "@/components/association/AssociationWorkspaceScreen";
import { OrganizationProfileEventsSection } from "@/components/association/OrganizationProfileEventsSection";
import { OrganizationProfileHeader } from "@/components/association/OrganizationProfileHeader";
import { OrganizationProfileLeadershipSection } from "@/components/association/OrganizationProfileLeadershipSection";
import { OrganizationProfileReadOnlyView } from "@/components/association/OrganizationProfileReadOnlyView";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { useAssociationWorkspace } from "@/contexts/AssociationWorkspaceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  isUpcomingEvent,
  loadOrganizationProfileExtrasForOwner,
  type OrganizationProfileExtras,
} from "@/lib/organizationProfileData";
import { setItem } from "@/utils/authStorage";

type FormState = {
  associationName: string;
  username: string;
  description: string;
  faculty: string;
  category: string;
  logoUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  linkedInUrl: string;
};

function mapProfileToForm(profile: StudentAssociationProfile): FormState {
  return {
    associationName: profile.associationName,
    username: profile.username,
    description: profile.description ?? "",
    faculty: profile.faculty ?? "",
    category: profile.category ?? ASSOCIATION_CATEGORIES[0],
    logoUrl: profile.logoUrl ?? "",
    instagramUrl: profile.instagramUrl ?? "",
    facebookUrl: profile.facebookUrl ?? "",
    linkedInUrl: profile.linkedInUrl ?? "",
  };
}

export default function AssociationProfileScreen() {
  const layout = useResponsiveLayout();
  const { reload: reloadShell } = useAssociationWorkspace();
  const [profile, setProfile] = useState<StudentAssociationProfile | null>(null);
  const [extras, setExtras] = useState<OrganizationProfileExtras | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reloadExtras = useCallback(async (organizationProfileId?: number) => {
    const data = await loadOrganizationProfileExtrasForOwner(organizationProfileId);
    setExtras(data);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAssociationProfile();
      setProfile(data);
      setForm(mapProfileToForm(data));
      await reloadExtras(data.id);
    } catch (err) {
      Alert.alert("Could not load profile", parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [reloadExtras]);

  useEffect(() => {
    void load();
  }, [load]);

  const cancelEdit = () => {
    if (profile) setForm(mapProfileToForm(profile));
    setEditing(false);
  };

  const saveProfile = async () => {
    if (!form) return;
    if (!form.associationName.trim() || !form.username.trim() || !form.faculty.trim() || !form.category) {
      Alert.alert("Required fields", "Organization name, username, faculty, and category are required.");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateAssociationProfile({
        associationName: form.associationName.trim(),
        username: form.username.trim(),
        description: form.description,
        faculty: form.faculty.trim(),
        category: form.category,
        logoUrl: form.logoUrl.trim() || undefined,
        instagramUrl: form.instagramUrl.trim() || undefined,
        facebookUrl: form.facebookUrl.trim() || undefined,
        linkedInUrl: form.linkedInUrl.trim() || undefined,
      });
      setProfile(updated);
      setForm(mapProfileToForm(updated));
      await setItem("name", updated.associationName);
      await reloadShell();
      setEditing(false);
    } catch (err) {
      Alert.alert("Could not save profile", parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile || !form) {
    return (
      <AssociationWorkspaceScreen>
        <AssociationLoadingState message="Loading profile…" />
      </AssociationWorkspaceScreen>
    );
  }

  const upcomingCount = (extras?.events ?? []).filter((event) => isUpcomingEvent(event.eventDate)).length;
  const leadershipCount = extras?.leadership.length ?? 0;

  return (
    <AssociationWorkspaceScreen
      refreshing={loading}
      onRefresh={() => void load()}
      showBack={editing}
      onBackPress={cancelEdit}
      navTitle={editing ? "Edit profile" : undefined}
    >
      <View style={[styles.page, { gap: layout.space("md") }]}>
        <View style={styles.intro}>
          <Text style={styles.pageTitle}>Organization profile</Text>
          <Text style={styles.pageLead}>Update your public profile, logo, and social links.</Text>
        </View>

        <OrganizationProfileHeader
          profile={profile}
          editing={editing}
          onEdit={() => setEditing(true)}
          onCancel={cancelEdit}
          eventCount={upcomingCount}
          leadershipCount={leadershipCount}
        />

        {editing ? (
          <AssociationCard compact>
            <AssociationFormSection
              title="Basic information"
              description="Shown on your public organization page."
              bordered={false}
            >
              <AssociationTextField
                label="Organization name"
                value={form.associationName}
                onChangeText={(associationName) => setForm((prev) => prev && { ...prev, associationName })}
              />
              <AssociationTextField
                label="Username"
                value={form.username}
                onChangeText={(username) => setForm((prev) => prev && { ...prev, username })}
                placeholder="ieee_an-najah"
                autoCapitalize="none"
              />
              <AssociationTextField
                label="About"
                value={form.description}
                onChangeText={(description) => setForm((prev) => prev && { ...prev, description })}
                placeholder="Tell students about your mission, events, and community."
                multiline
              />
              <AssociationTextField
                label="Faculty"
                value={form.faculty}
                onChangeText={(faculty) => setForm((prev) => prev && { ...prev, faculty })}
              />
              <AssociationSelectField
                label="Category"
                value={form.category}
                onValueChange={(category) => setForm((prev) => prev && { ...prev, category })}
                options={ASSOCIATION_CATEGORIES}
              />
            </AssociationFormSection>

            <AssociationFormSection title="Logo" description="Optional — used on cards and listings.">
              <AssociationLogoUpload
                organizationName={form.associationName}
                logoUrl={form.logoUrl.trim() || null}
                onLogoUrlChange={(url) => setForm((prev) => prev && { ...prev, logoUrl: url ?? "" })}
                disabled={saving}
              />
            </AssociationFormSection>

            <AssociationFormSection
              title="Social links"
              description="Optional — Instagram, Facebook, or LinkedIn."
            >
              <AssociationTextField
                label="Instagram"
                value={form.instagramUrl}
                onChangeText={(instagramUrl) => setForm((prev) => prev && { ...prev, instagramUrl })}
                placeholder="https://instagram.com/yourorg"
                keyboardType="url"
                autoCapitalize="none"
              />
              <AssociationTextField
                label="Facebook"
                value={form.facebookUrl}
                onChangeText={(facebookUrl) => setForm((prev) => prev && { ...prev, facebookUrl })}
                placeholder="https://facebook.com/yourorg"
                keyboardType="url"
                autoCapitalize="none"
              />
              <AssociationTextField
                label="LinkedIn"
                value={form.linkedInUrl}
                onChangeText={(linkedInUrl) => setForm((prev) => prev && { ...prev, linkedInUrl })}
                placeholder="https://linkedin.com/company/yourorg"
                keyboardType="url"
                autoCapitalize="none"
              />
            </AssociationFormSection>

            <View style={styles.formFooter}>
              <AssociationActionButton label="Cancel" variant="outline" onPress={cancelEdit} disabled={saving} />
              <AssociationActionButton
                label={saving ? "Saving…" : "Save changes"}
                loading={saving}
                onPress={() => void saveProfile()}
              />
            </View>
          </AssociationCard>
        ) : (
          <OrganizationProfileReadOnlyView profile={profile} followersCount={extras?.followersCount} />
        )}

        <OrganizationProfileEventsSection
          events={extras?.events ?? []}
          loading={extras == null}
          onEventsChanged={() => void reloadExtras(profile.id)}
        />

        <OrganizationProfileLeadershipSection
          organizationName={profile.associationName}
          members={extras?.leadership ?? []}
          loading={extras == null}
        />
      </View>
    </AssociationWorkspaceScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    width: "100%",
  },
  intro: {
    gap: 4,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: ASSOC_COLORS.foreground,
    letterSpacing: -0.4,
  },
  pageLead: {
    fontSize: 14,
    lineHeight: 20,
    color: ASSOC_COLORS.muted,
  },
  formFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ASSOC_COLORS.border,
  },
});
