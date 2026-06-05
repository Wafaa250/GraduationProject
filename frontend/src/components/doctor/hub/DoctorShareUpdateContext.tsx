import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DoctorShareUpdateModal } from "@/components/doctor/hub/DoctorShareUpdateModal";

type DoctorShareUpdateContextValue = {
  openShareUpdate: () => void;
  updatesRefreshKey: number;
};

const DoctorShareUpdateContext = createContext<DoctorShareUpdateContextValue | null>(null);

export function DoctorShareUpdateProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [updatesRefreshKey, setUpdatesRefreshKey] = useState(0);

  const openShareUpdate = useCallback(() => setOpen(true), []);

  const handlePublished = useCallback(() => {
    setUpdatesRefreshKey((k) => k + 1);
  }, []);

  const value = useMemo(
    () => ({ openShareUpdate, updatesRefreshKey }),
    [openShareUpdate, updatesRefreshKey],
  );

  return (
    <DoctorShareUpdateContext.Provider value={value}>
      {children}
      <DoctorShareUpdateModal
        open={open}
        onOpenChange={setOpen}
        onPublished={handlePublished}
      />
    </DoctorShareUpdateContext.Provider>
  );
}

export function useDoctorShareUpdate(): DoctorShareUpdateContextValue {
  const ctx = useContext(DoctorShareUpdateContext);
  if (!ctx) {
    throw new Error("useDoctorShareUpdate must be used within DoctorShareUpdateProvider");
  }
  return ctx;
}
