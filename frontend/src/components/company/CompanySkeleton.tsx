import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function CompanySkeleton({ className }: Props) {
  return <div className={cn("cw-skeleton", className)} aria-hidden />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <CompanySkeleton className="h-44 w-full rounded-[1.25rem]" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CompanySkeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <CompanySkeleton className="h-80 lg:col-span-2 rounded-xl" />
        <CompanySkeleton className="h-80 rounded-xl" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <CompanySkeleton className="h-64 rounded-xl" />
        <CompanySkeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
