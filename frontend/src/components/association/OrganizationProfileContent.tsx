import { useState, type FormEvent, type ReactNode } from "react";
import toast from "react-hot-toast";
import { AssociationLogoUpload } from "@/components/association/AssociationLogoUpload";
import { AssociationProfileHeader } from "@/components/association/AssociationProfileHeader";
import { AssociationProfileReadOnlyView } from "@/components/association/AssociationProfileReadOnlyView";
import { OrganizationProfileEventsSection } from "@/components/association/OrganizationProfileEventsSection";
import { OrganizationProfileLeadershipSection } from "@/components/association/OrganizationProfileLeadershipSection";
import type { OrganizationProfileMode } from "@/components/association/organizationProfileTypes";
import type { OrganizationProfileExtras } from "@/api/organizationProfileData";
import {
  ASSOCIATION_CATEGORIES,
  parseApiErrorMessage,
  updateAssociationProfile,
  uploadAssociationLogo,
  type StudentAssociationProfile,
} from "@/api/associationApi";
import {
  deleteOrganizationEvent,
  type StudentOrganizationEvent,
} from "@/api/organizationEventsApi";
import type { PublicOrganizationMember } from "@/api/organizationsPublicApi";
import {
  ASSOC_PROFILE_MAX_WIDTH,
  assocCard,
} from "@/pages/association/dashboard/associationDashTokens";

