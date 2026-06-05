import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import type { CompanyProfileMode } from "@/components/company/companyProfileTypes";
import {
  getCompanyProfile,
  getCompanyProfileById,
  parseApiErrorMessage,
  updateCompanyProfile,
  type CompanyProfile,
} from "@/api/companyApi";
import { isCompanyOwner, setStoredCompanyRole } from "@/lib/companyWorkspace";

function applyProfileToForm(profile: CompanyProfile) {
  return {
    companyName: profile.companyName ?? "",
    about: profile.description ?? "",
    industry: profile.industry ?? "",
    website: profile.websiteUrl ?? "",
    headquartersLocation: profile.headquartersLocation ?? profile.location ?? "",
    workingStyle: profile.workingStyle ?? "",
    contactEmail: profile.contactEmail ?? profile.email ?? "",
    linkedInUrl: profile.linkedInUrl ?? "",
    optionalContactLink: profile.optionalContactLink ?? "",
    areasOfInterest: profile.areasOfInterest ?? [],
  };
}

export function useCompanyProfilePage(mode: CompanyProfileMode, companyProfileId?: number) {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState(applyProfileToForm({} as CompanyProfile));
  const [newInterest, setNewInterest] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data =
        mode === "owner"
          ? await getCompanyProfile()
          : await getCompanyProfileById(companyProfileId ?? 0);
      setProfile(data);
      setForm(applyProfileToForm(data));
      if (mode === "owner") {
        setStoredCompanyRole(data.workspaceRole ?? "owner");
      }
    } catch (err) {
      setProfile(null);
      setLoadError(parseApiErrorMessage(err) || "Failed to load company profile.");
    } finally {
      setLoading(false);
    }
  }, [mode, companyProfileId]);

  useEffect(() => {
    if (mode === "visitor" && (!companyProfileId || companyProfileId <= 0)) {
      setLoading(false);
      setLoadError("Invalid company link.");
      return;
    }
    void reload();
  }, [mode, companyProfileId, reload]);

  const canEditProfile = mode === "owner" && isCompanyOwner();

  const hasUnsavedChanges = useMemo(() => {
    if (!profile || !canEditProfile) return false;
    const baseline = applyProfileToForm(profile);
    return (
      form.companyName !== baseline.companyName ||
      form.about !== baseline.about ||
      form.industry !== baseline.industry ||
      form.website !== baseline.website ||
      form.headquartersLocation !== baseline.headquartersLocation ||
      form.workingStyle !== baseline.workingStyle ||
      form.contactEmail !== baseline.contactEmail ||
      form.linkedInUrl !== baseline.linkedInUrl ||
      form.optionalContactLink !== baseline.optionalContactLink ||
      JSON.stringify(form.areasOfInterest) !== JSON.stringify(baseline.areasOfInterest)
    );
  }, [canEditProfile, form, profile]);

  const addInterest = () => {
    const value = newInterest.trim();
    if (!value) return;
    if (form.areasOfInterest.some((x) => x.toLowerCase() === value.toLowerCase())) {
      setNewInterest("");
      return;
    }
    setForm((prev) => ({
      ...prev,
      areasOfInterest: [...prev.areasOfInterest, value],
    }));
    setNewInterest("");
  };

  const removeInterest = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      areasOfInterest: prev.areasOfInterest.filter((x) => x !== tag),
    }));
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile || !canEditProfile) return;
    setSaving(true);
    try {
      const updated = await updateCompanyProfile({
        companyName: form.companyName,
        description: form.about || null,
        industry: form.industry || null,
        headquartersLocation: form.headquartersLocation || null,
        workingStyle: form.workingStyle || null,
        areasOfInterest: form.areasOfInterest,
        websiteUrl: form.website || null,
        linkedInUrl: form.linkedInUrl || null,
        contactEmail: form.contactEmail || null,
        optionalContactLink: form.optionalContactLink || null,
      });
      setProfile(updated);
      setForm(applyProfileToForm(updated));
      setStoredCompanyRole(updated.workspaceRole ?? "owner");
      toast.success("Company profile updated.");
    } catch (err) {
      toast.error(parseApiErrorMessage(err) || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    loading,
    saving,
    loadError,
    form,
    setForm,
    newInterest,
    setNewInterest,
    canEditProfile,
    hasUnsavedChanges,
    addInterest,
    removeInterest,
    onSave,
    reload,
  };
}
