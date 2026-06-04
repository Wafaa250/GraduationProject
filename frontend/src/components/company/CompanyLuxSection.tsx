import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  id?: string;
};

export function CompanyLuxSection({ title, icon: Icon, children, className, id }: Props) {
  return (
    <section id={id} className={cn("cw-lux-section", className)}>
      <div className="cw-lux-section-head">
        {Icon ? (
          <span className="cw-lux-section-icon">
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
        ) : null}
        <h2 className="cw-lux-section-title">{title}</h2>
      </div>
      <div className="cw-lux-section-body">{children}</div>
    </section>
  );
}
