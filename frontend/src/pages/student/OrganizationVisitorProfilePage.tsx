import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { OrganizationProfileContent } from "@/components/association/OrganizationProfileContent";
import { AssociationPublicProfileShell } from "@/components/public-profile/AssociationPublicProfileShell";
import { useOrganizationProfilePage } from "@/hooks/useOrganizationProfilePage";
import { ROUTES } from "@/routes/paths";
import "@/styles/association-profile.css";

export default function OrganizationVisitorProfilePage() {
  const { organizationId: idParam } = useParams<{ organizationId: string }>();
  const organizationId = Number(idParam);
  const validId = Number.isFinite(organizationId) && organizationId > 0;

  const {
    profile,
    extras,
    form,
    loading,
    editing,
    saving,
    loadError,
    setProfile,
    setForm,
    setEditing,
    handleSave,
    cancelEdit,
    reloadExtras,
  } = useOrganizationProfilePage("visitor", validId ? organizationId : undefined);

  return (
    <AssociationPublicProfileShell>
      <Link
        to={ROUTES.communicationHub}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to Communication Hub
      </Link>

      {!validId ? (
        <p className="text-sm text-muted-foreground">Invalid organization link.</p>
      ) : loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : loadError || !profile ? (
        <p className="text-sm text-muted-foreground">{loadError ?? "Organization not found."}</p>
      ) : (
        <OrganizationProfileContent
          mode="visitor"
          organizationId={organizationId}
          profile={profile}
          extras={extras}
          form={form}
          loading={loading}
          editing={editing}
          saving={saving}
          onEdit={() => setEditing(true)}
          onCancel={cancelEdit}
          onSave={handleSave}
          setForm={setForm}
          setProfile={setProfile}
          onEventsChanged={reloadExtras}
        />
      )}
    </AssociationPublicProfileShell>
  );
}
