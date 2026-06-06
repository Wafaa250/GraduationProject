import { createContext, useContext, type ReactNode } from "react";

import { useAssociationShell } from "@/hooks/useAssociationShell";

type AssociationWorkspaceContextValue = ReturnType<typeof useAssociationShell>;

const AssociationWorkspaceContext = createContext<AssociationWorkspaceContextValue | null>(null);

export function AssociationWorkspaceProvider({ children }: { children: ReactNode }) {
  const shell = useAssociationShell();
  return (
    <AssociationWorkspaceContext.Provider value={shell}>{children}</AssociationWorkspaceContext.Provider>
  );
}

export function useAssociationWorkspace(): AssociationWorkspaceContextValue {
  const ctx = useContext(AssociationWorkspaceContext);
  if (!ctx) {
    throw new Error("useAssociationWorkspace must be used within AssociationWorkspaceProvider");
  }
  return ctx;
}
