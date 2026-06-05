import { Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyLuxPanel } from "@/components/company/CompanyPremiumUI";
import {
  canPublishRequest,
  canUnpublishRequest,
  getRequestLifecycleStatus,
} from "@/lib/companyRequestDisplay";
import type { CompanyProjectRequestDetail } from "@/api/companyApi";
import { cn } from "@/lib/utils";

type Props = {
  request: CompanyProjectRequestDetail;
  loading: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
};

export function CompanyRequestVisibilityPanel({
  request,
  loading,
  onPublish,
  onUnpublish,
}: Props) {
  const lifecycle = getRequestLifecycleStatus(request);
  const isPublished = request.isPublishedToHub;
  const canPublish = canPublishRequest(request);
  const canUnpublish = canUnpublishRequest(request);
  const isBlocked = lifecycle === "paused" || lifecycle === "closed";

  return (
    <CompanyLuxPanel
      title="Visibility"
      description="Choose whether students can discover this opportunity in the Communication Hub."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3",
              !isPublished && "border-[hsl(var(--cw-accent))]/40 bg-[hsl(var(--cw-accent))]/5",
            )}
          >
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-sm font-medium">Private Request</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Visible only in your workspace. AI recommendations are unaffected.
              </p>
            </div>
          </label>
          <label
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3",
              isPublished && "border-[hsl(var(--cw-accent))]/40 bg-[hsl(var(--cw-accent))]/5",
            )}
          >
            <Globe className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--cw-accent))]" aria-hidden />
            <div>
              <p className="text-sm font-medium">Published in Communication Hub</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Students can discover this opportunity in the campus feed.
              </p>
            </div>
          </label>
        </div>

        {isBlocked ? (
          <p className="text-xs text-muted-foreground">
            {lifecycle === "paused"
              ? "Reactivate this request before publishing to the Communication Hub."
              : "Closed requests cannot be published."}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {canPublish ? (
            <Button
              type="button"
              size="sm"
              className="rounded-lg cw-btn-gradient border-0"
              disabled={loading}
              onClick={onPublish}
            >
              {loading ? "Publishing…" : "Publish Opportunity"}
            </Button>
          ) : null}
          {canUnpublish ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-lg"
              disabled={loading}
              onClick={onUnpublish}
            >
              {loading ? "Removing…" : "Unpublish Opportunity"}
            </Button>
          ) : null}
        </div>
      </div>
    </CompanyLuxPanel>
  );
}
