import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type HubAccountMenuContextValue = {
  menuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
};

const HubAccountMenuContext = createContext<HubAccountMenuContextValue | null>(null);

export function HubAccountMenuProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const value = useMemo(
    () => ({
      menuOpen,
      openMenu: () => setMenuOpen(true),
      closeMenu: () => setMenuOpen(false),
    }),
    [menuOpen],
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
