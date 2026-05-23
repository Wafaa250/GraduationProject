import type { ReactNode } from "react";
import { DoctorHubContent } from "./DoctorHubContent";

type Props = {
  backTo?: string;
  backLabel?: string;
  wide?: boolean;
  children: ReactNode;
};

/**
 * @deprecated Use `DoctorHubContent` inside `DoctorHubShellLayout` / `DoctorHubShellPage`.
 * Kept as an alias so existing imports keep working during migration.
 */
export function DoctorSubpageLayout(props: Props) {
  return <DoctorHubContent {...props} />;
}
