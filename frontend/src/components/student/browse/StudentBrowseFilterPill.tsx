import { cn } from "@/components/ui/utils";

/** Shared filter chip used on student browse workspace pages. */
export function StudentBrowseFilterPill({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("student-ws-pill", active && "student-ws-pill--active")}
    >
      {children}
    </button>
  );
}