export type OrganizationProfileFormState = {
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

type Props = {
  mode: OrganizationProfileMode;
  organizationId: number;
  profile: StudentAssociationProfile | null;
  extras: OrganizationProfileExtras | null;
  form: OrganizationProfileFormState | null;
  loading: boolean;
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (e: FormEvent) => void;
  setForm: React.Dispatch<React.SetStateAction<OrganizationProfileFormState | null>>;
  setProfile: React.Dispatch<React.SetStateAction<StudentAssociationProfile | null>>;
  onEventsChanged?: () => void | Promise<void>;
};

export function mapProfileToForm(data: StudentAssociationProfile): OrganizationProfileFormState {
  return {
    associationName: data.associationName,
    username: data.username,
    description: data.description ?? "",
    faculty: data.faculty ?? "",
    category: data.category ?? "",
    logoUrl: data.logoUrl ?? "",
    instagramUrl: data.instagramUrl ?? "",
    facebookUrl: data.facebookUrl ?? "",
    linkedInUrl: data.linkedInUrl ?? "",
  };
}

export function OrganizationProfileContent({
  mode,
  organizationId,
  profile,
  extras,
  form,
  loading,
  editing,
  saving,
  onEdit,
  onCancel,
  onSave,
  setForm,
  setProfile,
  onEventsChanged,
}: Props) {
  const isOwner = mode === "owner";
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);

  const handleDeleteEvent = async (eventId: number, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingEventId(eventId);
    try {
      await deleteOrganizationEvent(eventId);
      toast.success("Event deleted");
      await onEventsChanged?.();
    } catch (err) {
      toast.error(parseApiErrorMessage(err));
    } finally {
      setDeletingEventId(null);
    }
  };

  const orgName = profile?.associationName ?? "Organization";
  const events = extras?.events ?? [];
  const leadership = extras?.leadership ?? [];
  const followersCount = extras?.followersCount;
  const members = extras?.members ?? [];

  return (
    <div className="assoc-profile-page" style={{ maxWidth: ASSOC_PROFILE_MAX_WIDTH, margin: "0 auto" }}>
      {isOwner ? (
        <header className="assoc-profile-page__intro">
          <h1 className="assoc-profile-page__title">Organization profile</h1>
          <p className="assoc-profile-page__lead">
            Update your public profile, logo, and social links.
          </p>
        </header>
      ) : null}

      {loading || !profile || (isOwner && !form) ? (
        <ProfileSkeleton />
      ) : (
        <>
          <AssociationProfileHeader
            profile={profile}
            editing={isOwner ? editing : false}
            onEdit={isOwner ? onEdit : undefined}
            onCancel={isOwner ? onCancel : undefined}
          />

          {isOwner && editing && form ? (
            <form onSubmit={onSave} className="assoc-profile-form" style={assocCard}>
              <FormSection
                title="Basic information"
                description="Shown on your public organization page."
              >
                <div className="assoc-profile-form__row assoc-profile-form__row--2">
                  <Field label="Organization name" required>
                    <input
                      value={form.associationName}
                      onChange={(e) => setForm({ ...form, associationName: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Username" required>
                    <input
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      required
                      placeholder="ieee_an-najah"
                    />
                  </Field>
                </div>
                <Field label="About">
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Tell students about your mission, events, and community."
                  />
                </Field>
                <div className="assoc-profile-form__row assoc-profile-form__row--2">
                  <Field label="Faculty" required>
                    <input
                      value={form.faculty}
                      onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Category" required>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      required
                    >
                      <option value="">Select category</option>
                      {ASSOCIATION_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </FormSection>

              <FormSection title="Logo" description="Optional — used on cards and listings.">
                <AssociationLogoUpload
                  logoUrl={form.logoUrl || null}
                  onLogoUrlChange={async (url) => {
                    setForm((f) => (f ? { ...f, logoUrl: url ?? "" } : f));
                    if (url === null) {
                      try {
                        const updated = await updateAssociationProfile({ logoUrl: "" });
                        setProfile(updated);
                        toast.success("Logo removed");
                      } catch (err) {
                        toast.error(parseApiErrorMessage(err));
                      }
                    }
                  }}
                  onUpload={async (file, onProgress) => {
                    const url = await uploadAssociationLogo(file, onProgress);
                    setForm((f) => (f ? { ...f, logoUrl: url } : f));
                    setProfile((p) => (p ? { ...p, logoUrl: url } : p));
                    toast.success("Logo uploaded");
                    return url;
                  }}
                  disabled={saving}
                />
              </FormSection>

              <FormSection title="Social links" description="Optional — Instagram, Facebook, or LinkedIn.">
                <Field label="Instagram">
                  <input
                    value={form.instagramUrl}
                    onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
                    placeholder="https://instagram.com/yourorg"
                  />
                </Field>
                <Field label="Facebook">
                  <input
                    value={form.facebookUrl}
                    onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
                    placeholder="https://facebook.com/yourorg"
                  />
                </Field>
                <Field label="LinkedIn">
                  <input
                    value={form.linkedInUrl}
                    onChange={(e) => setForm({ ...form, linkedInUrl: e.target.value })}
                    placeholder="https://linkedin.com/company/yourorg"
                  />
                </Field>
              </FormSection>

              <div className="assoc-profile-form__footer">
                <button
                  type="button"
                  className="assoc-profile-btn assoc-profile-btn--ghost"
                  disabled={saving}
                  onClick={onCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="assoc-profile-btn assoc-profile-btn--primary settings-save-btn"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          ) : (
            <AssociationProfileReadOnlyView
              profile={profile}
              followersCount={followersCount}
            />
          )}

          <OrganizationProfileEventsSection
            mode={mode}
            organizationId={organizationId}
            events={events}
            loading={loading || extras == null}
            deletingEventId={deletingEventId}
            onDeleteEvent={
              isOwner
                ? (event: StudentOrganizationEvent) => void handleDeleteEvent(event.id, event.title)
                : undefined
            }
          />

          <OrganizationProfileLeadershipSection
            mode={mode}
            organizationName={orgName}
            members={leadership}
            loading={loading || extras == null}
          />

          {members.length > 0 ? <MembersSection members={members} /> : null}
        </>
      )}
    </div>
  );
}

function MembersSection({ members }: { members: PublicOrganizationMember[] }) {
  return (
    <section className="assoc-profile-view-card" style={assocCard}>
      <h2 className="assoc-profile-section-head__title" style={{ margin: "0 0 12px" }}>
        Members
      </h2>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
        {members.map((m) => (
          <li key={`${m.studentUserId}-${m.roleTitle}`} style={{ fontSize: 14 }}>
            <span style={{ fontWeight: 600 }}>{m.studentName}</span>
            {m.roleTitle ? <span style={{ color: "var(--muted-foreground)" }}> · {m.roleTitle}</span> : null}
            {m.major ? <span style={{ color: "var(--muted-foreground)" }}> · {m.major}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProfileSkeleton() {
  return (
    <div className="assoc-profile-skeleton" aria-busy aria-label="Loading profile">
      <div className="assoc-profile-skeleton__block" style={{ height: 168 }} />
      <div className="assoc-profile-skeleton__block" style={{ height: 128 }} />
      <div className="assoc-profile-skeleton__block" style={{ height: 96 }} />
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="assoc-profile-form__section">
      <SectionHeader title={title} description={description} />
      <div className="assoc-profile-form__fields">{children}</div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="assoc-profile-section-head">
      <div>
        <h2 className="assoc-profile-section-head__title">{title}</h2>
        {description && <p className="assoc-profile-section-head__desc">{description}</p>}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="assoc-profile-field">
      <span
        className={`assoc-profile-field__label${required ? " assoc-profile-field__label--required" : ""}`}
      >
        {label}
        {required && <span> *</span>}
      </span>
      {children}
    </label>
  );
}
