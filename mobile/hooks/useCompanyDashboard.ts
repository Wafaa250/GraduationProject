import { useCallback, useEffect, useState } from "react";

import { getCompanyDashboard, getCompanyProfile, type CompanyDashboard } from "@/api/companyApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getItem } from "@/utils/authStorage";
import { isCompanyOwnerAccountRole } from "@/utils/companyAccountRole";

const RECENT_ACTIVITY_LIMIT = 5;

export function useCompanyDashboard() {
  const [dashboard, setDashboard] = useState<CompanyDashboard | null>(null);
  const [companyName, setCompanyName] = useState("Your company");
  const [industry, setIndustry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showMembersLink, setShowMembersLink] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const [dashboardRes, profileRes, role] = await Promise.all([
        getCompanyDashboard(),
        getCompanyProfile().catch(() => null),
        getItem("role"),
      ]);
      setDashboard(dashboardRes);
      setCompanyName(dashboardRes.companyName?.trim() || profileRes?.companyName?.trim() || "Your company");
      setIndustry(profileRes?.industry ?? null);
      setShowMembersLink(isCompanyOwnerAccountRole(role));
    } catch (err) {
      setLoadError(parseApiErrorMessage(err));
      setDashboard(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const recentActivity = (dashboard?.recentActivity ?? []).slice(0, RECENT_ACTIVITY_LIMIT);

  return {
    dashboard,
    companyName,
    industry,
    loading,
    refreshing,
    loadError,
    showMembersLink,
    recentActivity,
    onRefresh,
    reload: load,
  };
}
