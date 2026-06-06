import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import type { ProfileMenuAnchor } from "@/components/navigation/ProfileDropdownMenu";

type HubAccountMenuContextValue = {
  menuOpen: boolean;
  menuAnchor: ProfileMenuAnchor | null;
  openMenu: (anchor: ProfileMenuAnchor) => void;
  closeMenu: () => void;
};

const HubAccountMenuContext = createContext<HubAccountMenuContextValue | null>(null);

export function HubAccountMenuProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<ProfileMenuAnchor | null>(null);

  const value = useMemo(
    () => ({
      menuOpen,
      menuAnchor,
      openMenu: (anchor: ProfileMenuAnchor) => {
        setMenuAnchor(anchor);
        setMenuOpen(true);
      },
      closeMenu: () => {
        setMenuOpen(false);
        setMenuAnchor(null);
      },
    }),
    [menuOpen, menuAnchor],
  );

  return <HubAccountMenuContext.Provider value={value}>{children}</HubAccountMenuContext.Provider>;
}

export function useHubAccountMenu(): HubAccountMenuContextValue {
  const context = useContext(HubAccountMenuContext);
  if (!context) {
    throw new Error("useHubAccountMenu must be used within HubAccountMenuProvider");
  }
  return context;
}
