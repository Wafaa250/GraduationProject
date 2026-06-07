import { Check, Plus, Sparkles, UserRound, UsersRound } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { CompanyAccordionSection } from "@/components/company/ui/CompanyAccordionSection";
import { CompanyWizardOptionField } from "@/components/company/requests/wizard/CompanyWizardOptionField";
import { CompanyWizardSkillsField } from "@/components/company/requests/wizard/CompanyWizardSkillsField";
import { createWizardStyles } from "@/components/company/requests/wizard/companyRequestWizardStyles";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import type { useCompanyRequestWizard } from "@/hooks/useCompanyRequestWizard";
import {
  buildDurationLabel,
  COLLABORATION_FORMATS,
  COMPANY_ROLE_OPTIONS,
  COMPANY_SKILL_OPTIONS,
  DURATION_UNITS,
  PROJECT_CATEGORIES,
  resolveProjectCategory,
} from "@/lib/companyRequestCatalog";
import { formatDraftSavedAt, requestTypeLabel } from "@/lib/companyRequestDisplay";
import { collaborationFormatLabel } from "@/lib/collaborationFormat";

type Wizard = ReturnType<typeof useCompanyRequestWizard>;

export function CompanyRequestTypeStep({ wizard }: { wizard: Wizard }) {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createWizardStyles(colors), [colors]);

  const cards = [
    {
      key: "individual" as const,
      title: "Individual Contributor",
      desc: "One student for a specific role on your project.",
      icon: UserRound,
    },
    {
      key: "ai-built-team" as const,
      title: "AI-Built Team",
      desc: "Multiple required roles — AI suggests separate students per role to form a team composition.",
      icon: UsersRound,
    },
  ];

  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.stepTitle}>Request Type</Text>
      <Text style={styles.stepSubtitle}>Choose how SkillSwap should match students to this request.</Text>
      {cards.map((card) => {
        const Icon = card.icon;
        const selected = wizard.type === card.key;
        return (
          <Pressable
            key={card.key}
            onPress={() => wizard.setType(card.key)}
            style={[styles.typeCard, selected && styles.typeCardSelected]}
          >
            <View style={styles.typeIcon}>
              <Icon size={24} color={colors.accent} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.typeTitle}>{card.title}</Text>
              <Text style={styles.typeDesc}>{card.desc}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function CompanyRequestBasicsStep({ wizard }: { wizard: Wizard }) {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createWizardStyles(colors), [colors]);

  return (
    <View style={{ gap: 16 }}>
      <Text style={styles.stepTitle}>Project basics</Text>
      <View>
        <Text style={styles.fieldLabel}>
          Project title<Text style={styles.required}> *</Text>
        </Text>
        <TextInput
          value={wizard.title}
          onChangeText={wizard.setTitle}
          placeholder="e.g. Mobile booking app MVP"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
      </View>
      <CompanyWizardOptionField
        label="Category"
        required
        value={wizard.categoryChoice}
        onChange={wizard.setCategoryChoice}
        options={[...PROJECT_CATEGORIES]}
        placeholder="Search categories…"
      />
      {wizard.categoryChoice === "Other" ? (
        <View>
          <Text style={styles.fieldLabel}>
            Custom category<Text style={styles.required}> *</Text>
          </Text>
          <TextInput
            value={wizard.categoryOther}
            onChangeText={wizard.setCategoryOther}
            placeholder="Describe your project category"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </View>
      ) : null}
      <View>
        <Text style={styles.fieldLabel}>
          Description<Text style={styles.required}> *</Text>
        </Text>
        <TextInput
          value={wizard.description}
          onChangeText={wizard.setDescription}
          placeholder="What should collaborators build or contribute?"
          placeholderTextColor={colors.muted}
          multiline
          style={[styles.input, styles.inputMultiline]}
        />
      </View>
    </View>
  );
}

export function CompanyRequestRolesStep({ wizard }: { wizard: Wizard }) {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createWizardStyles(colors), [colors]);

  if (wizard.type === "individual") {
    return (
      <View style={{ gap: 16 }}>
        <Text style={styles.stepTitle}>Roles & skills</Text>
        <CompanyWizardOptionField
          label="Role"
          required
          value={wizard.targetRole}
          onChange={wizard.setTargetRole}
          options={COMPANY_ROLE_OPTIONS}
          placeholder="Search or select a role…"
          allowCustom
        />
        <CompanyWizardSkillsField
          label="Skills"
          required
          selected={wizard.individualSkills}
          onChange={wizard.setIndividualSkills}
          options={COMPANY_SKILL_OPTIONS}
        />
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      <Text style={styles.stepTitle}>Roles & skills</Text>
      <Text style={styles.stepSubtitle}>Add each role your team needs. AI will match one student per role.</Text>
      {wizard.teamRoles.map((role, index) => {
        const taken = wizard.rolesTakenByOthers(role.id);
        const roleOptions = COMPANY_ROLE_OPTIONS.filter(
          (o) =>
            o.toLowerCase() === role.roleName.toLowerCase() ||
            !taken.some((t) => t.toLowerCase() === o.toLowerCase()),
        );
        return (
          <View key={role.id} style={styles.roleCard}>
            <View style={styles.roleCardHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{index + 1}</Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                  {role.roleName || "Select a role"}
                </Text>
              </View>
              {wizard.teamRoles.length > 1 ? (
                <Pressable onPress={() => wizard.removeTeamRole(role.id)} hitSlop={8}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#DC2626" }}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
            <CompanyWizardOptionField
              label="Role"
              required
              value={role.roleName}
              onChange={(name) => wizard.updateTeamRole(role.id, { roleName: name })}
              options={roleOptions}
              placeholder="Search or select a role…"
              allowCustom
            />
            <CompanyWizardSkillsField
              label="Skills for this role"
              required
              selected={role.skills}
              onChange={(skills) => wizard.updateTeamRole(role.id, { skills })}
              options={COMPANY_SKILL_OPTIONS}
            />
            <View>
              <Text style={styles.fieldLabel}>Optional notes</Text>
              <TextInput
                value={role.notes ?? ""}
                onChangeText={(notes) => wizard.updateTeamRole(role.id, { notes })}
                placeholder="Scope, seniority, or collaboration expectations"
                placeholderTextColor={colors.muted}
                multiline
                style={[styles.input, { minHeight: 88, textAlignVertical: "top" }]}
              />
            </View>
          </View>
        );
      })}
      <Pressable onPress={wizard.addTeamRole} style={styles.addRoleBtn}>
        <Plus size={16} color={colors.accent} />
        <Text style={styles.addRoleText}>Add another role</Text>
      </Pressable>
    </View>
  );
}

export function CompanyRequestScopeStep({ wizard }: { wizard: Wizard }) {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createWizardStyles(colors), [colors]);

  return (
    <View style={{ gap: 16 }}>
      <Text style={styles.stepTitle}>Scope</Text>
      <CompanyWizardOptionField
        label="Collaboration format"
        required
        value={wizard.collaborationType}
        onChange={wizard.setCollaborationType}
        options={COLLABORATION_FORMATS.map((f) => ({ value: f.value, label: f.label }))}
        placeholder="Select format"
      />
      <View>
        <Text style={styles.fieldLabel}>
          Duration<Text style={styles.required}> *</Text>
        </Text>
        <Pressable
          onPress={() => wizard.setDurationOngoing(!wizard.durationOngoing)}
          style={styles.checkboxRow}
        >
          <View style={[styles.checkbox, wizard.durationOngoing && styles.checkboxChecked]}>
            {wizard.durationOngoing ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : null}
          </View>
          <Text style={styles.checkboxLabel}>Ongoing collaboration</Text>
        </Pressable>
        {!wizard.durationOngoing ? (
          <View style={{ gap: 12, marginTop: 12 }}>
            <View>
              <Text style={styles.fieldLabel}>Length</Text>
              <TextInput
                value={wizard.durationValue === "" ? "" : String(wizard.durationValue)}
                onChangeText={(text) => {
                  const n = parseInt(text.replace(/\D/g, ""), 10);
                  wizard.setDurationValue(Number.isFinite(n) ? n : "");
                }}
                keyboardType="number-pad"
                placeholder="e.g. 3"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
            </View>
            <CompanyWizardOptionField
              label="Unit"
              value={wizard.durationUnit}
              onChange={(unit) => wizard.setDurationUnit(unit as typeof wizard.durationUnit)}
              options={[...DURATION_UNITS]}
              placeholder="Select unit"
            />
          </View>
        ) : null}
      </View>
      <View>
        <Text style={styles.fieldLabel}>Notes</Text>
        <TextInput
          value={wizard.scopeNotes}
          onChangeText={wizard.setScopeNotes}
          placeholder="Optional"
          placeholderTextColor={colors.muted}
          multiline
          style={[styles.input, styles.inputMultiline]}
        />
      </View>
    </View>
  );
}

export function CompanyRequestReviewStep({ wizard }: { wizard: Wizard }) {
  const colors = useCompanyTheme();
  const category = resolveProjectCategory(wizard.categoryChoice, wizard.categoryOther);
  const durationLabel = buildDurationLabel(
    wizard.durationOngoing,
    wizard.durationValue,
    wizard.durationUnit,
  );
  const reviewSkills =
    wizard.type === "individual"
      ? wizard.individualSkills
      : [...new Set(wizard.teamRoles.flatMap((r) => r.skills))];

  const summaryText = [
    wizard.type ? requestTypeLabel(wizard.type) : "—",
    category || "—",
    durationLabel || "—",
    collaborationFormatLabel(wizard.collaborationType) || "—",
  ].join(" · ");

  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground, letterSpacing: -0.4 }}>
        Review
      </Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
        Confirm your request before publishing. You can save a draft and finish later.
      </Text>

      <CompanyAccordionSection
        title="Summary"
        defaultExpanded
        summary={wizard.title.trim() || "Untitled project request"}
      >
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground, paddingTop: 4 }}>
          {wizard.title.trim() || "Untitled project request"}
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginTop: 8 }}>
          {wizard.description.trim() || "No description provided."}
        </Text>
        <ReviewStat label="Type" value={wizard.type ? requestTypeLabel(wizard.type) : "—"} />
        <ReviewStat label="Category" value={category || "—"} />
        <ReviewStat label="Duration" value={durationLabel || "—"} />
        <ReviewStat label="Format" value={collaborationFormatLabel(wizard.collaborationType) || "—"} />
        {wizard.draftUpdatedAt ? (
          <ReviewStat label="Last saved" value={formatDraftSavedAt(wizard.draftUpdatedAt)} />
        ) : null}
      </CompanyAccordionSection>

      <CompanyAccordionSection title="Requirements" summary={summaryText}>
        <View style={{ paddingTop: 4 }}>
          {wizard.type === "individual" ? (
            <ReviewStat label="Role" value={wizard.targetRole || "—"} />
          ) : (
            wizard.teamRoles.map((role) => (
              <View key={role.id} style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                  {role.roleName || "—"}
                </Text>
                {role.skills.length > 0 ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {role.skills.map((s) => (
                      <View
                        key={s}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 999,
                          backgroundColor: colors.surfaceMuted,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}>{s}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                {role.notes?.trim() ? (
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, lineHeight: 18 }}>
                    {role.notes.trim()}
                  </Text>
                ) : null}
              </View>
            ))
          )}
          {reviewSkills.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.muted, letterSpacing: 0.4 }}>
                SKILLS
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {reviewSkills.map((s) => (
                  <View
                    key={s}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 999,
                      backgroundColor: colors.accentSoft,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accent }}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </CompanyAccordionSection>

      <CompanyAccordionSection
        title="Scope"
        summary={[collaborationFormatLabel(wizard.collaborationType), durationLabel].filter(Boolean).join(" · ") || "Collaboration details"}
      >
        <ReviewStat label="Collaboration" value={collaborationFormatLabel(wizard.collaborationType) || "—"} />
        <ReviewStat label="Duration" value={durationLabel || "—"} />
      </CompanyAccordionSection>

      <CompanyAccordionSection
        title="Notes"
        summary={wizard.scopeNotes.trim() || "No additional notes"}
      >
        <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textSecondary, paddingTop: 4 }}>
          {wizard.scopeNotes.trim() || "No additional notes provided."}
        </Text>
      </CompanyAccordionSection>

      <View
        style={{
          flexDirection: "row",
          gap: 10,
          padding: 14,
          borderRadius: 12,
          backgroundColor: colors.accentSoft,
          borderWidth: 1,
          borderColor: colors.accentBorder,
        }}
      >
        <Sparkles size={18} color={colors.accent} strokeWidth={2.2} />
        <Text style={{ flex: 1, fontSize: 13, lineHeight: 18, color: colors.textSecondary }}>
          AI will recommend matching students based on this request.
        </Text>
      </View>
    </View>
  );
}

