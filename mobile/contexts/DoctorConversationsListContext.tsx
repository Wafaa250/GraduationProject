import { createContext, useContext, type ReactNode } from "react";

import { useDoctorConversationsList } from "@/hooks/use-doctor-conversations-list";

type DoctorConversationsListState = ReturnType<typeof useDoctorConversationsList>;

const DoctorConversationsListContext = createContext<DoctorConversationsListState | null>(null);

export function DoctorConversationsListProvider({ children }: { children: ReactNode }) {
  const value = useDoctorConversationsList();
  return (
    <DoctorConversationsListContext.Provider value={value}>
      {children}
    </DoctorConversationsListContext.Provider>
  );
}

export function useDoctorConversationsListState(): DoctorConversationsListState {
  const shared = useContext(DoctorConversationsListContext);
  if (!shared) {
    throw new Error("useDoctorConversationsListState must be used within DoctorConversationsListProvider");
  }
  return shared;
}
