import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

import {
  getAssociationProfile,
  parseApiErrorMessage,
  type StudentAssociationProfile,
} from "@/api/associationApi";
import { logout } from "@/lib/logout";
import { getItem } from "@/utils/authStorage";

export function useAssociationShell() {
  const [profile, setProfile] = useState<StudentAssociationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [storedName, setStoredName] = useState("Organization");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAssociationProfile();
      setProfile(data);
    } catch (err) {
      Alert.alert("Could not load profile", parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void getItem("name").then((name) => {
      if (name?.trim()) setStoredName(name.trim());
    });
    void load();
  }, [load]);

  const associationName = profile?.associationName ?? storedName;

  return {
    profile,
    loading,
    associationName,
    logoUrl: profile?.logoUrl ?? null,
    reload: load,
    logout,
  };
}