function ReviewStat({ label, value }: { label: string; value: string }) {
  const colors = useCompanyTheme();
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: colors.muted, letterSpacing: 0.4 }}>{label.toUpperCase()}</Text>
      <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground, marginTop: 2 }}>{value}</Text>
    </View>
  );
}

export function CompanyRequestSuccessStep({
  savedRequestId,
  isEdit = false,
  onViewRequest,
  onAllRequests,
  onDashboard,
}: {
  savedRequestId: number | null;
  isEdit?: boolean;
  onViewRequest: () => void;
  onAllRequests: () => void;
  onDashboard: () => void;
}) {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createWizardStyles(colors), [colors]);

  return (
    <View style={{ alignItems: "center", paddingTop: 24 }}>
      <View style={styles.successIcon}>
        <Check size={36} color="#FFFFFF" strokeWidth={2.5} />
      </View>
      <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground, marginTop: 20, textAlign: "center" }}>
        {isEdit ? "Request updated" : "Request created"}
      </Text>
      <Text
        style={{
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
          marginTop: 10,
          textAlign: "center",
          maxWidth: 320,
        }}
      >
        {isEdit
          ? "Your changes are saved. You can return to the request or find matching students when AI matching is available."
          : "Your project request is saved. SkillSwap AI will recommend students based on your roles and skills when matching is available."}
      </Text>
      <View style={[styles.successActions, { width: "100%" }]}>
        {savedRequestId ? (
          <Pressable onPress={onViewRequest} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>View request</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onAllRequests} style={styles.outlineBtn}>
          <Text style={styles.outlineBtnText}>All requests</Text>
        </Pressable>
        <Pressable onPress={onDashboard} style={styles.outlineBtn}>
          <Text style={styles.outlineBtnText}>Back to dashboard</Text>
        </Pressable>
      </View>
    </View>
  );
}
