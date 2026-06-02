import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  getPublicOrganizationProfile,
  type PublicOrganizationProfile,
} from "@/api/organizationsPublicApi";
import { resolveApiFileUrl } from "@/api/axiosInstance";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { ROUTES } from "@/routes/paths";

export default function OrganizationPublicProfilePage() {
  const { organizationId: idParam } = useParams<{ organizationId: string }>();
  const organizationId = Number(idParam);
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<PublicOrganizationProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(organizationId)) return;
    setLoading(true);
    void getPublicOrganizationProfile(organizationId)
      .then(setOrg)
      .catch((err) => {
        setOrg(null);
        setError(parseApiErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [organizationId]);

  const logo = org?.logoUrl ? resolveApiFileUrl(org.logoUrl) ?? org.logoUrl : null;

  return (
    <div className="student-hub min-h-full bg-hero px-4 py-6 sm:px-6">
      <Link
        to={ROUTES.communicationHub}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back
      </Link>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !org ? (
        <p className="text-sm text-muted-foreground">{error ?? "Organization not found."}</p>
      ) : (
        <article className="hub-card max-w-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-sm font-bold">
              {logo ? (
                <img src={logo} alt="" className="h-full w-full object-cover" />
              ) : (
                org.organizationName.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">{org.organizationName}</h1>
              <p className="text-sm text-muted-foreground">
                {[org.category, org.faculty].filter(Boolean).join(" · ") || "Student Association"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {org.followersCount} follower{org.followersCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          {org.description ? (
            <p className="mt-4 text-sm leading-relaxed text-foreground/90">{org.description}</p>
          ) : null}
        </article>
      )}
    </div>
  );
}
