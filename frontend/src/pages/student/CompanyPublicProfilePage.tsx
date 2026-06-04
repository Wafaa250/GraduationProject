import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { getPublicCompanyProfile, type PublicCompanyProfile } from "@/api/organizationsPublicApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { ROUTES } from "@/routes/paths";

function parseAreasOfInterest(raw?: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function CompanyPublicProfilePage() {
  const { companyProfileId: idParam } = useParams<{ companyProfileId: string }>();
  const companyProfileId = Number(idParam);
  const location = useLocation();
  const searchHint =
    (location.state as { companyName?: string } | null)?.companyName?.trim() ?? "";

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<PublicCompanyProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(companyProfileId) || companyProfileId <= 0) {
      setLoading(false);
      setError("Invalid company link.");
      return;
    }
    setLoading(true);
    void getPublicCompanyProfile(companyProfileId, searchHint)
      .then((row) => {
        setCompany(row);
        setError(row ? null : "Company not found.");
      })
      .catch((err) => {
        setCompany(null);
        setError(parseApiErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [companyProfileId, searchHint]);

  const interests = useMemo(() => parseAreasOfInterest(company?.areasOfInterest), [company]);
  const initials = (company?.companyName ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="student-hub min-h-full bg-hero px-4 py-6 sm:px-6">
      <Link
        to={ROUTES.communicationHub}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to Communication Hub
      </Link>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !company ? (
        <p className="text-sm text-muted-foreground">{error ?? "Company not found."}</p>
      ) : (
        <article className="hub-card max-w-3xl overflow-hidden p-0">
          <div className="h-20 bg-gradient-to-r from-primary/15 to-primary/5" aria-hidden />
          <div className="p-6 pt-0">
            <div className="-mt-10 flex items-end gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary ring-4 ring-card">
                {initials || <Building2 className="h-7 w-7" aria-hidden />}
              </div>
              <div className="min-w-0 pb-1">
                <h1 className="font-display text-2xl font-bold">{company.companyName}</h1>
                {company.industry ? (
                  <p className="text-sm text-muted-foreground">{company.industry}</p>
                ) : null}
              </div>
            </div>

            {company.description ? (
              <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">{company.description}</p>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">No company description provided yet.</p>
            )}

            {interests.length > 0 ? (
              <div className="mt-6">
                <h2 className="text-sm font-semibold">Areas of interest</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {interests.map((area) => (
                    <span
                      key={area}
                      className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </article>
      )}
    </div>
  );
}
