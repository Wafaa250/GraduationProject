import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { getCompanyProfile } from "@/api/companyApi";
import { CompanyAccountMenuDropdown, type AccountMenuAnchor } from "@/components/company/CompanyAccountMenuDropdown";
import { getItem } from "@/utils/authStorage";
import { isCompanyOwnerAccountRole } from "@/utils/companyAccountRole";

export type { AccountMenuAnchor } from "@/components/company/CompanyAccountMenuDropdown";

type AccountInfo = {
  companyName: string;
  email: string;
};

type CompanyAccountMenuContextValue = {
  openAccountMenu: (anchor?: AccountMenuAnchor) => void;
  closeAccountMenu: () => void;
  companyName: string;
};

const CompanyAccountMenuContext = createContext<CompanyAccountMenuContextValue | null>(null);

export function CompanyAccountMenuProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [anchor, setAnchor] = useState<AccountMenuAnchor | null>(null);
  const [account, setAccount] = useState<AccountInfo>({ companyName: "Company", email: "" });
  const [showSettings, setShowSettings] = useState(false);

  const loadAccount = useCallback(async () => {
    const role = await getItem("role");
    setShowSettings(isCompanyOwnerAccountRole(role));

    try {
      const profile = await getCompanyProfile();
      setAccount({
        companyName: profile.companyName?.trim() || "Company",
        email: (profile.contactEmail || profile.email || "").trim(),
      });
      return;
    } catch {
      /* fall back to session */
    }

    const [name, email] = await Promise.all([getItem("name"), getItem("email")]);
    setAccount({
      companyName: name?.trim() || "Company",
      email: email?.trim() || "",
    });
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

  const value = useMemo(
    () => ({
      openAccountMenu,
      closeAccountMenu,
      companyName: account.companyName,
    }),
    [openAccountMenu, closeAccountMenu, account.companyName],
  );

  return (
    <CompanyAccountMenuContext.Provider value={value}>
      {children}
      <CompanyAccountMenuDropdown
        visible={visible}
        onClose={closeAccountMenu}
        anchor={anchor}
        companyName={account.companyName}
        email={account.email}
        showSettings={showSettings}
      />
    </CompanyAccountMenuContext.Provider>
  );
}

export function useCompanyAccountMenu(): CompanyAccountMenuContextValue {
  const ctx = useContext(CompanyAccountMenuContext);
  if (!ctx) {
    throw new Error("useCompanyAccountMenu must be used within CompanyAccountMenuProvider");
  }
  return ctx;
}
