import { useState } from "react";
import { ROUTES } from "@/routes/paths";
import { OrganizationProfileContent } from "@/components/association/OrganizationProfileContent";
import { useOrganizationProfilePage } from "@/hooks/useOrganizationProfilePage";
import { AssociationDashboardLayout } from "./dashboard/AssociationDashboardLayout";
import "@/styles/association-profile.css";

export default function AssociationProfilePage() {
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const {
    profile,
    extras,
    form,
    loading,
    editing,
    saving,
    setProfile,
    setForm,
    setEditing,
    handleSave,
    cancelEdit,
    reloadExtras,
  } = useOrganizationProfilePage("owner");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    window.location.href = ROUTES.login;
  };

  const name = profile?.associationName ?? localStorage.getItem("name") ?? "Organization";
  const sidebarProfile = profile
    ? { associationName: profile.associationName, logoUrl: profile.logoUrl }
    : { associationName: name, logoUrl: null };

  return (
    <AssociationDashboardLayout
      associationName={name}
      sidebarProfile={sidebarProfile}
      sidebarMobileOpen={sidebarMobileOpen}
      onSidebarOpen={() => setSidebarMobileOpen(true)}
      onSidebarClose={() => setSidebarMobileOpen(false)}
      onLogout={handleLogout}
    >
      <OrganizationProfileContent
        mode="owner"
        organizationId={profile?.id ?? 0}
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
    </AssociationDashboardLayout>
  );
}
