import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { getDoctorMe } from "@/api/meApi";
import {
  DoctorAccountMenuDropdown,
  type AccountMenuAnchor,
} from "@/components/doctor/DoctorAccountMenuDropdown";
import { mapDoctorMeToHeaderProfile } from "@/lib/doctorHubMappers";
import { getItem } from "@/utils/authStorage";

export type { AccountMenuAnchor } from "@/components/doctor/DoctorAccountMenuDropdown";

type DoctorAccountMenuContextValue = {
  openAccountMenu: (anchor?: AccountMenuAnchor) => void;
  closeAccountMenu: () => void;
  toggleAccountMenu: (anchor: AccountMenuAnchor) => void;
  isMenuOpen: boolean;
  displayName: string;
};

const DoctorAccountMenuContext = createContext<DoctorAccountMenuContextValue | null>(null);

export function DoctorAccountMenuProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [anchor, setAnchor] = useState<AccountMenuAnchor | null>(null);
  const [displayName, setDisplayName] = useState("Doctor");

  const loadAccount = useCallback(async () => {
    try {
      const me = await getDoctorMe();
      const profile = mapDoctorMeToHeaderProfile(me);
      setDisplayName(profile.displayName);
      return;
    } catch {
      /* fall back to session */
    }

    const name = await getItem("name");
    setDisplayName(name?.trim() || "Doctor");
  }, []);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  const openAccountMenu = useCallback(
    (nextAnchor?: AccountMenuAnchor) => {
      void loadAccount();
      setAnchor(nextAnchor ?? null);
      setVisible(true);
    },
    [loadAccount],
  );

  const closeAccountMenu = useCallback(() => {
    setVisible(false);
    setAnchor(null);
  }, []);

  const toggleAccountMenu = useCallback(
    (nextAnchor: AccountMenuAnchor) => {
      if (visible) {
        closeAccountMenu();
        return;
      }
      openAccountMenu(nextAnchor);
    },
    [visible, closeAccountMenu, openAccountMenu],
  );

  const value = useMemo(
    () => ({
      openAccountMenu,
      closeAccountMenu,
      toggleAccountMenu,
      isMenuOpen: visible,
      displayName,
    }),
    [openAccountMenu, closeAccountMenu, toggleAccountMenu, visible, displayName],
  );

  return (
    <DoctorAccountMenuContext.Provider value={value}>
      {children}
      <DoctorAccountMenuDropdown visible={visible} onClose={closeAccountMenu} anchor={anchor} />
    </DoctorAccountMenuContext.Provider>
  );
}

export function useDoctorAccountMenu(): DoctorAccountMenuContextValue {
  const ctx = useContext(DoctorAccountMenuContext);
  if (!ctx) {
    throw new Error("useDoctorAccountMenu must be used within DoctorAccountMenuProvider");
  }
  return ctx;
}
