import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronDown, Plus, Sparkles, Users } from "lucide-react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  createOrganizationTeamMember,
  deleteOrganizationTeamMember,
  listOrganizationTeamMembers,
  updateOrganizationTeamMember,
  type OrganizationTeamMember,
} from "@/api/organizationTeamMembersApi";
import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { AssociationFormSection } from "@/components/association/AssociationFormSection";
import { AssociationLoadingState } from "@/components/association/AssociationLoadingState";
import { AssociationTextField } from "@/components/association/AssociationTextField";
import { AssociationWorkspaceScreen } from "@/components/association/AssociationWorkspaceScreen";
import { LeadershipProfileCard } from "@/components/association/LeadershipProfileCard";
import { TeamMemberPortraitUpload } from "@/components/association/TeamMemberPortraitUpload";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { useAssociationWorkspace } from "@/contexts/AssociationWorkspaceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { sortByLeadershipRole } from "@/lib/leadershipRoleSort";
import { confirmAlert, showAlert } from "@/lib/confirmAlert";

type Draft = {
  fullName: string;
  roleTitle: string;
  major: string;
  imageUrl: string;
  linkedInUrl: string;
};

function emptyDraft(): Draft {
  return { fullName: "", roleTitle: "", major: "", imageUrl: "", linkedInUrl: "" };
}

function draftFromMember(member: OrganizationTeamMember): Draft {
  return {
    fullName: member.fullName,
    roleTitle: member.roleTitle,
    major: member.major ?? "",
    imageUrl: member.imageUrl ?? "",
    linkedInUrl: member.linkedInUrl ?? "",
  };
}

function draftsEqual(a: Draft, b: Draft): boolean {
  return (
    a.fullName === b.fullName &&
    a.roleTitle === b.roleTitle &&
    a.major === b.major &&
    a.imageUrl === b.imageUrl &&
    a.linkedInUrl === b.linkedInUrl
  );
}

