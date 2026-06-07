import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getCompanyProfile,
  parseApiErrorMessage,
  updateCompanyProfile,
  type CompanyProfile,
} from "@/api/companyApi";
import {
  applyProfileToForm,
  type CompanyProfileFormState,
} from "@/lib/companyProfileUtils";
import { setStoredCompanyRole } from "@/lib/companyWorkspace";
import { getItem } from "@/utils/authStorage";
import { isCompanyOwnerAccountRole } from "@/utils/companyAccountRole";

export function useCompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<CompanyProfileFormState>(applyProfileToForm({} as CompanyProfile));
  const [canEditProfile, setCanEditProfile] = useState(false);

  const reload = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const [data, role] = await Promise.all([getCompanyProfile(), getItem("role")]);
      setProfile(data);
      setForm(applyProfileToForm(data));
      setCanEditProfile(isCompanyOwnerAccountRole(role));
      await setStoredCompanyRole(data.workspaceRole ?? "owner");
    } catch (err) {
      setProfile(null);
      setLoadError(parseApiErrorMessage(err) || "Failed to load company profile.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const hasUnsavedChanges = useMemo(() => {
    if (!profile || !canEditProfile) return false;
    const baseline = applyProfileToForm(profile);
    return (
      form.companyName !== baseline.companyName ||
      form.about !== baseline.about ||
      form.industry !== baseline.industry ||
      form.headquartersLocation !== baseline.headquartersLocation ||
      form.workingStyle !== baseline.workingStyle ||
      form.linkedInUrl !== baseline.linkedInUrl ||
      form.optionalContactLink !== baseline.optionalContactLink ||
      JSON.stringify(form.areasOfInterest) !== JSON.stringify(baseline.areasOfInterest)
    );
  }, [canEditProfile, form, profile]);

  const addInterest = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setForm((prev) => {
      if (prev.areasOfInterest.some((x) => x.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return { ...prev, areasOfInterest: [...prev.areasOfInterest, trimmed] };
    });
  }, []);

  const removeInterest = useCallback((tag: string) => {
    setForm((prev) => ({
      ...prev,
      areasOfInterest: prev.areasOfInterest.filter((x) => x !== tag),
    }));
  }, []);

  const save = useCallback(async () => {
    if (!profile || !canEditProfile) return false;
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
      await setStoredCompanyRole(updated.workspaceRole ?? "owner");
      return true;
    } catch (err) {
      throw new Error(parseApiErrorMessage(err) || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }, [canEditProfile, form, profile]);

  return {
    profile,
    loading,
    saving,
    loadError,
    form,
    setForm,
    canEditProfile,
    hasUnsavedChanges,
    addInterest,
    removeInterest,
    save,
    reload,
  };
}
