import { createContext, useContext, type ReactNode } from "react";

import { useStudentConversationsList } from "@/hooks/use-student-conversations-list";

type StudentConversationsListState = ReturnType<typeof useStudentConversationsList>;

const StudentConversationsListContext = createContext<StudentConversationsListState | null>(null);

export function StudentConversationsListProvider({ children }: { children: ReactNode }) {
  const value = useStudentConversationsList();
  return (
    <StudentConversationsListContext.Provider value={value}>
      {children}
    </StudentConversationsListContext.Provider>
  );
}

export function useStudentConversationsListState(): StudentConversationsListState {
  const shared = useContext(StudentConversationsListContext);
  if (!shared) {
    throw new Error("useStudentConversationsListState must be used within StudentConversationsListProvider");
  }
  return shared;
}
