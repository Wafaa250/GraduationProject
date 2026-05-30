import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type Props = {
  to: string;
  children: React.ReactNode;
  className?: string;
};

/** Secondary navigation link — matches Dashboard “View all” treatment. */
export function CompanyLinkAction({ to, children, className }: Props) {
  return (
    <Link to={to} className={cn("cw-link-subtle shrink-0", className)}>
      {children}
    </Link>
  );
}
