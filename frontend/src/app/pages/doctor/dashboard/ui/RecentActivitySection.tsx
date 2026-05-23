import { Briefcase, ClipboardList, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { RecentActivityItem } from "../doctorDashboardHelpers";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";

const KIND_ICON: Record<RecentActivityItem["kind"], LucideIcon> = {
  request: ClipboardList,
  team: Briefcase,
  recommendation: Sparkles,
};

type Props = {
  items: RecentActivityItem[];
};

export function RecentActivitySection({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="divide-y divide-border m-0 p-0 list-none">
          {items.map((item) => {
            const Icon = KIND_ICON[item.kind];
            return (
              <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <div className="h-9 w-9 rounded-lg bg-accent text-accent-foreground grid place-items-center shrink-0">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">{item.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.detail}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
