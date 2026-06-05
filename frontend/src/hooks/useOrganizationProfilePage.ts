import { useCallback, useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import type { OrganizationProfileMode } from "@/components/association/organizationProfileTypes";
import {
  mapProfileToForm,
  type OrganizationProfileFormState,
} from "@/components/association/OrganizationProfileContent";
import {
  getAssociationProfile,
  parseApiErrorMessage,
  updateAssociationProfile,
  type StudentAssociationProfile,
} from "@/api/associationApi";
import {
  loadOrganizationProfileExtrasForOwner,
  loadVisitorOrganizationProfile,
  type OrganizationProfileExtras,
} from "@/api/organizationProfileData";

export function useOrganizationProfilePage(
  mode: OrganizationProfileMode,
  organizationId?: number,
) {
  const [profile, setProfile] = useState<StudentAssociationProfile | null>(null);
  const [extras, setExtras] = useState<OrganizationProfileExtras | null>(null);
  const [form, setForm] = useState<OrganizationProfileFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reloadExtras = useCallback(async () => {
    if (mode === "owner") {
      setExtras(await loadOrganizationProfileExtrasForOwner());
      return;
    }
    if (organizationId && organizationId > 0) {
      const bundle = await loadVisitorOrganizationProfile(organizationId);
      setProfile(bundle.profile);
      setExtras(bundle.extras);
    }
  }, [mode, organizationId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        if (mode === "owner") {
          const data = await getAssociationProfile();
          if (cancelled) return;
          setProfile(data);
          setForm(mapProfileToForm(data));
          setExtras(await loadOrganizationProfileExtrasForOwner());
        } else if (organizationId && organizationId > 0) {
          const bundle = await loadVisitorOrganizationProfile(organizationId);
          if (cancelled) return;
          setProfile(bundle.profile);
          setExtras(bundle.extras);
        } else {
          setProfile(null);
          setExtras(null);
          setLoadError("Invalid organization link.");
        }
      } catch (err) {
        if (!cancelled) {
          setProfile(null);
          setExtras(null);
          setLoadError(parseApiErrorMessage(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, organizationId]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (mode !== "owner" || !form) return;
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
      localStorage.setItem("name", updated.associationName);
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (profile) setForm(mapProfileToForm(profile));
    setEditing(false);
  };

  return {
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
  };
}
