import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
};

/** Lovable EmptyState — presentation only. */
export function DoctorHubEmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="border border-dashed border-border rounded-lg p-10 text-center bg-card">
      <div className="mx-auto h-12 w-12 rounded-full bg-accent text-accent-foreground grid place-items-center mb-3">
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <h3 className="font-semibold text-foreground m-0">{title}</h3>
      <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto mb-0">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