export default function AssociationLeadershipScreen() {
  const layout = useResponsiveLayout();
  const { associationName } = useAssociationWorkspace();
  const [members, setMembers] = useState<OrganizationTeamMember[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [baselineDraft, setBaselineDraft] = useState<Draft>(emptyDraft());
  const [formExpanded, setFormExpanded] = useState(false);
  const [portraitPreviewUrl, setPortraitPreviewUrl] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const loadMembers = useCallback(async (silent = false) => {
    if (!silent) setListLoading(true);
    else setRefreshing(true);
    try {
      const data = await listOrganizationTeamMembers();
      setMembers(sortByLeadershipRole(data));
    } catch (err) {
      Alert.alert("Could not load leadership board", parseApiErrorMessage(err));
    } finally {
      setListLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const isDirty = formExpanded && !draftsEqual(draft, baselineDraft);
  const previewImageUrl = (portraitPreviewUrl ?? draft.imageUrl.trim()) || null;

  const startCreate = () => {
    const empty = emptyDraft();
    setEditingId(null);
    setDraft(empty);
    setBaselineDraft(empty);
    setPortraitPreviewUrl(null);
    setShowAdvanced(false);
    setFormExpanded(true);
  };

  const startEdit = (member: OrganizationTeamMember) => {
    const next = draftFromMember(member);
    setEditingId(member.id);
    setDraft(next);
    setBaselineDraft(next);
    setPortraitPreviewUrl(null);
    setShowAdvanced(!!next.imageUrl && !next.imageUrl.startsWith("/"));
    setFormExpanded(true);
  };

  const cancelForm = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setBaselineDraft(emptyDraft());
    setPortraitPreviewUrl(null);
    setShowAdvanced(false);
    setFormExpanded(false);
  };

  const tryLeaveForm = () => {
    if (isDirty) {
      confirmAlert({
        title: "Discard changes?",
        message: "You have unsaved changes.",
        confirmLabel: "Discard",
        destructive: true,
        onConfirm: cancelForm,
      });
      return;
    }
    cancelForm();
  };

  const handlePortraitPreview = useCallback((url: string | null) => {
    setPortraitPreviewUrl(url);
  }, []);

  const saveMember = async () => {
    const payload = {
      fullName: draft.fullName.trim(),
      roleTitle: draft.roleTitle.trim(),
      major: draft.major.trim() || null,
      imageUrl: draft.imageUrl.trim() || null,
      linkedInUrl: draft.linkedInUrl.trim() || null,
    };
    if (!payload.fullName || !payload.roleTitle) {
      Alert.alert("Required fields", "Full name and position are required.");
      return;
    }

    setSaving(true);
    try {
      if (editingId != null) {
        const updated = await updateOrganizationTeamMember(editingId, payload);
        setMembers((prev) =>
          sortByLeadershipRole(prev.map((item) => (item.id === updated.id ? updated : item))),
        );
      } else {
        const created = await createOrganizationTeamMember(payload);
        setMembers((prev) => sortByLeadershipRole([...prev, created]));
      }
      cancelForm();
    } catch (err) {
      Alert.alert("Save failed", parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const removeMember = (member: OrganizationTeamMember) => {
    confirmAlert({
      title: "Remove member",
      message: `Remove ${member.fullName} (${member.roleTitle}) from the public leadership board?`,
      confirmLabel: "Remove",
      destructive: true,
      onConfirm: async () => {
        setDeletingId(member.id);
        try {
          await deleteOrganizationTeamMember(member.id);
          setMembers((prev) => prev.filter((item) => item.id !== member.id));
          if (editingId === member.id) cancelForm();
          showAlert("Member removed", "Leadership board updated.");
        } catch (err) {
          showAlert("Delete failed", parseApiErrorMessage(err));
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  if (formExpanded) {
    return (
      <AssociationWorkspaceScreen showBack onBackPress={tryLeaveForm} navTitle="Leadership">
        <View style={{ width: "100%", gap: layout.space("md") }}>

          {isDirty ? (
            <View style={styles.unsavedPill}>
              <Text style={styles.unsavedText}>Unsaved changes</Text>
            </View>
          ) : null}

          <View style={[styles.formCard, { borderRadius: layout.radius.button + 2 }]}>
            <View style={[styles.formHeader, { padding: layout.space("md") }]}>
              <View style={styles.formTitleIcon}>
                <Sparkles size={18} color={ASSOC_COLORS.accentDark} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.formTitle}>
                  {editingId != null ? "Edit position" : "Add position"}
                </Text>
                <Text style={styles.formSubtitle}>
                  {editingId != null
                    ? "Update this position's public profile details."
                    : "Add a new position to your leadership board."}
                </Text>
              </View>
            </View>

            <View style={[styles.formBody, { padding: layout.space("md"), gap: layout.space("lg") }]}>
              <View style={{ gap: layout.space("sm") }}>
                <Text style={styles.previewLabel}>Live preview</Text>
                <LeadershipProfileCard
                  preview
                  fullName={draft.fullName}
                  roleTitle={draft.roleTitle}
                  major={draft.major}
                  imageUrl={previewImageUrl}
                  linkedInUrl={draft.linkedInUrl}
                  organizationName={associationName}
                />
                <Text style={styles.previewNote}>
                  Matches your public profile card — students see exactly this layout.
                </Text>
              </View>

              <AssociationFormSection
                title="Profile photo"
                description="A clear portrait helps students recognize your board."
                bordered={false}
              >
                <TeamMemberPortraitUpload
                  imageUrl={draft.imageUrl.trim() || null}
                  onImageUrlChange={(url) => setDraft((prev) => ({ ...prev, imageUrl: url ?? "" }))}
                  onDisplayUrlChange={handlePortraitPreview}
                  disabled={saving}
                />
                <Pressable
                  onPress={() => setShowAdvanced((value) => !value)}
                  style={styles.advancedToggle}
                >
                  <Text style={styles.advancedToggleText}>Advanced options</Text>
                  <ChevronDown
                    size={15}
                    color={ASSOC_COLORS.muted}
                    strokeWidth={2.25}
                    style={{ transform: [{ rotate: showAdvanced ? "180deg" : "0deg" }] }}
                  />
                </Pressable>
                {showAdvanced ? (
                  <View style={{ gap: 6 }}>
                    <AssociationTextField
                      label="Image URL (optional)"
                      value={draft.imageUrl}
                      onChangeText={(imageUrl) => setDraft((prev) => ({ ...prev, imageUrl }))}
                      placeholder="https://… or /uploads/…"
                      keyboardType="url"
                      autoCapitalize="none"
                    />
                    <Text style={styles.fieldHint}>
                      Paste a direct image URL instead of uploading. Upload is recommended.
                    </Text>
                  </View>
                ) : null}
              </AssociationFormSection>

              <AssociationFormSection title="Basic information">
                <AssociationTextField
                  label="Full name"
                  value={draft.fullName}
                  onChangeText={(fullName) => setDraft((prev) => ({ ...prev, fullName }))}
                  placeholder="Sarah Al-Masri"
                />
                <AssociationTextField
                  label="Position"
                  value={draft.roleTitle}
                  onChangeText={(roleTitle) => setDraft((prev) => ({ ...prev, roleTitle }))}
                  placeholder="President"
                />
                <AssociationTextField
                  label="Major (optional)"
                  value={draft.major}
                  onChangeText={(major) => setDraft((prev) => ({ ...prev, major }))}
                  placeholder="Computer Engineering"
                />
              </AssociationFormSection>

              <AssociationFormSection title="Social links">
                <AssociationTextField
                  label="LinkedIn URL (optional)"
                  value={draft.linkedInUrl}
                  onChangeText={(linkedInUrl) => setDraft((prev) => ({ ...prev, linkedInUrl }))}
                  placeholder="https://linkedin.com/in/…"
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </AssociationFormSection>
            </View>

            <View style={[styles.formFooter, { padding: layout.space("md") }]}>
              <AssociationActionButton
                label={saving ? "Saving…" : "Save changes"}
                loading={saving}
                onPress={() => void saveMember()}
              />
              <AssociationActionButton
                label="Cancel"
                variant="outline"
                onPress={tryLeaveForm}
                disabled={saving}
              />
            </View>
          </View>
        </View>
      </AssociationWorkspaceScreen>
    );
  }

  return (
    <AssociationWorkspaceScreen refreshing={refreshing} onRefresh={() => void loadMembers(true)}>
      <View style={styles.pageHeader}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.eyebrow}>Student organization</Text>
          <Text style={styles.pageTitle}>Leadership board</Text>
          <Text style={styles.pageDesc}>
            Your administrative board appears on your public profile. Each person holds a defined
            position.
          </Text>
        </View>
        {!listLoading && members.length > 0 ? (
          <AssociationActionButton
            label="Add position"
            compact
            onPress={startCreate}
            icon={<Plus size={17} color="#FFFFFF" strokeWidth={2.25} />}
          />
        ) : null}
      </View>

      {listLoading ? (
        <AssociationLoadingState message="Loading leadership board…" />
      ) : members.length === 0 ? (
        <View style={[styles.empty, { borderRadius: layout.radius.button + 4, padding: layout.space("xl") }]}>
          <View style={styles.emptyIcon}>
            <Users size={28} color={ASSOC_COLORS.accentDark} strokeWidth={1.75} />
          </View>
          <Text style={styles.emptyTitle}>Build your leadership board</Text>
          <Text style={styles.emptyDesc}>
            Add presidents, coordinators, and leads—each with their own position on your public
            profile.
          </Text>
          <AssociationActionButton
            label="Add your first position"
            onPress={startCreate}
            icon={<Plus size={17} color="#FFFFFF" strokeWidth={2.25} />}
          />
        </View>
      ) : (
        <View style={{ width: "100%", gap: layout.space("md") }}>
          <Text style={styles.rosterCount}>
            {members.length} position{members.length === 1 ? "" : "s"}
          </Text>
          <View style={{ gap: layout.space("md"), width: "100%" }}>
            {members.map((member) => (
              <LeadershipProfileCard
                key={member.id}
                fullName={member.fullName}
                roleTitle={member.roleTitle}
                major={member.major}
                imageUrl={member.imageUrl}
                linkedInUrl={member.linkedInUrl}
                organizationName={associationName}
                deleting={deletingId === member.id}
                onEdit={() => startEdit(member)}
                onDelete={() => removeMember(member)}
              />
            ))}
          </View>
        </View>
      )}
    </AssociationWorkspaceScreen>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: ASSOC_COLORS.accent,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: ASSOC_COLORS.foreground,
    letterSpacing: -0.5,
  },
  pageDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: ASSOC_COLORS.muted,
    maxWidth: 520,
  },
  rosterCount: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: ASSOC_COLORS.muted,
    paddingHorizontal: 4,
  },
  empty: {
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: ASSOC_COLORS.border,
    backgroundColor: ASSOC_COLORS.cardBg,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ASSOC_COLORS.accentSoft,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.accentBorder,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: ASSOC_COLORS.foreground,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: ASSOC_COLORS.muted,
    textAlign: "center",
    maxWidth: 400,
    marginBottom: 24,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backText: {
    fontSize: 13,
    fontWeight: "600",
    color: ASSOC_COLORS.muted,
  },
  unsavedPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: ASSOC_COLORS.accentSoft,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.accentBorder,
  },
  unsavedText: {
    fontSize: 11,
    fontWeight: "700",
    color: ASSOC_COLORS.accentDark,
  },
  formCard: {
    width: "100%",
    backgroundColor: ASSOC_COLORS.cardBg,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
    overflow: "hidden",
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  formTitleIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ASSOC_COLORS.accentSoft,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.accentBorder,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: ASSOC_COLORS.foreground,
  },
  formSubtitle: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    color: ASSOC_COLORS.muted,
  },
  formBody: {
    width: "100%",
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: ASSOC_COLORS.muted,
  },
  previewNote: {
    fontSize: 12,
    lineHeight: 18,
    color: ASSOC_COLORS.muted,
  },
  advancedToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  advancedToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: ASSOC_COLORS.muted,
  },
  fieldHint: {
    fontSize: 12,
    lineHeight: 18,
    color: ASSOC_COLORS.muted,
    marginTop: -8,
    marginBottom: 8,
  },
  formFooter: {
    borderTopWidth: 1,
    borderTopColor: ASSOC_COLORS.border,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    backgroundColor: ASSOC_COLORS.background,
  },
});
