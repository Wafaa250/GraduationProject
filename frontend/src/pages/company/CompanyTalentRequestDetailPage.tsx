import { useEffect, useState } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  getPublicCompanyTalentRequest,
  type PublicCompanyTalentRequestDetail,
} from "@/api/organizationsPublicApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { ROUTES } from "@/routes/paths";
import { CompanyPageHeader } from "@/components/company/PageHeader";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";

/** Read-only company talent request (same entity as company workspace talent requests). */
export function CompanyTalentRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const talentRequestId = Number(id);
  const companyProfileId = Number(searchParams.get("companyId") ?? 0);
  const isStudent = (localStorage.getItem("role") ?? "").toLowerCase() === "student";

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<PublicCompanyTalentRequestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(talentRequestId) || companyProfileId <= 0) {
      setLoading(false);
      setError("Invalid talent request link.");
      return;
    }
    setLoading(true);
    void getPublicCompanyTalentRequest(companyProfileId, talentRequestId)
      .then(setItem)
      .catch((err) => {
        setItem(null);
        setError(parseApiErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [talentRequestId, companyProfileId]);

  const body = loading ? (
    <div className="flex min-h-[30vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ) : !item ? (
    <p className="text-sm text-muted-foreground">{error ?? "Talent request not found."}</p>
  ) : (
    <article className={isStudent ? "hub-card max-w-3xl p-6" : undefined}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {item.companyName}
        {item.industry ? ` · ${item.industry}` : ""}
      </p>
      <h1 className="mt-1 font-display text-2xl font-bold">{item.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {[item.engagementType, item.duration, item.preferredMajor].filter(Boolean).join(" · ")}
      </p>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{item.description}</p>
      {item.skills.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {item.skills.map((s) => (
            <span key={s} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
              {s}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );

  if (isStudent) {
    return (
      <div className="student-hub min-h-full bg-hero px-4 py-6 sm:px-6">
        <Link
          to={ROUTES.communicationHub}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to feed
        </Link>
        {body}
      </div>
    );
  }

  return (
    <CompanyPageShell>
      <CompanyPageHeader title="Talent request" subtitle="Opportunity details" />
      {body}
    </CompanyPageShell>
  );
}
